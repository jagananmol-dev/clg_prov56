/**
 * @file routes/payment.routes.ts
 * @description Customer-facing Razorpay payment integration.
 *
 * Unlike every other router in this API, these two endpoints are NOT
 * behind requireAdmin — the storefront calls them during checkout,
 * before the customer is known to have paid anything. That means the
 * usual "trust the client" shortcuts are exactly what would make this
 * exploitable, so:
 *
 *  - POST /create-order computes the amount itself from the products'
 *    current price in the DB — it never trusts a client-supplied total —
 *    then asks Razorpay to open an order for exactly that amount.
 *  - POST /verify recomputes the HMAC-SHA256 signature Razorpay returns
 *    after checkout, using the account's key_secret (server-only, never
 *    shipped to the browser). A payment is only ever treated as real once
 *    this passes — the frontend cannot fabricate a "payment succeeded"
 *    callback and get an order recorded as paid.
 *
 * Both are rate-limited since they're unauthenticated and /create-order
 * calls out to the Razorpay API on every request.
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config';
import { getAdminDB } from '../lib/supabase';
import { validate } from '../middleware/validate.middleware';

export const paymentRouter = Router();

// Generous relative to /login — these are normal checkout calls, not an
// attack surface for credential guessing — but still capped so a scripted
// loop can't hammer the Razorpay API (and our order-creation costs) for free.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please wait a few minutes and try again.' },
});
paymentRouter.use(paymentLimiter);

function razorpayAuthHeader(): string {
  const token = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
  return `Basic ${token}`;
}

// ── POST /api/payment/create-order ──────────────────────────────────────────
const createOrderSchema = z.object({
  items: z.array(z.object({
    id:       z.string().min(1),
    quantity: z.number().int().positive().max(50),
  })).min(1).max(50),
});

paymentRouter.post('/create-order', validate(createOrderSchema), async (req, res) => {
  const { items } = req.body as { items: { id: string; quantity: number }[] };

  const { data: products, error } = await getAdminDB()
    .from('products')
    .select('id, price, is_available')
    .in('id', items.map(i => i.id));

  if (error) {
    console.error('[PAYMENT] Product lookup error:', error.message);
    res.status(500).json({ error: 'Could not verify cart contents.' });
    return;
  }

  const productById = new Map((products ?? []).map(p => [p.id, p]));

  let amountInRupees = 0;
  for (const item of items) {
    const product = productById.get(item.id);
    if (!product) {
      res.status(400).json({ error: 'One of the items in your cart no longer exists.' });
      return;
    }
    if (product.is_available === false) {
      res.status(409).json({ error: 'One of the items in your cart is no longer available.' });
      return;
    }
    amountInRupees += product.price * item.quantity;
  }

  if (amountInRupees <= 0) {
    res.status(400).json({ error: 'Cart total must be greater than zero.' });
    return;
  }

  const amountInPaise = Math.round(amountInRupees * 100);

  try {
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: razorpayAuthHeader(),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      }),
    });

    const order = await rzpRes.json() as { id?: string; error?: unknown };

    if (!rzpRes.ok || !order.id) {
      console.error('[PAYMENT] Razorpay order creation failed:', order);
      res.status(502).json({ error: 'Could not start payment. Please try again.' });
      return;
    }

    res.json({ orderId: order.id, amount: amountInPaise, currency: 'INR' });
  } catch (err) {
    console.error('[PAYMENT] Razorpay request error:', err);
    res.status(502).json({ error: 'Could not start payment. Please try again.' });
  }
});

// ── POST /api/payment/verify ─────────────────────────────────────────────────
const verifySchema = z.object({
  razorpay_order_id:   z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature:  z.string().min(1),
});

paymentRouter.post('/verify', validate(verifySchema), (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf   = Buffer.from(razorpay_signature, 'utf8');

  // Length check first — timingSafeEqual throws on mismatched lengths rather
  // than returning false, and the length check itself doesn't leak useful
  // timing information (a real signature is always a fixed-length hex string).
  const verified = expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!verified) {
    res.status(400).json({ verified: false, error: 'Payment verification failed.' });
    return;
  }

  console.log(`[PAYMENT] Verified payment ${razorpay_payment_id} for order ${razorpay_order_id}`);
  res.json({ verified: true });
});

/**
 * @file routes/orders.routes.ts
 * @description Admin order management.
 *
 * GET   /api/admin/orders              — list all orders (newest first) with items
 * PATCH /api/admin/orders/:id/cancel   — cancel an order (sets status → 'cancelled')
 *
 * Only the admin can cancel orders. Users cannot cancel their own orders
 * (they contact the admin who uses this panel).
 */
import { Router } from 'express';
import { getAdminDB } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth.middleware';

export const ordersRouter = Router();

// ── GET /api/admin/orders ───────────────────────────────────────────────────
ordersRouter.get('/', requireAdmin, async (_req, res) => {
  // Fetch orders and their items in one query using PostgREST's foreign-key expansion
  const { data, error } = await getAdminDB()
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      total,
      status,
      created_at,
      user_id,
      order_items (
        id,
        product_name,
        price,
        quantity
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ORDERS] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders.' });
    return;
  }

  res.json({ orders: data });
});

// ── PATCH /api/admin/orders/:id/cancel ─────────────────────────────────────
ordersRouter.patch('/:id/cancel', requireAdmin, async (req, res) => {
  const { id } = req.params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  // Guard: don't cancel already-cancelled or delivered orders
  const { data: existing, error: fetchErr } = await getAdminDB()
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  if (existing.status === 'cancelled') {
    res.status(409).json({ error: 'Order is already cancelled.' });
    return;
  }

  if (existing.status === 'delivered') {
    res.status(409).json({ error: 'Cannot cancel a delivered order.' });
    return;
  }

  const { data, error } = await getAdminDB()
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) {
    console.error('[ORDERS] Cancel error:', error.message);
    res.status(500).json({ error: 'Failed to cancel order.' });
    return;
  }

  res.json({ success: true, order: data });
});

// ── PATCH /api/admin/orders/:id/status ─────────────────────────────────────
// Update order status (pending → processing → shipped → delivered)
ordersRouter.patch('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  const { data, error } = await getAdminDB()
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) {
    console.error('[ORDERS] Status update error:', error.message);
    res.status(500).json({ error: 'Failed to update order status.' });
    return;
  }

  console.log(`[ORDERS] Order ${id} → status=${status}`);
  res.json({ success: true, order: data });
});

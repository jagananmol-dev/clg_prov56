/**
 * @file routes/products.routes.ts
 * @description Admin CRUD for products.
 *
 * All routes require a valid admin JWT (requireAdmin middleware).
 *
 * GET    /api/admin/products        — list all products (with category name)
 * POST   /api/admin/products        — add a new product
 * DELETE /api/admin/products/:id    — hard delete a product
 */
import { Router } from 'express';
import { z } from 'zod';
import { getAdminDB } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const productsRouter = Router();

// ── Zod schema for creating a product ──────────────────────────────────────
const addProductSchema = z.object({
  name:           z.string().min(2).max(100).trim(),
  category_id:    z.string().min(1),
  price:          z.number().int().positive(),
  original_price: z.number().int().positive(),
  rating:         z.number().min(0).max(5).optional().default(0),
  reviews:        z.number().int().min(0).optional().default(0),
  image:          z.string().url({ message: 'image must be a valid URL' }),
  tag:            z.string().max(30).optional().nullable(),
  description:    z.string().min(10).max(2000).trim(),
  in_stock:       z.boolean().optional().default(true),
});

// ── GET /api/admin/products ─────────────────────────────────────────────────
productsRouter.get('/', requireAdmin, async (_req, res) => {
  const { data, error } = await getAdminDB()
    .from('products')
    .select('*, categories(id, name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[PRODUCTS] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch products.' });
    return;
  }

  res.json({ products: data });
});

// ── POST /api/admin/products ────────────────────────────────────────────────
productsRouter.post('/', requireAdmin, validate(addProductSchema), async (req, res) => {
  const { data, error } = await getAdminDB()
    .from('products')
    .insert([req.body])
    .select()
    .single();

  if (error) {
    console.error('[PRODUCTS] Insert error:', error.message);
    res.status(500).json({ error: 'Failed to add product.' });
    return;
  }

  res.status(201).json({ product: data });
});

// ── DELETE /api/admin/products/:id ──────────────────────────────────────────
productsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  // Validate UUID format before hitting DB
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({ error: 'Invalid product ID.' });
    return;
  }

  const { error } = await getAdminDB()
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[PRODUCTS] Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete product.' });
    return;
  }

  res.json({ success: true, id });
});

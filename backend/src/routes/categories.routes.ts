/**
 * @file routes/categories.routes.ts
 * @description Admin CRUD for categories — the tiles shown on the homepage
 * "Shop by Category" section and the Shop page filter sidebar.
 *
 * categories.id is a slug (e.g. 'pens', 'notebooks') and is the primary key
 * that products.category_id references, so it's immutable once created —
 * only name and image can be edited afterward. RLS on `categories` already
 * blocks anon/authenticated writes (see 20260805_admin_reviews_table.sql),
 * so these routes — running on the service_role key — are the only way to
 * manage categories at all.
 *
 * GET    /api/admin/categories       — list all, with each category's live product count
 * POST   /api/admin/categories       — create a new category
 * PUT    /api/admin/categories/:id   — edit name/image (id is not editable)
 * DELETE /api/admin/categories/:id   — delete, blocked while products still use it
 */
import { Router } from 'express';
import { z } from 'zod';
import { getAdminDB } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const categoriesRouter = Router();

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createCategorySchema = z.object({
  id:    z.string().min(1).max(40).regex(SLUG_REGEX, {
    message: 'Use lowercase letters, numbers, and hyphens only (e.g. "gift-wrap").',
  }),
  name:  z.string().min(2).max(60).trim(),
  image: z.string().min(1, { message: 'Please upload a category image' }),
});

const editCategorySchema = z.object({
  name:  z.string().min(2).max(60).trim(),
  image: z.string().min(1, { message: 'Please upload a category image' }),
});

// ── GET /api/admin/categories ────────────────────────────────────────────────
categoriesRouter.get('/', requireAdmin, async (_req, res) => {
  // Embedded count of products per category, so the admin can see at a
  // glance what's in use before trying to delete something.
  const { data, error } = await getAdminDB()
    .from('categories')
    .select('*, products(count)')
    .order('name');

  if (error) {
    console.error('[CATEGORIES] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories.' });
    return;
  }

  const categories = (data ?? []).map(row => {
    const { products, ...rest } = row as typeof row & { products?: { count: number }[] };
    return { ...rest, product_count: products?.[0]?.count ?? 0 };
  });

  res.json({ categories });
});

// ── POST /api/admin/categories ───────────────────────────────────────────────
categoriesRouter.post('/', requireAdmin, validate(createCategorySchema), async (req, res) => {
  const { data: existing } = await getAdminDB()
    .from('categories')
    .select('id')
    .eq('id', req.body.id)
    .maybeSingle();

  if (existing) {
    res.status(409).json({ error: `Category "${req.body.id}" already exists.` });
    return;
  }

  const { data, error } = await getAdminDB()
    .from('categories')
    .insert([req.body])
    .select()
    .single();

  if (error) {
    console.error('[CATEGORIES] Insert error:', error.message);
    res.status(500).json({ error: 'Failed to add category.' });
    return;
  }

  res.status(201).json({ category: data });
});

// ── PUT /api/admin/categories/:id ────────────────────────────────────────────
categoriesRouter.put('/:id', requireAdmin, validate(editCategorySchema), async (req, res) => {
  const { id } = req.params;

  const { data, error } = await getAdminDB()
    .from('categories')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[CATEGORIES] Update error:', error.message);
    res.status(500).json({ error: 'Failed to update category.' });
    return;
  }

  if (!data) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  console.log(`[CATEGORIES] Updated ${data.name} (${id})`);
  res.json({ category: data });
});

// ── DELETE /api/admin/categories/:id ─────────────────────────────────────────
categoriesRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  // Block the delete instead of letting the FK's ON DELETE SET NULL quietly
  // orphan products into a null category — better to make the admin
  // reassign or remove those products first.
  const { count, error: countError } = await getAdminDB()
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) {
    console.error('[CATEGORIES] Product count check error:', countError.message);
    res.status(500).json({ error: 'Failed to check category usage.' });
    return;
  }

  if (count && count > 0) {
    res.status(409).json({
      error: `Cannot delete — ${count} product${count > 1 ? 's' : ''} still use this category. Reassign or delete ${count > 1 ? 'them' : 'it'} first.`,
    });
    return;
  }

  const { error } = await getAdminDB()
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[CATEGORIES] Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete category.' });
    return;
  }

  res.json({ success: true, id });
});

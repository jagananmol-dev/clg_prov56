/**
 * @file routes/reviews.routes.ts
 * @description Admin review/comment management.
 *
 * GET    /api/admin/reviews      — list all reviews across all products
 * DELETE /api/admin/reviews/:id  — permanently delete a review
 *
 * Users can only delete their own reviews (via frontend + RLS).
 * Admin can delete ANY review regardless of who wrote it.
 */
import { Router } from 'express';
import { getAdminDB } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth.middleware';

export const reviewsRouter = Router();

// ── GET /api/admin/reviews ──────────────────────────────────────────────────
reviewsRouter.get('/', requireAdmin, async (_req, res) => {
  const { data, error } = await getAdminDB()
    .from('reviews')
    .select(`
      id,
      content,
      rating,
      created_at,
      user_id,
      products (id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[REVIEWS] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
    return;
  }

  res.json({ reviews: data });
});


// ── DELETE /api/admin/reviews/:id ───────────────────────────────────────────
reviewsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json({ error: 'Invalid review ID.' });
    return;
  }

  const { error } = await getAdminDB()
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[REVIEWS] Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete review.' });
    return;
  }

  res.json({ success: true, id });
});

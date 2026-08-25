/**
 * @file routes/thoughts.routes.ts
 * @description Admin moderation for student-submitted thoughts.
 *
 * GET    /api/admin/thoughts          — list all thoughts
 * PATCH  /api/admin/thoughts/:id/status — approve/reject a thought
 * DELETE /api/admin/thoughts/:id     — remove a thought
 */
import { Router } from 'express';
import { z } from 'zod';
import { getAdminDB } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const thoughtsRouter = Router();

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

thoughtsRouter.get('/', requireAdmin, async (_req, res) => {
  const { data, error } = await getAdminDB()
    .from('student_thoughts')
    .select('id, user_id, student_name, product_name, content, status, created_at, approved_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[THOUGHTS] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch thoughts.' });
    return;
  }

  res.json({ thoughts: data });
});

thoughtsRouter.patch('/:id/status', requireAdmin, validate(updateStatusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: 'pending' | 'approved' | 'rejected' };

  const updatePayload = status === 'approved'
    ? { status, approved_at: new Date().toISOString() }
    : { status, approved_at: null };

  const { data, error } = await getAdminDB()
    .from('student_thoughts')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[THOUGHTS] Status update error:', error.message);
    res.status(500).json({ error: 'Failed to update thought status.' });
    return;
  }

  res.json({ thought: data });
});

thoughtsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await getAdminDB()
    .from('student_thoughts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[THOUGHTS] Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete thought.' });
    return;
  }

  res.json({ success: true, id });
});

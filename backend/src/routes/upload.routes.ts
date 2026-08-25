/**
 * @file routes/upload.routes.ts
 * @description Image upload endpoint for admin product images.
 *
 * POST /api/admin/upload
 *   - Accepts a single image file (multipart/form-data, field name: "image")
 *   - Uploads it to the Supabase Storage bucket "product-images"
 *   - Returns { url: string } — the public CDN URL of the uploaded image
 *   - Max file size: 5 MB
 *   - Allowed types: JPEG, PNG, WebP, GIF
 *
 * The bucket must exist in Supabase Storage and be set to PUBLIC.
 * Create it at: Supabase Dashboard → Storage → New bucket → "product-images" → Public
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.middleware';
import { getAdminDB } from '../lib/supabase';

export const uploadRouter = Router();

// ── Multer — store file in memory (buffer), not on disk ──────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed.'));
    }
  },
});

// ── POST /api/admin/upload ────────────────────────────────────────────────────
uploadRouter.post(
  '/',
  requireAdmin,
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image file provided. Send as multipart/form-data with field name "image".' });
      return;
    }

    // Generate a unique filename: timestamp + sanitised original name
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const bucket   = 'product-images';

    const { data, error } = await getAdminDB()
      .storage
      .from(bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('[UPLOAD] Supabase storage error:', error.message);
      res.status(500).json({
        error: 'Upload failed. ' + (
          error.message.includes('Bucket not found')
            ? 'Create the "product-images" bucket in Supabase Storage (set it to Public).'
            : error.message
        ),
      });
      return;
    }

    // Build the public CDN URL
    const { data: { publicUrl } } = getAdminDB()
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`[UPLOAD] Image uploaded: ${publicUrl}`);
    res.json({ url: publicUrl });
  }
);

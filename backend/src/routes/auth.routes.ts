/**
 * @file routes/auth.routes.ts
 * @description Admin login endpoint.
 *
 * POST /api/admin/login
 *   Body: { email, password }
 *   → 200 { token, expiresIn } on success
 *   → 401 on wrong credentials (same message for both wrong email AND wrong password
 *          to prevent user enumeration)
 *
 * Rate limited to 5 attempts per 15 min per IP (configured in index.ts).
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { validate } from '../middleware/validate.middleware';

export const authRouter = Router();

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  // Constant-time email check (case-insensitive)
  const emailMatch = email.toLowerCase() === config.admin.email;

  // Always run bcrypt.compare even on email mismatch to prevent timing attacks
  const passwordMatch = await bcrypt.compare(password, config.admin.passwordHash);

  if (!emailMatch || !passwordMatch) {
    // Generic message — never reveal which field was wrong
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = jwt.sign(
    { email: config.admin.email, role: 'admin' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as string }
  );

  console.log(`[AUTH] Admin login successful at ${new Date().toISOString()}`);

  res.json({ token, expiresIn: config.jwt.expiresIn });
});

/**
 * @file middleware/auth.middleware.ts
 * @description JWT verification middleware for admin routes.
 *
 * Every protected route runs this middleware first.
 * If the token is missing, expired, or tampered → 401.
 * If valid → attaches decoded payload to req.admin and calls next().
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AdminPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

// Extend Express Request type so downstream handlers can read req.admin
declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed.' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AdminPayload;

    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    req.admin = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Session expired. Please log in again.' });
    } else {
      res.status(401).json({ error: 'Invalid token.' });
    }
  }
}

/**
 * @file index.ts
 * @description Express.js admin API server entry point for The Dorm Store.
 *
 * Security stack applied globally:
 *  - helmet()           → 12 HTTP security headers
 *  - cors()             → restricted to FRONTEND_ORIGIN only
 *  - express.json()     → 10KB body size limit (blocks large payload attacks)
 *  - loginLimiter       → 5 attempts / 15 min on /api/admin/login
 *  - auditLog()         → logs every mutating admin action
 *
 * Routes:
 *  POST   /api/admin/login
 *  GET    /api/admin/products
 *  POST   /api/admin/products
 *  DELETE /api/admin/products/:id
 *  GET    /api/admin/orders
 *  PATCH  /api/admin/orders/:id/cancel
 *  GET    /api/admin/reviews
 *  DELETE /api/admin/reviews/:id
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { auditLog } from './middleware/audit.middleware';
import { authRouter } from './routes/auth.routes';
import { productsRouter } from './routes/products.routes';
import { ordersRouter } from './routes/orders.routes';
import { reviewsRouter } from './routes/reviews.routes';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only the frontend origin is allowed ────────────────────────────────
app.use(cors({
  origin: config.server.frontendOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser — 10KB limit blocks large payload attacks ─────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Audit logging for all mutating requests ───────────────────────────────────
app.use(auditLog);

// ── Rate limiter — applies ONLY to the login endpoint ────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  skipSuccessfulRequests: true, // only count failed attempts
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/admin/login',    loginLimiter, authRouter);
app.use('/api/admin/products', productsRouter);
app.use('/api/admin/orders',   ordersRouter);
app.use('/api/admin/reviews',  reviewsRouter);

// ── Health check (unauthenticated — for uptime monitors) ─────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'dorm-store-admin-api' }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[UNHANDLED ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.server.port, () => {
  console.log(`[SERVER] Admin API running on http://localhost:${config.server.port}`);
  console.log(`[SERVER] Accepting requests from: ${config.server.frontendOrigin}`);
});

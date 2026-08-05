/**
 * @file middleware/audit.middleware.ts
 * @description Audit logger for every mutating admin action.
 *
 * Logs: timestamp | HTTP method | URL | admin email | response status
 * Applied globally to all non-GET admin routes in index.ts.
 * In production, pipe stdout to a log aggregation service (e.g. Datadog, Logtail).
 */
import { Request, Response, NextFunction } from 'express';

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  // Only audit mutating operations
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
    const originalJson = res.json.bind(res);

    // Intercept the response to capture the final status code
    res.json = (body) => {
      console.log(
        `[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.path} | admin=${req.admin?.email ?? 'unauthenticated'} | status=${res.statusCode}`
      );
      return originalJson(body);
    };
  }
  next();
}

/**
 * @file middleware/validate.middleware.ts
 * @description Zod request body validation helper.
 *
 * Usage:
 *   router.post('/products', requireAdmin, validate(addProductSchema), handler)
 *
 * If validation fails → 400 with structured Zod error messages.
 * If validation passes → req.body is replaced with the parsed (safe) value.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors into human-readable messages
      const messages = (result.error as ZodError).errors.map(
        e => `${e.path.join('.')}: ${e.message}`
      );
      res.status(400).json({ error: 'Validation failed.', details: messages });
      return;
    }

    // Replace body with the sanitized/coerced output from Zod
    req.body = result.data;
    next();
  };
}

/**
 * @file config.ts
 * @description Environment variable loader and validator.
 * Crashes the server at startup if any required variable is missing —
 * so misconfiguration is caught immediately, not at runtime.
 */
import dotenv from 'dotenv';
dotenv.config();

/** Read a required environment variable — crashes at startup if missing */
function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`[Config] Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  supabase: {
    url:            env('SUPABASE_URL'),
    serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
  },
  admin: {
    email:        env('ADMIN_EMAIL').toLowerCase(),
    passwordHash: env('ADMIN_PASSWORD_HASH'),
  },
  jwt: {
    secret:    env('ADMIN_JWT_SECRET'),
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '2h') as string,
  },
  server: {
    port:           parseInt(process.env.PORT ?? '4000', 10),
    frontendOrigin: env('FRONTEND_ORIGIN'),
  },
} as const;

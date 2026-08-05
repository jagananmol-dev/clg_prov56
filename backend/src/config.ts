/**
 * @file config.ts
 * @description Environment variable loader and validator.
 * Crashes the server at startup if any required variable is missing —
 * so misconfiguration is caught immediately, not at runtime.
 */
import dotenv from 'dotenv';
dotenv.config();

function require(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`[Config] Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  supabase: {
    url:            require('SUPABASE_URL'),
    serviceRoleKey: require('SUPABASE_SERVICE_ROLE_KEY'),
  },
  admin: {
    email:        require('ADMIN_EMAIL').toLowerCase(),
    passwordHash: require('ADMIN_PASSWORD_HASH'),
  },
  jwt: {
    secret:    require('ADMIN_JWT_SECRET'),
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '2h') as string,
  },
  server: {
    port:           parseInt(process.env.PORT ?? '4000', 10),
    frontendOrigin: require('FRONTEND_ORIGIN'),
  },
} as const;

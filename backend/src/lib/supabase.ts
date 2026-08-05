/**
 * @file lib/supabase.ts
 * @description Supabase admin client — uses the service_role key.
 *
 * The service_role key BYPASSES all Row Level Security policies.
 * This means every query hits the raw PostgreSQL tables with no restrictions.
 *
 * ⚠️  This file must ONLY exist on the backend.
 *     Never expose this key or this client to the browser.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const adminSupabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      // Disable automatic session management — this is a server-side client
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

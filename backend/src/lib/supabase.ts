/**
 * @file lib/supabase.ts
 * @description Lazy Supabase admin client (service_role — bypasses all RLS).
 *
 * WHY LAZY: createClient() instantiates RealtimeClient which validates the JWT
 * at startup and throws if the key is a placeholder. Lazy init means the server
 * starts cleanly; the client is only created on the first actual DB call.
 *
 * Usage in route handlers:
 *   import { getAdminDB } from '../lib/supabase';
 *   const { data, error } = await getAdminDB().from('products').select('*');
 *
 * To find your service_role key:
 *   Supabase Dashboard → Project Settings → API → service_role (secret) key
 *   Paste it into backend/.env  →  SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let _client: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase admin client.
 * The client is created on first call, not at module import time.
 */
export function getAdminDB(): SupabaseClient {
  if (!_client) {
    const keyIsReal = config.supabase.serviceRoleKey.startsWith('eyJ');

    if (!keyIsReal) {
      console.warn(
        '\n⚠️  [DB] SUPABASE_SERVICE_ROLE_KEY is still a placeholder.' +
        '\n   Get it: Supabase Dashboard → Project Settings → API → service_role key' +
        '\n   Add it to backend/.env and restart. DB routes will fail until then.\n'
      );
    }

    _client = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          persistSession:   false,  // server-side — no session storage
          autoRefreshToken: false,  // JWTs are long-lived service_role keys
        },
      }
    );
  }
  return _client;
}

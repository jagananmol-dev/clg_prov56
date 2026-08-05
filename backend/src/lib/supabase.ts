/**
 * @file lib/supabase.ts
 * @description Lazy Supabase admin client (service_role — bypasses all RLS).
 *
 * WHY LAZY: createClient() instantiates RealtimeClient which validates the JWT
 * at startup and throws if the key is a placeholder. Lazy init means the server
 * starts cleanly; the client is only created on the first actual DB call.
 *
 * WHY ws: Node.js < 22 doesn't have native WebSocket. The 'ws' package provides
 * a compatible WebSocket implementation for the Supabase Realtime client.
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
// Use ws.WebSocket class — compatible with Node.js < 22 which has no native WebSocket
import { WebSocket } from 'ws';
import { config } from '../config';

let _client: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase admin client.
 * Created on first call — not at module import time — so startup never throws.
 */
export function getAdminDB(): SupabaseClient {
  if (!_client) {
    const keyIsReal = config.supabase.serviceRoleKey.startsWith('eyJ') ||
                      config.supabase.serviceRoleKey.startsWith('sb_secret_');

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
          persistSession:   false,  // server-side — no session storage needed
          autoRefreshToken: false,  // service_role keys don't expire
        },
        realtime: {
          // Provide native WebSocket for Node.js < 22 (no native WebSocket)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transport: WebSocket as any,
        },
      }
    );
  }
  return _client;
}

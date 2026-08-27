/**
 * @file supabase.ts
 * @description Supabase client singleton for The Dorm Store.
 *
 * Exports a single `supabase` instance used throughout the app.
 * Importing from this file ensures only one client is ever created
 * (singleton pattern), which avoids multiple simultaneous connections.
 *
 * Environment variables (defined in .env, never committed to git):
 *  - VITE_SUPABASE_URL      — your project's Supabase REST endpoint
 *  - VITE_SUPABASE_ANON_KEY — public anon key (safe for client-side use;
 *                             Row Level Security policies restrict data access)
 *
 * Usage:
 *  import { supabase } from '@/lib/supabase';
 *  const { data } = await supabase.from('orders').select('*');
 *
 * Note: Never use the service_role key on the client side.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

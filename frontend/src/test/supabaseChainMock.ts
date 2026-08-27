import { vi } from 'vitest';

/**
 * Builds a Proxy that answers any Supabase query-builder chain
 * (.from().select().eq().order()...) by returning itself, and resolves
 * like a promise when awaited or `.then()`'d. Good enough for tests that
 * only care about UI gating, not the actual returned rows.
 */
export function makeChainableSupabaseMock(resolveWith: { data: unknown; error: unknown } = { data: [], error: null }) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: typeof resolveWith) => void) => resolve(resolveWith);
      }
      return vi.fn(() => proxy);
    },
  };
  const proxy = new Proxy({}, handler);
  return proxy;
}

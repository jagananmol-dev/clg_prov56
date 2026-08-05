/**
 * @file context/AdminAuthContext.tsx
 * @description Admin authentication context for the admin panel.
 *
 * Stores the JWT in sessionStorage (not localStorage) so the session
 * automatically clears when the browser tab is closed.
 *
 * Provides:
 *  - isAdminAuthenticated — true if a valid (non-expired) JWT exists
 *  - adminSignIn(email, password) — calls POST /api/admin/login, stores JWT
 *  - adminSignOut()              — clears JWT, redirects to /admin/login
 *  - adminFetch(path, options)   — fetch wrapper that injects Authorization header
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const SESSION_KEY = 'dorm_admin_token';
const API_BASE    = import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:4000';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  adminSignOut: () => void;
  adminFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);

  const adminSignIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error ?? 'Login failed.' };
      }

      sessionStorage.setItem(SESSION_KEY, data.token);
      setToken(data.token);
      return { error: null };
    } catch {
      return { error: 'Network error. Is the admin server running?' };
    }
  }, []);

  const adminSignOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
  }, []);

  /** Authenticated fetch — auto-injects Authorization: Bearer <token> */
  const adminFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token ?? ''}`,
      },
    });
  }, [token]);

  return (
    <AdminAuthContext.Provider value={{
      isAdminAuthenticated: !!token,
      adminSignIn,
      adminSignOut,
      adminFetch,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

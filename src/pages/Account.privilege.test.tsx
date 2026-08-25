/**
 * @file Account.privilege.test.tsx
 * @description Privilege test — /account is a customer-only page.
 *
 * Order history, the "submit a thought" form, and the logout icon all live
 * here. An unauthenticated visitor must be bounced to /login before any of
 * it renders — this guards that redirect.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Account from './Account';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/context/AuthContext', () => ({ useAuth: mockUseAuth }));

// vi.mock factories are hoisted above imports, so the chain-mock helper is
// pulled in via a dynamic import() inside the factory rather than a normal
// top-level import (which would hit a temporal-dead-zone error).
vi.mock('@/lib/supabase', async () => {
  const { makeChainableSupabaseMock } = await import('@/test/supabaseChainMock');
  return { supabase: makeChainableSupabaseMock() };
});

function renderAccount() {
  return render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Account page privilege gating', () => {
  it('redirects an unauthenticated visitor to /login instead of showing order history', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });

    renderAccount();

    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
    expect(screen.queryByText(/Recent Orders/i)).not.toBeInTheDocument();
  });

  it('renders account content for a logged-in customer', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'student@example.com',
        created_at: new Date().toISOString(),
        user_metadata: { full_name: 'Priya Sharma' },
      },
      loading: false,
      signOut: vi.fn(),
    });

    renderAccount();

    await waitFor(() => expect(screen.getByText('Priya Sharma')).toBeInTheDocument());
    expect(screen.getByText(/Recent Orders/i)).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

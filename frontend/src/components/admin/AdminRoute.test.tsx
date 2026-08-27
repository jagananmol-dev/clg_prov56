/**
 * @file AdminRoute.test.tsx
 * @description Privilege test — the admin route guard.
 *
 * Every admin-only icon (Products, Orders, Reviews, Thoughts nav items,
 * edit/delete/status-change buttons) lives behind this guard. If it ever
 * stops redirecting an unauthenticated visitor, ALL admin actions become
 * reachable by URL alone (the backend still enforces its own JWT check,
 * but the UI shouldn't rely on that as the only line of defense).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './AdminRoute';

const { mockUseAdminAuth } = vi.hoisted(() => ({ mockUseAdminAuth: vi.fn() }));

vi.mock('@/context/AdminAuthContext', () => ({
  useAdminAuth: mockUseAdminAuth,
}));

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin/orders']}>
      <Routes>
        <Route path="/admin/login" element={<div>Admin Login Page</div>} />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <div>Admin Orders — Cancel Order Icon</div>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRoute privilege guard', () => {
  it('redirects an unauthenticated visitor to /admin/login instead of rendering admin icons', () => {
    mockUseAdminAuth.mockReturnValue({ isAdminAuthenticated: false });

    renderAdminRoute();

    expect(screen.getByText('Admin Login Page')).toBeInTheDocument();
    expect(screen.queryByText(/Admin Orders/)).not.toBeInTheDocument();
  });

  it('renders admin content once isAdminAuthenticated is true', () => {
    mockUseAdminAuth.mockReturnValue({ isAdminAuthenticated: true });

    renderAdminRoute();

    expect(screen.getByText(/Admin Orders/)).toBeInTheDocument();
    expect(screen.queryByText('Admin Login Page')).not.toBeInTheDocument();
  });
});

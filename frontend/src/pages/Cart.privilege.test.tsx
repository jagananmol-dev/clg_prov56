/**
 * @file Cart.privilege.test.tsx
 * @description Privilege test — checkout is a customer-only action.
 *
 * The Cart page renders for guests too (so they can review their basket),
 * but the delivery form and the "Pay" icon/button must only be usable once
 * the customer is logged in. This guards against a regression where the
 * checkout button becomes clickable (or silently no-ops) for a guest
 * instead of sending them to /login.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';

const { mockUseCart, mockUseAuth } = vi.hoisted(() => ({
  mockUseCart: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/context/CartContext', () => ({ useCart: mockUseCart }));
vi.mock('@/context/AuthContext', () => ({ useAuth: mockUseAuth }));

// Cart.tsx prefills the phone field from `profiles` on mount — stub the
// chain so the effect resolves without hitting a real network.
vi.mock('@/lib/supabase', () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { supabase: { from } };
});

const cartWithOneItem = {
  items: [{ id: 1, name: 'Gel Pens Set', price: 299, quantity: 1, image: '', category: 'pens', originalPrice: 399, rating: 4.5, reviews: 10, description: '' }],
  updateQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  totalPrice: 299,
  totalItems: 1,
  clearCart: vi.fn(),
};

function renderCart() {
  return render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );
}

describe('Cart checkout privilege gating', () => {
  it('shows a login prompt (not the delivery form) for a guest, and keeps Pay disabled', () => {
    mockUseCart.mockReturnValue(cartWithOneItem);
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });

    renderCart();

    expect(screen.getByText(/You need to log in to place an order/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Phone Number/i)).not.toBeInTheDocument();

    const payButton = screen.getByRole('button', { name: /Pay ₹/i });
    expect(payButton).toBeDisabled();
  });

  it('shows the delivery form for an authenticated customer', () => {
    mockUseCart.mockReturnValue(cartWithOneItem);
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'student@example.com', user_metadata: { full_name: 'Student' } },
      isAuthenticated: true,
    });

    renderCart();

    expect(screen.queryByText(/You need to log in to place an order/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Full delivery address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('9876543210')).toBeInTheDocument();
  });
});

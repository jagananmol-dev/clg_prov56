/**
 * @file ProductCard.privilege.test.tsx
 * @description Privilege test — wishlist/add-to-cart icons are guest-usable
 * by design (CartContext falls back to localStorage when no one is logged
 * in; it only syncs to Supabase for an authenticated user). This test
 * guards against someone "fixing" that by accidentally hiding or disabling
 * these icons for guests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from '@/data/products';

const { mockUseCart } = vi.hoisted(() => ({ mockUseCart: vi.fn() }));
vi.mock('@/context/CartContext', () => ({ useCart: mockUseCart }));

const product: Product = {
  id: 1,
  name: 'Gel Pens Set (10 Pcs)',
  category: 'pens',
  price: 299,
  originalPrice: 399,
  rating: 4.5,
  reviews: 480,
  image: 'https://example.com/pens.jpg',
  description: 'Smooth-writing gel pens.',
};

describe('ProductCard icons — guest access', () => {
  it('lets a guest (no auth context involved) toggle wishlist and add to cart', async () => {
    const addToCart = vi.fn();
    const toggleWishlist = vi.fn();
    mockUseCart.mockReturnValue({ addToCart, toggleWishlist, wishlist: [] });

    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
    expect(wishlistButton).toBeEnabled();
    await user.click(wishlistButton);
    expect(toggleWishlist).toHaveBeenCalledWith(product.id);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeEnabled();
    await user.click(addToCartButton);
    expect(addToCart).toHaveBeenCalledWith(product);
  });
});

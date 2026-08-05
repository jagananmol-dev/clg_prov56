/**
 * @file context/CartContext.tsx
 * @description Shopping cart + wishlist state management.
 *
 * Cart: localStorage only (no account needed to shop).
 * Wishlist:
 *   - Guest users → localStorage only
 *   - Logged-in users → synced to Supabase `wishlists` table
 *     so it persists across devices and browser sessions.
 *
 * On login: merges any localStorage wishlist items into the DB.
 * On logout: clears local wishlist state (DB data preserved for next login).
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Product } from '@/data/products';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const CART_KEY     = 'dorm_store_cart';
const WISHLIST_KEY = 'dorm_store_wishlist';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  wishlist: number[];
  toggleWishlist: (id: number) => void;
  wishlistLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

/** Safely read and JSON-parse a value from localStorage. */
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // ── Cart state (localStorage only) ─────────────────────────────────────────
  const [items, setItems] = useState<CartItem[]>(() =>
    loadFromStorage<CartItem[]>(CART_KEY, [])
  );

  // ── Wishlist state ─────────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState<number[]>(() =>
    loadFromStorage<number[]>(WISHLIST_KEY, [])
  );
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Persist wishlist to localStorage (always, as fallback)
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // ── Sync wishlist with Supabase when user logs in ──────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    async function syncWishlist() {
      setWishlistLoading(true);

      // 1. Fetch existing wishlist from DB
      const { data: dbItems } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user!.id);

      const dbIds = (dbItems ?? []).map(
        (w: { product_id: string }) => parseInt(w.product_id) || w.product_id
      );

      // 2. Merge any localStorage items that aren't in DB yet
      const localOnly = wishlist.filter(id => !dbIds.includes(id));
      if (localOnly.length > 0) {
        const inserts = localOnly.map(pid => ({
          user_id:    user!.id,
          product_id: String(pid),
        }));
        await supabase.from('wishlists').upsert(inserts, {
          onConflict: 'user_id,product_id',
          ignoreDuplicates: true,
        });
      }

      // 3. Set state to the combined set
      const merged = [...new Set([...dbIds, ...wishlist])];
      setWishlist(merged as number[]);
      setWishlistLoading(false);
    }

    syncWishlist();
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cart actions ───────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => setItems([]);

  // ── Wishlist toggle ────────────────────────────────────────────────────────
  const toggleWishlist = useCallback(async (id: number) => {
    const isInWishlist = wishlist.includes(id);

    // Optimistic update — instant UI feedback
    setWishlist(prev =>
      isInWishlist ? prev.filter(w => w !== id) : [...prev, id]
    );

    // Sync to Supabase if logged in
    if (isAuthenticated && user) {
      if (isInWishlist) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', String(id));
      } else {
        await supabase
          .from('wishlists')
          .upsert({
            user_id:    user.id,
            product_id: String(id),
          }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
      }
    }
  }, [wishlist, isAuthenticated, user]);

  // Derived values
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        wishlist,
        toggleWishlist,
        wishlistLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

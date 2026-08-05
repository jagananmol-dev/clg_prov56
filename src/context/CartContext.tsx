import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product } from '@/data/products';

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
}

const CartContext = createContext<CartContextType | null>(null);

/** Safely read and JSON-parse a value from localStorage. */
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    // Corrupted data or private-browsing storage restrictions → use fallback
    return fallback;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialise directly from localStorage so the cart survives a page refresh
  const [items, setItems] = useState<CartItem[]>(() =>
    loadFromStorage<CartItem[]>(CART_KEY, [])
  );
  const [wishlist, setWishlist] = useState<number[]>(() =>
    loadFromStorage<number[]>(WISHLIST_KEY, [])
  );

  // Persist cart to localStorage on every change — zero Supabase calls needed
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Persist wishlist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

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
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => setItems([]);

  const toggleWishlist = (id: number) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  // Derived values — computed on every render, never stored
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

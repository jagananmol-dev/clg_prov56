/**
 * @file products.ts
 * @description Shared product/category types for The Dorm Store.
 *
 * Product data itself is DB-driven — see `useProducts()`, which reads the
 * live `products` and `categories` tables from Supabase. This file only
 * holds the shape those rows get normalized into, so components can share
 * one type definition instead of redeclaring it.
 */
export interface Product {
  id: number | string;
  name: string;
  category: string;   // matches Category.id slug (e.g. 'pens', 'notebooks')
  price: number;      // current sale price in INR (₹)
  originalPrice: number; // original price for discount % calculation
  rating: number;     // average rating (0–5)
  reviews: number;    // number of reviews
  image: string;      // Pexels CDN URL or Supabase Storage URL
  tag?: string;       // optional badge: 'Best Seller' | 'New' | 'Premium'
  description: string;
  isFeatured?: boolean; // admin-controlled: true = shown in Best Selling section
  isAvailable: boolean; // admin-controlled: false = out of stock, Add to Cart disabled
  unavailableReason?: string; // shown to shoppers when isAvailable is false (e.g. "Out of stock")
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

/**
 * @file products.ts
 * @description Static product and category data for The Dorm Store.
 *
 * NOTE: Products are currently stored as static TypeScript data for fast,
 * zero-latency reads. The Supabase `products` table (created in the migration)
 * mirrors this structure and can be used to serve dynamic data in the future.
 *
 * To switch to DB-driven products:
 *  1. Seed the Supabase `products` table using the migration SQL.
 *  2. Replace imports of this file with a `supabase.from('products').select()` call.
 *  3. Add loading/error state to Shop.tsx and ProductDetail.tsx.
 *
 * Type exports:
 *  - Product   — shape of a single product object
 *  - Category  — shape of a category object
 *
 * Data exports:
 *  - products    — full list of 12 products
 *  - categories  — 7 category objects used by Shop and Categories component
 *  - bestSelling — first 5 products (used by BestSelling section on Home)
 */
export interface Product {
  id: number;
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
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export const categories: Category[] = [
  {
    id: 'pens',
    name: 'Pens & Pencils',
    image: 'https://images.pexels.com/photos/159751/book-address-book-learning-read-159751.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 'notebooks',
    name: 'Notebooks',
    image: 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 'study',
    name: 'Study Essentials',
    image: 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 'organizers',
    name: 'Organizers',
    image: 'https://images.pexels.com/photos/416322/pexels-photo-416322.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 'bags',
    name: 'Bags & Cases',
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 'desk',
    name: 'Desk Accessories',
    image: 'https://images.pexels.com/photos/1329571/pexels-photo-1329571.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 'art',
    name: 'Art Supplies',
    image: 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'Gel Pens Set (10 Pcs)',
    category: 'pens',
    price: 299,
    originalPrice: 399,
    rating: 4.5,
    reviews: 480,
    image: 'https://images.pexels.com/photos/159751/book-address-book-learning-read-159751.jpeg?auto=compress&cs=tinysrgb&w=400',
    tag: 'Best Seller',
    description: 'Smooth-writing gel pens in 10 vibrant colors. Perfect for notes, journaling, and assignments.',
  },
  {
    id: 2,
    name: 'A5 Spiral Notebook',
    category: 'notebooks',
    price: 149,
    originalPrice: 199,
    rating: 4.5,
    reviews: 350,
    image: 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '200-page spiral notebook with thick, bleed-proof pages. Ideal for daily notes.',
  },
  {
    id: 3,
    name: 'Pastel Highlighters (Set of 6)',
    category: 'pens',
    price: 199,
    originalPrice: 249,
    rating: 4.5,
    reviews: 560,
    image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
    tag: 'New',
    description: 'Soft pastel highlighters that won\'t bleed through your notes. Set of 6 soothing shades.',
  },
  {
    id: 4,
    name: 'Canvas Pencil Pouch',
    category: 'bags',
    price: 179,
    originalPrice: 249,
    rating: 4.0,
    reviews: 210,
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Durable canvas pencil case with multiple pockets. Keeps your stationery organized.',
  },
  {
    id: 5,
    name: 'Sticky Notes Set',
    category: 'study',
    price: 99,
    originalPrice: 149,
    rating: 4.5,
    reviews: 610,
    image: 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400',
    tag: 'Best Seller',
    description: '400-sheet sticky notes in assorted pastel colors. Strong adhesive that won\'t damage pages.',
  },
  {
    id: 6,
    name: 'Mechanical Pencil Set',
    category: 'pens',
    price: 249,
    originalPrice: 349,
    rating: 4.5,
    reviews: 290,
    image: 'https://images.pexels.com/photos/159751/book-address-book-learning-read-159751.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Set of 3 mechanical pencils with 0.5mm lead. Includes extra leads and eraser tips.',
  },
  {
    id: 7,
    name: 'Leather Desk Organizer',
    category: 'desk',
    price: 449,
    originalPrice: 599,
    rating: 4.5,
    reviews: 175,
    image: 'https://images.pexels.com/photos/1329571/pexels-photo-1329571.jpeg?auto=compress&cs=tinysrgb&w=400',
    tag: 'Premium',
    description: 'Elegant vegan-leather desk organizer with 5 compartments. Keeps your workspace tidy.',
  },
  {
    id: 8,
    name: 'Watercolor Set (24 Colors)',
    category: 'art',
    price: 349,
    originalPrice: 499,
    rating: 5.0,
    reviews: 140,
    image: 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Professional-grade watercolors with vibrant, fade-resistant pigments.',
  },
  {
    id: 9,
    name: 'Hardcover Planner 2025',
    category: 'organizers',
    price: 299,
    originalPrice: 399,
    rating: 4.5,
    reviews: 320,
    image: 'https://images.pexels.com/photos/416322/pexels-photo-416322.jpeg?auto=compress&cs=tinysrgb&w=400',
    tag: 'New',
    description: 'Structured daily planner with monthly overviews, goal trackers, and dot-grid notes pages.',
  },
  {
    id: 10,
    name: 'Backpack — Tan Canvas',
    category: 'bags',
    price: 1299,
    originalPrice: 1799,
    rating: 4.5,
    reviews: 89,
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
    tag: 'Premium',
    description: 'Spacious 30L canvas backpack with padded laptop sleeve, water-resistant coating.',
  },
  {
    id: 11,
    name: 'Index Card Set (200 Pcs)',
    category: 'study',
    price: 129,
    originalPrice: 179,
    rating: 4.0,
    reviews: 205,
    image: 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Blank and ruled index cards for flashcards, notes, and study sessions.',
  },
  {
    id: 12,
    name: 'Washi Tape Set (12 Rolls)',
    category: 'art',
    price: 199,
    originalPrice: 279,
    rating: 4.5,
    reviews: 430,
    image: 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Decorative washi tapes in botanical and geometric patterns. Great for bullet journaling.',
  },
];

export const bestSelling = products.slice(0, 5);

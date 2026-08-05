/**
 * @file hooks/useProducts.ts
 * @description Live products + categories fetched from Supabase.
 *
 * Replaces the static import from @/data/products.ts for pages that
 * need real-time data (Shop, ProductDetail, BestSelling).
 *
 * Returns data shaped identically to the old static arrays so existing
 * component code requires minimal changes.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/data/products';

interface UseProductsReturn {
  products:   Product[];
  categories: Category[];
  loading:    boolean;
  error:      string | null;
  refetch:    () => void;
}

/** Map Supabase row (snake_case) → frontend Product type (camelCase) */
function mapProduct(row: Record<string, unknown>): Product {
  return {
    id:            row.id as number,
    name:          row.name as string,
    category:      row.category_id as string,
    price:         row.price as number,
    originalPrice: row.original_price as number,
    rating:        Number(row.rating ?? 0),
    reviews:       Number(row.reviews ?? 0),
    image:         row.image as string,
    tag:           (row.tag as string) ?? undefined,
    description:   row.description as string,
    isFeatured:    Boolean(row.is_featured),
  };
}

export function useProducts(): UseProductsReturn {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [tick,       setTick]       = useState(0); // used by refetch()

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal),
      supabase
        .from('categories')
        .select('id, name, image')
        .order('name')
        .abortSignal(controller.signal),
    ]).then(([prodRes, catRes]) => {
      if (controller.signal.aborted) return;

      if (prodRes.error) { setError('Failed to load products.'); return; }
      if (catRes.error)  { setError('Failed to load categories.'); return; }

      setProducts((prodRes.data ?? []).map(mapProduct));
      setCategories(catRes.data as Category[] ?? []);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Network error.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [tick]);

  return { products, categories, loading, error, refetch: () => setTick(t => t + 1) };
}

/** Convenience hook for a single product by ID */
export function useProduct(id: string | undefined): {
  product: Product | null;
  loading: boolean;
  error: string | null;
} {
  const { products, loading, error } = useProducts();
  const product = products.find(p => String(p.id) === id) ?? null;
  return { product, loading, error };
}

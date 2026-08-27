/**
 * @file Shop.tsx
 * @description Product listing page for The Dorm Store.
 *
 * Features:
 *  - URL-driven filters: ?category=<id> and ?q=<search> are
 *    read from the URL so filters are shareable and bookmarkable.
 *  - Debounced price range slider (300ms) to avoid expensive
 *    re-renders on every pixel of slider movement.
 *  - Fuzzy, typo-tolerant, relevance-ranked search via Fuse.js — see
 *    the `fuse` useMemo below for why this beats plain substring
 *    matching at this catalog's scale.
 *  - useMemo for filtering/sorting so the computation only
 *    re-runs when its dependencies actually change.
 *  - Desktop sidebar + mobile slide-in drawer for filters.
 *  - Products fetched live from Supabase (admin can add/delete products).
 */
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const query = searchParams.get('q') || '';

  // Live products from Supabase — reflects admin adds/deletes
  const { products, categories, loading, error } = useProducts();

  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState(2000);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce the price range so the useMemo filter only recalculates
  // 300ms after the user stops moving the slider — not on every tick.
  const debouncedPrice = useDebounce(priceRange, 300);

  const setCategory = (cat: string) => {
    if (cat === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  useEffect(() => {
    setSortBy('featured');
    setPriceRange(2000);
  }, [activeCategory, query]);

  // Fuzzy search index — rebuilt only when the product list itself changes,
  // not on every keystroke. Weighted so a match in the name counts for a lot
  // more than one buried in the description, with tag/category as a light
  // tiebreaker. `threshold` controls fuzziness (0 = exact, 1 = match almost
  // anything); 0.2 was tuned against the real catalog — loose enough to
  // survive typos ("noteboook", "pancil" -> pencil, "watrcolor") but tight
  // enough that short common words like "pen" don't drag in unrelated
  // products (a looser 0.35 was pulling "Leather Desk Organizer" into a
  // "pen" search purely on incidental edit-distance noise).
  const fuse = useMemo(() => new Fuse(products, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'tag', weight: 0.2 },
      { name: 'category', weight: 0.15 },
      { name: 'description', weight: 0.15 },
    ],
    threshold: 0.2,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [products]);

  /**
   * Filtering pipeline (all client-side, no Supabase call needed):
   * 1. Price ≤ debouncedPrice
   * 2. Category match (skipped when activeCategory === 'all')
   * 3. Search query — fuzzy-matched and relevance-ranked via Fuse
   * 4. Sort: featured (relevance when searching, else insertion order) |
   *    price-low | price-high | rating
   */
  const filtered = useMemo(() => {
    let list = products.filter(p => p.price <= debouncedPrice);
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);

    if (query.trim()) {
      const results = fuse.search(query.trim()); // best match first
      const rank = new Map(results.map((r, i) => [r.item.id, i]));
      list = list.filter(p => rank.has(p.id));
      // Only impose relevance order when the user hasn't picked an explicit
      // sort — price-low/high and rating below still take priority.
      if (sortBy === 'featured') {
        list = [...list].sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
      }
    }

    if (sortBy === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, activeCategory, query, debouncedPrice, sortBy, fuse]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A]">All Products</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#3D2B0E] mt-2">
            {query ? `Results for "${query}"` : activeCategory === 'all' ? 'Shop All Stationery' : categories.find(c => c.id === activeCategory)?.name || 'Shop'}
          </h1>
          <p className="text-[#5A5A5A] text-sm mt-2">{filtered.length} products available</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterContent
              activeCategory={activeCategory}
              setCategory={setCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              categories={categories}
            />
          </aside>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setShowFilters(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-[#3D2B0E]">Filters</h3>
                  <button onClick={() => setShowFilters(false)}><X size={20} className="text-[#3D2B0E]" /></button>
                </div>
                <FilterContent
                  activeCategory={activeCategory}
                  setCategory={setCategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  categories={categories}
                />
              </div>
            </div>
          )}

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-[#3D2B0E] border border-[#E8DDD0] rounded-full px-4 py-2"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <div className="hidden lg:block" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-[#E8DDD0] rounded-full px-4 py-2 text-sm bg-white text-[#3D2B0E] focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-[#E8DDD0] overflow-hidden">
                    <div className="aspect-square bg-[#F0EAE0] animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 w-2/3 bg-[#F0EAE0] rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-[#F0EAE0] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-red-200 p-8 md:p-12 text-center max-w-lg mx-auto mt-10 shadow-sm">
                <h3 className="text-xl font-bold text-red-600 mb-2">Couldn't load products</h3>
                <p className="text-[#5A5A5A] mb-2">{error}</p>
                <p className="text-sm text-[#8A8A8A]">Please refresh the page or try again shortly.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8DDD0] p-8 md:p-12 text-center max-w-lg mx-auto mt-10 shadow-sm">
                <div className="w-16 h-16 bg-[#F0EAE0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-[#3D2B0E] mb-2">No exact matches found</h3>
                <p className="text-[#5A5A5A] mb-8">
                  {query 
                    ? `We couldn't find any products matching "${query}".`
                    : "We couldn't find any products matching your current filters."
                  }
                  <br className="hidden sm:block" /> Try checking out our full collection instead.
                </p>
                <button
                  onClick={() => {
                    setCategory('all');
                    searchParams.delete('q');
                    setSearchParams(searchParams);
                    setPriceRange(2000);
                  }}
                  className="bg-[#3D2B0E] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#2A1D09] transition-colors shadow-lg shadow-black/10"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterContent({
  activeCategory,
  setCategory,
  priceRange,
  setPriceRange,
  categories,
}: {
  activeCategory: string;
  setCategory: (c: string) => void;
  priceRange: number;
  setPriceRange: (n: number) => void;
  categories: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-[#3D2B0E] mb-3">Categories</h3>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setCategory('all')}
              className={`text-sm ${activeCategory === 'all' ? 'text-[#7C5A2A] font-medium' : 'text-[#5A5A5A] hover:text-[#7C5A2A]'}`}
            >
              All Products
            </button>
          </li>
          {categories.map(c => (
            <li key={c.id}>
              <button
                onClick={() => setCategory(c.id)}
                className={`text-sm ${activeCategory === c.id ? 'text-[#7C5A2A] font-medium' : 'text-[#5A5A5A] hover:text-[#7C5A2A]'}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#3D2B0E] mb-3">Price Range</h3>
        <input
          type="range"
          min={0}
          max={2000}
          step={100}
          value={priceRange}
          onChange={e => setPriceRange(Number(e.target.value))}
          className="w-full accent-[#7C5A2A]"
        />
        <div className="flex justify-between text-xs text-[#8A8A8A] mt-1">
          <span>₹0</span>
          <span className="font-medium text-[#3D2B0E]">Up to ₹{priceRange}</span>
        </div>
      </div>
    </div>
  );
}

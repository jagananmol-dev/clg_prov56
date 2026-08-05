import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';

export default function BestSelling() {
  // Fetch live products from Supabase; use first 5 as "best selling"
  const { products, loading } = useProducts();
  const bestSelling = products.slice(0, 5);

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A]">Most loved by students</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#3D2B0E] mt-2">Best Selling Products</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-[#7C5A2A] hover:gap-3 transition-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#F0EAE0] animate-pulse aspect-[3/4]" />
              ))
            : bestSelling.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-[#7C5A2A]">
            View All <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}


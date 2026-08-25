import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

export default function Categories() {
  // DB-driven — stays in sync with whatever the admin manages in Supabase,
  // instead of a hardcoded list that could drift from the real catalog.
  const { categories, loading } = useProducts();

  return (
    <section className="py-16 md:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A]">Browse by category</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#3D2B0E] mt-2">Shop by Category</h2>
          <p className="text-[#5A5A5A] mt-3 max-w-lg mx-auto">Find exactly what you need for every class, project, and study session.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-[#E8DDD0] animate-pulse ${i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square'}`}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square'}`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B0E]/80 via-[#3D2B0E]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 md:p-5">
                  <h3 className="text-white font-semibold text-sm md:text-lg">{cat.name}</h3>
                  <span className="inline-flex items-center gap-1 text-white/80 text-xs mt-1 group-hover:gap-2 transition-all">
                    Shop now <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SaleBanner() {
  return (
    <section className="py-16 md:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#3D2B0E] to-[#7C5A2A]">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-14">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#C4A265] mb-4">
                Limited Time
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                Back to Campus Sale
              </h2>
              <p className="text-white/80 text-base mb-2">Up to <span className="text-[#C4A265] font-bold text-2xl">40% OFF</span></p>
              <p className="text-white/60 text-sm mb-8 max-w-sm">On notebooks, pens, planners, and more. Because great grades shouldn't cost a fortune.</p>
              <Link
                to="/shop"
                className="glass-btn inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-full text-sm font-medium hover:gap-3 transition-all"
              >
                Shop the Sale <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative h-64 md:h-full min-h-[280px]">
              <img
                src="https://images.pexels.com/photos/6207365/pexels-photo-6207365.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Sale"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#3D2B0E]/60 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    eyebrow: 'Back to Campus 2025',
    title: 'Stationery that keeps up with your grind.',
    subtitle: 'From gel pens to planners — everything you need to ace the semester, delivered to your dorm.',
    cta: 'Shop New Arrivals',
    link: '/shop',
    image: 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    eyebrow: 'Up to 40% Off',
    title: 'The Study Essentials Sale.',
    subtitle: 'Stock up on notebooks, highlighters, and sticky notes at prices that won\'t break your budget.',
    cta: 'Shop the Sale',
    link: '/shop',
    image: 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    eyebrow: 'Premium Picks',
    title: 'Elevate your desk, elevate your focus.',
    subtitle: 'Curated desk accessories and bags designed for students who mean business.',
    cta: 'Explore Premium',
    link: '/shop',
    image: 'https://images.pexels.com/photos/1329571/pexels-photo-1329571.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent(c => (c + 1) % slides.length);
  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);

  return (
    <section className="relative bg-[#FAF7F2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text */}
          <div key={current} className="order-2 md:order-1 animate-[fadeIn_0.6s_ease]">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A] mb-4">
              {slides[current].eyebrow}
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D2B0E] leading-[1.1] mb-6">
              {slides[current].title}
            </h1>
            <p className="text-base md:text-lg text-[#5A5A5A] mb-8 max-w-md leading-relaxed">
              {slides[current].subtitle}
            </p>
            <Link
              to={slides[current].link}
              className="inline-flex items-center gap-2 bg-[#7C5A2A] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#3D2B0E] hover:gap-3 transition-all shadow-md hover:shadow-lg"
            >
              {slides[current].cta}
              <ArrowRight size={16} />
            </Link>

            {/* Dots */}
            <div className="flex gap-2 mt-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-[#7C5A2A]' : 'w-1.5 bg-[#C4A265]/50'}`}
                />
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] md:aspect-square">
              <img
                src={slides[current].image}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3D2B0E]/20 to-transparent" />
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-5 -left-3 md:-left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 max-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-[#E8DDD0] flex items-center justify-center text-[#7C5A2A] font-bold text-sm">
                ★
              </div>
              <div>
                <p className="text-xs font-semibold text-[#3D2B0E]">4.8/5 Rating</p>
                <p className="text-[10px] text-[#8A8A8A]">2,400+ happy students</p>
              </div>
            </div>

            {/* Arrows */}
            <button onClick={prev} className="absolute top-1/2 -left-2 md:-left-4 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-[#E8DDD0]">
              <ChevronLeft size={18} className="text-[#7C5A2A]" />
            </button>
            <button onClick={next} className="absolute top-1/2 -right-2 md:-right-4 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-[#E8DDD0]">
              <ChevronRight size={18} className="text-[#7C5A2A]" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

import { Truck, RefreshCw, Lock, Headphones } from 'lucide-react';

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₹499' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: Lock, title: 'Secure Payment', desc: '100% protected checkout' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated student care' },
];

export default function Features() {
  return (
    <section className="bg-white border-y border-[#E8DDD0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-[#E8DDD0] flex items-center justify-center group-hover:bg-[#C4A265] transition-colors">
                <f.icon size={20} className="text-[#7C5A2A] group-hover:text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3D2B0E]">{f.title}</p>
                <p className="text-xs text-[#8A8A8A]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

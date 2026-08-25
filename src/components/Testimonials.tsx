import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  text: string;
}

const fallbackTestimonials: TestimonialItem[] = [
  {
    id: 'fallback-1',
    name: 'Aarav Sharma',
    role: 'B.Tech Student, IIT Delhi',
    text: 'The gel pens and notebooks are top quality. My notes have never looked this organized. Fast delivery to my hostel too!',
  },
  {
    id: 'fallback-2',
    name: 'Priya Nair',
    role: 'B.A. English, DU',
    text: 'I love the planner and washi tapes. The aesthetic is exactly what I wanted for my bullet journal. Prices are very student-friendly.',
  },
  {
    id: 'fallback-3',
    name: 'Rahul Verma',
    role: 'B.Com, Christ University',
    text: 'Got my backpack and pencil case here. Great quality for the price. The 7-day return policy gave me peace of mind.',
  },
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(fallbackTestimonials);

  useEffect(() => {
    supabase
      .from('student_thoughts')
      .select('id, student_name, product_name, content')
      .order('approved_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Testimonials] Failed to load approved thoughts:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setTestimonials(data.map(item => ({
            id: item.id,
            name: item.student_name,
            role: item.product_name,
            text: item.content,
          })));
        }
      });
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A]">Student voices</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#3D2B0E] mt-2">What Students Say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.id} className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E8DDD0] hover:shadow-lg transition-shadow">
              <Quote size={28} className="text-[#C4A265] mb-3" />
              <p className="text-sm text-[#5A5A5A] leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C4A265] text-white text-sm font-semibold">
                  {t.name.split(' ').map(word => word[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3D2B0E]">{t.name}</p>
                  <p className="text-xs text-[#8A8A8A]">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < 5 ? 'fill-[#C4A265] text-[#C4A265]' : 'text-[#E8DDD0]'} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

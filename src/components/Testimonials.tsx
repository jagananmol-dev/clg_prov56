import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Aarav Sharma',
    role: 'B.Tech Student, IIT Delhi',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    text: 'The gel pens and notebooks are top quality. My notes have never looked this organized. Fast delivery to my hostel too!',
  },
  {
    name: 'Priya Nair',
    role: 'B.A. English, DU',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    text: 'I love the planner and washi tapes. The aesthetic is exactly what I wanted for my bullet journal. Prices are very student-friendly.',
  },
  {
    name: 'Rahul Verma',
    role: 'B.Com, Christ University',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 4,
    text: 'Got my backpack and pencil case here. Great quality for the price. The 7-day return policy gave me peace of mind.',
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A]">Student voices</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#3D2B0E] mt-2">What Students Say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#E8DDD0] hover:shadow-lg transition-shadow">
              <Quote size={28} className="text-[#C4A265] mb-3" />
              <p className="text-sm text-[#5A5A5A] leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-[#3D2B0E]">{t.name}</p>
                  <p className="text-xs text-[#8A8A8A]">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < t.rating ? 'fill-[#C4A265] text-[#C4A265]' : 'text-[#E8DDD0]'} />
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

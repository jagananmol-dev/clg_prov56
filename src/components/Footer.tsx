import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
  const linkGroups = [
    { title: 'Shop', links: ['New Arrivals', 'Best Sellers', 'Pens & Pencils', 'Notebooks', 'Sale'] },
    { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Sustainability', 'Affiliates'] },
    { title: 'Support', links: ['Help Center', 'Track Order', 'Returns', 'Shipping Info', 'Contact Us'] },
  ];

  return (
    <footer className="bg-[#3D2B0E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="bg-[#FAF7F2] rounded-xl p-3 inline-block mb-4">
              <Logo className="h-12 w-44" />
            </div>
            <p className="text-white/60 text-sm max-w-xs mb-5 leading-relaxed">
              The Dorm Store is your campus stationery partner. Quality essentials at student-friendly prices, delivered fast.
            </p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C4A265] transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {linkGroups.map(group => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold mb-4 text-[#C4A265]">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map(link => (
                  <li key={link}>
                    <Link to="/" className="text-white/60 text-sm hover:text-white transition-colors">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Mail size={16} className="text-[#C4A265]" /> hello@thedormstore.in
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Phone size={16} className="text-[#C4A265]" /> +91 98765 43210
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <MapPin size={16} className="text-[#C4A265]" /> Campus delivery, pan-India
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-white/40 text-xs">© 2025 The Dorm Store. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/" className="text-white/40 text-xs hover:text-white">Privacy Policy</Link>
            <Link to="/" className="text-white/40 text-xs hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

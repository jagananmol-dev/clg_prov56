/**
 * @file pages/admin/AdminLayout.tsx
 * @description Shared sidebar + header layout wrapping all admin pages.
 * Import this in each admin page as the outer wrapper.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, MessageSquare, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

const NAV = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/admin/products', icon: Package,         label: 'Products' },
  { to: '/admin/orders',   icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/reviews',  icon: MessageSquare,   label: 'Reviews' },
  { to: '/admin/thoughts', icon: MessageSquare,   label: 'Thoughts' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { adminSignOut } = useAdminAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    adminSignOut();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-[#FAF7F2]">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 bg-[#1C1008] flex flex-col">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-[#C4A265] font-bold text-sm tracking-wider uppercase">Admin Panel</p>
          <p className="text-white/40 text-xs mt-0.5">The Dorm Store</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#C4A265] text-[#3D2B0E]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

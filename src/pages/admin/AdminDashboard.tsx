/**
 * @file pages/admin/AdminDashboard.tsx
 * @description Admin overview page at /admin.
 * Shows live counts: total products, pending orders, total reviews.
 */
import { useEffect, useState } from 'react';
import { Package, ShoppingBag, MessageSquare, TrendingUp } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface Stats { products: number; pendingOrders: number; totalOrders: number; reviews: number; }

export default function AdminDashboard() {
  const { adminFetch } = useAdminAuth();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/products').then(r => r.json()),
      adminFetch('/api/admin/orders').then(r => r.json()),
      adminFetch('/api/admin/reviews').then(r => r.json()),
    ]).then(([p, o, r]) => {
      setStats({
        products:      p.products?.length ?? 0,
        pendingOrders: (o.orders ?? []).filter((x: {status:string}) => x.status === 'pending').length,
        totalOrders:   o.orders?.length ?? 0,
        reviews:       r.reviews?.length ?? 0,
      });
    }).finally(() => setLoading(false));
  }, [adminFetch]);

  const cards = [
    { label: 'Total Products',  value: stats?.products,      icon: Package,       color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders',  value: stats?.pendingOrders, icon: ShoppingBag,   color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Orders',    value: stats?.totalOrders,   icon: TrendingUp,    color: 'bg-green-50 text-green-600' },
    { label: 'Reviews',         value: stats?.reviews,       icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Dashboard</h1>
        <p className="text-sm text-[#8A8A8A] mb-8">Welcome back, Admin.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8DDD0] p-6">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-[#1C1C1C]">
                {loading ? '—' : value}
              </p>
              <p className="text-sm text-[#8A8A8A] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

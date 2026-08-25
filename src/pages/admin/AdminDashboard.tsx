/**
 * @file pages/admin/AdminDashboard.tsx
 * @description Admin overview page at /admin.
 * Shows live counts: total products, pending orders, total reviews.
 */
import { useEffect, useState } from 'react';
import { Package, FolderKanban, ShoppingBag, MessageSquare, TrendingUp } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface Stats { products: number; categories: number; pendingOrders: number; totalOrders: number; reviews: number; thoughts: number; }

export default function AdminDashboard() {
  const { adminFetch } = useAdminAuth();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/products').then(r => r.json()).catch(() => ({ products: [] })),
      adminFetch('/api/admin/categories').then(r => r.json()).catch(() => ({ categories: [] })),
      adminFetch('/api/admin/orders').then(r => r.json()).catch(() => ({ orders: [] })),
      adminFetch('/api/admin/reviews').then(r => r.json()).catch(() => ({ reviews: [] })),
      adminFetch('/api/admin/thoughts').then(r => r.json()).catch(() => ({ thoughts: [] })),
    ]).then(([p, c, o, r, t]) => {
      setStats({
        products:      p.products?.length ?? 0,
        categories:    c.categories?.length ?? 0,
        pendingOrders: (o.orders ?? []).filter((x: {status:string}) => x.status === 'pending').length,
        totalOrders:   o.orders?.length ?? 0,
        reviews:       r.reviews?.length ?? 0,
        thoughts:      t.thoughts?.length ?? 0,
      });
    }).catch(() => {
      setError('Cannot reach the admin backend. Make sure it is running on port 4000.');
    }).finally(() => setLoading(false));
  }, [adminFetch]);

  const cards = [
    { label: 'Total Products',  value: stats?.products,      icon: Package,       color: 'bg-blue-50 text-blue-600' },
    { label: 'Categories',      value: stats?.categories,    icon: FolderKanban,  color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Pending Orders',  value: stats?.pendingOrders, icon: ShoppingBag,   color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Orders',    value: stats?.totalOrders,   icon: TrendingUp,    color: 'bg-green-50 text-green-600' },
    { label: 'Reviews',         value: stats?.reviews,       icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
    { label: 'Thoughts',        value: stats?.thoughts,      icon: MessageSquare, color: 'bg-sky-50 text-sky-600' },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Dashboard</h1>
        <p className="text-sm text-[#8A8A8A] mb-8">Welcome back, Admin.</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

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

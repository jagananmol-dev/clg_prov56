import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface OrderRow {
  id: string;
  created_at: string;
  total: number;
  status: string;
}

export default function Account() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]               = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Guard: redirect unauthenticated visitors to login
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    // AbortController — cancel the in-flight Supabase request if the user
    // navigates away before the response arrives.
    // Prevents: state updates on unmounted components + stale responses.
    const controller = new AbortController();
    setOrdersLoading(true);

    supabase
      .from('orders')
      .select('id, created_at, total, status')
      .eq('user_id', user.id)            // UUID-based: only this user's orders
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal)
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setOrders(data ?? []);
          setOrdersLoading(false);
        }
      });

    return () => controller.abort();
  }, [user]);

  async function handleLogout() {
    await signOut(); // signOut from AuthContext — no direct supabase import needed
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#5A5A5A]">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const fullName    = (user.user_metadata?.full_name as string) || 'Member';
  const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long',
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">

      {/* Profile header */}
      <div className="flex items-center gap-4 rounded-2xl border border-[#E8DDD0] bg-white p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3D2B0E] text-white">
          <UserIcon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-[#1C1C1C]">{fullName}</h1>
          <p className="text-sm text-[#5A5A5A]">{user.email}</p>
          <p className="text-xs text-[#8A8A8A] mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 space-y-3">
        <Link
          to="/shop"
          className="flex items-center justify-between rounded-2xl border border-[#E8DDD0] bg-white p-5 hover:border-[#C4A265] transition-colors"
        >
          <span className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-[#3D2B0E]" />
            <span className="text-sm font-medium text-[#1C1C1C]">Continue Shopping</span>
          </span>
          <ChevronRight className="h-4 w-4 text-[#8A8A8A]" />
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-2xl border border-[#E8DDD0] bg-white p-5 hover:border-red-300 transition-colors"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-600">Log out</span>
          </span>
        </button>
      </div>

      {/* Recent orders — queried by user_id (UUID), not email */}
      <div className="mt-8">
        <h2 className="font-display text-xl text-[#1C1C1C]">Recent Orders</h2>

        {ordersLoading ? (
          <p className="mt-4 text-sm text-[#5A5A5A]">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#E8DDD0] p-8 text-center text-sm text-[#8A8A8A]">
            You haven't placed any orders yet.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-[#E8DDD0]">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-left text-xs uppercase tracking-wide text-[#5A5A5A]">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0] bg-white">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 text-[#1C1C1C]">#{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[#5A5A5A]">
                      {new Date(o.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-[#1C1C1C]">₹{o.total}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#E8DDD0] px-2.5 py-1 text-xs text-[#3D2B0E]">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

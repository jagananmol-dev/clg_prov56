/**
 * @file pages/admin/AdminOrders.tsx
 * @description Admin order management at /admin/orders.
 *
 * Shows all orders (newest first) with expandable rows for order items.
 * Admin can cancel any non-delivered, non-already-cancelled order.
 */
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface OrderItem { id: string; product_name: string; price: number; quantity: number; }
interface Order {
  id: string; customer_name: string; customer_email: string;
  total: number; status: string; created_at: string;
  order_items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { adminFetch } = useAdminAuth();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const res  = await adminFetch('/api/admin/orders');
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line

  async function handleStatusChange(id: string, status: string) {
    setUpdatingStatus(id);
    await adminFetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadOrders();
    setUpdatingStatus(null);
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Orders</h1>
        <p className="text-sm text-[#8A8A8A] mb-6">{orders.length} total orders</p>

        {loading ? (
          <p className="text-sm text-[#8A8A8A]">Loading orders…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-xs uppercase tracking-wide text-[#5A5A5A]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Order ID</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Total</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0]">
                {orders.map(order => (
                  <>
                    <tr key={order.id} className="hover:bg-[#FAF7F2] cursor-pointer" onClick={() => setExpanded(e => e === order.id ? null : order.id)}>
                      <td className="px-5 py-3 font-mono text-xs text-[#5A5A5A]">#{order.id.slice(0, 8)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1C1C1C]">{order.customer_name}</p>
                        <p className="text-xs text-[#8A8A8A]">{order.customer_email}</p>
                      </td>
                      <td className="px-5 py-3 text-[#5A5A5A]">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 font-semibold text-[#3D2B0E]">₹{order.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                          {updatingStatus === order.id && <RefreshCw size={12} className="animate-spin text-[#8A8A8A]" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={order.status}
                            onClick={e => e.stopPropagation()}
                            onChange={e => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                            className="text-xs border border-[#E8DDD0] rounded-lg px-2 py-1 bg-white text-[#3D2B0E] focus:outline-none"
                            disabled={updatingStatus === order.id}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {expanded === order.id ? <ChevronUp size={15} className="text-[#8A8A8A]" /> : <ChevronDown size={15} className="text-[#8A8A8A]" />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded order items */}
                    {expanded === order.id && (
                      <tr key={`${order.id}-items`}>
                        <td colSpan={6} className="px-5 py-4 bg-[#FAF7F2]">
                          <p className="text-xs font-semibold text-[#5A5A5A] mb-2 uppercase tracking-wide">Order Items</p>
                          <div className="space-y-1.5">
                            {order.order_items.map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm bg-white rounded-xl px-4 py-2.5 border border-[#E8DDD0]">
                                <span className="text-[#1C1C1C]">{item.product_name}</span>
                                <span className="text-[#5A5A5A] text-xs">×{item.quantity} · ₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <p className="py-16 text-center text-sm text-[#8A8A8A]">No orders yet.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/**
 * @file pages/admin/AdminOrders.tsx
 * @description Admin order management at /admin/orders.
 *
 * Shows all orders (newest first), grouped under a header for the day
 * they were placed — makes it obvious at a glance where one day's orders
 * end and the next begin, instead of a flat list where every row looks
 * the same regardless of date. Each row shows the order's exact time
 * (the date is already carried by its group header). Each day's group
 * has a "Download XLSX" button that exports that day's orders — with
 * full shipping address, phone, and line items — so the backend team
 * can hand the sheet straight to a delivery vendor.
 *
 * Admin can change order status per row; cancel is one of the status
 * options.
 */
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Download, Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface OrderItem { id: string; product_name: string; price: number; quantity: number; }
interface Order {
  id: string; customer_name: string; customer_email: string; customer_phone: string | null;
  shipping_address: string;
  total: number; status: string; payment_method: string; created_at: string;
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

interface DayGroup { dateKey: string; label: string; orders: Order[]; }

/** Groups orders into per-day buckets. Orders arrive sorted newest-first
 * from the backend, so same-day orders are always contiguous — a single
 * linear pass is enough, no need to sort/bucket by map. */
function groupByDay(orders: Order[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const order of orders) {
    const d = new Date(order.created_at);
    const dateKey = d.toLocaleDateString('en-CA'); // YYYY-MM-DD — stable grouping key
    const last = groups[groups.length - 1];
    if (last && last.dateKey === dateKey) {
      last.orders.push(order);
    } else {
      groups.push({
        dateKey,
        label: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        orders: [order],
      });
    }
  }
  return groups;
}

export default function AdminOrders() {
  const { adminFetch } = useAdminAuth();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [downloadingDay, setDownloadingDay] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const res  = await adminFetch('/api/admin/orders');
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line

  const groups = useMemo(() => groupByDay(orders), [orders]);

  async function handleStatusChange(id: string, status: string) {
    setUpdatingStatus(id);
    await adminFetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadOrders();
    setUpdatingStatus(null);
  }

  /** Builds a real .xlsx workbook for one day's orders and triggers a
   * browser download. exceljs is dynamically imported so its ~1MB+ isn't
   * part of the initial admin bundle — only loaded the first time someone
   * actually clicks Download. */
  async function downloadDay(group: DayGroup) {
    setDownloadingDay(group.dateKey);
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(group.dateKey);

      sheet.columns = [
        { header: 'Order ID',   key: 'id',      width: 12 },
        { header: 'Time',       key: 'time',     width: 10 },
        { header: 'Customer',   key: 'customer', width: 22 },
        { header: 'Phone',      key: 'phone',    width: 14 },
        { header: 'Email',      key: 'email',    width: 26 },
        { header: 'Address',    key: 'address',  width: 45 },
        { header: 'Items',      key: 'items',    width: 55 },
        { header: 'Total (₹)',  key: 'total',    width: 10 },
        { header: 'Payment',    key: 'payment',  width: 16 },
        { header: 'Status',     key: 'status',   width: 12 },
      ];
      sheet.getRow(1).font = { bold: true };

      for (const order of group.orders) {
        sheet.addRow({
          id:       order.id.slice(0, 8),
          time:     new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          customer: order.customer_name,
          phone:    order.customer_phone ?? '',
          email:    order.customer_email,
          address:  order.shipping_address,
          items:    order.order_items.map(i => `${i.product_name} x${i.quantity}`).join(', '),
          total:    order.total,
          payment:  order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online',
          status:   order.status,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${group.dateKey}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDay(null);
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Orders</h1>
        <p className="text-sm text-[#8A8A8A] mb-6">{orders.length} total orders</p>

        {loading ? (
          <p className="text-sm text-[#8A8A8A]">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8DDD0] py-16 text-center">
            <p className="text-sm text-[#8A8A8A]">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.dateKey} className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden">
                {/* Day header — the "space" between date groups, plus the
                    per-day XLSX download */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#FAF7F2] border-b border-[#E8DDD0]">
                  <div>
                    <p className="text-sm font-semibold text-[#3D2B0E]">{group.label}</p>
                    <p className="text-xs text-[#8A8A8A]">{group.orders.length} order{group.orders.length > 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => downloadDay(group)}
                    disabled={downloadingDay === group.dateKey}
                    className="flex items-center gap-2 text-xs font-medium text-[#3D2B0E] bg-white border border-[#E8DDD0] rounded-full px-4 py-2 hover:border-[#C4A265] disabled:opacity-60 transition-colors"
                  >
                    {downloadingDay === group.dateKey
                      ? <><Loader2 size={13} className="animate-spin" /> Preparing…</>
                      : <><Download size={13} /> Download XLSX</>}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead className="text-xs uppercase tracking-wide text-[#5A5A5A]">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Order ID</th>
                        <th className="px-5 py-3 text-left font-medium">Customer</th>
                        <th className="px-5 py-3 text-left font-medium">Time</th>
                        <th className="px-5 py-3 text-left font-medium">Total</th>
                        <th className="px-5 py-3 text-left font-medium">Payment</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD0]">
                      {group.orders.map(order => (
                        <>
                          <tr key={order.id} className="hover:bg-[#FAF7F2] cursor-pointer" onClick={() => setExpanded(e => e === order.id ? null : order.id)}>
                            <td className="px-5 py-3 font-mono text-xs text-[#5A5A5A]">#{order.id.slice(0, 8)}</td>
                            <td className="px-5 py-3">
                              <p className="font-medium text-[#1C1C1C]">{order.customer_name}</p>
                              <p className="text-xs text-[#8A8A8A]">{order.customer_email}</p>
                            </td>
                            <td className="px-5 py-3 text-[#5A5A5A]">
                              {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-5 py-3 font-semibold text-[#3D2B0E]">₹{order.total}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                order.payment_method === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                              </span>
                            </td>
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
                              <td colSpan={7} className="px-5 py-4 bg-[#FAF7F2]">
                                <p className="text-xs font-semibold text-[#5A5A5A] mb-2 uppercase tracking-wide">Order Items</p>
                                <div className="space-y-1.5">
                                  {order.order_items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between text-sm bg-white rounded-xl px-4 py-2.5 border border-[#E8DDD0]">
                                      <span className="text-[#1C1C1C]">{item.product_name}</span>
                                      <span className="text-[#5A5A5A] text-xs">×{item.quantity} · ₹{item.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-[#8A8A8A] mt-3">
                                  <span className="font-semibold text-[#5A5A5A]">Ship to:</span> {order.shipping_address}
                                  {order.customer_phone && <> · {order.customer_phone}</>}
                                </p>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

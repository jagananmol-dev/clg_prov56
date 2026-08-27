import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  products: { image: string | null } | null;
}

interface OrderRow {
  id: string;
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  order_items: OrderItemRow[];
}

export default function Account() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]               = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productName, setProductName]     = useState('');
  const [thoughtText, setThoughtText]     = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [thoughts, setThoughts]           = useState<Array<{ id: string; product_name: string; content: string; status: string; created_at: string; approved_at: string | null }>>([]);
  const [thoughtsLoading, setThoughtsLoading] = useState(true);
  const [phone, setPhone]                 = useState<string | null>(null);

  // Guard: redirect unauthenticated visitors to login
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setPhone(data?.phone ?? null));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // AbortController — cancel the in-flight Supabase request if the user
    // navigates away before the response arrives.
    // Prevents: state updates on unmounted components + stale responses.
    const controller = new AbortController();
    setOrdersLoading(true);

    supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        status,
        payment_method,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          products ( image )
        )
      `)
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

  useEffect(() => {
    if (!user) return;

    setThoughtsLoading(true);
    supabase
      .from('student_thoughts')
      .select('id, product_name, content, status, created_at, approved_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Account] Failed to load student thoughts:', error.message);
          setThoughts([]);
        } else {
          setThoughts(data ?? []);
        }
        setThoughtsLoading(false);
      });
  }, [user]);

  async function handleSubmitThought(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productName.trim() || !thoughtText.trim()) {
      setSubmissionMessage('Please share both the product name and your thoughts.');
      return;
    }

    if (productName.trim().length < 2) {
      setSubmissionMessage('Product name must be at least 2 characters.');
      return;
    }

    if (thoughtText.trim().length < 10) {
      setSubmissionMessage('Thought text must be at least 10 characters.');
      return;
    }

    if (!user) {
      setSubmissionMessage('You must be logged in to submit a thought.');
      return;
    }

    setSubmitting(true);
    setSubmissionMessage(null);

    const { error } = await supabase
      .from('student_thoughts')
      .insert([{ 
        user_id: user.id,
        student_name: (user.user_metadata?.full_name as string) || 'Student',
        product_name: productName.trim(),
        content: thoughtText.trim(),
      }]);

    setSubmitting(false);

    if (error) {
      console.error('[Account] Thought submission failed:', error.message, error.details ?? '');
      setSubmissionMessage(
        error.message
          ? `Submission failed: ${error.message}`
          : 'Failed to submit your thought. Please try again.'
      );
      return;
    }

    setSubmissionMessage('Your thought was submitted and is pending admin approval.');
    setProductName('');
    setThoughtText('');

    // Refresh the user's thought history after submission
    supabase
      .from('student_thoughts')
      .select('id, product_name, content, status, created_at, approved_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setThoughts(data ?? []));
  }

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
          {phone && <p className="text-sm text-[#5A5A5A]">+91 {phone}</p>}
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
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E8DDD0]">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-[#FAF7F2] text-left text-xs uppercase tracking-wide text-[#5A5A5A]">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD0] bg-white">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 text-[#1C1C1C]">#{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {(o.order_items ?? []).map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.products?.image ? (
                              <img
                                src={item.products.image}
                                alt={item.product_name}
                                className="h-9 w-9 flex-shrink-0 rounded-lg object-cover border border-[#E8DDD0]"
                              />
                            ) : (
                              <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-[#FAF7F2] border border-[#E8DDD0]" />
                            )}
                            <span className="text-[#1C1C1C]">
                              {item.product_name}
                              {item.quantity > 1 && (
                                <span className="text-[#8A8A8A]"> ×{item.quantity}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#5A5A5A]">
                      {new Date(o.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-[#1C1C1C]">₹{o.total}</td>
                    <td className="px-4 py-3 text-[#5A5A5A]">
                      {o.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                    </td>
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

      {/* Student thought submission */}
      <div className="mt-8 rounded-2xl border border-[#E8DDD0] bg-white p-6">
        <div className="mb-5">
          <h2 className="font-display text-xl text-[#1C1C1C]">Share your experience</h2>
          <p className="text-sm text-[#5A5A5A]">
            Submit a short thought about a product you loved. Admin will review it before it appears on the homepage.
          </p>
        </div>

        <form onSubmit={handleSubmitThought} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3D2B0E] mb-2">Product Name</label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full rounded-2xl border border-[#E8DDD0] bg-[#FAF7F2] px-4 py-3 text-sm text-[#1C1C1C] focus:border-[#C4A265] focus:outline-none"
              placeholder="Ex: Graphite Mechanical Pencil"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B0E] mb-2">Your Thought</label>
            <textarea
              value={thoughtText}
              onChange={e => setThoughtText(e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-[#E8DDD0] bg-[#FAF7F2] px-4 py-3 text-sm text-[#1C1C1C] focus:border-[#C4A265] focus:outline-none"
              placeholder="Tell us what you liked about the product and how it helped you."
            />
          </div>

          {submissionMessage && (
            <p className="text-sm text-[#5A5A5A]">{submissionMessage}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-[#3D2B0E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d210b] disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Thought'}
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-[#E8DDD0] bg-white p-6">
        <h2 className="font-display text-xl text-[#1C1C1C] mb-4">Your submitted thoughts</h2>

        {thoughtsLoading ? (
          <p className="text-sm text-[#5A5A5A]">Loading your submissions…</p>
        ) : thoughts.length === 0 ? (
          <p className="text-sm text-[#8A8A8A]">You haven't submitted any thoughts yet.</p>
        ) : (
          <div className="space-y-4">
            {thoughts.map(thought => (
              <div key={thought.id} className="rounded-2xl border border-[#E8DDD0] bg-[#FAF7F2] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-semibold text-[#3D2B0E]">{thought.product_name}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7C5A2A]">
                    {thought.status}
                  </span>
                </div>
                <p className="text-sm text-[#5A5A5A] leading-relaxed mb-2">{thought.content}</p>
                <p className="text-xs text-[#8A8A8A]">
                  Submitted {new Date(thought.created_at).toLocaleDateString('en-IN')}
                  {thought.approved_at ? ` · Approved ${new Date(thought.approved_at).toLocaleDateString('en-IN')}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

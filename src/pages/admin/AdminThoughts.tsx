/**
 * @file pages/admin/AdminThoughts.tsx
 * @description Admin moderation for student-submitted thoughts.
 */
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Trash2, MessageSquare } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface Thought {
  id: string;
  user_id: string;
  student_name: string;
  product_name: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
}

export default function AdminThoughts() {
  const { adminFetch } = useAdminAuth();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadThoughts = async () => {
    setLoading(true);
    const res = await adminFetch('/api/admin/thoughts');
    const data = await res.json();
    setThoughts(data.thoughts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadThoughts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setActionId(id);
    const res = await adminFetch(`/api/admin/thoughts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadThoughts();
    setActionId(null);
  }

  async function handleDelete(id: string) {
    setActionId(id);
    const res = await adminFetch(`/api/admin/thoughts/${id}`, { method: 'DELETE' });
    if (res.ok) loadThoughts();
    setActionId(null);
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Student Thoughts</h1>
        <p className="text-sm text-[#8A8A8A] mb-6">Moderate student feedback before it appears on the homepage.</p>

        {loading ? (
          <p className="text-sm text-[#5A5A5A]">Loading thoughts…</p>
        ) : thoughts.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={32} className="text-[#E8DDD0] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A]">No student thoughts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {thoughts.map(thought => (
              <div key={thought.id} className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="rounded-full bg-[#E8DDD0] px-3 py-1 text-xs font-semibold text-[#7C5A2A]">
                        {thought.status}
                      </span>
                      <span className="text-xs text-[#8A8A8A]">
                        {thought.student_name} · {thought.product_name}
                      </span>
                      <span className="text-xs text-[#8A8A8A]">
                        {new Date(thought.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-[#5A5A5A] leading-relaxed">{thought.content}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(thought.id, 'approved')}
                      disabled={actionId === thought.id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(thought.id, 'rejected')}
                      disabled={actionId === thought.id}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-[#7C5A2A] hover:bg-amber-200 disabled:opacity-50"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      onClick={() => handleDelete(thought.id)}
                      disabled={actionId === thought.id}
                      className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

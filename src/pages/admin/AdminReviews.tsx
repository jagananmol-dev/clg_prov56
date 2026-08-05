/**
 * @file pages/admin/AdminReviews.tsx
 * @description Admin review/comment management at /admin/reviews.
 * Lists all reviews across all products. Admin can delete any review.
 */
import { useState, useEffect } from 'react';
import { Star, Trash2, MessageSquare } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminLayout from './AdminLayout';

interface Review {
  id: string; content: string; rating: number; created_at: string;
  user_id: string;
  products: { id: string; name: string } | null;
}

export default function AdminReviews() {
  const { adminFetch } = useAdminAuth();
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    const res  = await adminFetch('/api/admin/reviews');
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, []); // eslint-disable-line

  async function handleDelete(id: string) {
    const res = await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteId(null); loadReviews(); }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Reviews</h1>
        <p className="text-sm text-[#8A8A8A] mb-6">{reviews.length} total reviews</p>

        {loading ? (
          <p className="text-sm text-[#8A8A8A]">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={32} className="text-[#E8DDD0] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A]">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl border border-[#E8DDD0] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Product + user */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#7C5A2A] bg-[#E8DDD0] px-2.5 py-1 rounded-full">
                        {review.products?.name ?? 'Unknown product'}
                      </span>
                      <span className="text-xs text-[#8A8A8A]">
                        by User #{review.user_id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-[#8A8A8A]">
                        · {new Date(review.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {/* Star rating */}
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i} size={12}
                          className={i < review.rating ? 'fill-[#C4A265] text-[#C4A265]' : 'text-[#E8DDD0]'}
                        />
                      ))}
                    </div>

                    {/* Review content */}
                    <p className="text-sm text-[#5A5A5A] leading-relaxed">{review.content}</p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteId(review.id)}
                    className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 shrink-0"
                    title="Delete review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Confirm Dialog ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <h3 className="font-semibold text-[#1C1C1C] mb-2">Delete Review?</h3>
            <p className="text-sm text-[#5A5A5A] mb-5">This review will be permanently removed. The user will not be notified.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#E8DDD0] py-2.5 rounded-full text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/**
 * @file components/RateProduct.tsx
 * @description Lets a signed-in shopper submit (or update) a star rating +
 * short review for a product. Writes to the `reviews` table — the same
 * one the admin's "User Ratings" page (AdminReviews.tsx) already
 * moderates, so anything submitted here is immediately visible there.
 *
 * Deliberately does NOT touch `products.rating` — the number shown on
 * product cards and this page, which the admin sets separately via the
 * "Admin Rating" field on the Edit Product form. User ratings are
 * recorded but kept decoupled from the displayed rating for now.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function RateProduct({ productId }: { productId: string | number }) {
  const { user, isAuthenticated } = useAuth();
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content,     setContent]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [message,     setMessage]     = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  // Prefill with the shopper's own existing rating for this product, if any.
  useEffect(() => {
    if (!isAuthenticated || !user) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('reviews')
      .select('rating, content')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRating(data.rating);
          setContent(data.content);
        }
        setLoading(false);
      });
  }, [productId, user, isAuthenticated]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    if (content.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }

    setSaving(true);
    // Upsert on (product_id, user_id) — the table's unique constraint — so
    // rating a product a second time updates the existing row instead of
    // failing on the constraint.
    const { error: upsertError } = await supabase
      .from('reviews')
      .upsert(
        { product_id: productId, user_id: user!.id, rating, content: content.trim() },
        { onConflict: 'product_id,user_id' }
      );
    setSaving(false);

    if (upsertError) {
      setError(upsertError.message || 'Failed to submit your rating. Please try again.');
      return;
    }
    setMessage('Thanks! Your rating has been submitted.');
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-[#E8DDD0] bg-white p-5">
        <p className="text-sm text-[#5A5A5A]">
          <Link to="/login" className="text-[#7C5A2A] font-medium hover:underline">Log in</Link> to rate this product.
        </p>
      </div>
    );
  }

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-[#E8DDD0] bg-white p-5">
      <h3 className="font-display text-lg font-bold text-[#3D2B0E] mb-3">
        {rating ? 'Update Your Rating' : 'Rate This Product'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star
                  size={22}
                  className={(hoverRating || rating) >= starValue ? 'fill-[#C4A265] text-[#C4A265]' : 'text-[#E8DDD0]'}
                />
              </button>
            );
          })}
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          placeholder="What did you think of this product? (min 10 characters)"
          className="w-full border border-[#E8DDD0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A265]/40 resize-none"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}
        {message && <p className="text-xs text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-[#3D2B0E] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#5A3F1A] disabled:opacity-60 transition-colors flex items-center gap-2"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Submitting…</>
          ) : rating ? 'Update Rating' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}

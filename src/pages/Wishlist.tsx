import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { Star } from 'lucide-react';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { products } = useProducts();

  // Resolve full product objects from the stored ID array
  const wishlisted = products.filter(p => wishlist.includes(p.id));

  // ── Empty state ──────────────────────────────
  if (wishlisted.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[#E8DDD0] flex items-center justify-center mx-auto mb-6">
            <Heart size={32} className="text-[#7C5A2A]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#3D2B0E] mb-2">Your wishlist is empty</h1>
          <p className="text-[#5A5A5A] text-sm mb-6">
            Hit the ♡ on any product to save it here for later.
          </p>
          <Link
            to="/shop"
            className="glass-btn inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-full text-sm font-medium transition-all"
          >
            Browse Products <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Wishlist grid ────────────────────────────
  return (
    <div className="bg-[#FAF7F2] min-h-screen">

      {/* Page header */}
      <div className="bg-white border-b border-[#E8DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C5A2A]">
            Saved items
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#3D2B0E] mt-2 flex items-center gap-3">
            My Wishlist
            <span className="text-base font-sans font-normal text-[#8A8A8A]">
              ({wishlisted.length} {wishlisted.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Add all to cart shortcut */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => wishlisted.forEach(p => addToCart(p))}
            className="flex items-center gap-2 text-sm font-medium text-white bg-[#3D2B0E] hover:bg-[#5A3F1A] px-5 py-2.5 rounded-full transition-colors"
          >
            <ShoppingCart size={15} />
            Add all to cart
          </button>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {wishlisted.map(product => {
            const discount = Math.round(
              ((product.originalPrice - product.price) / product.originalPrice) * 100
            );

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-[#FAF7F2]">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.tag && (
                      <span className="bg-[#7C5A2A] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        {product.tag}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="bg-[#3D2B0E] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Remove from wishlist */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    title="Remove from wishlist"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-red-50 flex items-center justify-center shadow-sm transition-colors"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-[#8A8A8A] mb-1">
                    {product.category}
                  </p>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-semibold text-[#3D2B0E] hover:text-[#7C5A2A] transition-colors line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={12} className="fill-[#C4A265] text-[#C4A265]" />
                    <span className="text-xs font-medium text-[#5A5A5A]">{product.rating}</span>
                    <span className="text-xs text-[#8A8A8A]">({product.reviews})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base font-bold text-[#3D2B0E]">₹{product.price}</span>
                    <span className="text-xs text-[#8A8A8A] line-through">₹{product.originalPrice}</span>
                  </div>

                  {/* Add to cart — pinned to bottom */}
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-[#3D2B0E] text-white py-2.5 rounded-full text-xs font-medium hover:bg-[#5A3F1A] transition-colors"
                  >
                    <ShoppingCart size={13} />
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="text-sm font-medium text-[#7C5A2A] hover:underline underline-offset-2"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

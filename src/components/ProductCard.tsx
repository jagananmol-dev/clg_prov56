/**
 * @file ProductCard.tsx
 * @description Reusable product tile used on the Shop page,
 * Best Sellers section, and Related Products grid.
 *
 * Interactions:
 *  - Click image / title  → navigates to /product/:id
 *  - Heart button         → toggles wishlist (persisted via CartContext → localStorage)
 *  - Hover "Add to Cart"  → quick-add without leaving the page (slides up on hover)
 */
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useCart();
  // Check if this product's ID exists in the persisted wishlist array
  const isWishlisted = wishlist.includes(product.id);
  // Compute integer discount % for the badge (e.g. 25 → "-25%")
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#E8DDD0] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-[#FAF7F2]">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>

        {/* Tags */}
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

        {/* Wishlist */}
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-sm"
        >
          <Heart size={16} className={isWishlisted ? 'fill-[#7C5A2A] text-[#7C5A2A]' : 'text-[#3D2B0E]'} />
        </button>

        {/* Quick add */}
        <button
          onClick={() => addToCart(product)}
          className="absolute bottom-3 left-3 right-3 bg-[#3D2B0E] text-white py-2.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wide text-[#8A8A8A] mb-1">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-[#3D2B0E] hover:text-[#7C5A2A] transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-1.5">
          <Star size={12} className="fill-[#C4A265] text-[#C4A265]" />
          <span className="text-xs font-medium text-[#5A5A5A]">{product.rating}</span>
          <span className="text-xs text-[#8A8A8A]">({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-[#3D2B0E]">₹{product.price}</span>
          <span className="text-xs text-[#8A8A8A] line-through">₹{product.originalPrice}</span>
        </div>
      </div>
    </div>
  );
}

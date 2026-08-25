import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Star, Heart, ShoppingCart, Minus, Plus, ChevronRight, Truck, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import RateProduct from '@/components/RateProduct';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const [qty, setQty] = useState(1);

  // Fetch single product and all products (for related grid) from Supabase
  const { product, loading } = useProduct(id);
  const { products: allProducts } = useProducts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 rounded-full border-2 border-[#E8DDD0] border-t-[#7C5A2A] animate-spin" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <p className="text-[#3D2B0E] text-lg font-semibold mb-2">Product not found</p>
          <Link to="/shop" className="text-[#7C5A2A] text-sm underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  const outOfStock = product.isAvailable === false;
  // Use live allProducts list for related items (same category, different ID),
  // ordered by rating ascending as requested.
  const related = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 4);

  const handleAdd = () => {
    if (outOfStock) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    navigate('/cart');
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
          <Link to="/" className="hover:text-[#7C5A2A]">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-[#7C5A2A]">Shop</Link>
          <ChevronRight size={12} />
          <span className="text-[#3D2B0E]">{product.name}</span>
        </nav>
      </div>

      {/* Product */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden bg-white border border-[#E8DDD0] aspect-square">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.tag && (
              <span className="absolute top-4 left-4 bg-[#7C5A2A] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {product.tag}
              </span>
            )}
          </div>

          {/* Info — min-w-0 lets this grid column actually shrink to its
              track width; a bare grid item defaults to min-width: auto,
              which lets wide content (like the description below) push
              the column wider than intended instead of wrapping inside it. */}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[#8A8A8A] mb-2">{product.category}</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#3D2B0E] mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(product.rating) ? 'fill-[#C4A265] text-[#C4A265]' : 'text-[#E8DDD0]'} />
                ))}
              </div>
              <span className="text-sm text-[#5A5A5A]">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-[#3D2B0E]">₹{product.price}</span>
              <span className="text-lg text-[#8A8A8A] line-through">₹{product.originalPrice}</span>
              {discount > 0 && (
                <span className="bg-[#E8DDD0] text-[#7C5A2A] text-xs font-semibold px-2.5 py-1 rounded-full">Save {discount}%</span>
              )}
            </div>

            {/* Description — boxed off as its own section rather than
                flowing straight into the page. Each Enter the admin
                pressed in the form becomes its own <p> with real spacing
                between them (an actual new paragraph, not just a CSS line
                break inside one block); whitespace-pre-wrap on each line
                still preserves multi-space runs within it. */}
            <div className="mb-7 rounded-2xl border border-[#E8DDD0] bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-[#8A8A8A] mb-2">Description</p>
              <div className="space-y-3">
                {product.description
                  .split('\n')
                  .filter(line => line.trim() !== '')
                  .map((paragraph, i) => (
                    // break-words: whitespace-pre-wrap alone only wraps at
                    // existing spaces/breaks — a single long unbroken run
                    // (a long word, a URL) would still push past the box
                    // without this.
                    <p key={i} className="font-sans text-base text-[#5A5A5A] leading-relaxed whitespace-pre-wrap break-words">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {/* Out of stock notice */}
            {outOfStock && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  <strong>Out of Stock</strong>
                  {product.unavailableReason && product.unavailableReason !== 'Out of stock'
                    ? ` — ${product.unavailableReason}`
                    : '. Check back soon.'}
                </span>
              </div>
            )}

            {/* Quantity + Add */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className={`flex items-center border border-[#E8DDD0] rounded-full ${outOfStock ? 'opacity-50' : ''}`}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={outOfStock}
                  className="p-3 text-[#3D2B0E] hover:text-[#7C5A2A] disabled:cursor-not-allowed"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-semibold text-[#3D2B0E]">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  disabled={outOfStock}
                  className="p-3 text-[#3D2B0E] hover:text-[#7C5A2A] disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className={`transition-colors flex-1 min-w-[140px] py-3.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 ${
                  outOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <ShoppingCart size={16} /> {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="w-12 h-12 rounded-full border border-[#E8DDD0] flex items-center justify-center hover:bg-[#E8DDD0]"
              >
                <Heart size={18} className={isWishlisted ? 'fill-[#7C5A2A] text-[#7C5A2A]' : 'text-[#3D2B0E]'} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#E8DDD0]">
              {[
                { icon: Truck, label: 'Same Day Delivery', sub: 'On all orders' },
                { icon: RefreshCw, label: 'Same-Day Returns', sub: 'Easy process' },
                { icon: Shield, label: 'Secure Payment', sub: 'Protected' },
              ].map(b => (
                <div key={b.label} className="text-center">
                  <b.icon size={20} className="text-[#7C5A2A] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-[#3D2B0E]">{b.label}</p>
                  <p className="text-[10px] text-[#8A8A8A]">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rate this product — a separate track from the admin-set rating
            shown above; see RateProduct.tsx for why they're decoupled. */}
        <div className="mt-12 max-w-xl">
          <RateProduct productId={product.id} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-2xl font-bold text-[#3D2B0E] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Star, Heart, ShoppingCart, Minus, Plus, ChevronRight, Truck, RefreshCw, Shield } from 'lucide-react';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const [qty, setQty] = useState(1);

  const product = products.find(p => p.id === Number(id));

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
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAdd = () => {
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

          {/* Info */}
          <div>
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

            <p className="text-sm text-[#5A5A5A] leading-relaxed mb-7">{product.description}</p>

            {/* Quantity + Add */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center border border-[#E8DDD0] rounded-full">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-3 text-[#3D2B0E] hover:text-[#7C5A2A]">
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-semibold text-[#3D2B0E]">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="p-3 text-[#3D2B0E] hover:text-[#7C5A2A]">
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="glass-btn flex-1 text-white py-3.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} /> Add to Cart
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
                { icon: Truck, label: 'Free Shipping', sub: 'Over ₹499' },
                { icon: RefreshCw, label: '7-Day Returns', sub: 'Easy process' },
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

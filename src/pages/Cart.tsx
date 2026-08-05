import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = totalPrice > 499 ? 0 : 49;
  const grandTotal = totalPrice + shipping;

  async function handleCheckout() {
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (!address.trim()) {
      setError('Please provide a shipping address.');
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      // 1. Create the Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: user.user_metadata?.full_name || 'Customer',
          customer_email: user.email,
          customer_phone: phone,
          shipping_address: address,
          total: grandTotal,
          status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // 2. Create the Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Cleanup & Redirect
      clearCart();
      navigate('/account');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[#E8DDD0] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={32} className="text-[#7C5A2A]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#3D2B0E] mb-2">Your cart is empty</h1>
          <p className="text-[#5A5A5A] text-sm mb-6">Looks like you haven't added any stationery yet. Let's fix that.</p>
          <Link to="/shop" className="glass-btn inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-full text-sm font-medium hover:gap-2 transition-all">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl font-bold text-[#3D2B0E] mb-2">Shopping Cart</h1>
        <p className="text-[#5A5A5A] text-sm mb-8">{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#E8DDD0] p-4 flex gap-4">
                <Link to={`/product/${item.id}`} className="flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#8A8A8A]">{item.category}</p>
                      <Link to={`/product/${item.id}`}>
                        <h3 className="text-sm font-semibold text-[#3D2B0E] hover:text-[#7C5A2A] line-clamp-1">{item.name}</h3>
                      </Link>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-[#8A8A8A] hover:text-red-500 flex-shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#E8DDD0] rounded-full">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-[#3D2B0E] hover:text-[#7C5A2A]">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm font-semibold text-[#3D2B0E]">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-[#3D2B0E] hover:text-[#7C5A2A]">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-[#3D2B0E]">₹{item.price * item.quantity}</p>
                      <p className="text-xs text-[#8A8A8A]">₹{item.price} each</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <Link to="/shop" className="text-sm text-[#7C5A2A] font-medium hover:underline">← Continue Shopping</Link>
              <button onClick={clearCart} className="text-sm text-[#8A8A8A] hover:text-red-500">Clear Cart</button>
            </div>
          </div>

          {/* Checkout & Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 sticky top-24">
              
              {/* Shipping Details */}
              <div className="mb-6 pb-6 border-b border-[#E8DDD0]">
                <h2 className="font-display text-lg font-bold text-[#3D2B0E] mb-4 flex items-center gap-2">
                  <MapPin size={18} /> Shipping Details
                </h2>
                
                {!isAuthenticated ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 mb-3">You need to sign in to place an order.</p>
                    <Link to="/login?redirect=/cart" className="block w-full text-center bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700">
                      Sign In to Checkout
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Delivery Address *</label>
                      <textarea 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Full delivery address"
                        className="w-full bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#C4A265]"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Phone Number (optional)</label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="For delivery updates"
                        className="w-full bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#C4A265]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <h2 className="font-display text-xl font-bold text-[#3D2B0E] mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#5A5A5A]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#3D2B0E]">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[#5A5A5A]">
                  <span>Shipping</span>
                  <span className="font-medium text-[#3D2B0E]">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">You qualified for free shipping!</p>
                )}
                <div className="border-t border-[#E8DDD0] pt-3 flex justify-between items-center">
                  <span className="font-semibold text-[#3D2B0E]">Total</span>
                  <span className="font-bold text-xl text-[#3D2B0E]">₹{grandTotal}</span>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
              )}

              <button 
                onClick={handleCheckout}
                disabled={!isAuthenticated || isCheckingOut || !address.trim()}
                className={`w-full py-3.5 rounded-full text-sm font-medium mt-5 flex items-center justify-center gap-2 transition-all ${
                  (!isAuthenticated || !address.trim())
                    ? 'bg-[#E8DDD0] text-[#8A8A8A] cursor-not-allowed'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isCheckingOut ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <>Place Order <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-xs text-[#8A8A8A] text-center mt-4">Secure checkout · Cash on Delivery available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

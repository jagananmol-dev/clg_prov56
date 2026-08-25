import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, MapPin, Phone, CreditCard, Banknote } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

/** Razorpay type declarations (loaded via <script> in index.html) */
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

// Razorpay key_id is a public identifier (like a Stripe publishable key) —
// safe to ship to the client, but still env-driven so test/live keys can be
// swapped per environment without a code change.
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  // Prefill the phone number from the profile captured at signup, so
  // returning customers don't have to retype it on every order. Still
  // editable — the field remains the source of truth for this order.
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.phone) setPhone(data.phone);
      });
  }, [user]);

  // Persists the order (and its line items) to Supabase. For 'online' this
  // runs after Razorpay confirms the charge; for 'cod' it runs immediately,
  // since nothing is collected until the order arrives.
  async function saveOrder(paymentId: string | null, method: 'online' | 'cod') {
    if (!user) return;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: user.user_metadata?.full_name || 'Customer',
        customer_email: user.email,
        customer_phone: phone,
        shipping_address: address,
        total: totalPrice,
        status: method === 'cod' ? 'pending' : 'confirmed',
        payment_id: paymentId,
        payment_method: method,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    clearCart();
    navigate('/account');
  }

  async function handleCheckout() {
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (!address.trim()) {
      setError('Please provide a delivery address.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setError(null);

    // Cash on Delivery — nothing to charge now, just record the order so
    // the admin panel and the delivery agent know cash is due on arrival.
    if (paymentMethod === 'cod') {
      setIsCheckingOut(true);
      try {
        await saveOrder(null, 'cod');
      } catch (err) {
        console.error('COD order save error:', err);
        setError(err instanceof Error ? err.message : 'Failed to place your order. Please try again.');
      } finally {
        setIsCheckingOut(false);
      }
      return;
    }

    if (!RAZORPAY_KEY) {
      console.error('VITE_RAZORPAY_KEY_ID is not set.');
      setError('Payments are not configured. Please contact support.');
      return;
    }

    setIsCheckingOut(true);

    try {
      // Razorpay expects amount in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(totalPrice * 100);

      const options: Record<string, unknown> = {
        key: RAZORPAY_KEY,
        amount: amountInPaise,
        currency: 'INR',
        name: 'The Dorm Store',
        description: `Order — ${totalItems} item${totalItems > 1 ? 's' : ''}`,
        image: '/images/ChatGPT_Image_Jul_24,_2026,_03_17_51_PM copy.png',
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          contact: phone || '',
        },
        notes: {
          address: address,
        },
        theme: {
          color: '#3D2B0E',
        },
        handler: async function (response: { razorpay_payment_id: string }) {
          // Payment succeeded — save order to Supabase
          try {
            await saveOrder(response.razorpay_payment_id, 'online');
          } catch (err) {
            console.error('Order save error:', err);
            setError('Payment succeeded but order save failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
          } finally {
            setIsCheckingOut(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsCheckingOut(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function () {
        setError('Payment failed. Please try again.');
        setIsCheckingOut(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.');
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
              
              {/* Delivery Details */}
              <div className="mb-6 pb-6 border-b border-[#E8DDD0]">
                <h2 className="font-display text-lg font-bold text-[#3D2B0E] mb-4 flex items-center gap-2">
                  <MapPin size={18} /> Delivery Details
                </h2>
                
                {!isAuthenticated ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 mb-3">You need to log in to place an order.</p>
                    <Link to="/login?redirect=/cart" className="block w-full text-center bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700">
                      Log In to Checkout
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
                      <label className="block text-xs font-medium text-[#5A5A5A] mb-1">Phone Number *</label>
                      <div className="flex items-center bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl px-4 py-2">
                        <span className="text-sm font-medium text-[#5A5A5A] mr-2 select-none">+91</span>
                        <input 
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(val);
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                          className="w-full bg-transparent text-sm focus:outline-none"
                        />
                        <Phone size={16} className="text-[#8A8A8A] flex-shrink-0" />
                      </div>
                      {phone && !/^[6-9]\d{9}$/.test(phone) && (
                        <p className="text-xs text-red-500 mt-1">Enter a valid 10-digit Indian mobile number</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              {isAuthenticated && (
                <div className="mb-6 pb-6 border-b border-[#E8DDD0]">
                  <h2 className="font-display text-lg font-bold text-[#3D2B0E] mb-4">Payment Method</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                        paymentMethod === 'online'
                          ? 'border-[#3D2B0E] bg-[#FAF7F2]'
                          : 'border-[#E8DDD0] hover:border-[#C4A265]'
                      }`}
                    >
                      <CreditCard size={20} className="text-[#3D2B0E]" />
                      <span className="text-xs font-medium text-[#3D2B0E]">Pay Online</span>
                      <span className="text-[10px] text-[#8A8A8A]">Card / UPI / Wallet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                        paymentMethod === 'cod'
                          ? 'border-[#3D2B0E] bg-[#FAF7F2]'
                          : 'border-[#E8DDD0] hover:border-[#C4A265]'
                      }`}
                    >
                      <Banknote size={20} className="text-[#3D2B0E]" />
                      <span className="text-xs font-medium text-[#3D2B0E]">Cash on Delivery</span>
                      <span className="text-[10px] text-[#8A8A8A]">Pay when it arrives</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <h2 className="font-display text-xl font-bold text-[#3D2B0E] mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#5A5A5A]">
                  <span>Subtotal ({totalItems} item{totalItems > 1 ? 's' : ''})</span>
                  <span className="font-medium text-[#3D2B0E]">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[#5A5A5A]">
                  <span>Delivery</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t border-[#E8DDD0] pt-3 flex justify-between items-center">
                  <span className="font-semibold text-[#3D2B0E]">Total</span>
                  <span className="font-bold text-xl text-[#3D2B0E]">₹{totalPrice}</span>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
              )}

              <button 
                onClick={handleCheckout}
                disabled={!isAuthenticated || isCheckingOut || !address.trim() || !/^[6-9]\d{9}$/.test(phone)}
                className={`w-full py-3.5 rounded-full text-sm font-medium mt-5 flex items-center justify-center gap-2 transition-all ${
                  (!isAuthenticated || !address.trim() || !/^[6-9]\d{9}$/.test(phone))
                    ? 'bg-[#E8DDD0] text-[#8A8A8A] cursor-not-allowed'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isCheckingOut ? (
                  <><Loader2 size={16} className="animate-spin" /> {paymentMethod === 'cod' ? 'Placing Order...' : 'Processing...'}</>
                ) : paymentMethod === 'cod' ? (
                  <>Place Order — Pay ₹{totalPrice} on Delivery <ArrowRight size={16} /></>
                ) : (
                  <>Pay ₹{totalPrice} <ArrowRight size={16} /></>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2">
                {paymentMethod === 'cod' ? (
                  <p className="text-xs text-[#8A8A8A]">Pay in cash to the delivery agent when your order arrives</p>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" className="text-[#8A8A8A]"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <p className="text-xs text-[#8A8A8A]">Secured by Razorpay · 100% safe payment</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

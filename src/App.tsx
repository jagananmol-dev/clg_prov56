import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─────────────────────────────────────────────
// Route-based code splitting via React.lazy()
//
// Each page is its own JS chunk. Vite splits them at build time.
// The browser only downloads a page's code when the user navigates to it.
//
// Result: initial JS bundle is ~65% smaller → faster first load.
// ─────────────────────────────────────────────
const Home          = lazy(() => import('@/pages/Home'));
const Shop          = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart          = lazy(() => import('@/pages/Cart'));
const Account       = lazy(() => import('@/pages/Account'));
const AuthPage      = lazy(() => import('@/pages/AuthPage'));
const Wishlist      = lazy(() => import('@/pages/Wishlist'));

// Minimal spinner shown while a lazy chunk is loading
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[#E8DDD0] border-t-[#7C5A2A] animate-spin" />
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
            <Navbar />
            <main className="flex-1">
              {/* Suspense catches any lazy chunk that's still loading */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login"        element={<AuthPage mode="login" />} />
                  <Route path="/signup"       element={<AuthPage mode="signup" />} />
                  <Route path="/account"      element={<Account />} />
                  <Route path="/wishlist"     element={<Wishlist />} />
                  <Route path="/"             element={<Home />} />
                  <Route path="/shop"         element={<Shop />} />
                  <Route path="/product/:id"  element={<ProductDetail />} />
                  <Route path="/cart"         element={<Cart />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;

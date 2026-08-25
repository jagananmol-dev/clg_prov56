/**
 * @file StoreApp.tsx
 * @description Root component for the customer storefront build.
 *
 * This is a separate entry from AdminApp.tsx so the two can be deployed as
 * two independent Vercel projects with two independent bundles — the
 * storefront's JS never contains admin routes/components (and vice versa),
 * rather than shipping one super-app and just changing which HTML file
 * loads it.
 *
 * Provider hierarchy: CartProvider → AuthProvider → BrowserRouter
 * (no AdminAuthProvider here — the storefront never touches admin auth).
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Home          = lazy(() => import('@/pages/Home'));
const Shop          = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart          = lazy(() => import('@/pages/Cart'));
const Account       = lazy(() => import('@/pages/Account'));
const AuthPage      = lazy(() => import('@/pages/AuthPage'));
const Wishlist      = lazy(() => import('@/pages/Wishlist'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[#E8DDD0] border-t-[#7C5A2A] animate-spin" />
    </div>
  );
}

export default function StoreApp() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"             element={<Home />} />
                  <Route path="/shop"         element={<Shop />} />
                  <Route path="/product/:id"  element={<ProductDetail />} />
                  <Route path="/cart"         element={<Cart />} />
                  <Route path="/wishlist"     element={<Wishlist />} />
                  <Route path="/account"      element={<Account />} />
                  <Route path="/login"        element={<AuthPage mode="login" />} />
                  <Route path="/signup"       element={<AuthPage mode="signup" />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

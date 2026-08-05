/**
 * @file App.tsx
 * @description Root application component.
 *
 * Provider hierarchy (outermost → innermost):
 *  AdminAuthProvider → CartProvider → AuthProvider → BrowserRouter
 *
 * Route structure:
 *  Public routes  — wrapped in Navbar + Footer
 *  Admin routes   — standalone layout (AdminLayout contains its own sidebar)
 *                   guarded by AdminRoute (redirects to /admin/login)
 *
 * All page-level components are React.lazy() — each becomes its own
 * JS chunk downloaded only when the user first navigates to that route.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminRoute from '@/components/admin/AdminRoute';

// ── Public pages (lazy-loaded) ────────────────────────────────────────────
const Home          = lazy(() => import('@/pages/Home'));
const Shop          = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart          = lazy(() => import('@/pages/Cart'));
const Account       = lazy(() => import('@/pages/Account'));
const AuthPage      = lazy(() => import('@/pages/AuthPage'));
const Wishlist      = lazy(() => import('@/pages/Wishlist'));

// ── Admin pages (lazy-loaded, isolated layout) ────────────────────────────
const AdminLogin     = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts  = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminReviews   = lazy(() => import('@/pages/admin/AdminReviews'));

/** Minimal spinner shown while a lazy chunk downloads */
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[#E8DDD0] border-t-[#7C5A2A] animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>

                {/* ── Admin routes (standalone — no public Navbar/Footer) ── */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/reviews"  element={<AdminRoute><AdminReviews /></AdminRoute>} />

                {/* ── Public routes (with Navbar + Footer) ── */}
                <Route path="/*" element={
                  <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
                    <Navbar />
                    <main className="flex-1">
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
                    </main>
                    <Footer />
                  </div>
                } />

              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </CartProvider>
    </AdminAuthProvider>
  );
}

export default App;

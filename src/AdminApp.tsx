/**
 * @file AdminApp.tsx
 * @description Root component for the admin portal build.
 *
 * Separate entry from StoreApp.tsx — deployed as its own Vercel project,
 * with its own bundle that never contains storefront routes/components.
 *
 * Provider hierarchy: AdminAuthProvider → BrowserRouter
 * (no CartProvider/AuthProvider — admin never touches customer auth or cart).
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import AdminRoute from '@/components/admin/AdminRoute';

const AdminLogin     = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts  = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminReviews   = lazy(() => import('@/pages/admin/AdminReviews'));
const AdminThoughts  = lazy(() => import('@/pages/admin/AdminThoughts'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[#E8DDD0] border-t-[#7C5A2A] animate-spin" />
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/reviews"  element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="/admin/thoughts" element={<AdminRoute><AdminThoughts /></AdminRoute>} />
            {/* Anything else on this domain is an admin portal — send it to login */}
            <Route path="*" element={<AdminLogin />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

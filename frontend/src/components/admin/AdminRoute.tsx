/**
 * @file components/admin/AdminRoute.tsx
 * @description Route guard for admin pages.
 * Redirects unauthenticated visitors to /admin/login.
 */
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated } = useAdminAuth();
  return isAdminAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useEffect } from 'react';

/**
 * ProtectedRoute component
 * Redirects to login if user is not authenticated
 * Optionally checks for specific role
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Log access attempt for debugging
    if (requiredRole && user?.role !== requiredRole) {
      console.warn(
        `[ProtectedRoute] Access denied to ${location.pathname}. Required: ${requiredRole}, Current: ${user?.role}`
      );
    }
  }, [requiredRole, user?.role, location.pathname]);

  // Not authenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check (if specified)
  if (requiredRole && user?.role !== requiredRole) {
    // Special handling: If passenger tries to access driver routes, redirect to become-driver
    if (requiredRole === 'driver' && user?.role === 'passenger') {
      // If trying to register vehicle, redirect to become-driver flow
      if (location.pathname === '/driver/register-vehicle') {
        return <Navigate to="/become-driver" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
    
    // Redirect to appropriate page based on actual role
    if (user?.role === 'passenger') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'driver') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}


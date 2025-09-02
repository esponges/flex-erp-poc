import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { state } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated and not initializing
  useEffect(() => {
    if (!state.isInitializing && !state.isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate({ to: '/login', replace: true });
    }
  }, [state.isAuthenticated, state.isInitializing, navigate]);

  // Show loading spinner while initializing
  if (state.isInitializing) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // If we have a fallback and user is not authenticated, show fallback
  if (!state.isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Show children if authenticated
  if (state.isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}

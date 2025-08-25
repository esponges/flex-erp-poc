import { type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { state } = useAuth();

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
  return <>{children}</>;
}

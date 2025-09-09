// components/auth/AuthGuard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/', 
  fallback 
}: AuthGuardProps) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push('/dashboard'); // or wherever authenticated users should go
      }
    }
  }, [isAuthenticated, isInitialized, requireAuth, router, redirectTo]);

  // Show loading state while initializing
  if (!isInitialized) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show children if auth requirements are met
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return <>{children}</>;
  }

  // Show fallback while redirecting
  return fallback || <div>Redirecting...</div>;
};
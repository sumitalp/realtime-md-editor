// components/auth/GuestGuard.tsx
import { AuthGuard } from './AuthGuard';

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const GuestGuard = ({ children, redirectTo, fallback }: GuestGuardProps) => {
  return (
    <AuthGuard 
      requireAuth={false} 
      redirectTo={redirectTo} 
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
};
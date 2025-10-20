import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth';

interface RequireRolesProps {
  children: React.ReactNode;
  roles: UserRole[];
}

export function RequireRoles({ children, roles }: RequireRolesProps) {
  const { hasAnyRole } = useAuthStore();

  if (!hasAnyRole(roles)) {
    // User doesn't have required role - redirect to 403 or dashboard
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

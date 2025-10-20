/**
 * Authentication Guard Hook
 * ========================
 * 
 * Hook für Route-Protection und Auth-basierte Navigation.
 * Bietet typsichere Auth-Checks für Komponenten.
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export interface AuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requireGuest?: boolean;
  fallbackComponent?: React.ComponentType;
}

/**
 * Hook für Auth-geschützte Routen
 * 
 * @param options - Konfiguration für Auth-Guard
 * @returns Auth-Status und Navigation-Funktionen
 */
export const useAuthGuard = (options: AuthGuardOptions = {}) => {
  const {
    redirectTo = '/login',
    requireAuth = false,
    requireGuest = false,
  } = options;

  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Warte bis Auth initialisiert ist
    if (!isInitialized || isLoading) return;

    // Auth erforderlich, aber nicht eingeloggt
    if (requireAuth && !isAuthenticated) {
      navigate(redirectTo, { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    // Gast erforderlich, aber eingeloggt
    if (requireGuest && isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, isInitialized, requireAuth, requireGuest, navigate, redirectTo, location.pathname]);

  return {
    isAuthenticated,
    isLoading: isLoading || !isInitialized,
    canAccess: requireAuth ? isAuthenticated : requireGuest ? !isAuthenticated : true,
  };
};

/**
 * Hook für Auth-Status-Checks
 * 
 * @returns Auth-Status und Utility-Funktionen
 */
export const useAuthStatus = () => {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuth();

  return {
    isAuthenticated,
    user,
    isLoading: isLoading || !isInitialized,
    isReady: isInitialized && !isLoading,
    isGuest: isInitialized && !isAuthenticated,
    isAdmin: user?.role === 'admin',
    isViewer: user?.role === 'viewer',
    isEditor: user?.role === 'editor',
  };
};

/**
 * Hook für Auth-basierte Conditional Rendering
 * 
 * @param options - Rendering-Optionen
 * @returns Rendering-Funktionen
 */
export const useAuthRender = (options: { 
  showLoading?: React.ReactNode;
  showUnauthorized?: React.ReactNode;
} = {}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const { showLoading, showUnauthorized } = options;

  const renderIfAuthenticated = (children: React.ReactNode) => {
    if (!isInitialized || isLoading) return showLoading || null;
    if (!isAuthenticated) return showUnauthorized || null;
    return children;
  };

  const renderIfGuest = (children: React.ReactNode) => {
    if (!isInitialized || isLoading) return showLoading || null;
    if (isAuthenticated) return null;
    return children;
  };

  const renderIfReady = (children: React.ReactNode) => {
    if (!isInitialized || isLoading) return showLoading || null;
    return children;
  };

  return {
    renderIfAuthenticated,
    renderIfGuest,
    renderIfReady,
  };
};

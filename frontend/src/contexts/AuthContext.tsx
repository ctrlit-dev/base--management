/**
 * Authentication Context Provider
 * ==============================
 * 
 * Zentrale Auth-State-Verwaltung mit React Context.
 * Bietet typsichere Authentication für die gesamte App.
 * 
 * Features:
 * - Automatische Token-Refresh
 * - Persistente Auth-State
 * - Optimistic Updates
 * - Error Recovery
 * - Performance-Optimierungen
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authApi, extendedTokenManager, userManager, type User } from '../lib/api/auth';
import { handleApiError, logError } from '../utils/errorHandling';
import type { 
  AuthState, 
  AuthContextValue, 
  AuthAction, 
  RegisterData
} from '../types/auth';

// Initial State
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

// Auth Reducer mit immutablen Updates
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'AUTH_REFRESH':
      return {
        ...state,
        tokens: action.payload,
        isLoading: false,
      };

    case 'AUTH_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    case 'USER_UPDATE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Context Creation
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Custom Hook für Auth Context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize Auth State from localStorage
  const initializeAuth = useCallback(async () => {
    try {
      const { accessToken, refreshToken } = extendedTokenManager.getTokens();
      const user = userManager.getCurrentUser();

      if (accessToken && refreshToken && user) {
        // Verify token validity by making a test request
        try {
          const response = await authApi.getCurrentUser();
          if (response.data) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: response.data,
                tokens: { access: accessToken, refresh: refreshToken }
              }
            });
            return;
          }
        } catch (error) {
          // Token is invalid, try to refresh
          logError(error, 'Token validation failed');
        }

        // Try to refresh token
        const refreshSuccess = await extendedTokenManager.refreshTokenIfNeeded();
        if (refreshSuccess) {
          const { accessToken: newAccess, refreshToken: newRefresh } = extendedTokenManager.getTokens();
          if (newAccess && newRefresh) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: user,
                tokens: { access: newAccess, refresh: newRefresh }
              }
            });
            return;
          }
        }
      }

      // Clear invalid auth data
      extendedTokenManager.clearTokens();
      userManager.clearCurrentUser();
      dispatch({ type: 'AUTH_INITIALIZED' });
    } catch (error) {
      logError(error, 'Auth initialization failed');
      dispatch({ type: 'AUTH_INITIALIZED' });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens) return;

    const refreshInterval = setInterval(async () => {
      try {
        const success = await extendedTokenManager.refreshTokenIfNeeded();
        if (success) {
          const { accessToken, refreshToken } = extendedTokenManager.getTokens();
          if (accessToken && refreshToken) {
            dispatch({
              type: 'AUTH_REFRESH',
              payload: { access: accessToken, refresh: refreshToken }
            });
          }
        }
      } catch (error) {
        logError(error, 'Auto token refresh failed');
        // Don't logout on refresh failure, let the next API call handle it
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.tokens]);

  // Memoized Auth Actions
  const authActions = useMemo(() => ({
    login: async (email: string, password: string, rememberMe: boolean = false) => {
      dispatch({ type: 'AUTH_START' });
      
      try {
        const response = await authApi.login({ email, password, remember_me: rememberMe });
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          const { access, refresh, user } = response.data;
          
          // Store tokens and user data
          extendedTokenManager.setTokens(access, refresh);
          userManager.setCurrentUser(user);
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, tokens: { access, refresh } }
          });
        }
      } catch (error) {
        logError(error, 'Login failed');
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { message: handleApiError(error, 'Login fehlgeschlagen') }
        });
        throw error;
      }
    },

    logout: async () => {
      try {
        // Call logout API if authenticated
        if (state.isAuthenticated) {
          await authApi.logout();
        }
      } catch (error) {
        logError(error, 'Logout API call failed');
        // Continue with local logout even if API fails
      } finally {
        // Clear local data
        extendedTokenManager.clearTokens();
        userManager.clearCurrentUser();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    },

    register: async (userData: RegisterData) => {
      dispatch({ type: 'AUTH_START' });
      
      try {
        const response = await authApi.register({
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          password: userData.password,
          password_confirm: userData.password,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Registration successful, but user needs to verify email
        dispatch({ type: 'AUTH_INITIALIZED' });
      } catch (error) {
        logError(error, 'Registration failed');
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { message: handleApiError(error, 'Registrierung fehlgeschlagen') }
        });
        throw error;
      }
    },

    refreshToken: async (): Promise<boolean> => {
      try {
        const success = await extendedTokenManager.refreshTokenIfNeeded();
        if (success) {
          const { accessToken, refreshToken } = extendedTokenManager.getTokens();
          if (accessToken && refreshToken) {
            dispatch({
              type: 'AUTH_REFRESH',
              payload: { access: accessToken, refresh: refreshToken }
            });
          }
        }
        return success;
      } catch (error) {
        logError(error, 'Token refresh failed');
        return false;
      }
    },

    clearTokens: () => {
      extendedTokenManager.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    },

    updateUser: async (userData: Partial<User>) => {
      try {
        const response = await authApi.updateProfile(userData);
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          const updatedUser = { ...state.user, ...response.data };
          userManager.setCurrentUser(updatedUser);
          dispatch({ type: 'USER_UPDATE', payload: response.data });
        }
      } catch (error) {
        logError(error, 'User update failed');
        throw error;
      }
    },

    refreshUser: async () => {
      try {
        const response = await authApi.getCurrentUser();
        
        if (response.data) {
          userManager.setCurrentUser(response.data);
          dispatch({ type: 'USER_UPDATE', payload: response.data });
        }
      } catch (error) {
        logError(error, 'User refresh failed');
        throw error;
      }
    },

    loginWithPasskey: async () => {
      dispatch({ type: 'AUTH_START' });
      
      try {
        // This would integrate with PasskeyLogin component
        // For now, we'll throw an error to indicate it needs implementation
        throw new Error('Passkey login not yet implemented in Auth Context');
      } catch (error) {
        logError(error, 'Passkey login failed');
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { message: handleApiError(error, 'Passkey-Anmeldung fehlgeschlagen') }
        });
        throw error;
      }
    },

    registerPasskey: async () => {
      try {
        // This would integrate with PasskeyRegistration component
        throw new Error('Passkey registration not yet implemented in Auth Context');
      } catch (error) {
        logError(error, 'Passkey registration failed');
        throw error;
      }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      try {
        const response = await authApi.changePassword(
          currentPassword,
          newPassword
        );

        if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        logError(error, 'Password change failed');
        throw error;
      }
    },

    resetPassword: async (email: string) => {
      try {
        const response = await authApi.requestPasswordReset({ email });
        
        if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        logError(error, 'Password reset request failed');
        throw error;
      }
    },

    confirmPasswordReset: async (token: string, newPassword: string) => {
      try {
        const response = await authApi.confirmPasswordReset(
          token,
          newPassword,
          newPassword
        );

        if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        logError(error, 'Password reset confirmation failed');
        throw error;
      }
    },

    sendEmailVerification: async () => {
      try {
        // Note: This method doesn't exist in the API yet
        // For now, we'll throw an error to indicate it needs implementation
        throw new Error('Send email verification not yet implemented in API');
      } catch (error) {
        logError(error, 'Email verification send failed');
        throw error;
      }
    },

    verifyEmail: async (token: string) => {
      try {
        const response = await authApi.verifyEmail(token);
        
        if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        logError(error, 'Email verification failed');
        throw error;
      }
    },

    getActiveSessions: async () => {
      try {
        const response = await authApi.getSessions();
        
        if (response.error) {
          throw new Error(response.error);
        }

        return response.data?.sessions || [];
      } catch (error) {
        logError(error, 'Get active sessions failed');
        throw error;
      }
    },

    terminateSession: async (sessionId: string) => {
      try {
        const response = await authApi.terminateSession(sessionId);
        
        if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        logError(error, 'Terminate session failed');
        throw error;
      }
    },

    terminateAllSessions: async () => {
      try {
        // Note: This method doesn't exist in the API yet
        // For now, we'll throw an error to indicate it needs implementation
        throw new Error('Terminate all sessions not yet implemented in API');
      } catch (error) {
        logError(error, 'Terminate all sessions failed');
        throw error;
      }
    },
  }), [state.user, state.isAuthenticated]);

  // Memoized Context Value
  const contextValue = useMemo((): AuthContextValue => ({
    ...state,
    ...authActions,
  }), [state, authActions]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

/**
 * Authentication Context Types
 * ==========================
 * 
 * TypeScript-Definitionen für das Authentication Context System.
 * Bietet typsichere Auth-State-Verwaltung mit React Context.
 */

import type { User } from '../lib/api/auth';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface AuthContextValue extends AuthState {
  // Authentication Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  
  // Token Management
  refreshToken: () => Promise<boolean>;
  clearTokens: () => void;
  
  // User Management
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Passkey Actions
  loginWithPasskey: () => Promise<void>;
  registerPasskey: () => Promise<void>;
  
  // Password Actions
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  
  // Email Verification
  sendEmailVerification: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  
  // Session Management
  getActiveSessions: () => Promise<any[]>;
  terminateSession: (sessionId: string) => Promise<void>;
  terminateAllSessions: () => Promise<void>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

export type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: AuthError }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_REFRESH'; payload: AuthTokens }
  | { type: 'AUTH_INITIALIZED' }
  | { type: 'USER_UPDATE'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };
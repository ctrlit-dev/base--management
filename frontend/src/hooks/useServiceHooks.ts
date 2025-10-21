/**
 * Service Hooks
 * ============
 * 
 * React Hooks für Service-Layer Integration.
 * Kombiniert Services mit AsyncOperation Hooks für optimale UX.
 */

import { useCallback } from 'react';
import { useEnhancedLoading } from '../hooks/useEnhancedLoading';
import { 
  authService, 
  userProfileService, 
  sessionService, 
  passkeyService,
  settingsService
} from '../services/apiServices';
import type { User, Session } from '../lib/api/auth';

// Auth Service Hooks
export const useAuthOperations = () => {
  const loginOperation = useEnhancedLoading(
    (email: string, password: string, rememberMe: boolean = false) =>
      authService.login(email, password, rememberMe),
    { maxRetries: 3, retryDelay: 1000, retryBackoff: true }
  );

  const registerOperation = useEnhancedLoading(
    (userData: { firstName: string; lastName: string; email: string; password: string }) =>
      authService.register(userData),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const logoutOperation = useEnhancedLoading(
    () => authService.logout(),
    { maxRetries: 1, retryBackoff: false }
  );

  const changePasswordOperation = useEnhancedLoading(
    (currentPassword: string, newPassword: string) =>
      authService.changePassword(currentPassword, newPassword),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const resetPasswordOperation = useEnhancedLoading(
    (email: string) => authService.requestPasswordReset(email),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const confirmPasswordResetOperation = useEnhancedLoading(
    (token: string, newPassword: string) =>
      authService.confirmPasswordReset(token, newPassword),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const verifyEmailOperation = useEnhancedLoading(
    (token: string) => authService.verifyEmail(token),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const refreshUserOperation = useEnhancedLoading(
    () => authService.getCurrentUser(),
    { maxRetries: 3, retryDelay: 1000, retryBackoff: true }
  );

  return {
    login: loginOperation,
    register: registerOperation,
    logout: logoutOperation,
    changePassword: changePasswordOperation,
    resetPassword: resetPasswordOperation,
    confirmPasswordReset: confirmPasswordResetOperation,
    verifyEmail: verifyEmailOperation,
    refreshUser: refreshUserOperation,
  };
};

// User Profile Service Hooks
export const useUserProfileOperations = () => {
  const updateProfileOperation = useEnhancedLoading(
    (profileData: Partial<any>) => userProfileService.updateProfile(profileData),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const uploadAvatarOperation = useEnhancedLoading(
    (file: File) => userProfileService.uploadAvatar(file),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const deleteAvatarOperation = useEnhancedLoading(
    () => userProfileService.deleteAvatar(),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  return {
    updateProfile: updateProfileOperation,
    uploadAvatar: uploadAvatarOperation,
    deleteAvatar: deleteAvatarOperation,
  };
};

// Session Service Hooks
export const useSessionOperations = () => {
  const getSessionsOperation = useEnhancedLoading(
    () => sessionService.getActiveSessions(),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const terminateSessionOperation = useEnhancedLoading(
    (sessionId: string) => sessionService.terminateSession(sessionId),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  const terminateAllSessionsOperation = useEnhancedLoading(
    () => sessionService.terminateAllSessions(),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  return {
    getSessions: getSessionsOperation,
    terminateSession: terminateSessionOperation,
    terminateAllSessions: terminateAllSessionsOperation,
  };
};

// Passkey Service Hooks
export const usePasskeyOperations = () => {
  const getRegistrationOptionsOperation = useAsyncOperation(
    () => passkeyService.getRegistrationOptions(),
    { retryCount: 1 }
  );

  const registerPasskeyOperation = useAsyncOperation(
    (credential: any) => passkeyService.registerPasskey(credential),
    { retryCount: 0 }
  );

  const getAuthenticationOptionsOperation = useAsyncOperation(
    () => passkeyService.getAuthenticationOptions(),
    { retryCount: 1 }
  );

  const authenticatePasskeyOperation = useAsyncOperation(
    (credential: any) => passkeyService.authenticatePasskey(credential),
    { retryCount: 0 }
  );

  const getPasskeysOperation = useAsyncOperation(
    () => passkeyService.getPasskeys(),
    { retryCount: 1 }
  );

  const deletePasskeyOperation = useAsyncOperation(
    (passkeyId: string) => passkeyService.deletePasskey(passkeyId),
    { retryCount: 1 }
  );

  return {
    getRegistrationOptions: getRegistrationOptionsOperation,
    registerPasskey: registerPasskeyOperation,
    getAuthenticationOptions: getAuthenticationOptionsOperation,
    authenticatePasskey: authenticatePasskeyOperation,
    getPasskeys: getPasskeysOperation,
    deletePasskey: deletePasskeyOperation,
  };
};

// Combined Service Hook
export const useAllServices = () => {
  const authOps = useAuthOperations();
  const profileOps = useUserProfileOperations();
  const sessionOps = useSessionOperations();
  const passkeyOps = usePasskeyOperations();

  return {
    auth: authOps,
    profile: profileOps,
    session: sessionOps,
    passkey: passkeyOps,
  };
};

// Utility Hook for Service Status
export const useServiceStatus = () => {
  const services = useAllServices();
  
  const isLoading = Object.values(services).some(serviceGroup =>
    Object.values(serviceGroup).some(operation => operation.loading)
  );

  const hasError = Object.values(services).some(serviceGroup =>
    Object.values(serviceGroup).some(operation => operation.error)
  );

  const getErrors = () => {
    const errors: string[] = [];
    Object.values(services).forEach(serviceGroup => {
      Object.values(serviceGroup).forEach(operation => {
        if (operation.error) {
          errors.push(operation.error);
        }
      });
    });
    return errors;
  };

  const clearAllErrors = useCallback(() => {
    Object.values(services).forEach(serviceGroup => {
      Object.values(serviceGroup).forEach(operation => {
        operation.setError(null);
      });
    });
  }, [services]);

  return {
    isLoading,
    hasError,
    errors: getErrors(),
    clearAllErrors,
    services
  };
};

// Settings Service Hooks
export const useSettingsOperations = () => {
  const getSettingsOperation = useEnhancedLoading(
    () => settingsService.getSettings(),
    { maxRetries: 3, retryDelay: 1000, retryBackoff: true }
  );

  const updateSettingsOperation = useEnhancedLoading(
    (settingsData: any) => settingsService.updateSettings(settingsData),
    { maxRetries: 2, retryDelay: 1000, retryBackoff: true }
  );

  return {
    getSettings: getSettingsOperation,
    updateSettings: updateSettingsOperation
  };
};

/**
 * API Service Layer
 * ================
 * 
 * Professionelle Service-Layer für API-Operationen.
 * Trennt Business Logic von HTTP-Client und bietet bessere Testbarkeit.
 * 
 * Features:
 * - Service-basierte Architektur
 * - Typsichere API-Calls
 * - Error Handling
 * - Request/Response Transformation
 * - Caching
 * - Retry Logic
 */

import { authApi, type ApiResponse, type User } from '../api/auth';
import { handleApiError, logError, retryApiCall } from '../utils/errorHandling';
import type { Session } from '../api/auth';

// Base Service Class
abstract class BaseService {
  protected async handleRequest<T>(
    request: () => Promise<ApiResponse<T>>,
    context: string
  ): Promise<T> {
    try {
      const response = await retryApiCall(request, 3, 1000);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (!response.data) {
        throw new Error('Keine Daten erhalten');
      }
      
      return response.data;
    } catch (error) {
      logError(error, context);
      throw new Error(handleApiError(error, `${context} fehlgeschlagen`));
    }
  }
}

// Authentication Service
export class AuthService extends BaseService {
  /**
   * Benutzer anmelden
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<{
    user: User;
    tokens: { access: string; refresh: string };
  }> {
    const response = await this.handleRequest(
      () => authApi.login({ email, password, remember_me: rememberMe }),
      'Login'
    );
    
    return {
      user: response.user,
      tokens: { access: response.access, refresh: response.refresh }
    };
  }

  /**
   * Benutzer abmelden
   */
  async logout(): Promise<void> {
    return this.handleRequest(
      () => authApi.logout(),
      'Logout'
    );
  }

  /**
   * Benutzer registrieren
   */
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ user: User; emailVerificationRequired?: boolean }> {
    return this.handleRequest(
      () => authApi.register({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password,
      }),
      'Registrierung'
    );
  }

  /**
   * Passwort zurücksetzen anfordern
   */
  async requestPasswordReset(email: string): Promise<void> {
    return this.handleRequest(
      () => authApi.requestPasswordReset({ email }),
      'Passwort-Reset-Anfrage'
    );
  }

  /**
   * Passwort zurücksetzen bestätigen
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    return this.handleRequest(
      () => authApi.confirmPasswordReset(token, newPassword, newPassword),
      'Passwort-Reset-Bestätigung'
    );
  }

  /**
   * Passwort ändern
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.handleRequest(
      () => authApi.changePassword(currentPassword, newPassword),
      'Passwort-Änderung'
    );
  }

  /**
   * E-Mail verifizieren
   */
  async verifyEmail(token: string): Promise<void> {
    return this.handleRequest(
      () => authApi.verifyEmail(token),
      'E-Mail-Verifizierung'
    );
  }

  /**
   * Aktuellen Benutzer abrufen
   */
  async getCurrentUser(): Promise<User> {
    return this.handleRequest(
      () => authApi.getCurrentUser(),
      'Benutzer abrufen'
    );
  }

  /**
   * Token aktualisieren
   */
  async refreshToken(): Promise<{ access: string; refresh: string }> {
    return this.handleRequest(
      () => authApi.refreshToken(),
      'Token-Aktualisierung'
    );
  }
}

// User Profile Service
export class UserProfileService extends BaseService {
  /**
   * Profil aktualisieren
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    return this.handleRequest(
      () => authApi.updateProfile(profileData),
      'Profil-Aktualisierung'
    );
  }

  /**
   * Avatar hochladen
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const response = await this.handleRequest(
      () => authApi.uploadAvatar(file),
      'Avatar-Upload'
    );
    
    return {
      avatar_url: response.user.avatar || ''
    };
  }

  /**
   * Avatar löschen
   */
  async deleteAvatar(): Promise<void> {
    await this.handleRequest(
      () => authApi.deleteAvatar(),
      'Avatar-Löschung'
    );
  }
}

// Session Management Service
export class SessionService extends BaseService {
  /**
   * Aktive Sessions abrufen
   */
  async getActiveSessions(): Promise<Session[]> {
    const response = await this.handleRequest(
      () => authApi.getSessions(),
      'Sessions abrufen'
    );
    return response.sessions || [];
  }

  /**
   * Session beenden
   */
  async terminateSession(sessionId: string): Promise<void> {
    return this.handleRequest(
      () => authApi.terminateSession(sessionId),
      'Session beenden'
    );
  }

  /**
   * Alle Sessions beenden
   */
  async terminateAllSessions(): Promise<void> {
    // Note: This method doesn't exist in the API yet
    throw new Error('Terminate all sessions not yet implemented in API');
  }
}

// Passkey Service
export class PasskeyService extends BaseService {
  /**
   * Passkey-Registrierungsoptionen abrufen
   */
  async getRegistrationOptions(): Promise<any> {
    return this.handleRequest(
      () => authApi.getPasskeyRegistrationOptions(),
      'Passkey-Registrierungsoptionen'
    );
  }

  /**
   * Passkey registrieren
   */
  async registerPasskey(credential: any): Promise<void> {
    await this.handleRequest(
      () => authApi.registerPasskey(credential),
      'Passkey-Registrierung'
    );
  }

  /**
   * Passkey-Authentifizierungsoptionen abrufen
   */
  async getAuthenticationOptions(): Promise<any> {
    return this.handleRequest(
      () => authApi.getPasskeyAuthenticationOptions(),
      'Passkey-Authentifizierungsoptionen'
    );
  }

  /**
   * Passkey-Authentifizierung
   */
  async authenticatePasskey(credential: any): Promise<{
    user: User;
    tokens: { access: string; refresh: string };
  }> {
    const response = await this.handleRequest(
      () => authApi.authenticatePasskey(credential),
      'Passkey-Authentifizierung'
    );
    
    return {
      user: response.user!,
      tokens: { access: response.access!, refresh: response.refresh! }
    };
  }

  /**
   * Registrierte Passkeys abrufen
   */
  async getPasskeys(): Promise<any[]> {
    const response = await this.handleRequest(
      () => authApi.getPasskeys(),
      'Passkeys abrufen'
    );
    return response.credentials || [];
  }

  /**
   * Passkey löschen
   */
  async deletePasskey(passkeyId: string): Promise<void> {
    return this.handleRequest(
      () => authApi.deletePasskey(passkeyId),
      'Passkey-Löschung'
    );
  }
}

// Service Factory
export class ServiceFactory {
  private static instances: Map<string, any> = new Map();

  static getAuthService(): AuthService {
    if (!this.instances.has('auth')) {
      this.instances.set('auth', new AuthService());
    }
    return this.instances.get('auth');
  }

  static getUserProfileService(): UserProfileService {
    if (!this.instances.has('userProfile')) {
      this.instances.set('userProfile', new UserProfileService());
    }
    return this.instances.get('userProfile');
  }

  static getSessionService(): SessionService {
    if (!this.instances.has('session')) {
      this.instances.set('session', new SessionService());
    }
    return this.instances.get('session');
  }

  static getPasskeyService(): PasskeyService {
    if (!this.instances.has('passkey')) {
      this.instances.set('passkey', new PasskeyService());
    }
    return this.instances.get('passkey');
  }

  static getSettingsService(): SettingsService {
    if (!this.instances.has('settings')) {
      this.instances.set('settings', new SettingsService());
    }
    return this.instances.get('settings');
  }

  // Clear all instances (useful for testing)
  static clearInstances(): void {
    this.instances.clear();
  }
}

// Settings Service
export class SettingsService extends BaseService {
  /**
   * Systemeinstellungen abrufen
   */
  async getSettings(): Promise<any> {
    return this.handleRequest(
      async () => {
        console.log('SettingsService: Lade Einstellungen...');
        
        // Token automatisch aktualisieren falls nötig
        const { extendedTokenManager } = await import('../api/auth');
        await extendedTokenManager.refreshTokenIfNeeded();
        
        const { accessToken } = extendedTokenManager.getTokens();
        console.log('Token vorhanden:', !!accessToken);
        
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/settings/settings/`;
        console.log('API URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response Status:', response.status);
        
        // Bei 401-Fehler: Token erneut aktualisieren und nochmal versuchen
        if (response.status === 401) {
          console.log('401-Fehler, versuche Token-Refresh...');
          const refreshSuccess = await extendedTokenManager.refreshTokenIfNeeded();
          
          if (refreshSuccess) {
            const { accessToken: newAccessToken } = extendedTokenManager.getTokens();
            console.log('Token aktualisiert, versuche erneut...');
            
            const retryResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!retryResponse.ok) {
              const errorText = await retryResponse.text();
              console.error('Retry API Error Response:', errorText);
              throw new Error(`HTTP ${retryResponse.status}: ${errorText}`);
            }
            
            const data = await retryResponse.json();
            console.log('Retry API Response Data:', data);
            return { data };
          } else {
            throw new Error('Token-Refresh fehlgeschlagen. Bitte melden Sie sich erneut an.');
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response Data:', data);
        return { data };
      },
      'Einstellungen abrufen'
    );
  }

  /**
   * Systemeinstellungen aktualisieren
   */
  async updateSettings(settingsData: any): Promise<any> {
    return this.handleRequest(
      async () => {
        console.log('SettingsService: Aktualisiere Einstellungen...', settingsData);
        
        // Token automatisch aktualisieren falls nötig
        const { extendedTokenManager } = await import('../api/auth');
        await extendedTokenManager.refreshTokenIfNeeded();
        
        const { accessToken } = extendedTokenManager.getTokens();
        
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/settings/settings/1/`;
        console.log('API URL:', url);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settingsData),
        });
        
        console.log('Update Response Status:', response.status);
        
        // Bei 401-Fehler: Token erneut aktualisieren und nochmal versuchen
        if (response.status === 401) {
          console.log('401-Fehler beim Update, versuche Token-Refresh...');
          const refreshSuccess = await extendedTokenManager.refreshTokenIfNeeded();
          
          if (refreshSuccess) {
            const { accessToken: newAccessToken } = extendedTokenManager.getTokens();
            console.log('Token aktualisiert, versuche Update erneut...');
            
            const retryResponse = await fetch(url, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(settingsData),
            });
            
            if (!retryResponse.ok) {
              const errorText = await retryResponse.text();
              console.error('Retry Update API Error Response:', errorText);
              throw new Error(`HTTP ${retryResponse.status}: ${errorText}`);
            }
            
            const data = await retryResponse.json();
            console.log('Retry Update API Response Data:', data);
            return { data };
          } else {
            throw new Error('Token-Refresh fehlgeschlagen. Bitte melden Sie sich erneut an.');
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Update API Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Update API Response Data:', data);
        return { data };
      },
      'Einstellungen aktualisieren'
    );
  }
}

// Convenience exports
export const authService = ServiceFactory.getAuthService();
export const userProfileService = ServiceFactory.getUserProfileService();
export const sessionService = ServiceFactory.getSessionService();
export const passkeyService = ServiceFactory.getPasskeyService();
export const settingsService = ServiceFactory.getSettingsService();

// Service Hooks for React Components
export const useAuthService = () => authService;
export const useUserProfileService = () => userProfileService;
export const useSessionService = () => sessionService;
export const usePasskeyService = () => passkeyService;
export const useSettingsService = () => settingsService;

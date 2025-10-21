/**
 * LCREE Authentication API Service
 * =================================
 * 
 * API-Service für Authentifizierung und Benutzerverwaltung.
 * 
 * Endpunkte:
 * - Registrierung: POST /api/v1/accounts/auth/register/
 * - Login: POST /api/v1/accounts/auth/login/
 * - Logout: POST /api/v1/accounts/auth/logout/
 * - Passwort-Reset: POST /api/v1/accounts/auth/password-reset/
 */

import { BaseApiClient, type ApiResponse, type User, tokenManager, userManager } from './baseClient';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  remember_me: boolean;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface PasswordResetData {
  email: string;
}

export interface Session {
  id: number;
  session_id: string;
  ip_address: string;
  device_name: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_current: boolean;
}

export interface ProfileSettings {
  notifications_enabled: boolean;
  dashboard_widgets: Record<string, any>;
  device_verification?: boolean;
  biometric_login?: boolean;
  device_encryption?: boolean;
  remote_logout?: boolean;
}

// API-Client-Instanz
const apiClient = new BaseApiClient();

// Authentifizierungs-API
export const authApi = {
  /**
   * Benutzer registrieren
   */
  async register(data: RegisterData): Promise<ApiResponse<{ user: User; email_verification_required?: boolean }>> {
    return apiClient.post('/accounts/auth/register/', data);
  },

  /**
   * Benutzer anmelden
   */
  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/accounts/auth/login/', data);
  },

  /**
   * Benutzer abmelden
   */
  async logout(): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/logout/', {});
  },

  /**
   * Passwort-Reset anfordern
   */
  async requestPasswordReset(data: PasswordResetData): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/password-reset/', data);
  },

  /**
   * Passwort-Reset bestätigen
   */
  async confirmPasswordReset(token: string, password: string, passwordConfirm: string): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/password-reset/confirm/', {
      token,
      password,
      password_confirm: passwordConfirm,
    });
  },

  /**
   * E-Mail-Verifizierung
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/verify-email/', { token });
  },

  /**
   * Verifizierungs-E-Mail erneut senden
   */
  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/resend-verification/', { email });
  },

  /**
   * Passwort ändern (eingeloggt)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Aktuelle Benutzerdaten abrufen
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get('/accounts/users/me/');
  },

  /**
   * Benutzerprofil aktualisieren
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put('/accounts/users/update_me/', data);
  },

  /**
   * Profilbild hochladen
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ user: User; message: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = localStorage.getItem('lcree_access');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/accounts/avatar/upload/`;
    
    console.log('Uploading avatar to:', url);
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('File:', file.name, file.size, file.type);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Kein Content-Type Header für FormData
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        return {
          error: data.error || data.message || 'Fehler beim Hochladen des Profilbilds',
        };
      }
      
      return {
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        error: 'Netzwerkfehler beim Hochladen des Profilbilds',
      };
    }
  },

  /**
   * Profilbild löschen
   */
  async deleteAvatar(): Promise<ApiResponse<{ user: User; message: string }>> {
    return apiClient.delete('/accounts/users/delete_avatar/');
  },

  /**
   * Session-Management - Aktive Sessions abrufen
   */
  async getSessions(): Promise<ApiResponse<{ sessions: Session[]; total_count: number }>> {
    return apiClient.get('/accounts/auth/sessions/');
  },

  /**
   * Session-Management - Spezifische Session beenden
   */
  async terminateSession(sessionId: string): Promise<ApiResponse> {
    return apiClient.delete('/accounts/auth/sessions/', { session_id: sessionId });
  },

  /**
   * Session-Management - Alle anderen Sessions beenden
   */
  async logoutAllSessions(includeCurrent: boolean = false): Promise<ApiResponse> {
    return apiClient.post('/accounts/auth/logout-all/', { include_current: includeCurrent });
  },

  /**
   * Benutzerprofil-Einstellungen abrufen
   */
  async getProfileSettings(): Promise<ApiResponse<ProfileSettings>> {
    return apiClient.get('/accounts/profiles/me/');
  },

  /**
   * Benutzerprofil-Einstellungen aktualisieren
   */
  async updateProfileSettings(data: Partial<ProfileSettings>): Promise<ApiResponse<ProfileSettings>> {
    return apiClient.put('/accounts/profiles/update_me/', data);
  },

  /**
   * Passkey-Management - Passkey-Credentials abrufen
   */
  async getPasskeys(): Promise<ApiResponse<{ credentials: any[]; total_count: number }>> {
    return apiClient.get('/accounts/auth/passkey/manage/');
  },

  /**
   * Passkey-Management - Passkey-Credential löschen
   */
  async deletePasskey(credentialId: string): Promise<ApiResponse> {
    return apiClient.delete('/accounts/auth/passkey/manage/', { credential_id: credentialId });
  },

  /**
   * Passkey-Registrierung - Registrierungsoptionen abrufen
   */
  async getPasskeyRegistrationOptions(): Promise<ApiResponse<{ options: any; session_data?: any }>> {
    return apiClient.post('/accounts/auth/passkey/register/options/', {});
  },

  /**
   * Passkey-Registrierung - Credential registrieren
   */
  async registerPasskey(data: {
    credential: any;
    session_data?: any;
    user_data?: {
      email: string;
      first_name: string;
      last_name: string;
    };
  }): Promise<ApiResponse<{ message: string; credential_id: string; is_new_user?: boolean; access?: string; refresh?: string; user?: User }>> {
    return apiClient.post('/accounts/auth/passkey/register/verify/', data);
  },

  /**
   * Passkey-Authentifizierung - Authentifizierungsoptionen abrufen
   */
  async getPasskeyAuthenticationOptions(): Promise<ApiResponse<{ options: any }>> {
    return apiClient.post('/accounts/auth/passkey/authenticate/options/', {});
  },

  /**
   * Passkey-Authentifizierung - Credential authentifizieren
   */
  async authenticatePasskey(credential: any): Promise<ApiResponse<{ access: string; refresh: string; user: User; message: string }>> {
    // Konvertiere Credential für Backend
    const credentialForBackend = {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
        clientDataJSON: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).clientDataJSON)),
        signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
        userHandle: credential.response.userHandle ? Array.from(new Uint8Array(credential.response.userHandle)) : null
      },
      type: credential.type
    };
    
    console.log('Sending credential to backend:', {
      id: credentialForBackend.id,
      rawIdLength: credentialForBackend.rawId.length,
      responseKeys: Object.keys(credentialForBackend.response),
      userHandle: credentialForBackend.response.userHandle ? 'present' : 'null'
    });
    
    return apiClient.post('/accounts/auth/passkey/authenticate/verify/', { credential: credentialForBackend });
  },

  /**
   * Token aktualisieren
   */
  async refreshToken(): Promise<ApiResponse<{ access: string; refresh: string }>> {
    const refreshToken = localStorage.getItem('lcree_refresh');
    if (!refreshToken) {
      return { error: 'Kein Refresh-Token vorhanden' };
    }

    return apiClient.post('/accounts/auth/token/refresh/', {
      refresh: refreshToken,
    });
  },
};

// Token-Management erweitern
export const extendedTokenManager = {
  ...tokenManager,
  
  /**
   * Token automatisch aktualisieren
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    const { refreshToken } = this.getTokens();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await authApi.refreshToken();
      if (response.data) {
        this.setTokens(response.data.access, response.data.refresh);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  },
};

// Benutzer-Management erweitern
export const extendedUserManager = {
  ...userManager,

  /**
   * Systemeinstellungen abrufen
   */
  async getSettings(): Promise<ApiResponse<any>> {
    return apiClient.get('/settings/settings/');
  },

  /**
   * Systemeinstellungen aktualisieren
   */
  async updateSettings(data: any): Promise<ApiResponse<any>> {
    return apiClient.put('/settings/settings/1/', data);
  },
};

// Re-export der Basis-Manager und Typen für Rückwärtskompatibilität
export { tokenManager, userManager };
export type { User, ApiResponse };

export default authApi;
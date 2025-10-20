/**
 * LCREE Base API Client
 * =====================
 * 
 * Zentrale API-Client-Klasse für alle Services.
 * Eliminiert DRY-Verletzungen durch wiederverwendbare HTTP-Logik.
 */

// API-Konfiguration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Typen für API-Responses
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'PRODUCTION' | 'WAREHOUSE' | 'SALES' | 'VIEWER';
  is_active: boolean;
  avatar?: string;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  email_verified: boolean;
  email_verified_at: string | null;
  last_login_ip: string | null;
  last_login_device: string | null;
  login_notifications_enabled: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: number | null;
}

// HTTP-Client mit zentralisierter Fehlerbehandlung
export class BaseApiClient {
  protected baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {};
    
    // Füge Authorization Header hinzu
    const token = localStorage.getItem('lcree_access');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Füge Content-Type hinzu, wenn nicht bereits gesetzt (für FormData)
    if (!options.headers || !('Content-Type' in options.headers)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`Making ${config.method || 'GET'} request to: ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        return this.handleErrorResponse(response, data);
      }

      return {
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return this.handleNetworkError(error);
    }
  }

  private handleErrorResponse(response: Response, data: any): ApiResponse {
    if (response.status === 400) {
      return {
        error: data.error || 'Ungültige Eingabedaten',
        errors: data,
      };
    } else if (response.status === 401) {
      return {
        error: 'Nicht autorisiert',
      };
    } else if (response.status === 403) {
      return {
        error: 'Zugriff verweigert',
      };
    } else if (response.status === 404) {
      return {
        error: 'Ressource nicht gefunden',
      };
    } else if (response.status >= 500) {
      return {
        error: 'Serverfehler. Bitte versuchen Sie es später erneut.',
      };
    } else {
      return {
        error: data.error || data.message || 'Ein unbekannter Fehler ist aufgetreten',
      };
    }
  }

  private handleNetworkError(error: any): ApiResponse {
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      return {
        error: 'Server-Fehler: Ungültige Antwort vom Backend.',
      };
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        error: 'Netzwerkfehler: Backend nicht erreichbar.',
      };
    }
    
    return {
      error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Token-Management Utilities
export const tokenManager = {
  /**
   * Tokens im localStorage speichern
   */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('lcree_access', accessToken);
    localStorage.setItem('lcree_refresh', refreshToken);
  },

  /**
   * Tokens aus localStorage laden
   */
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('lcree_access'),
      refreshToken: localStorage.getItem('lcree_refresh'),
    };
  },

  /**
   * Tokens aus localStorage entfernen
   */
  clearTokens(): void {
    localStorage.removeItem('lcree_access');
    localStorage.removeItem('lcree_refresh');
  },

  /**
   * Prüft, ob ein gültiger Token vorhanden ist
   */
  hasValidToken(): boolean {
    const { refreshToken } = this.getTokens();
    return !!refreshToken;
  },
};

// User Management Utilities
export const userManager = {
  /**
   * Aktuellen Benutzer aus localStorage laden
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('lcree_user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Benutzer im localStorage speichern
   */
  setCurrentUser(user: User): void {
    localStorage.setItem('lcree_user', JSON.stringify(user));
  },

  /**
   * Benutzer aus localStorage entfernen
   */
  clearCurrentUser(): void {
    localStorage.removeItem('lcree_user');
  },

  /**
   * Prüft, ob Benutzer eingeloggt ist
   */
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null && tokenManager.hasValidToken();
  },

  /**
   * Vollständiges Logout
   */
  logout(): void {
    tokenManager.clearTokens();
    this.clearCurrentUser();
  },
};

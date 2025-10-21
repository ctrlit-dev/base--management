/**
 * LCREE User Management API Service
 * ==================================
 * 
 * API-Service für erweiterte Benutzerverwaltung im Admin-Bereich.
 * 
 * Endpunkte:
 * - Benutzer auflisten: GET /api/v1/accounts/users/
 * - Benutzer erstellen: POST /api/v1/accounts/users/
 * - Benutzer bearbeiten: PUT /api/v1/accounts/users/{id}/
 * - Benutzer löschen: DELETE /api/v1/accounts/users/{id}/
 * - Soft-Delete: POST /api/v1/accounts/users/{id}/soft_delete/
 * - Wiederherstellen: POST /api/v1/accounts/users/{id}/restore/
 */

import { BaseApiClient, type ApiResponse, type User } from './baseClient';

// Erweiterte Typen für Benutzerverwaltung
export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';
  is_active?: boolean;
  language?: string;
  timezone?: string;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';
  is_active?: boolean;
  language?: string;
  timezone?: string;
}

export interface UserListResponse {
  results: User[];
  count: number;
  next?: string;
  previous?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_after?: string;
  created_before?: string;
  ordering?: string;
}

export interface AuditLog {
  id: number;
  actor: User | null;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  payload_before: any;
  payload_after: any;
  description: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  deleted_users: number;
  users_by_role: Record<string, number>;
  recent_registrations: number;
}

// API-Client-Instanz
const userManagementClient = new BaseApiClient();

// Benutzerverwaltungs-API
export const userManagementApi = {
  /**
   * Alle Benutzer auflisten mit Filtern
   */
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<UserListResponse>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/accounts/users/${queryString ? `?${queryString}` : ''}`;
    
    return userManagementClient.get<UserListResponse>(endpoint);
  },

  /**
   * Einzelnen Benutzer abrufen
   */
  async getUser(userId: number): Promise<ApiResponse<User>> {
    return userManagementClient.get<User>(`/accounts/users/${userId}/`);
  },

  /**
   * Neuen Benutzer erstellen
   */
  async createUser(userData: CreateUserData): Promise<ApiResponse<User>> {
    return userManagementClient.post<User>(`/accounts/users/`, userData);
  },

  /**
   * Benutzer bearbeiten
   */
  async updateUser(userId: number, userData: UpdateUserData): Promise<ApiResponse<User>> {
    return userManagementClient.put<User>(`/accounts/users/${userId}/`, userData);
  },

  /**
   * Benutzer löschen (Hard Delete)
   */
  async deleteUser(userId: number): Promise<ApiResponse> {
    return userManagementClient.delete(`/accounts/users/${userId}/`);
  },

  /**
   * Benutzer hard-deleten (permanent löschen)
   */
  async hardDeleteUser(userId: number): Promise<ApiResponse> {
    return userManagementClient.post(`/accounts/users/${userId}/hard_delete/`, {});
  },

  /**
   * Benutzer soft-deleten
   */
  async softDeleteUser(userId: number): Promise<ApiResponse> {
    return userManagementClient.post(`/accounts/users/${userId}/soft_delete/`, {});
  },

  /**
   * Gelöschten Benutzer wiederherstellen
   */
  async restoreUser(userId: number): Promise<ApiResponse> {
    return userManagementClient.post(`/accounts/users/${userId}/restore/`, {});
  },

  /**
   * Benutzer-Statistiken abrufen
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return userManagementClient.get<UserStats>(`/accounts/users/stats/`);
  },

  /**
   * Benutzer nach E-Mail suchen
   */
  async searchUsersByEmail(email: string): Promise<ApiResponse<User[]>> {
    return userManagementClient.get<User[]>(`/accounts/users/?search=${encodeURIComponent(email)}`);
  },

  /**
   * Benutzer nach Rolle filtern
   */
  async getUsersByRole(role: string): Promise<ApiResponse<UserListResponse>> {
    return userManagementClient.get<UserListResponse>(`/accounts/users/?role=${role}`);
  },

  /**
   * Aktive/Inaktive Benutzer abrufen
   */
  async getUsersByStatus(isActive: boolean): Promise<ApiResponse<UserListResponse>> {
    return userManagementClient.get<UserListResponse>(`/accounts/users/?is_active=${isActive}`);
  },

  /**
   * Gelöschte Benutzer abrufen
   */
  async getDeletedUsers(): Promise<ApiResponse<UserListResponse>> {
    return userManagementClient.get<UserListResponse>(`/accounts/users/?is_deleted=true`);
  },

  /**
   * Benutzer-Passwort zurücksetzen (Admin-Funktion)
   */
  async resetUserPassword(userId: number, newPassword: string): Promise<ApiResponse> {
    return userManagementClient.post(`/accounts/users/${userId}/reset_password/`, {
      new_password: newPassword,
    });
  },

  /**
   * Benutzer aktivieren/deaktivieren
   */
  async toggleUserStatus(userId: number, isActive: boolean): Promise<ApiResponse<User>> {
    // Erst den aktuellen Benutzer laden, um alle Daten zu haben
    const currentUserResponse = await this.getUser(userId);
    if (currentUserResponse.error || !currentUserResponse.data) {
      return currentUserResponse;
    }
    
    const currentUser = currentUserResponse.data;
    
    // Alle aktuellen Daten mit der neuen is_active Einstellung senden
    return userManagementClient.put<User>(`/accounts/users/${userId}/`, {
      email: currentUser.email,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      role: currentUser.role,
      is_active: isActive,
      language: currentUser.language,
      timezone: currentUser.timezone,
    });
  },

  /**
   * Benutzer-Rolle ändern
   */
  async changeUserRole(userId: number, role: string): Promise<ApiResponse<User>> {
    // Erst den aktuellen Benutzer laden, um alle Daten zu haben
    const currentUserResponse = await this.getUser(userId);
    if (currentUserResponse.error || !currentUserResponse.data) {
      return currentUserResponse;
    }
    
    const currentUser = currentUserResponse.data;
    
    // Alle aktuellen Daten mit der neuen Rolle senden
    return userManagementClient.put<User>(`/accounts/users/${userId}/`, {
      email: currentUser.email,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      role: role,
      is_active: currentUser.is_active,
      language: currentUser.language,
      timezone: currentUser.timezone,
    });
  },

  /**
   * Bulk-Operationen für mehrere Benutzer
   */
  async bulkUpdateUsers(userIds: number[], updates: UpdateUserData): Promise<ApiResponse<{ updated_count: number }>> {
    return userManagementClient.post(`/accounts/users/bulk_update/`, {
      user_ids: userIds,
      updates: updates,
    });
  },

  /**
   * Bulk-Delete für mehrere Benutzer
   */
  async bulkDeleteUsers(userIds: number[]): Promise<ApiResponse<{ deleted_count: number }>> {
    return userManagementClient.post(`/accounts/users/bulk_delete/`, {
      user_ids: userIds,
    });
  },

  /**
   * Benutzer-Export (CSV/Excel)
   */
  async exportUsers(format: 'csv' | 'excel' = 'csv'): Promise<ApiResponse<{ download_url: string }>> {
    return userManagementClient.get(`/accounts/users/export/?format=${format}`);
  },

  /**
   * Benutzer-Import (CSV/Excel)
   */
  async importUsers(file: File): Promise<ApiResponse<{ imported_count: number; errors: any[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('lcree_access');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/accounts/users/import/`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.error || 'Fehler beim Import der Benutzer',
        };
      }
      
      return {
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('User import error:', error);
      return {
        error: 'Netzwerkfehler beim Import der Benutzer',
      };
    }
  },

  /**
   * Audit-Logs für Benutzer-Management abrufen
   */
  async getAuditLogs(filters: {
    action?: string;
    actor?: number;
    subject_type?: string;
    created_at__gte?: string;
    created_at__lte?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ logs: AuditLog[]; total_count: number }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return userManagementClient.get(`/audit/audit-logs/?${params.toString()}`);
  },
};

export default userManagementApi;

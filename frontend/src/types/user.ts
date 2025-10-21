/**
 * Zentrale User-Type-Definition
 * =============================
 * 
 * Einheitliche TypeScript-Definition für User-Objekte im gesamten Frontend.
 * Eliminiert Duplikationen und gewährleistet Typsicherheit.
 * 
 * Diese Datei konsolidiert alle User-Interfaces aus:
 * - baseClient.ts (20+ Felder)
 * - authStore.ts (4 Felder)
 * - DashboardPage.tsx (12 Felder)
 * - userManagement.ts
 * - UserDropdown.tsx
 * - TopNavigation.tsx
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';

/**
 * Vollständige User-Definition für API-Responses und Datenbank-Objekte
 * Enthält alle verfügbaren Felder aus dem Backend
 */
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
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

/**
 * Vereinfachte User-Interface für AuthStore
 * Nur die essentiellen Felder für die Authentifizierung
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
}

/**
 * User-Update-Interface für Profil-Updates
 * Nur die Felder, die vom Benutzer geändert werden können
 */
export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  language?: string;
  timezone?: string;
  login_notifications_enabled?: boolean;
}

/**
 * User-Create-Interface für neue Benutzer
 * Alle erforderlichen Felder für die Registrierung
 */
export interface UserCreateData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role: UserRole;
}

/**
 * User-Filter-Interface für Suchfunktionen
 * Felder für die Benutzer-Filterung
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
  created_after?: string;
  created_before?: string;
}

/**
 * User-List-Response für API-Antworten
 * Struktur für paginierte Benutzer-Listen
 */
export interface UserListResponse {
  users: User[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Utility-Funktionen für User-Objekte
 */
export const UserUtils = {
  /**
   * Konvertiert einen vollständigen User zu einem AuthUser
   */
  toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      roles: [user.role],
    };
  },

  /**
   * Prüft, ob ein Benutzer eine bestimmte Rolle hat
   */
  hasRole(user: User, role: UserRole): boolean {
    return user.role === role;
  },

  /**
   * Prüft, ob ein Benutzer Administrator ist
   */
  isAdmin(user: User): boolean {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  },

  /**
   * Prüft, ob ein Benutzer aktiv ist
   */
  isActive(user: User): boolean {
    return user.is_active && !user.is_deleted;
  },

  /**
   * Gibt den vollständigen Namen des Benutzers zurück
   */
  getFullName(user: User): string {
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  },

  /**
   * Prüft, ob ein Benutzer E-Mail-Verifizierung benötigt
   */
  needsEmailVerification(user: User): boolean {
    return !user.email_verified;
  },
};

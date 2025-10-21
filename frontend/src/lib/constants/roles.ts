/**
 * Zentrale Rollen-Konfiguration für LCREE
 * ======================================
 * 
 * DRY-Prinzip: Zentrale Definition aller Rollen-Konfigurationen
 * um Duplikation zwischen UserManagement und UserManagementModals zu vermeiden.
 * 
 * Design und Funktionalität bleiben unverändert!
 */

import {
  ShieldCheckIcon,
  CogIcon,
  TruckIcon,
  ShoppingCartIcon,
  EyeIcon as ViewerIcon,
} from '@heroicons/react/24/outline';

export interface RoleConfig {
  label: string;
  color: string;
  glowColor: string;
  icon: React.ComponentType<any>;
  description: string;
}

export const ROLE_CONFIG: Record<string, RoleConfig> = {
  SUPER_ADMIN: {
    label: 'Super-Admin',
    color: 'bg-red-600',
    glowColor: 'shadow-red-600/50',
    icon: ShieldCheckIcon,
    description: 'Vollzugriff auf alle Systemfunktionen',
  },
  ADMIN: {
    label: 'Admin',
    color: 'bg-red-500',
    glowColor: 'shadow-red-500/50',
    icon: ShieldCheckIcon,
    description: 'Benutzer- und Systemverwaltung',
  },
  MANAGER: {
    label: 'Manager',
    color: 'bg-blue-500',
    glowColor: 'shadow-blue-500/50',
    icon: CogIcon,
    description: 'Team- und Projektverwaltung',
  },
  USER: {
    label: 'Benutzer',
    color: 'bg-green-500',
    glowColor: 'shadow-green-500/50',
    icon: TruckIcon,
    description: 'Standard-Benutzer mit grundlegenden Funktionen',
  },
  GUEST: {
    label: 'Gast',
    color: 'bg-gray-500',
    glowColor: 'shadow-gray-500/50',
    icon: ViewerIcon,
    description: 'Gast mit nur Lesezugriff',
  },
} as const;

// Hilfsfunktionen für bessere TypeScript-Unterstützung
export type RoleKey = keyof typeof ROLE_CONFIG;

export const getRoleConfig = (role: string): RoleConfig | undefined => {
  return ROLE_CONFIG[role];
};

export const getAllRoles = (): Array<{ value: string; label: string; description: string }> => {
  return Object.entries(ROLE_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    description: config.description,
  }));
};

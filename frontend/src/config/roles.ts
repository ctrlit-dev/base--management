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
  ADMIN: {
    label: 'Admin',
    color: 'bg-red-500',
    glowColor: 'shadow-red-500/50',
    icon: ShieldCheckIcon,
    description: 'Vollzugriff auf alle Funktionen',
  },
  PRODUCTION: {
    label: 'Produktion',
    color: 'bg-blue-500',
    glowColor: 'shadow-blue-500/50',
    icon: CogIcon,
    description: 'Produktions- und Materialverwaltung',
  },
  WAREHOUSE: {
    label: 'Lager',
    color: 'bg-green-500',
    glowColor: 'shadow-green-500/50',
    icon: TruckIcon,
    description: 'Lager- und Bestandsverwaltung',
  },
  SALES: {
    label: 'Verkauf',
    color: 'bg-purple-500',
    glowColor: 'shadow-purple-500/50',
    icon: ShoppingCartIcon,
    description: 'Verkaufs- und Kundenverwaltung',
  },
  VIEWER: {
    label: 'Betrachter',
    color: 'bg-gray-500',
    glowColor: 'shadow-gray-500/50',
    icon: ViewerIcon,
    description: 'Nur Lesezugriff',
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

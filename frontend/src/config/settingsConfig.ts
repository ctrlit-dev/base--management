/**
 * Settings Configuration
 * ======================
 * 
 * Zentrale Konfiguration für Admin-Einstellungen.
 * DRY-Prinzip: Ein Ort für alle Settings-Definitionen.
 */

import { 
  ShieldExclamationIcon,
  CurrencyEuroIcon,
  BeakerIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CloudArrowUpIcon,
  UsersIcon,
  DocumentTextIcon,
  DocumentTextIcon as LogsIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  ClockIcon,
  KeyIcon,
  LockClosedIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import type { SettingsTabConfig, SettingsSection, SystemSettings } from '../types/settings';

// Tab-Konfiguration
export const SETTINGS_TABS: SettingsTabConfig[] = [
  { 
    id: 'authentication', 
    name: 'Authentifizierung', 
    icon: ShieldExclamationIcon
  },
  { 
    id: 'company', 
    name: 'Firmen-Einstellungen', 
    icon: CurrencyEuroIcon
  },
  { 
    id: 'system', 
    name: 'System', 
    icon: Cog6ToothIcon
  },
  { 
    id: 'security', 
    name: 'Sicherheit', 
    icon: ShieldCheckIcon
  },
  { 
    id: 'notifications', 
    name: 'Benachrichtigungen', 
    icon: BellIcon
  },
  { 
    id: 'backup', 
    name: 'Backup & Wartung', 
    icon: CloudArrowUpIcon
  },
  { 
    id: 'users', 
    name: 'Benutzer-Management', 
    icon: UsersIcon
  },
  { 
    id: 'privacy', 
    name: 'Datenschutz', 
    icon: DocumentTextIcon
  },
  { 
    id: 'logs', 
    name: 'Logs & Aktivitäten', 
    icon: LogsIcon
  }
];

// Standardwerte für Settings
export const DEFAULT_SETTINGS: SystemSettings = {
  // Bestehende Einstellungen
  registration_enabled: true,
  require_email_verification: false,
  password_reset_token_expiry_hours: 24,
  company_name: 'User Management System',
  currency: 'EUR',
  
  // NEUE ADMIN-FUNKTIONEN (nur Frontend)
  // Wartungsmodus
  maintenance_mode: false,
  maintenance_message: 'Das System befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.',
  maintenance_allowed_ips: ['127.0.0.1', '::1'],
  
  // Sicherheits-Einstellungen
  two_factor_required: false,
  session_timeout_minutes: 60,
  max_login_attempts: 5,
  password_min_length: 8,
  password_require_special_chars: true,
  account_lockout_duration_minutes: 15,
  
  // Benachrichtigungs-Einstellungen
  email_enabled: false,
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_use_tls: true,
  email_from_address: '',
  notify_on_user_registration: true,
  notify_on_failed_login: true,
  notify_on_system_errors: true,
  notify_on_maintenance_mode: true,
  
  // Backup & Wartung
  backup_enabled: false,
  backup_frequency_hours: 24,
  backup_retention_days: 30,
  backup_location: '/backups',
  log_retention_days: 90,
  audit_log_enabled: true,
  performance_monitoring: false,
  
  // API & Integration
  api_rate_limit_per_minute: 100,
  api_key_expiry_days: 365,
  webhook_enabled: false,
  webhook_url: '',
  webhook_secret: '',
  external_api_timeout_seconds: 30,
  retry_failed_requests: true,
  
  // Benutzer-Management
  user_registration_approval_required: false,
  default_user_role: 'GUEST',
  user_session_timeout_minutes: 480,
  allow_multiple_sessions: true,
  force_password_change_on_first_login: false,
  
  // Datenschutz & Compliance
  data_retention_days: 2555, // 7 Jahre
  anonymize_old_data: false,
  consent_required: true,
  privacy_policy_url: '',
  terms_of_service_url: ''
};

// Validierungsregeln
export const SETTINGS_VALIDATION_RULES = {
  company_name: {
    required: true,
    minLength: 2,
    message: 'Firmenname muss mindestens 2 Zeichen lang sein'
  },
  currency: {
    required: true,
    custom: (value: string) => {
      const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];
      return !validCurrencies.includes(value) ? 'Ungültige Währung' : undefined;
    }
  },
  qr_base_url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'QR-Code Basis-URL muss mit http:// oder https:// beginnen'
  },
  print_agent_url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'Print-Agent URL muss mit http:// oder https:// beginnen'
  },
  password_reset_token_expiry_hours: {
    required: true,
    custom: (value: number) => {
      if (value < 1 || value > 168) {
        return 'Token-Gültigkeit muss zwischen 1 und 168 Stunden liegen';
      }
      return undefined;
    }
  },
  default_loss_factor_oil_percent: {
    required: true,
    custom: (value: number) => {
      if (value < 0 || value > 100) {
        return 'Verlustfaktor muss zwischen 0 und 100% liegen';
      }
      return undefined;
    }
  }
};

// Settings-Sektionen für Formular-Generierung
export const SETTINGS_SECTIONS: Record<string, SettingsSection[]> = {
  authentication: [
    {
      title: 'Benutzer-Registrierung',
      description: 'Konfigurieren Sie, wie neue Benutzer sich registrieren können und welche Genehmigungen erforderlich sind.',
      fields: [
        {
          key: 'registration_enabled',
          label: 'Registrierung aktiviert',
          type: 'boolean',
          helperText: 'Erlaubt neuen Benutzern sich zu registrieren'
        },
        {
          key: 'require_email_verification',
          label: 'E-Mail-Verifizierung erforderlich',
          type: 'boolean',
          helperText: 'Neue Benutzer müssen ihre E-Mail-Adresse verifizieren'
        },
        {
          key: 'user_registration_approval_required',
          label: 'Admin-Genehmigung für Registrierung erforderlich',
          type: 'boolean',
          helperText: 'Neue Benutzer müssen von einem Admin genehmigt werden'
        },
        {
          key: 'default_user_role',
          label: 'Standard-Benutzerrolle',
          type: 'select',
          options: [
            { value: 'GUEST', label: 'GUEST - Nur Lesen' },
            { value: 'USER', label: 'USER - Standard-Benutzer' },
            { value: 'MANAGER', label: 'MANAGER - Manager' },
            { value: 'ADMIN', label: 'ADMIN - Administrator' },
            { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN - Super-Administrator' }
          ],
          helperText: 'Standard-Rolle für neue Benutzer'
        }
      ]
    },
    {
      title: 'Passwort & Sicherheit',
      description: 'Definieren Sie Sicherheitsrichtlinien für Passwörter und Authentifizierungsverfahren.',
      fields: [
        {
          key: 'password_min_length',
          label: 'Minimale Passwort-Länge',
          type: 'number',
          min: 6,
          max: 32,
          helperText: 'Mindestlänge für Benutzer-Passwörter'
        },
        {
          key: 'password_require_special_chars',
          label: 'Sonderzeichen erforderlich',
          type: 'boolean',
          helperText: 'Erfordert Sonderzeichen in Passwörtern'
        },
        {
          key: 'password_reset_token_expiry_hours',
          label: 'Passwort-Reset Token-Gültigkeit (Stunden)',
          type: 'number',
          required: true,
          min: 1,
          max: 168,
          helperText: 'Wie lange ist ein Passwort-Reset-Token gültig'
        },
        {
          key: 'force_password_change_on_first_login',
          label: 'Passwort-Änderung bei erstem Login',
          type: 'boolean',
          helperText: 'Erfordert Passwort-Änderung bei der ersten Anmeldung'
        }
      ]
    },
    {
      title: 'Login-Sicherheit',
      description: 'Einstellungen für Login-Versuche, Account-Sperrungen und Zwei-Faktor-Authentifizierung.',
      fields: [
        {
          key: 'max_login_attempts',
          label: 'Maximale Login-Versuche',
          type: 'number',
          min: 3,
          max: 10,
          helperText: 'Anzahl fehlgeschlagener Login-Versuche bevor Account gesperrt wird'
        },
        {
          key: 'account_lockout_duration_minutes',
          label: 'Account-Sperrung (Minuten)',
          type: 'number',
          min: 5,
          max: 60,
          helperText: 'Dauer der Account-Sperrung nach zu vielen Login-Versuchen'
        },
        {
          key: 'two_factor_required',
          label: '2FA für alle Benutzer erforderlich',
          type: 'boolean',
          helperText: 'Erfordert 2FA für alle Benutzer'
        }
      ]
    }
  ],
  company: [
    {
      title: 'Firmen-Informationen',
      fields: [
        {
          key: 'company_name',
          label: 'Firmenname',
          type: 'text',
          required: true,
          placeholder: 'User Management System'
        },
        {
          key: 'currency',
          label: 'Währung',
          type: 'select',
          required: true,
          options: [
            { value: 'EUR', label: 'EUR (Euro)' },
            { value: 'USD', label: 'USD (US Dollar)' },
            { value: 'GBP', label: 'GBP (British Pound)' },
            { value: 'CHF', label: 'CHF (Swiss Franc)' }
          ]
        }
      ]
    },
  ],
  
  // NEUE ADMIN-SEKTIONEN
  system: [
    {
      title: 'Wartungsmodus',
      icon: WrenchScrewdriverIcon,
      fields: [
        {
          key: 'maintenance_mode',
          label: 'Wartungsmodus aktivieren',
          type: 'boolean',
          icon: ExclamationTriangleIcon,
          helperText: 'Aktiviert den Wartungsmodus für das gesamte System'
        },
        {
          key: 'maintenance_message',
          label: 'Wartungsmodus-Nachricht',
          type: 'text',
          icon: DocumentTextIcon,
          placeholder: 'Das System befindet sich im Wartungsmodus...',
          helperText: 'Nachricht die Benutzern im Wartungsmodus angezeigt wird'
        },
        {
          key: 'maintenance_allowed_ips',
          label: 'Erlaubte IPs im Wartungsmodus (JSON)',
          type: 'json',
          icon: ServerIcon,
          helperText: 'JSON-Array mit IP-Adressen die auch im Wartungsmodus zugreifen können'
        }
      ]
    },
    {
      title: 'System-Performance',
      icon: ChartBarIcon,
      fields: [
        {
          key: 'performance_monitoring',
          label: 'Performance-Monitoring aktivieren',
          type: 'boolean',
          icon: ChartBarIcon,
          helperText: 'Überwacht die System-Performance und erstellt Berichte'
        },
        {
          key: 'log_retention_days',
          label: 'Log-Aufbewahrung (Tage)',
          type: 'number',
          icon: ClockIcon,
          helperText: 'Anzahl der Tage, für die Logs aufbewahrt werden'
        },
        {
          key: 'audit_log_enabled',
          label: 'Audit-Log aktivieren',
          type: 'boolean',
          icon: DocumentTextIcon,
          helperText: 'Protokolliert alle wichtigen System-Aktivitäten'
        }
      ]
    }
  ],
  
  security: [
    {
      title: 'Session-Management',
      icon: LockClosedIcon,
      fields: [
        {
          key: 'session_timeout_minutes',
          label: 'Session-Timeout (Minuten)',
          type: 'number',
          icon: ClockIcon,
          min: 5,
          max: 1440,
          helperText: 'Nach wie vielen Minuten wird eine Session automatisch beendet'
        },
        {
          key: 'allow_multiple_sessions',
          label: 'Mehrere Sessions erlauben',
          type: 'boolean',
          icon: UserGroupIcon,
          helperText: 'Erlaubt Benutzern sich von mehreren Geräten anzumelden'
        }
      ]
    },
    {
      title: 'API & Integration Sicherheit',
      icon: ServerIcon,
      fields: [
        {
          key: 'api_rate_limit_per_minute',
          label: 'API Rate Limit (pro Minute)',
          type: 'number',
          icon: ChartBarIcon,
          min: 10,
          max: 1000,
          helperText: 'Maximale Anzahl API-Anfragen pro Minute'
        },
        {
          key: 'api_key_expiry_days',
          label: 'API-Schlüssel Ablaufzeit (Tage)',
          type: 'number',
          icon: KeyIcon,
          min: 30,
          max: 365,
          helperText: 'Nach wie vielen Tagen laufen API-Schlüssel ab'
        },
        {
          key: 'external_api_timeout_seconds',
          label: 'Externe API Timeout (Sekunden)',
          type: 'number',
          icon: ClockIcon,
          min: 5,
          max: 300,
          helperText: 'Timeout für externe API-Aufrufe'
        },
        {
          key: 'retry_failed_requests',
          label: 'Fehlgeschlagene Anfragen wiederholen',
          type: 'boolean',
          helperText: 'Wiederholt automatisch fehlgeschlagene API-Anfragen'
        }
      ]
    },
    {
      title: 'Webhook-Sicherheit',
      fields: [
        {
          key: 'webhook_enabled',
          label: 'Webhooks aktivieren',
          type: 'boolean',
          helperText: 'Aktiviert Webhook-Funktionalität'
        },
        {
          key: 'webhook_url',
          label: 'Webhook-URL',
          type: 'url',
          placeholder: 'https://example.com/webhook',
          helperText: 'URL für Webhook-Benachrichtigungen'
        },
        {
          key: 'webhook_secret',
          label: 'Webhook-Geheimnis',
          type: 'text',
          helperText: 'Geheimnis für Webhook-Signatur-Verifikation'
        }
      ]
    }
  ],
  
  notifications: [
    {
      title: 'E-Mail-Server Konfiguration',
      fields: [
        {
          key: 'email_enabled',
          label: 'E-Mail-Benachrichtigungen aktivieren',
          type: 'boolean',
          helperText: 'Aktiviert das Senden von E-Mail-Benachrichtigungen'
        },
        {
          key: 'smtp_host',
          label: 'SMTP-Server',
          type: 'text',
          placeholder: 'smtp.example.com',
          helperText: 'Hostname des SMTP-Servers'
        },
        {
          key: 'smtp_port',
          label: 'SMTP-Port',
          type: 'number',
          min: 1,
          max: 65535,
          helperText: 'Port des SMTP-Servers (meist 587 oder 465)'
        },
        {
          key: 'smtp_use_tls',
          label: 'TLS-Verschlüsselung verwenden',
          type: 'boolean',
          helperText: 'Verwendet TLS-Verschlüsselung für SMTP-Verbindung'
        }
      ]
    },
    {
      title: 'E-Mail-Authentifizierung',
      fields: [
        {
          key: 'smtp_username',
          label: 'SMTP-Benutzername',
          type: 'text',
          helperText: 'Benutzername für SMTP-Authentifizierung'
        },
        {
          key: 'smtp_password',
          label: 'SMTP-Passwort',
          type: 'text',
          helperText: 'Passwort für SMTP-Authentifizierung'
        },
        {
          key: 'email_from_address',
          label: 'Absender-E-Mail-Adresse',
          type: 'email',
          placeholder: 'noreply@example.com',
          helperText: 'E-Mail-Adresse die als Absender verwendet wird'
        }
      ]
    },
    {
      title: 'Benachrichtigungstypen',
      fields: [
        {
          key: 'notify_on_user_registration',
          label: 'Bei neuer Benutzer-Registrierung',
          type: 'boolean',
          helperText: 'Benachrichtigung wenn sich ein neuer Benutzer registriert'
        },
        {
          key: 'notify_on_failed_login',
          label: 'Bei fehlgeschlagenen Login-Versuchen',
          type: 'boolean',
          helperText: 'Benachrichtigung bei fehlgeschlagenen Login-Versuchen'
        },
        {
          key: 'notify_on_system_errors',
          label: 'Bei System-Fehlern',
          type: 'boolean',
          helperText: 'Benachrichtigung bei kritischen System-Fehlern'
        },
        {
          key: 'notify_on_maintenance_mode',
          label: 'Bei Wartungsmodus-Aktivierung',
          type: 'boolean',
          helperText: 'Benachrichtigung wenn Wartungsmodus aktiviert wird'
        }
      ]
    }
  ],
  
  backup: [
    {
      title: 'Backup-Einstellungen',
      fields: [
        {
          key: 'backup_enabled',
          label: 'Automatische Backups aktivieren',
          type: 'boolean',
          helperText: 'Aktiviert automatische System-Backups'
        },
        {
          key: 'backup_frequency_hours',
          label: 'Backup-Häufigkeit (Stunden)',
          type: 'number',
          min: 1,
          max: 168,
          helperText: 'Wie oft sollen Backups erstellt werden'
        },
        {
          key: 'backup_retention_days',
          label: 'Backup-Aufbewahrung (Tage)',
          type: 'number',
          min: 7,
          max: 365,
          helperText: 'Wie lange sollen Backups aufbewahrt werden'
        },
        {
          key: 'backup_location',
          label: 'Backup-Speicherort',
          type: 'text',
          placeholder: '/backups',
          helperText: 'Verzeichnis für Backup-Dateien'
        }
      ]
    },
    {
      title: 'System-Wartung',
      fields: [
        {
          key: 'log_retention_days',
          label: 'Log-Aufbewahrung (Tage)',
          type: 'number',
          min: 7,
          max: 365,
          helperText: 'Wie lange sollen Log-Dateien aufbewahrt werden'
        },
        {
          key: 'audit_log_enabled',
          label: 'Audit-Log aktivieren',
          type: 'boolean',
          helperText: 'Protokolliert alle wichtigen System-Aktivitäten'
        },
        {
          key: 'performance_monitoring',
          label: 'Performance-Monitoring aktivieren',
          type: 'boolean',
          helperText: 'Überwacht System-Performance und Ressourcenverbrauch'
        }
      ]
    }
  ],
  
  users: [
    {
      title: 'Benutzer-Session-Einstellungen',
      fields: [
        {
          key: 'user_session_timeout_minutes',
          label: 'Benutzer-Session-Timeout (Minuten)',
          type: 'number',
          min: 15,
          max: 1440,
          helperText: 'Nach wie vielen Minuten wird eine Benutzer-Session beendet'
        }
      ]
    }
  ],
  
  privacy: [
    {
      title: 'Datenschutz & Compliance',
      fields: [
        {
          key: 'data_retention_days',
          label: 'Datenaufbewahrung (Tage)',
          type: 'number',
          min: 30,
          max: 3650,
          helperText: 'Wie lange sollen Benutzerdaten aufbewahrt werden'
        },
        {
          key: 'anonymize_old_data',
          label: 'Alte Daten anonymisieren',
          type: 'boolean',
          helperText: 'Anonymisiert Daten nach Ablauf der Aufbewahrungsfrist'
        },
        {
          key: 'consent_required',
          label: 'Einverständniserklärung erforderlich',
          type: 'boolean',
          helperText: 'Erfordert Einverständniserklärung bei der Registrierung'
        }
      ]
    },
    {
      title: 'Rechtliche Dokumente',
      fields: [
        {
          key: 'privacy_policy_url',
          label: 'Datenschutzerklärung URL',
          type: 'url',
          placeholder: 'https://example.com/privacy',
          helperText: 'URL zur Datenschutzerklärung'
        },
        {
          key: 'terms_of_service_url',
          label: 'Nutzungsbedingungen URL',
          type: 'url',
          placeholder: 'https://example.com/terms',
          helperText: 'URL zu den Nutzungsbedingungen'
        }
      ]
    }
  ]
};

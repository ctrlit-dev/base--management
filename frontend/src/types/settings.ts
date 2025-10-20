/**
 * Settings Types
 * ==============
 * 
 * TypeScript-Definitionen für Systemeinstellungen.
 * Synchronisiert mit Backend-Modell für Typsicherheit.
 */

export interface SystemSettings {
  // Metadaten
  id?: number;
  created_at?: string;
  updated_at?: string;
  
  // Authentifizierungs-Einstellungen
  registration_enabled: boolean;
  require_email_verification: boolean;
  password_reset_token_expiry_hours: number;
  
  // Firmen-Einstellungen
  company_name: string;
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF';
  qr_base_url: string;
  print_agent_url: string;
  
  // Produktions-Einstellungen
  default_loss_factor_oil_percent: number;
  require_second_batch_scan_on_insufficient: boolean;
  show_older_batch_warning: boolean;
  
  // Analytics & Scraper
  analytics_defaults: Record<string, any>;
  scraper_settings: Record<string, any>;
  
  // NEUE ADMIN-FUNKTIONEN (nur Frontend)
  // Wartungsmodus
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_allowed_ips: string[];
  
  // Sicherheits-Einstellungen
  two_factor_required: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  password_min_length: number;
  password_require_special_chars: boolean;
  account_lockout_duration_minutes: number;
  
  // Benachrichtigungs-Einstellungen
  email_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_use_tls: boolean;
  email_from_address: string;
  notify_on_user_registration: boolean;
  notify_on_failed_login: boolean;
  notify_on_system_errors: boolean;
  notify_on_maintenance_mode: boolean;
  
  // Backup & Wartung
  backup_enabled: boolean;
  backup_frequency_hours: number;
  backup_retention_days: number;
  backup_location: string;
  log_retention_days: number;
  audit_log_enabled: boolean;
  performance_monitoring: boolean;
  
  // API & Integration
  api_rate_limit_per_minute: number;
  api_key_expiry_days: number;
  webhook_enabled: boolean;
  webhook_url: string;
  webhook_secret: string;
  external_api_timeout_seconds: number;
  retry_failed_requests: boolean;
  
  // Benutzer-Management
  user_registration_approval_required: boolean;
  default_user_role: 'ADMIN' | 'PRODUCTION' | 'WAREHOUSE' | 'SALES' | 'VIEWER';
  user_session_timeout_minutes: number;
  allow_multiple_sessions: boolean;
  force_password_change_on_first_login: boolean;
  
  // Datenschutz & Compliance
  data_retention_days: number;
  anonymize_old_data: boolean;
  consent_required: boolean;
  privacy_policy_url: string;
  terms_of_service_url: string;
}

export interface SettingsValidationErrors {
  company_name?: string;
  currency?: string;
  qr_base_url?: string;
  print_agent_url?: string;
  password_reset_token_expiry_hours?: string;
  default_loss_factor_oil_percent?: string;
}

export type SettingsTab = 'authentication' | 'company' | 'production' | 'system' | 'security' | 'notifications' | 'backup' | 'users' | 'privacy' | 'logs' | 'analytics';

export interface SettingsTabConfig {
  id: SettingsTab;
  name: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SettingsFormField {
  key: keyof SystemSettings;
  label: string;
  type: 'text' | 'email' | 'url' | 'number' | 'boolean' | 'select' | 'json';
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  helperText?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SettingsSection {
  title: string;
  fields: SettingsFormField[];
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

// Log-Types für Aktivitäten und Fehler
export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'warning' | 'error';
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  details?: string;
  user?: string;
  ip_address?: string;
  stack_trace?: string;
}

export interface LogFilter {
  level?: string;
  source?: string;
  user?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Mock Log Data
 * =============
 * 
 * Mock-Daten für Aktivitäten und Fehler-Logs.
 * Simuliert reale Log-Einträge für Frontend-Darstellung.
 */

import type { ActivityLog, ErrorLog } from '../types/settings';

// Mock-Daten für Aktivitäts-Logs
export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15T14:30:25Z',
    user: 'admin@lcree.com',
    action: 'LOGIN_SUCCESS',
    details: 'Erfolgreiche Anmeldung',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:25:12Z',
    user: 'user@example.com',
    action: 'LOGIN_FAILED',
    details: 'Falsches Passwort - 3 Versuche',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'error'
  },
  {
    id: '3',
    timestamp: '2024-01-15T14:20:45Z',
    user: 'admin@lcree.com',
    action: 'SETTINGS_UPDATE',
    details: 'Systemeinstellungen aktualisiert - Wartungsmodus aktiviert',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'warning'
  },
  {
    id: '4',
    timestamp: '2024-01-15T14:15:30Z',
    user: 'production@lcree.com',
    action: 'BATCH_CREATED',
    details: 'Neue Charge erstellt - Öl-Batch #2024-001',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '5',
    timestamp: '2024-01-15T14:10:15Z',
    user: 'warehouse@lcree.com',
    action: 'INVENTORY_UPDATE',
    details: 'Lagerbestand aktualisiert - 15 Artikel geändert',
    ip_address: '192.168.1.103',
    user_agent: 'Mozilla/5.0 (Linux x86_64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '6',
    timestamp: '2024-01-15T14:05:22Z',
    user: 'sales@lcree.com',
    action: 'ORDER_CREATED',
    details: 'Neue Bestellung erstellt - Order #ORD-2024-001',
    ip_address: '192.168.1.104',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '7',
    timestamp: '2024-01-15T14:00:18Z',
    user: 'admin@lcree.com',
    action: 'USER_CREATED',
    details: 'Neuer Benutzer erstellt - test@example.com',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '8',
    timestamp: '2024-01-15T13:55:45Z',
    user: 'unknown',
    action: 'LOGIN_FAILED',
    details: 'Unbekannter Benutzer - hacking@evil.com',
    ip_address: '203.0.113.42',
    user_agent: 'curl/7.68.0',
    status: 'error'
  }
];

// Mock-Daten für Fehler-Logs
export const MOCK_ERROR_LOGS: ErrorLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15T14:30:25Z',
    level: 'ERROR',
    source: 'API',
    message: 'Database connection timeout',
    details: 'Failed to connect to PostgreSQL database after 30 seconds',
    user: 'admin@lcree.com',
    ip_address: '192.168.1.100',
    stack_trace: 'at Database.connect (/app/db/connection.js:45:12)\n  at async APIHandler.process (/app/api/handler.js:23:8)'
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:25:12Z',
    level: 'WARNING',
    source: 'AUTH',
    message: 'Multiple failed login attempts',
    details: 'User user@example.com has failed 5 login attempts in 10 minutes',
    user: 'user@example.com',
    ip_address: '192.168.1.101'
  },
  {
    id: '3',
    timestamp: '2024-01-15T14:20:45Z',
    level: 'CRITICAL',
    source: 'SYSTEM',
    message: 'Disk space low',
    details: 'Disk usage is at 95% on /var/log partition',
    stack_trace: 'at DiskMonitor.checkSpace (/app/monitor/disk.js:78:15)'
  },
  {
    id: '4',
    timestamp: '2024-01-15T14:15:30Z',
    level: 'ERROR',
    source: 'EMAIL',
    message: 'SMTP connection failed',
    details: 'Could not connect to SMTP server smtp.example.com:587',
    stack_trace: 'at SMTPClient.connect (/app/email/smtp.js:34:22)'
  },
  {
    id: '5',
    timestamp: '2024-01-15T14:10:15Z',
    level: 'WARNING',
    source: 'API',
    message: 'Rate limit exceeded',
    details: 'API rate limit exceeded for IP 192.168.1.105 (100 requests/minute)',
    ip_address: '192.168.1.105'
  },
  {
    id: '6',
    timestamp: '2024-01-15T14:05:22Z',
    level: 'ERROR',
    source: 'BACKUP',
    message: 'Backup failed',
    details: 'Database backup failed due to insufficient disk space',
    stack_trace: 'at BackupManager.createBackup (/app/backup/manager.js:156:8)'
  },
  {
    id: '7',
    timestamp: '2024-01-15T14:00:18Z',
    level: 'INFO',
    source: 'SYSTEM',
    message: 'System maintenance started',
    details: 'Scheduled maintenance window started',
    user: 'admin@lcree.com'
  },
  {
    id: '8',
    timestamp: '2024-01-15T13:55:45Z',
    level: 'DEBUG',
    source: 'API',
    message: 'Request processed',
    details: 'GET /api/v1/settings processed in 45ms',
    user: 'admin@lcree.com',
    ip_address: '192.168.1.100'
  },
  {
    id: '9',
    timestamp: '2024-01-15T13:50:30Z',
    level: 'ERROR',
    source: 'SECURITY',
    message: 'Suspicious activity detected',
    details: 'Multiple login attempts from suspicious IP 203.0.113.42',
    ip_address: '203.0.113.42',
    stack_trace: 'at SecurityMonitor.detectSuspiciousActivity (/app/security/monitor.js:89:12)'
  },
  {
    id: '10',
    timestamp: '2024-01-15T13:45:15Z',
    level: 'WARNING',
    source: 'CACHE',
    message: 'Cache miss rate high',
    details: 'Cache miss rate is 85% for Redis cache',
    stack_trace: 'at CacheMonitor.checkMissRate (/app/cache/monitor.js:67:9)'
  }
];

// Hilfsfunktionen für Logs
export const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'text-red-600 bg-red-50';
    case 'ERROR': return 'text-red-500 bg-red-50';
    case 'WARNING': return 'text-yellow-600 bg-yellow-50';
    case 'INFO': return 'text-blue-600 bg-blue-50';
    case 'DEBUG': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-50';
    case 'warning': return 'text-yellow-600 bg-yellow-50';
    case 'error': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

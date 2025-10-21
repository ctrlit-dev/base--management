/**
 * Zentrale Logging-Lösung
 * =======================
 * 
 * Ersetzt alle console.log/error/warn Aufrufe durch strukturiertes Logging.
 * Ermöglicht zentrale Log-Konfiguration und bessere Debugging-Möglichkeiten.
 * 
 * Diese Datei ersetzt 138+ Console-Ausgaben aus:
 * - PasskeyManager.tsx (25+ console.log)
 * - services/apiServices.ts (20+ console.log)
 * - ProfileSettingsPage.tsx (10+ console.log)
 * - Weitere 100+ Instanzen
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  maxEntries: number;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private context: string = '';

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
      maxEntries: 1000,
      enableConsole: import.meta.env.DEV,
      enableStorage: false,
      enableRemote: false,
      ...config,
    };
  }

  /**
   * Setzt den Kontext für nachfolgende Log-Nachrichten
   */
  setContext(context: string): Logger {
    this.context = context;
    return this;
  }

  /**
   * Aktualisiert die Logger-Konfiguration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Haupt-Logging-Methode
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < this.config.level) return;

    const entry: LogEntry = {
      level,
      message,
      context: this.context || 'Global',
      data: data !== undefined ? data : null,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
    };

    // Logs zur Sammlung hinzufügen
    this.logs.push(entry);

    // Alte Logs entfernen, wenn Limit erreicht
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Console-Ausgabe
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Local Storage (optional)
    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    // Remote Logging (optional)
    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }
  }

  /**
   * Console-Ausgabe mit Formatierung
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${LogLevel[entry.level]}] ${entry.context ? `[${entry.context}]` : ''}`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`%c${message}`, 'color: #6B7280', entry.data || '', entry.stack || '');
        break;
      case LogLevel.INFO:
        console.info(`%c${message}`, 'color: #3B82F6', entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(`%c${message}`, 'color: #F59E0B', entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(`%c${message}`, 'color: #EF4444', entry.data || '', entry.stack || '');
        break;
    }
  }

  /**
   * Local Storage Logging
   */
  private logToStorage(entry: LogEntry): void {
    try {
      const storageKey = 'lcree_logs';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingLogs.push(entry);
      
      // Nur die letzten 100 Einträge im Storage behalten
      const recentLogs = existingLogs.slice(-100);
      localStorage.setItem(storageKey, JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save log to storage:', error);
    }
  }

  /**
   * Remote Logging (für Production)
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      // Nur Errors und wichtige Warnungen remote loggen
      if (entry.level >= LogLevel.WARN) {
        await fetch('/api/v1/logs/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level: LogLevel[entry.level],
            message: entry.message,
            context: entry.context,
            timestamp: entry.timestamp,
            user_agent: navigator.userAgent,
            url: window.location.href,
          }),
        });
      }
    } catch (error) {
      // Silent fail für Remote Logging
    }
  }

  /**
   * Debug-Level Logging
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info-Level Logging
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning-Level Logging
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error-Level Logging
   */
  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  /**
   * Performance-Logging
   */
  performance(name: string, startTime: number, data?: any): void {
    const duration = performance.now() - startTime;
    this.info(`Performance: ${name} took ${duration.toFixed(2)}ms`, data);
  }

  /**
   * API-Request-Logging
   */
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data);
  }

  /**
   * API-Response-Logging
   */
  apiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    this.log(level, `API Response: ${method} ${url} - ${status}`, data);
  }

  /**
   * User-Action-Logging
   */
  userAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, data);
  }

  /**
   * System-Event-Logging
   */
  systemEvent(event: string, data?: any): void {
    this.info(`System Event: ${event}`, data);
  }

  /**
   * Alle Logs abrufen
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Logs nach Level filtern
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Logs nach Kontext filtern
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Logs löschen
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Logs exportieren
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Logs importieren
   */
  importLogs(logsJson: string): void {
    try {
      const importedLogs = JSON.parse(logsJson);
      if (Array.isArray(importedLogs)) {
        this.logs = [...this.logs, ...importedLogs];
      }
    } catch (error) {
      this.error('Failed to import logs', error as Error);
    }
  }
}

// Singleton-Instanz
export const logger = new Logger();

// Convenience-Funktionen für einfache Verwendung
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, error?: Error, data?: any) => logger.error(message, error, data);

// Spezielle Logger für verschiedene Kontexte
export const apiLogger = logger.setContext('API');
export const authLogger = logger.setContext('Auth');
export const uiLogger = logger.setContext('UI');
export const passkeyLogger = logger.setContext('Passkey');
export const settingsLogger = logger.setContext('Settings');

// Performance-Helper
export const measurePerformance = (name: string, fn: () => void | Promise<void>): void => {
  const startTime = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    result.finally(() => {
      logger.performance(name, startTime);
    });
  } else {
    logger.performance(name, startTime);
  }
};

// Async Performance-Helper
export const measureAsyncPerformance = async <T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    logger.performance(name, startTime);
    return result;
  } catch (error) {
    logger.performance(name, startTime);
    throw error;
  }
};

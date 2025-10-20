/**
 * Audit Logs Hook
 * ===============
 * 
 * React Hook für Audit-Logs.
 * Bietet State-Management und API-Integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { auditLogsApi, type AuditLog, type LogFilters } from '../api/auditLogs';

interface UseAuditLogsReturn {
  // Audit Logs
  auditLogs: AuditLog[];
  auditLogsLoading: boolean;
  auditLogsError: string | null;
  auditLogsCount: number;
  loadAuditLogs: (filters?: LogFilters) => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  
  // Common
  clearErrors: () => void;
}

export function useAuditLogs(): UseAuditLogsReturn {
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);
  const [auditLogsCount, setAuditLogsCount] = useState(0);
  const [auditLogsFilters, setAuditLogsFilters] = useState<LogFilters>({});

  // Audit Logs Functions
  const loadAuditLogs = useCallback(async (filters: LogFilters = {}) => {
    setAuditLogsLoading(true);
    setAuditLogsError(null);
    setAuditLogsFilters(filters);

    try {
      const response = await auditLogsApi.getAuditLogs(filters);
      
      if (response.error) {
        setAuditLogsError(response.error);
        return;
      }

      if (response.data) {
        setAuditLogs(response.data.results);
        setAuditLogsCount(response.data.count);
      }
    } catch (error) {
      setAuditLogsError('Fehler beim Laden der Audit-Logs');
      console.error('Error loading audit logs:', error);
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    await loadAuditLogs(auditLogsFilters);
  }, [loadAuditLogs, auditLogsFilters]);

  // Common Functions
  const clearErrors = useCallback(() => {
    setAuditLogsError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return {
    // Audit Logs
    auditLogs,
    auditLogsLoading,
    auditLogsError,
    auditLogsCount,
    loadAuditLogs,
    refreshAuditLogs,
    
    // Common
    clearErrors,
  };
}
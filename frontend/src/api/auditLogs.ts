/**
 * LCREE Audit Logs API Service
 * =============================
 * 
 * API-Service für Audit-Logs und System-Logs.
 * 
 * Endpunkte:
 * - Audit-Logs: GET /api/v1/audit/audit-logs/
 * - System-Logs: GET /api/v1/logs/system-logs/
 * - Error-Logs: GET /api/v1/logs/error-logs/
 */

import { BaseApiClient, type ApiResponse } from './baseClient';

// Audit-Log-Typen
export interface AuditLog {
  id: number;
  actor: number | null; // Actor ID
  actor_name: string | null; // Actor full name
  actor_details: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
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

export interface SystemLog {
  id: number;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  source: string;
  timestamp: string;
  user_id?: number;
  ip_address?: string;
  details?: any;
  stack_trace?: string;
}

export interface LogFilters {
  action?: string;
  actor?: number;
  subject_type?: string;
  level?: string;
  source?: string;
  search?: string;
  created_at__gte?: string;
  created_at__lte?: string;
  limit?: number;
  offset?: number;
}

// API-Client-Instanz
const auditLogsClient = new BaseApiClient();

// Audit-Logs API
export const auditLogsApi = {
  /**
   * Audit-Logs abrufen
   */
  async getAuditLogs(filters: LogFilters = {}): Promise<ApiResponse<{ results: AuditLog[]; count: number; next?: string; previous?: string }>> {
    const params = new URLSearchParams();
    
    console.log('Building filters:', filters);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
        console.log(`Added filter: ${key} = ${value}`);
      }
    });
    
    const url = `/audit/logs/?${params.toString()}`;
    console.log('API URL:', url);
    
    return auditLogsClient.get(url);
  },

  /**
   * System-Logs abrufen (falls verfügbar)
   */
  async getSystemLogs(filters: LogFilters = {}): Promise<ApiResponse<{ results: SystemLog[]; count: number }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return auditLogsClient.get(`/logs/system-logs/?${params.toString()}`);
  },

  /**
   * Error-Logs abrufen (falls verfügbar)
   */
  async getErrorLogs(filters: LogFilters = {}): Promise<ApiResponse<{ results: SystemLog[]; count: number }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return auditLogsClient.get(`/logs/error-logs/?${params.toString()}`);
  },

  /**
   * Audit-Log-Details abrufen
   */
  async getAuditLogDetails(id: number): Promise<ApiResponse<AuditLog>> {
    return auditLogsClient.get(`/audit/logs/${id}/`);
  },
};

export default auditLogsApi;

/**
 * Real Log Components
 * ===================
 * 
 * Komponenten für echte Audit-Logs aus dem Backend.
 * Ersetzt die Mock-Daten-Komponenten.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { BaseSelect } from '../forms/FormComponents';
import { SecondaryButton } from '../buttons/ButtonComponents';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import type { AuditLog, LogFilters } from '../../api/auditLogs';

// Utility-Funktionen
const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getActionColor = (action: string): string => {
  if (action.includes('DELETE') || action.includes('HARD_DELETE')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  }
  if (action.includes('CREATE') || action.includes('RESTORE')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  }
  if (action.includes('UPDATE') || action.includes('SOFT_DELETE')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getActionIcon = (action: string) => {
  if (action.includes('DELETE') || action.includes('HARD_DELETE')) {
    return <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
  }
  if (action.includes('CREATE') || action.includes('RESTORE')) {
    return <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />;
  }
  if (action.includes('UPDATE') || action.includes('SOFT_DELETE')) {
    return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }
  return <InformationCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
};

const getSubjectDisplayName = (log: AuditLog): string => {
  if (!log.subject_type || !log.subject_id) {
    return 'Unbekanntes Objekt';
  }

  // Für User-Objekte: Zeige E-Mail aus payload_after oder payload_before
  if (log.subject_type === 'User') {
    const userData = log.payload_before || log.payload_after;
    if (userData && userData.email) {
      return `Benutzer: ${userData.email}`;
    }
    
    // Fallback: Extrahiere E-Mail aus der Beschreibung
    if (log.description) {
      const emailMatch = log.description.match(/\(([^)]+@[^)]+)\)/);
      if (emailMatch) {
        return `Benutzer: ${emailMatch[1]}`;
      }
      
      // Fallback: Extrahiere Namen aus der Beschreibung
      const nameMatch = log.description.match(/Benutzer ([^(]+)/);
      if (nameMatch) {
        return `Benutzer: ${nameMatch[1].trim()}`;
      }
    }
    
    return `Benutzer #${log.subject_id}`;
  }

  // Für Order-Objekte: Zeige Order-Nummer oder ID
  if (log.subject_type === 'Order') {
    const orderData = log.payload_after || log.payload_before;
    if (orderData && orderData.order_number) {
      return `Bestellung: ${orderData.order_number}`;
    }
    return `Bestellung #${log.subject_id}`;
  }

  // Für Production-Objekte
  if (log.subject_type === 'Production') {
    const prodData = log.payload_after || log.payload_before;
    if (prodData && prodData.batch_number) {
      return `Produktion: ${prodData.batch_number}`;
    }
    return `Produktion #${log.subject_id}`;
  }

  // Für Sale-Objekte
  if (log.subject_type === 'Sale') {
    const saleData = log.payload_after || log.payload_before;
    if (saleData && saleData.sale_number) {
      return `Verkauf: ${saleData.sale_number}`;
    }
    return `Verkauf #${log.subject_id}`;
  }

  // Für OilBatch-Objekte
  if (log.subject_type === 'OilBatch') {
    const batchData = log.payload_after || log.payload_before;
    if (batchData && batchData.batch_number) {
      return `Charge: ${batchData.batch_number}`;
    }
    return `Charge #${log.subject_id}`;
  }

  // Für ToolUsage-Objekte
  if (log.subject_type === 'ToolUsage') {
    const toolData = log.payload_after || log.payload_before;
    if (toolData && toolData.tool_name) {
      return `Tool: ${toolData.tool_name}`;
    }
    return `Tool-Nutzung #${log.subject_id}`;
  }

  // Fallback für unbekannte Objekttypen
  return `${log.subject_type} #${log.subject_id}`;
};

// Simple Date Input Component
interface DateInputProps {
  label: string;
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
}

const DateInput: React.FC<DateInputProps> = ({ label, selectedDate, onChange }) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onChange(new Date(value));
    } else {
      onChange(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-2">
        {label}
      </label>
      <input
        type="date"
        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="w-full px-3 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary"
      />
    </div>
  );
};

// Audit Log Item Component
interface AuditLogItemProps {
  log: AuditLog;
}

const AuditLogItem: React.FC<AuditLogItemProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-card-secondary rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getActionIcon(log.action)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-primary truncate">
                {log.actor_details ? `${log.actor_details.first_name} ${log.actor_details.last_name} (${log.actor_details.email})` : log.actor_name || 'System'}
              </h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                {log.action.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-secondary mt-1">{log.description || 'Keine Beschreibung verfügbar.'}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-tertiary">
              <span><ClockIcon className="inline-block w-3 h-3 mr-1" />{formatTimestamp(log.created_at)}</span>
              {log.ip && <span><ComputerDesktopIcon className="inline-block w-3 h-3 mr-1" />{log.ip}</span>}
              {log.subject_type && (
                <span>
                  <UserIcon className="inline-block w-3 h-3 mr-1" />
                  {getSubjectDisplayName(log)}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-card-secondary transition-colors text-secondary"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-card-secondary overflow-hidden"
        >
          <div className="space-y-2 text-xs text-secondary">
            {log.user_agent && (
              <div>
                <span className="font-medium text-primary">User Agent:</span> {log.user_agent}
              </div>
            )}
            {log.payload_before && (
              <div>
                <span className="font-medium text-primary">Daten vorher:</span>
                <pre className="mt-1 p-2 bg-card-tertiary rounded text-xs font-mono overflow-x-auto text-primary">
                  {JSON.stringify(log.payload_before, null, 2)}
                </pre>
              </div>
            )}
            {log.payload_after && (
              <div>
                <span className="font-medium text-primary">Daten nachher:</span>
                <pre className="mt-1 p-2 bg-card-tertiary rounded text-xs font-mono overflow-x-auto text-primary">
                  {JSON.stringify(log.payload_after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Log Filter Component
interface LogFilterComponentProps {
  onFilterChange: (filter: LogFilters) => void;
  filter: LogFilters;
}

const LogFilterComponent: React.FC<LogFilterComponentProps> = ({ onFilterChange, filter }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filter.search || '');

  const handleDateChange = (key: 'created_at__gte' | 'created_at__lte', date: Date | null) => {
    onFilterChange({
      ...filter,
      [key]: date ? date.toISOString().split('T')[0] : undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Sofortige Filter-Anwendung ohne Debouncing für bessere UX
    onFilterChange({ ...filter, search: value });
  };

  const actionOptions = [
    { value: '', label: 'Alle Aktionen' },
    // Authentifizierung
    { value: 'AUTH_LOGIN', label: 'Anmeldung' },
    { value: 'AUTH_LOGOUT', label: 'Abmeldung' },
    { value: 'AUTH_PASSKEY_REGISTER', label: 'Passkey registriert' },
    { value: 'AUTH_PASSKEY_DELETE', label: 'Passkey gelöscht' },
    // Benutzer-Management
    { value: 'USER_CREATE', label: 'Benutzer erstellt' },
    { value: 'USER_UPDATE', label: 'Benutzer aktualisiert' },
    { value: 'USER_SOFT_DELETE', label: 'Benutzer Soft-Delete' },
    { value: 'USER_HARD_DELETE', label: 'Benutzer Hard-Delete' },
    { value: 'USER_RESTORE', label: 'Benutzer wiederhergestellt' },
    { value: 'USER_STATUS_TOGGLE', label: 'Benutzer-Status geändert' },
    // Geschäftsprozesse
    { value: 'ORDER_RECEIVE', label: 'Wareneingang' },
    { value: 'PRODUCTION_COMMIT', label: 'Produktion bestätigt' },
    { value: 'SALE_COMMIT', label: 'Verkauf bestätigt' },
    { value: 'BATCH_ADJUSTMENT', label: 'Charge-Anpassung' },
    { value: 'MATERIAL_ADJUST', label: 'Material-Anpassung' },
    { value: 'PRODUCT_ADJUST', label: 'Produkt-Anpassung' },
    // Tools & Equipment
    { value: 'TOOL_CHECKOUT', label: 'Tool-Entnahme' },
    { value: 'LABEL_PRINT_JOB', label: 'Etikettendruck' },
    // Generische CRUD
    { value: 'CRUD_CREATE', label: 'Objekt erstellt' },
    { value: 'CRUD_UPDATE', label: 'Objekt aktualisiert' },
    { value: 'CRUD_DELETE', label: 'Objekt gelöscht' },
  ];

  const subjectTypeOptions = [
    { value: '', label: 'Alle Objekttypen' },
    { value: 'User', label: 'Benutzer' },
    { value: 'Order', label: 'Bestellung' },
    { value: 'Production', label: 'Produktion' },
    { value: 'Sale', label: 'Verkauf' },
    { value: 'OilBatch', label: 'Charge' },
    { value: 'ToolUsage', label: 'Tool-Nutzung' },
    { value: 'Material', label: 'Material' },
    { value: 'Product', label: 'Produkt' },
  ];

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filter).filter(([key, value]) => {
      if (key === 'limit' || key === 'offset') return false;
      return value !== undefined && value !== '' && value !== null;
    }).length;
  }, [filter]);

  const resetFilters = () => {
    setSearchValue('');
    onFilterChange({ limit: filter.limit, offset: filter.offset });
  };

  return (
    <div className="bg-card border border-card-secondary rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-primary font-medium hover:text-blue-600 transition-colors"
      >
        <FunnelIcon className="w-5 h-5" />
        <span>Filter</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-4 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Suche
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Beschreibung, E-Mail, Objekt-ID durchsuchen..."
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary placeholder:text-tertiary"
                />
              </div>
            </div>
            
            {/* Action Filter */}
            <div>
              <BaseSelect
                label="Aktion"
                value={filter.action || ''}
                onChange={(value) => onFilterChange({ ...filter, action: value })}
                options={actionOptions}
              />
            </div>

            {/* Subject Type Filter */}
            <div>
              <BaseSelect
                label="Objekttyp"
                value={filter.subject_type || ''}
                onChange={(value) => onFilterChange({ ...filter, subject_type: value })}
                options={subjectTypeOptions}
              />
            </div>

            {/* Actor Filter */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Benutzer-ID
              </label>
              <input
                type="number"
                placeholder="Benutzer-ID eingeben..."
                value={filter.actor || ''}
                onChange={(e) => onFilterChange({ ...filter, actor: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary placeholder:text-tertiary"
              />
            </div>

            {/* Date Range Filters */}
            <div>
              <DateInput
                label="Erstellt nach"
                selectedDate={filter.created_at__gte ? new Date(filter.created_at__gte) : null}
                onChange={(date) => handleDateChange('created_at__gte', date)}
              />
            </div>
            <div>
              <DateInput
                label="Erstellt vor"
                selectedDate={filter.created_at__lte ? new Date(filter.created_at__lte) : null}
                onChange={(date) => handleDateChange('created_at__lte', date)}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-secondary">
              {activeFiltersCount > 0 && (
                <span className="flex items-center space-x-1">
                  <FunnelIcon className="w-4 h-4" />
                  <span>{activeFiltersCount} Filter aktiv</span>
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <SecondaryButton
                onClick={resetFilters}
                className="text-sm"
                disabled={activeFiltersCount === 0}
              >
                Filter zurücksetzen
              </SecondaryButton>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Filter anwenden
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Main Activity Logs Component
export const RealActivityLogs: React.FC = () => {
  const { auditLogs, auditLogsLoading, auditLogsError, auditLogsCount, loadAuditLogs } = useAuditLogs();
  const [filter, setFilter] = useState<LogFilters>({});

  const handleFilterChange = (newFilter: LogFilters) => {
    console.log('Filter change:', { oldFilter: filter, newFilter });
    setFilter(newFilter);
    loadAuditLogs(newFilter);
  };

  if (auditLogsError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-2">Fehler beim Laden der Aktivitäts-Logs</div>
        <p className="text-secondary text-sm">{auditLogsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <h3 className="text-lg font-semibold text-primary">
          Letzte Aktivitäten ({auditLogsCount})
        </h3>
        <div className="text-sm text-secondary">
          Benutzer-Aktionen und System-Events
        </div>
      </div>
      
      <LogFilterComponent onFilterChange={handleFilterChange} filter={filter} />
      
      {auditLogsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-secondary">Lade Aktivitäten...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <AuditLogItem key={log.id} log={log} />
          ))}
        </div>
      )}
      
      {!auditLogsLoading && auditLogs.length === 0 && (
        <div className="text-center py-8 text-secondary">
          Keine Aktivitäten gefunden
        </div>
      )}
    </div>
  );
};

// Main Error Logs Component (zeigt kritische Audit-Logs)
export const RealErrorLogs: React.FC = () => {
  const { auditLogs, auditLogsLoading, auditLogsError, loadAuditLogs } = useAuditLogs();
  const [filter, setFilter] = useState<LogFilters>({});

  const handleFilterChange = (newFilter: LogFilters) => {
    setFilter(newFilter);
    loadAuditLogs(newFilter);
  };

  // Filtere nur Error-bezogene Audit-Logs
  const errorRelatedLogs = auditLogs.filter(log => 
    log.action.includes('ERROR') || 
    log.action.includes('DELETE') || 
    log.description?.toLowerCase().includes('fehler') ||
    log.description?.toLowerCase().includes('error')
  );

  if (auditLogsError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-2">Fehler beim Laden der Logs</div>
        <p className="text-secondary text-sm">{auditLogsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <h3 className="text-lg font-semibold text-primary">
          Kritische Aktivitäten ({errorRelatedLogs.length})
        </h3>
        <div className="text-sm text-secondary">
          Löschungen, Fehler und kritische Aktionen
        </div>
      </div>
      
      <LogFilterComponent onFilterChange={handleFilterChange} filter={filter} />
      
      {auditLogsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-secondary">Lade Logs...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {errorRelatedLogs.map((log) => (
            <AuditLogItem key={log.id} log={log} />
          ))}
        </div>
      )}
      
      {!auditLogsLoading && errorRelatedLogs.length === 0 && (
        <div className="text-center py-8 text-secondary">
          Keine kritischen Aktivitäten gefunden
        </div>
      )}
    </div>
  );
};
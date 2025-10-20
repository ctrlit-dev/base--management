/**
 * Log Components
 * ==============
 * 
 * Komponenten für Aktivitäts-Logs und Fehler-Logs.
 * Zeigt Mock-Daten in übersichtlicher Form an.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { BaseSelect } from '../forms/FormComponents';
import { SecondaryButton } from '../buttons/ButtonComponents';
import type { ActivityLog, ErrorLog, LogFilter } from '../../types/settings';
import { 
  MOCK_ACTIVITY_LOGS, 
  MOCK_ERROR_LOGS, 
  getLogLevelColor, 
  getStatusColor, 
  formatTimestamp 
} from '../../data/mockLogData';

// Aktivitäts-Log-Komponente
interface ActivityLogProps {
  log: ActivityLog;
}

const ActivityLogItem: React.FC<ActivityLogProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background-secondary border border-border-primary rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getStatusIcon(log.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-text-primary truncate">
                {log.user}
              </h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                {log.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{log.details}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-text-tertiary">
              <span>{formatTimestamp(log.timestamp)}</span>
              <span>{log.ip_address}</span>
              <span>{log.action}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-background-tertiary transition-colors"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border-primary"
        >
          <div className="space-y-2 text-xs text-text-secondary">
            <div>
              <span className="font-medium">User Agent:</span> {log.user_agent}
            </div>
            <div>
              <span className="font-medium">Action:</span> {log.action}
            </div>
            <div>
              <span className="font-medium">IP Address:</span> {log.ip_address}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Fehler-Log-Komponente
interface ErrorLogProps {
  log: ErrorLog;
}

const ErrorLogItem: React.FC<ErrorLogProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'ERROR': return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'INFO': return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'DEBUG': return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background-secondary border border-border-primary rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getLevelIcon(log.level)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-xs text-text-tertiary">{log.source}</span>
            </div>
            <p className="text-sm text-text-primary mt-1 font-medium">{log.message}</p>
            {log.details && (
              <p className="text-sm text-text-secondary mt-1">{log.details}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-text-tertiary">
              <span>{formatTimestamp(log.timestamp)}</span>
              {log.user && <span>{log.user}</span>}
              {log.ip_address && <span>{log.ip_address}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-background-tertiary transition-colors"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border-primary"
        >
          <div className="space-y-2 text-xs text-text-secondary">
            {log.stack_trace && (
              <div>
                <span className="font-medium">Stack Trace:</span>
                <pre className="mt-1 p-2 bg-background-primary rounded text-xs font-mono overflow-x-auto">
                  {log.stack_trace}
                </pre>
              </div>
            )}
            {log.user && (
              <div>
                <span className="font-medium">User:</span> {log.user}
              </div>
            )}
            {log.ip_address && (
              <div>
                <span className="font-medium">IP Address:</span> {log.ip_address}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Filter-Komponente
interface LogFilterProps {
  onFilterChange: (filter: LogFilter) => void;
  filter: LogFilter;
}

const LogFilterComponent: React.FC<LogFilterProps> = ({ onFilterChange, filter }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-background-secondary border border-border-primary rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-text-primary font-medium"
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
          className="mt-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Suche
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Nachrichten durchsuchen..."
                  value={filter.search || ''}
                  onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <BaseSelect
                label="Level"
                value={filter.level || ''}
                onChange={(value) => onFilterChange({ ...filter, level: value })}
                options={[
                  { value: '', label: 'Alle Level' },
                  { value: 'CRITICAL', label: 'CRITICAL' },
                  { value: 'ERROR', label: 'ERROR' },
                  { value: 'WARNING', label: 'WARNING' },
                  { value: 'INFO', label: 'INFO' },
                  { value: 'DEBUG', label: 'DEBUG' }
                ]}
              />
            </div>
            
            <div>
              <BaseSelect
                label="Quelle"
                value={filter.source || ''}
                onChange={(value) => onFilterChange({ ...filter, source: value })}
                options={[
                  { value: '', label: 'Alle Quellen' },
                  { value: 'API', label: 'API' },
                  { value: 'AUTH', label: 'AUTH' },
                  { value: 'SYSTEM', label: 'SYSTEM' },
                  { value: 'EMAIL', label: 'EMAIL' },
                  { value: 'BACKUP', label: 'BACKUP' },
                  { value: 'SECURITY', label: 'SECURITY' },
                  { value: 'CACHE', label: 'CACHE' }
                ]}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <SecondaryButton
              onClick={() => onFilterChange({})}
            >
              Filter zurücksetzen
            </SecondaryButton>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Haupt-Log-Komponenten
interface ActivityLogsProps {
  logs: ActivityLog[];
  filter: LogFilter;
  onFilterChange: (filter: LogFilter) => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs, filter, onFilterChange }) => {
  const filteredLogs = logs.filter(log => {
    if (filter.search && !log.details.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.user && !log.user.toLowerCase().includes(filter.user.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Letzte Aktivitäten ({filteredLogs.length})
        </h3>
        <div className="text-sm text-text-secondary">
          Zeigt die letzten Benutzer-Aktivitäten
        </div>
      </div>
      
      <LogFilterComponent onFilterChange={onFilterChange} filter={filter} />
      
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <ActivityLogItem key={log.id} log={log} />
        ))}
      </div>
      
      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          Keine Aktivitäten gefunden
        </div>
      )}
    </div>
  );
};

interface ErrorLogsProps {
  logs: ErrorLog[];
  filter: LogFilter;
  onFilterChange: (filter: LogFilter) => void;
}

export const ErrorLogs: React.FC<ErrorLogsProps> = ({ logs, filter, onFilterChange }) => {
  const filteredLogs = logs.filter(log => {
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.level && log.level !== filter.level) {
      return false;
    }
    if (filter.source && log.source !== filter.source) {
      return false;
    }
    if (filter.user && (!log.user || !log.user.toLowerCase().includes(filter.user.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Fehler-Logs ({filteredLogs.length})
        </h3>
        <div className="text-sm text-text-secondary">
          System- und API-Fehler
        </div>
      </div>
      
      <LogFilterComponent onFilterChange={onFilterChange} filter={filter} />
      
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <ErrorLogItem key={log.id} log={log} />
        ))}
      </div>
      
      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          Keine Fehler-Logs gefunden
        </div>
      )}
    </div>
  );
};

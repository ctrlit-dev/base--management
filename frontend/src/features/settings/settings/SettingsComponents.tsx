/**
 * Settings Form Components
 * ========================
 * 
 * Optimierte wiederverwendbare Komponenten für Settings-Formulare.
 * DRY-Prinzip: Verwendet zentrale Form-Komponenten für Konsistenz.
 * 
 * Optimierungen:
 * - Verwendet zentrale Form-Komponenten
 * - React.memo für Performance
 * - useCallback für stabile Referenzen
 * - Konsistente Error-Behandlung
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BaseSelect } from '../../../components/forms/FormComponents';
import type { SystemSettings, SettingsValidationErrors, SettingsFormField } from '../../types/settings';

interface SettingsFormFieldProps {
  field: SettingsFormField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}

const SettingsFormFieldComponent: React.FC<SettingsFormFieldProps> = React.memo(({
  field,
  value,
  error,
  onChange
}) => {
  const renderInput = useCallback(() => {
    const commonProps = {
      label: field.label,
      error: error,
      helperText: field.helperText,
      required: field.required,
      className: "w-full"
    };

    switch (field.type) {
      case 'boolean':
        return (
          <div className="py-8 bg-background-secondary/10 rounded-lg px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-6">
                <label className="text-lg font-semibold text-text-primary block mb-3 flex items-center">
                  {field.icon && (
                    <field.icon className="w-6 h-6 mr-3 text-accent-blue flex-shrink-0" />
                  )}
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.helperText && (
                  <p className="text-sm text-text-secondary leading-relaxed">{field.helperText}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange(!value)}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none flex-shrink-0
                  ${value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                  ${error ? 'ring-2 ring-red-500' : ''}
                `}
              >
                <span className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm
                  ${value ? 'translate-x-7' : 'translate-x-1'}
                `}></span>
              </button>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="py-8 bg-background-secondary/10 rounded-lg px-6">
            <BaseSelect
              {...commonProps}
              value={value}
              onChange={(newValue: string) => onChange(newValue)}
              options={field.options?.map(option => ({
                value: option.value,
                label: option.label
              })) || []}
            />
          </div>
        );

      case 'json':
        return (
          <div className="py-8 bg-background-secondary/10 rounded-lg px-6">
            <label className="block text-lg font-semibold text-text-primary mb-4 flex items-center">
              {field.icon && (
                <field.icon className="w-6 h-6 mr-3 text-accent-blue flex-shrink-0" />
              )}
              {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange(parsed);
                } catch {
                  onChange(e.target.value);
                }
              }}
              placeholder={field.placeholder || "{}"}
              rows={8}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent bg-background-primary text-text-primary font-mono text-sm ${
                error ? 'border-red-500' : 'border-border-primary'
              }`}
            />
            {field.helperText && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">{field.helperText}</p>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="py-8 bg-background-secondary/10 rounded-lg px-6">
            <label className="block text-lg font-semibold text-text-primary mb-4 flex items-center">
              {field.icon && (
                <field.icon className="w-6 h-6 mr-3 text-accent-blue flex-shrink-0" />
              )}
              {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent bg-background-primary text-text-primary ${
                error ? 'border-red-500' : 'border-border-primary'
              }`}
            />
            {field.helperText && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">{field.helperText}</p>
            )}
          </div>
        );

      case 'url':
        return (
          <div className="py-8 bg-background-secondary/10 rounded-lg px-6">
            <label className="block text-lg font-semibold text-text-primary mb-4 flex items-center">
              {field.icon && (
                <field.icon className="w-6 h-6 mr-3 text-accent-blue flex-shrink-0" />
              )}
              {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent bg-background-primary text-text-primary ${
                error ? 'border-red-500' : 'border-border-primary'
              }`}
            />
            {field.helperText && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">{field.helperText}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="py-8 bg-background-secondary/10 rounded-lg px-6">
            <label className="block text-lg font-semibold text-text-primary mb-4 flex items-center">
              {field.icon && (
                <field.icon className="w-6 h-6 mr-3 text-accent-blue flex-shrink-0" />
              )}
              {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent bg-background-primary text-text-primary ${
                error ? 'border-red-500' : 'border-border-primary'
              }`}
            />
            {field.helperText && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">{field.helperText}</p>
            )}
          </div>
        );
    }
  }, [field, value, error, onChange]);

  return (
    <>
      {renderInput()}
    </>
  );
});

interface SettingsSectionProps {
  title: string;
  icon?: React.ComponentType<any>;
  fields: SettingsFormField[];
  settings: SystemSettings;
  errors: SettingsValidationErrors;
  onFieldChange: (field: keyof SystemSettings, value: any) => void;
  description?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = React.memo(({
  title,
  icon,
  fields,
  settings,
  errors,
  onFieldChange,
  description
}) => {
  const handleFieldChange = useCallback((field: keyof SystemSettings, value: any) => {
    onFieldChange(field, value);
  }, [onFieldChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-16"
    >
      {/* Sektions-Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          {icon && React.createElement(icon, { className: "w-8 h-8 mr-4 text-accent-blue flex-shrink-0" })}
          <h3 className="text-3xl font-bold text-text-primary">{title}</h3>
        </div>
        <div className="w-24 h-1 bg-gradient-to-r from-accent-blue to-accent-violet rounded-full mb-6"></div>
        <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
          {description || `Konfigurieren Sie die Einstellungen für ${title.toLowerCase()}. Alle Änderungen werden automatisch gespeichert.`}
        </p>
      </div>
      
      {/* Felder-Container */}
      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.key} className="w-full">
            <SettingsFormFieldComponent
              field={field}
              value={settings[field.key as keyof SystemSettings]}
              error={errors[field.key as keyof SettingsValidationErrors]}
              onChange={(value) => handleFieldChange(field.key as keyof SystemSettings, value)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
});

interface SettingsHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  onSave: () => void;
  onBack: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  successMessage?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = React.memo(({
  title,
  subtitle,
  onSave,
  onBack,
  isSaving = false,
  hasChanges = false
}) => {
  const handleSave = useCallback(() => {
    onSave();
  }, [onSave]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="p-2 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: hasChanges ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className={`
          px-6 py-2 rounded-lg font-medium transition-all duration-200
          ${hasChanges && !isSaving
            ? 'bg-accent-blue text-white hover:bg-accent-blue-dark shadow-lg'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Speichern...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <CheckIcon className="w-4 h-4" />
            <span>Speichern</span>
          </div>
        )}
      </motion.button>
    </div>
  );
});

interface MaintenanceModeAlertProps {
  settings: SystemSettings;
}

export const MaintenanceModeAlert: React.FC<MaintenanceModeAlertProps> = React.memo(({
  settings
}) => {
  const isMaintenanceMode = settings.maintenance_mode;
  const maintenanceMessage = settings.maintenance_message;
  if (!isMaintenanceMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Wartungsmodus aktiv
          </h3>
          {maintenanceMessage && (
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {maintenanceMessage}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

interface SystemStatusProps {
  settings: SystemSettings;
}

export const SystemStatus: React.FC<SystemStatusProps> = React.memo(({
  settings
}) => {
  const status = settings.maintenance_mode ? 'maintenance' : 'online';
  const lastUpdate = new Date().toLocaleString('de-DE');
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-600 dark:text-green-400';
      case 'maintenance':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'maintenance':
        return 'Wartung';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
      }`}></div>
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {lastUpdate && (
        <span className="text-text-secondary">
          • Letzte Aktualisierung: {lastUpdate}
        </span>
      )}
    </div>
  );
});

export default SettingsFormFieldComponent;
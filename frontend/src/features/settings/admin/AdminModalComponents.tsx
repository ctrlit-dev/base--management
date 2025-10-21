/**
 * Zentrale Modal-Komponenten für Admin-Bereich
 * ============================================
 * 
 * DRY-Prinzip: Wiederverwendbare Modal-Komponenten für alle Admin-Modals
 * um Duplikation zu vermeiden und Konsistenz zu gewährleisten.
 * 
 * Design und Funktionalität bleiben unverändert!
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Modal-Backdrop - zentrale Komponente für alle Admin-Modals
export const AdminModalBackdrop: React.FC<{ 
  children: React.ReactNode; 
  onClose: () => void;
  maxWidth?: string;
}> = ({ children, onClose, maxWidth = "max-w-md" }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-card border border-card-secondary rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// Modal-Header - zentrale Komponente für alle Admin-Modals
export const AdminModalHeader: React.FC<{ 
  title: string; 
  onClose: () => void;
}> = ({ title, onClose }) => (
  <div className="flex items-center justify-between p-6 border-b border-card-secondary">
    <h2 className="text-xl font-semibold text-primary">{title}</h2>
    <button
      onClick={onClose}
      className="text-secondary hover:text-primary transition-colors"
    >
      <XMarkIcon className="w-6 h-6" />
    </button>
  </div>
);

// Modal-Footer - zentrale Komponente für alle Admin-Modals
export const AdminModalFooter: React.FC<{ 
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="flex items-center justify-end space-x-3 p-6 border-t border-card-secondary">
    {children}
  </div>
);

// Form-Field-Komponente - zentrale Komponente für alle Admin-Formulare
export const AdminFormField: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, type = 'text', value, onChange, error, required, placeholder, disabled }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-primary">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 bg-card border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary placeholder:text-tertiary ${
        error ? 'border-red-300 dark:border-red-600' : 'border-card-secondary'
      } ${disabled ? 'bg-card-tertiary' : ''}`}
    />
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

// Select-Field-Komponente - zentrale Komponente für alle Admin-Formulare
export const AdminSelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  error?: string;
  required?: boolean;
}> = ({ label, value, onChange, options, error, required }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-primary">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 bg-card border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary ${
        error ? 'border-red-300 dark:border-red-600' : 'border-card-secondary'
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

// Checkbox-Field-Komponente - zentrale Komponente für alle Admin-Formulare
export const AdminCheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}> = ({ label, checked, onChange, description }) => (
  <div className="flex items-start space-x-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-4 h-4 text-blue-600 border-card-secondary rounded focus:ring-blue-500 bg-card"
    />
    <div>
      <label className="text-sm font-medium text-primary">{label}</label>
      {description && <p className="text-xs text-secondary">{description}</p>}
    </div>
  </div>
);

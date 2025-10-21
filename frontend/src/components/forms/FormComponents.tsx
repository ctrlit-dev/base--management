/**
 * Form Components
 * ===============
 * 
 * Wiederverwendbare Form-Komponenten für konsistente UI.
 * Bietet abstrahierte Form-Patterns für verschiedene Use Cases.
 */

import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../common/LoadingUI';

// Base Input Component
interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  ({
    label,
    error,
    success = false,
    loading = false,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'filled':
          return 'bg-gray-100 dark:bg-gray-700 border-0 rounded-lg';
        case 'outlined':
          return 'bg-transparent border-2 rounded-lg';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md';
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1.5 text-sm';
        case 'lg':
          return 'px-4 py-3 text-lg';
        default:
          return 'px-3 py-2 text-base';
      }
    };

    const getStateClasses = () => {
      if (error) {
        return 'border-red-500 focus:border-red-500 focus:ring-red-500';
      }
      if (success) {
        return 'border-green-500 focus:border-green-500 focus:ring-green-500';
      }
      return 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';
    };

    const inputClasses = `
      w-full
      ${getVariantClasses()}
      ${getSizeClasses()}
      ${getStateClasses()}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon || loading ? 'pr-10' : ''}
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500/50
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
      ${className}
    `.trim();

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{leftIcon}</div>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <input
              ref={ref}
              className={inputClasses}
              {...props}
            />
          </motion.div>
          
          {(rightIcon || loading) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-1"
            >
              {error ? (
                <>
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{helperText}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

BaseInput.displayName = 'BaseInput';

// Password Input Component
interface PasswordInputProps extends Omit<BaseInputProps, 'type' | 'rightIcon'> {
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPassword = false, onTogglePassword, ...props }, ref) => {
    return (
      <BaseInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// Select Component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BaseSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const BaseSelect: React.FC<BaseSelectProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  disabled = false,
  placeholder = 'Bitte wählen...',
  className = '',
}) => {
  const selectClasses = `
    w-full
    px-3 py-2
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    rounded-md
    text-gray-900 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
    focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectClasses}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      <AnimatePresence>
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-1"
          >
            {error ? (
              <>
                <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{helperText}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Checkbox Component
interface BaseCheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export const BaseCheckbox: React.FC<BaseCheckboxProps> = ({
  label,
  checked,
  onChange,
  error,
  helperText,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
        />
        {label && (
          <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            {label}
          </label>
        )}
      </div>
      
      <AnimatePresence>
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-1"
          >
            {error ? (
              <>
                <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{helperText}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    helperText,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'filled':
          return 'bg-gray-100 dark:bg-gray-700 border-0 rounded-lg';
        case 'outlined':
          return 'bg-transparent border-2 rounded-lg';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md';
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1.5 text-sm';
        case 'lg':
          return 'px-4 py-3 text-lg';
        default:
          return 'px-3 py-2 text-base';
      }
    };

    const getStateClasses = () => {
      if (error) {
        return 'border-red-500 focus:border-red-500 focus:ring-red-500';
      }
      return 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';
    };

    const textareaClasses = `
      w-full
      ${getVariantClasses()}
      ${getSizeClasses()}
      ${getStateClasses()}
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500/50
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
      resize-vertical
      ${className}
    `.trim();

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={textareaClasses}
          {...props}
        />
        
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-1"
            >
              {error ? (
                <>
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{helperText}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

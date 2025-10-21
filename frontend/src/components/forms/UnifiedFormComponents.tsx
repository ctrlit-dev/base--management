/**
 * LCREE Unified Form Components
 * =============================
 * 
 * Zentrale Form-Komponenten für konsistente UI.
 * Konsolidiert alle Input-Varianten in einem System.
 */

import React, { forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../common/LoadingUI';

// Typen für einheitliche Form-Komponenten
export type FormVariant = 'default' | 'filled' | 'outlined';
export type FormSize = 'sm' | 'md' | 'lg';
export type FormState = 'default' | 'error' | 'success' | 'loading';

// Basis-Props für alle Form-Elemente
interface BaseFormProps {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  helperText?: string;
  variant?: FormVariant;
  size?: FormSize;
  state?: FormState;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

// Styling-Utilities (DRY-Prinzip)
const getVariantClasses = (variant: FormVariant): string => {
  const variants = {
    filled: 'bg-gray-100 dark:bg-gray-700 border-0 rounded-lg',
    outlined: 'bg-transparent border-2 rounded-lg',
    default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md'
  };
  return variants[variant];
};

const getSizeClasses = (size: FormSize): string => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };
  return sizes[size];
};

const getStateClasses = (state: FormState): string => {
  const states = {
    default: 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
    loading: 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
  };
  return states[state];
};

// Error/Success Message Component (DRY)
const FormMessage: React.FC<{ error?: string; helperText?: string; success?: boolean }> = ({ 
  error, 
  helperText, 
  success 
}) => {
  if (!error && !helperText) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center space-x-1"
      >
        {error ? (
          <>
            <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </>
        ) : success ? (
          <>
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">{helperText}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">{helperText}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Label Component (DRY)
const FormLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    {label} {required && <span className="text-red-500">*</span>}
  </label>
);

// Input Component
interface InputProps extends BaseFormProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animated?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success = false,
  loading = false,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  state = 'default',
  fullWidth = true,
  animated = true,
  className = '',
  required = false,
  ...props
}, ref) => {
  const inputState = error ? 'error' : success ? 'success' : loading ? 'loading' : state;
  
  const inputClasses = useMemo(() => `
    w-full
    ${getVariantClasses(variant)}
    ${getSizeClasses(size)}
    ${getStateClasses(inputState)}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || loading ? 'pr-10' : ''}
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${className}
  `.trim(), [variant, size, inputState, leftIcon, rightIcon, loading, className]);

  const inputElement = (
    <input
      ref={ref}
      className={inputClasses}
      {...props}
    />
  );

  return (
    <div className="space-y-1">
      {label && <FormLabel label={label} required={required} />}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{leftIcon}</div>
          </div>
        )}
        
        {animated ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {inputElement}
          </motion.div>
        ) : (
          inputElement
        )}
        
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
      
      <FormMessage error={error} helperText={helperText} success={success} />
    </div>
  );
});

Input.displayName = 'Input';

// Password Input
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({
  showPasswordToggle = true,
  showPassword = false,
  onTogglePassword,
  ...props
}, ref) => {
  const rightIcon = showPasswordToggle ? (
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
  ) : undefined;

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={rightIcon}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// Select Component
interface SelectProps extends BaseFormProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = React.memo(({
  label,
  error,
  success = false,
  loading = false,
  helperText,
  variant = 'default',
  size = 'md',
  state = 'default',
  className = '',
  value,
  onChange,
  options,
  placeholder,
  required = false
}) => {
  const selectState = error ? 'error' : success ? 'success' : loading ? 'loading' : state;
  
  const selectClasses = `
    w-full
    ${getVariantClasses(variant)}
    ${getSizeClasses(size)}
    ${getStateClasses(selectState)}
    text-gray-900 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {label && <FormLabel label={label} required={required} />}
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClasses}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
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
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      
      <FormMessage error={error} helperText={helperText} success={success} />
    </div>
  );
});

Select.displayName = 'Select';

// Textarea Component
interface TextareaProps extends BaseFormProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  success = false,
  helperText,
  variant = 'default',
  size = 'md',
  state = 'default',
  resize = 'vertical',
  className = '',
  required = false,
  ...props
}, ref) => {
  const textareaState = error ? 'error' : success ? 'success' : state;
  
  const textareaClasses = `
    w-full
    ${getVariantClasses(variant)}
    ${getSizeClasses(size)}
    ${getStateClasses(textareaState)}
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    resize-${resize}
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {label && <FormLabel label={label} required={required} />}
      
      <textarea
        ref={ref}
        className={textareaClasses}
        {...props}
      />
      
      <FormMessage error={error} helperText={helperText} success={success} />
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Checkbox Component
interface CheckboxProps extends BaseFormProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  variant?: 'default' | 'toggle';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  success = false,
  helperText,
  variant = 'default',
  size = 'md',
  state = 'default',
  className = '',
  required = false,
  ...props
}, ref) => {
  const checkboxState = error ? 'error' : success ? 'success' : state;
  
  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    return sizes[size];
  };

  const getStateClasses = () => {
    const states = {
      default: 'text-blue-500 focus:ring-blue-500',
      error: 'text-red-500 focus:ring-red-500',
      success: 'text-green-500 focus:ring-green-500',
      loading: 'text-blue-500 focus:ring-blue-500'
    };
    return states[checkboxState];
  };

  if (variant === 'toggle') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            {label && <FormLabel label={label} required={required} />}
            {helperText && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => props.onChange?.({ target: { checked: !props.checked } } as any)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
              ${props.checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
              ${error ? 'ring-2 ring-red-500' : ''}
              ${success ? 'ring-2 ring-green-500' : ''}
              ${className}
            `}
          >
            <span className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
              ${props.checked ? 'translate-x-6' : 'translate-x-1'}
            `}></span>
          </button>
        </div>
        
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <ExclamationCircleIcon className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-3">
        <input
          ref={ref}
          type="checkbox"
          className={`
            ${getSizeClasses()}
            ${getStateClasses()}
            border-gray-300 dark:border-gray-600
            rounded focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${className}
          `}
          {...props}
        />
        
        {label && <FormLabel label={label} required={required} />}
      </div>
      
      <FormMessage error={error} helperText={helperText} success={success} />
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Spezialisierte Input-Komponenten
export const TextInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="text" {...props} />
));

export const EmailInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="email" {...props} />
));

export const NumberInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="number" {...props} />
));

export const SearchInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="search" {...props} />
));

export const UrlInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="url" {...props} />
));

export const TelInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="tel" {...props} />
));

export const DateInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="date" {...props} />
));

export const TimeInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="time" {...props} />
));

export const FileInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="file" {...props} />
));

// Form Layout Components
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {children}
  </div>
);

interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({
  children,
  columns = 2,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

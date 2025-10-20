import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface FloatingLabelProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  className?: string;
}

export function FloatingLabel({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  icon,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  className = ''
}: FloatingLabelProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = isFocused || value.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            {icon}
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-3 pt-6 pb-2 rounded-xl border-2 transition-all duration-200
            bg-background-primary text-text-primary placeholder-transparent
            ${icon ? 'pl-10' : 'pl-3'}
            ${showPasswordToggle ? 'pr-10' : 'pr-3'}
            ${error 
              ? 'border-error focus:border-error focus:ring-error/20' 
              : isFocused 
                ? 'border-accent-blue focus:border-accent-blue focus:ring-accent-blue/20' 
                : 'border-border-primary focus:border-accent-blue focus:ring-accent-blue/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-blue/50'}
          `}
          placeholder={placeholder}
          disabled={disabled}
        />

        {/* Floating Label */}
        <motion.label
          htmlFor={id}
          className={`
            absolute left-3 transition-all duration-200 pointer-events-none
            ${isActive 
              ? 'top-1 text-xs font-medium text-accent-blue' 
              : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary'
            }
            ${icon ? 'left-10' : 'left-3'}
          `}
          animate={{
            y: isActive ? -8 : 0,
            scale: isActive ? 0.85 : 1,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {label}
        </motion.label>

        {/* Success Icon */}
        <AnimatePresence>
          {value && !error && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <CheckCircleIcon className="h-5 w-5 text-success" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password Toggle */}
        {showPasswordToggle && (
          <motion.button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={disabled}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
            ) : (
              <EyeIcon className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
            )}
          </motion.button>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center"
          >
            <ExclamationTriangleIcon className="w-4 h-4 text-error mr-1" />
            <span className="text-error text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

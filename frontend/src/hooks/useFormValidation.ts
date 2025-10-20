/**
 * Form Validation Hook
 * ====================
 * 
 * Optimierter Custom Hook für Form-Validierung mit Debouncing.
 * Bietet typsichere Validierung für React-Formulare.
 * 
 * Optimierungen:
 * - Debounced Validation für bessere Performance
 * - Memoized Validation Functions
 * - Field-specific Error Clearing
 * - Async Validation Support
 */

import { useState, useCallback, useRef, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateDelay?: number;
  debounceValidation?: boolean;
}

export const useFormValidation = (
  rules: ValidationRules,
  options: UseFormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateDelay = 300,
    debounceValidation = true
  } = options;

  const [errors, setErrors] = useState<ValidationErrors>({});
  const validationTimeoutRef = useRef<number | undefined>(undefined);

  // Memoized validation function
  const validateField = useCallback((fieldName: string, value: any): string | undefined => {
    const rule = rules[fieldName];
    if (!rule) return undefined;

    // Required validation
    if (rule.required && (!value || value === '')) {
      return rule.message || `${fieldName} ist erforderlich`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value === '') return undefined;

    // Min length validation
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return rule.message || `${fieldName} muss mindestens ${rule.minLength} Zeichen lang sein`;
    }

    // Max length validation
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return rule.message || `${fieldName} darf höchstens ${rule.maxLength} Zeichen lang sein`;
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message || `${fieldName} hat ein ungültiges Format`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return undefined;
  }, [rules]);

  // Debounced validation
  const debouncedValidateField = useCallback((fieldName: string, value: any) => {
    if (!debounceValidation) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = window.setTimeout(() => {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }, validateDelay);
  }, [validateField, validateDelay, debounceValidation]);

  // Validate entire form
  const validateForm = useCallback((formData: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  // Clear specific field error
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: undefined
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Validate field with debouncing
  const validateFieldDebounced = useCallback((fieldName: string, value: any) => {
    if (validateOnChange) {
      debouncedValidateField(fieldName, value);
    }
  }, [validateOnChange, debouncedValidateField]);

  // Memoized computed values
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => error === undefined);
  }, [errors]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error !== undefined);
  }, [errors]);

  const errorCount = useMemo(() => {
    return Object.values(errors).filter(error => error !== undefined).length;
  }, [errors]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
  }, []);

  return {
    errors,
    isValid,
    hasErrors,
    errorCount,
    validateField,
    validateFieldDebounced,
    validateForm,
    clearError,
    clearErrors,
    cleanup
  };
};

// Common validation rules for forms
export const commonValidationRules: ValidationRules = {
  firstName: {
    required: true,
    minLength: 2,
    message: 'Vorname muss mindestens 2 Zeichen lang sein'
  },
  lastName: {
    required: true,
    minLength: 2,
    message: 'Nachname muss mindestens 2 Zeichen lang sein'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Passwort muss mindestens 8 Zeichen lang sein'
  },
  confirmPassword: {
    required: true,
    message: 'Passwort-Bestätigung ist erforderlich'
  },
  company_name: {
    required: true,
    minLength: 2,
    message: 'Firmenname muss mindestens 2 Zeichen lang sein'
  },
  currency: {
    required: true,
    custom: (value: string) => {
      const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];
      return !validCurrencies.includes(value) ? 'Ungültige Währung' : undefined;
    }
  },
  qr_base_url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'QR-Code Basis-URL muss mit http:// oder https:// beginnen'
  },
  print_agent_url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'Print-Agent URL muss mit http:// oder https:// beginnen'
  },
  password_reset_token_expiry_hours: {
    required: true,
    custom: (value: number) => {
      if (value < 1 || value > 168) {
        return 'Token-Gültigkeit muss zwischen 1 und 168 Stunden liegen';
      }
      return undefined;
    }
  },
  default_loss_factor_oil_percent: {
    required: true,
    custom: (value: number) => {
      if (value < 0 || value > 100) {
        return 'Verlustfaktor muss zwischen 0 und 100% liegen';
      }
      return undefined;
    }
  }
};
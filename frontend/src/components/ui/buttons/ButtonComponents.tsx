/**
 * LCREE Unified Button Components
 * ===============================
 * 
 * Zentrale Button-Komponenten für konsistente UI.
 * Eliminiert wiederholte Button-Styles und bietet einheitliche API.
 */

import React, { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../../common/LoadingUI';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonState = 'default' | 'loading' | 'success' | 'error';

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animated?: boolean;
}

// Styling-Utilities (DRY-Prinzip)
const getVariantClasses = (variant: ButtonVariant): string => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    outline: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
  };
  return variants[variant];
};

const getSizeClasses = (size: ButtonSize): string => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  return sizes[size];
};

const getStateClasses = (state: ButtonState): string => {
  const states = {
    default: '',
    loading: 'opacity-75 cursor-not-allowed',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white'
  };
  return states[state];
};

// Button Content Component (DRY)
const ButtonContent: React.FC<{
  loading: boolean;
  state: ButtonState;
  loadingText: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ loading, state, loadingText, leftIcon, rightIcon, children }) => {
  if (loading || state === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" color="white" />
        <span>{loadingText}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </div>
  );
};

export const Button = forwardRef<HTMLButtonElement, BaseButtonProps>(({
  variant = 'primary',
  size = 'md',
  state = 'default',
  loading = false,
  loadingText = 'Lädt...',
  leftIcon,
  rightIcon,
  fullWidth = false,
  animated = true,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || loading || state === 'loading';

  const buttonClasses = useMemo(() => `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getVariantClasses(variant)}
    ${getSizeClasses(size)}
    ${getStateClasses(state)}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim(), [variant, size, state, fullWidth, className]);

  const buttonContent = (
    <ButtonContent
      loading={loading}
      state={state}
      loadingText={loadingText}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
    >
      {children}
    </ButtonContent>
  );

  if (animated) {
    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        transition={{ duration: 0.2 }}
        {...(props as any)}
      >
        {buttonContent}
      </motion.button>
    );
  }

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
});

Button.displayName = 'Button';

// Spezialisierte Button-Komponenten
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));

export const DangerButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="danger" {...props} />
));

export const SuccessButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="success" {...props} />
));

export const GhostButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="ghost" {...props} />
));

export const OutlineButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="outline" {...props} />
));

export const WarningButton = forwardRef<HTMLButtonElement, Omit<BaseButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="warning" {...props} />
));

// Icon Button
interface IconButtonProps extends Omit<BaseButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  return (
    <Button
      ref={ref}
      size={size}
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// Button Group
interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  className = ''
}) => {
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
    lg: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4'
  };

  return (
    <div className={`flex ${orientationClasses[orientation]} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

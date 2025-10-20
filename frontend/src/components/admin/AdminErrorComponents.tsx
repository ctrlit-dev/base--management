/**
 * Zentrale Error-Handling-Komponenten für Admin-Bereich
 * ====================================================
 * 
 * DRY-Prinzip: Wiederverwendbare Error-Handling-Komponenten für alle Admin-Komponenten
 * um Duplikation zu vermeiden und Konsistenz zu gewährleisten.
 * 
 * Design und Funktionalität bleiben unverändert!
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

export interface ErrorAlertProps {
  type?: ErrorType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

// Zentrale Error-Alert-Komponente für alle Admin-Komponenten
export const AdminErrorAlert: React.FC<ErrorAlertProps> = ({
  type = 'error',
  title,
  message,
  onClose,
  className = ''
}) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300',
          iconComponent: ExclamationTriangleIcon
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300',
          iconComponent: ExclamationTriangleIcon
        };
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300',
          iconComponent: InformationCircleIcon
        };
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-200',
          message: 'text-green-700 dark:text-green-300',
          iconComponent: CheckCircleIcon
        };
      default:
        return {
          container: 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-800 dark:text-gray-200',
          message: 'text-gray-700 dark:text-gray-300',
          iconComponent: InformationCircleIcon
        };
    }
  };

  const styles = getAlertStyles();
  const IconComponent = styles.iconComponent;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 ${styles.container} ${className}`}
    >
      <div className="flex items-center">
        <IconComponent className={`w-5 h-5 mr-3 ${styles.icon}`} />
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title} mb-1`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${styles.message}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-auto ${styles.icon} hover:opacity-75 transition-opacity`}
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Zentrale Loading-Komponente für alle Admin-Komponenten
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const AdminLoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          spinner: 'w-4 h-4',
          text: 'text-sm'
        };
      case 'lg':
        return {
          spinner: 'w-8 h-8',
          text: 'text-lg'
        };
      default: // md
        return {
          spinner: 'w-6 h-6',
          text: 'text-base'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeStyles.spinner} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
      {text && (
        <span className={`ml-3 text-secondary ${sizeStyles.text}`}>
          {text}
        </span>
      )}
    </div>
  );
};

// Zentrale Empty-State-Komponente für alle Admin-Komponenten
export interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const AdminEmptyState: React.FC<EmptyStateProps> = ({
  icon: IconComponent,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {IconComponent && (
        <IconComponent className="w-16 h-16 text-secondary mx-auto mb-4" />
      )}
      <h3 className="text-lg font-medium text-primary mb-2">
        {title}
      </h3>
      <p className="text-secondary mb-6">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

// Zentrale Error-Boundary-Komponente für alle Admin-Komponenten
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AdminErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error; resetError: () => void }> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error; resetError: () => void }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <AdminErrorAlert
          type="error"
          title="Ein Fehler ist aufgetreten"
          message={this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
          onClose={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

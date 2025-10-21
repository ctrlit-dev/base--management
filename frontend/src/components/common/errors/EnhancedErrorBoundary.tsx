/**
 * Enhanced Error Boundary
 * =======================
 * 
 * Verbesserter Error Boundary mit besseren Recovery-Optionen.
 * Bietet benutzerfreundliche Fehlerbehandlung mit Retry-Funktionalität.
 * 
 * Optimierungen:
 * - Retry-Funktionalität
 * - Error Reporting
 * - Fallback UI
 * - Performance Monitoring
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { PrimaryButton, SecondaryButton } from '../../ui/buttons/ButtonComponents';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  showRetryButton?: boolean;
  className?: string;
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report error to external service
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Retry after delay
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }, retryDelay);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    const { 
      hasError, 
      error, 
      errorInfo, 
      retryCount 
    } = this.state;
    
    const { 
      children, 
      fallback, 
      maxRetries = 3, 
      showRetryButton = true,
      className = ''
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className={`min-h-screen bg-background-primary flex items-center justify-center p-4 ${className}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-background-secondary rounded-xl border border-border-primary p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <XCircleIcon className="w-16 h-16 text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Etwas ist schiefgelaufen
            </h2>
            
            <p className="text-text-secondary mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>

            {import.meta.env.DEV && error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                  Fehlerdetails anzeigen
                </summary>
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">
                    {error.message}
                    {errorInfo?.componentStack && `\n\nComponent Stack:\n${errorInfo.componentStack}`}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showRetryButton && retryCount < maxRetries && (
                <PrimaryButton
                  onClick={this.handleRetry}
                  leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                >
                  Erneut versuchen ({retryCount + 1}/{maxRetries})
                </PrimaryButton>
              )}
              
              <SecondaryButton
                onClick={this.handleReset}
                leftIcon={<InformationCircleIcon className="w-4 h-4" />}
              >
                Zurücksetzen
              </SecondaryButton>
            </div>

            {retryCount >= maxRetries && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Maximale Anzahl von Wiederholungsversuchen erreicht.
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return children;
  }
}

// Convenience wrapper for common use cases
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for programmatic error handling
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // You can add additional error reporting logic here
    // e.g., send to error tracking service
  };

  return { handleError };
};

export default EnhancedErrorBoundary;

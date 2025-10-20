/**
 * Modal Components
 * ================
 * 
 * Wiederverwendbare Modal-Komponenten für verschiedene Use Cases.
 * Bietet konsistente Modal-Patterns mit Accessibility-Features.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../LoadingUI';
import { SecondaryButton, DangerButton, SuccessButton, PrimaryButton } from '../buttons/ButtonComponents';

// Modal Types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalType = 'default' | 'success' | 'warning' | 'error' | 'info';

// Base Modal Props
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

// Modal Overlay
const ModalOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
}> = ({ isOpen, onClose, closeOnOverlayClick = true }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      )}
    </AnimatePresence>
  );
};

// Base Modal Component
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-lg';
    }
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ModalOverlay
            isOpen={isOpen}
            onClose={onClose}
            closeOnOverlayClick={closeOnOverlayClick}
          />
          
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`
              relative bg-white dark:bg-gray-800 rounded-lg shadow-xl
              w-full ${getSizeClasses()}
              max-h-[90vh] overflow-y-auto
              ${className}
            `}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                aria-label="Modal schließen"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
            
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Portal to body
  return createPortal(modalContent, document.body);
};

// Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  type = 'default',
  loading = false,
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-gray-500" />;
    }
  };


  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {message}
            </p>
            
            <div className="flex justify-end space-x-3">
              <SecondaryButton
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </SecondaryButton>
              
              {type === 'success' ? (
                <SuccessButton
                  onClick={onConfirm}
                  disabled={loading}
                  loading={loading}
                  loadingText="Lädt..."
                >
                  {confirmText}
                </SuccessButton>
              ) : type === 'error' ? (
                <DangerButton
                  onClick={onConfirm}
                  disabled={loading}
                  loading={loading}
                  loadingText="Lädt..."
                >
                  {confirmText}
                </DangerButton>
              ) : (
                <PrimaryButton
                  onClick={onConfirm}
                  disabled={loading}
                  loading={loading}
                  loadingText="Lädt..."
                >
                  {confirmText}
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// Form Modal
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  size?: ModalSize;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Speichern',
  cancelText = 'Abbrechen',
  loading = false,
  size = 'md',
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size={size}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <div className="p-6">
          {children}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-3">
          <SecondaryButton
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </SecondaryButton>
          
          <PrimaryButton
            type="submit"
            disabled={loading}
            loading={loading}
            loadingText="Lädt..."
          >
            {submitText}
          </PrimaryButton>
        </div>
      </form>
    </BaseModal>
  );
};

// Info Modal
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: ModalType;
  size?: ModalSize;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  size = 'md',
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size={size}>
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {title}
            </h3>
            
            <div className="text-gray-500 dark:text-gray-400">
              {children}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// Loading Modal
interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title = 'Lädt...',
  message = 'Bitte warten Sie einen Moment.',
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={() => {}} showCloseButton={false} closeOnOverlayClick={false} closeOnEscape={false}>
      <div className="p-6 text-center">
        <LoadingSpinner size="lg" />
        
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>
    </BaseModal>
  );
};

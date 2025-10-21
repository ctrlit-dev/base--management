/**
 * LCREE User Management Modals
 * =============================
 * 
 * Modal-Komponenten für Benutzerverwaltung:
 * - AddUserModal: Neuen Benutzer erstellen
 * - EditUserModal: Benutzer bearbeiten
 * - DeleteUserModal: Benutzer löschen bestätigen
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { UserCreateData, UserUpdateData } from '../../../types/user';
import { User } from '../../../lib/api/auth';
import { ROLE_CONFIG } from '../../../lib/constants/roles';
import { 
  AdminModalBackdrop, 
  AdminModalHeader, 
  AdminModalFooter,
  AdminFormField,
  AdminSelectField,
  AdminCheckboxField
} from './AdminModalComponents';
// import { validateCreateUser, validateUpdateUser } from '../../utils/adminValidation';

// AddUserModal
export const AddUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<boolean>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'GUEST',
    is_active: true,
    language: 'de',
    timezone: 'Europe/Berlin',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      role: 'GUEST',
      is_active: true,
      language: 'de',
      timezone: 'Europe/Berlin',
    });
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const validation = validateCreateUser(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AdminModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <AdminModalHeader title="Neuen Benutzer erstellen" onClose={onClose} />
        
        <div className="p-6 space-y-4">
          <AdminFormField
            label="E-Mail-Adresse"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            error={errors.email}
            required
            placeholder="benutzer@beispiel.de"
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField
              label="Vorname"
              value={formData.first_name}
              onChange={(value) => setFormData({ ...formData, first_name: value })}
              error={errors.first_name}
              required
            />

            <AdminFormField
              label="Nachname"
              value={formData.last_name}
              onChange={(value) => setFormData({ ...formData, last_name: value })}
              error={errors.last_name}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField
              label="Passwort"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              error={errors.password}
              required
            />

            <AdminFormField
              label="Passwort bestätigen"
              type="password"
              value={formData.password_confirm}
              onChange={(value) => setFormData({ ...formData, password_confirm: value })}
              error={errors.password_confirm}
              required
            />
          </div>

          <AdminSelectField
            label="Rolle"
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as any })}
            options={Object.entries(ROLE_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
              description: config.description,
            }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminSelectField
              label="Sprache"
              value={formData.language || 'de'}
              onChange={(value) => setFormData({ ...formData, language: value })}
              options={[
                { value: 'de', label: 'Deutsch' },
                { value: 'en', label: 'English' },
              ]}
            />

            <AdminSelectField
              label="Zeitzone"
              value={formData.timezone || 'Europe/Berlin'}
              onChange={(value) => setFormData({ ...formData, timezone: value })}
              options={[
                { value: 'Europe/Berlin', label: 'Europa/Berlin' },
                { value: 'UTC', label: 'UTC' },
              ]}
            />
          </div>

          <AdminCheckboxField
            label="Benutzer ist aktiv"
            checked={formData.is_active || false}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            description="Inaktive Benutzer können sich nicht anmelden"
          />
        </div>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center space-x-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Erstelle...</span>
              </>
            ) : (
              <>
                <UserPlusIcon className="w-5 h-5" />
                <span>Benutzer erstellen</span>
              </>
            )}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModalBackdrop>
  );
};

// EditUserModal
export const EditUserModal: React.FC<{
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (userId: number, data: UpdateUserData) => Promise<boolean>;
}> = ({ isOpen, user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<UpdateUserData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
        language: user.language,
        timezone: user.timezone,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const validation = validateUpdateUser(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(user.id, formData);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AdminModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <AdminModalHeader title="Benutzer bearbeiten" onClose={onClose} />
        
        <div className="p-6 space-y-4">
          <AdminFormField
            label="E-Mail-Adresse"
            type="email"
            value={formData.email || ''}
            onChange={(value) => setFormData({ ...formData, email: value })}
            error={errors.email}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminFormField
              label="Vorname"
              value={formData.first_name || ''}
              onChange={(value) => setFormData({ ...formData, first_name: value })}
              error={errors.first_name}
              required
            />

            <AdminFormField
              label="Nachname"
              value={formData.last_name || ''}
              onChange={(value) => setFormData({ ...formData, last_name: value })}
              error={errors.last_name}
              required
            />
          </div>

          <AdminSelectField
            label="Rolle"
            value={formData.role || 'GUEST'}
            onChange={(value) => setFormData({ ...formData, role: value as any })}
            options={Object.entries(ROLE_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
              description: config.description,
            }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminSelectField
              label="Sprache"
              value={formData.language || 'de'}
              onChange={(value) => setFormData({ ...formData, language: value })}
              options={[
                { value: 'de', label: 'Deutsch' },
                { value: 'en', label: 'English' },
              ]}
            />

            <AdminSelectField
              label="Zeitzone"
              value={formData.timezone || 'Europe/Berlin'}
              onChange={(value) => setFormData({ ...formData, timezone: value })}
              options={[
                { value: 'Europe/Berlin', label: 'Europa/Berlin' },
                { value: 'UTC', label: 'UTC' },
              ]}
            />
          </div>

          <AdminCheckboxField
            label="Benutzer ist aktiv"
            checked={formData.is_active || false}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            description="Inaktive Benutzer können sich nicht anmelden"
          />
        </div>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center space-x-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Speichere...</span>
              </>
            ) : (
              <>
                <PencilIcon className="w-5 h-5" />
                <span>Änderungen speichern</span>
              </>
            )}
          </button>
        </AdminModalFooter>
      </form>
    </AdminModalBackdrop>
  );
};

// DeleteUserModal
export const DeleteUserModal: React.FC<{
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: (user: User, isHardDelete?: boolean) => Promise<boolean>;
}> = ({ isOpen, user, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setDeleteType('soft');
    setConfirmationText('');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSoftDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    setError(null);
    const success = await onConfirm(user, false);
    setIsDeleting(false);

    if (success) {
      onClose();
    }
  };

  const handleHardDelete = async () => {
    if (!user) return;

    if (confirmationText !== 'LÖSCHEN') {
      setError('Bitte geben Sie "LÖSCHEN" ein, um den Benutzer permanent zu löschen.');
      return;
    }

    setIsDeleting(true);
    setError(null);
    const success = await onConfirm(user, true);
    setIsDeleting(false);

    if (success) {
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AdminModalBackdrop onClose={onClose}>
      <div className="max-w-lg">
        <AdminModalHeader title="Benutzer löschen" onClose={onClose} />
        
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-primary mb-2">
                Benutzer wirklich löschen?
              </h3>
              <p className="text-secondary mb-4">
                Möchten Sie den Benutzer <strong>{user.first_name} {user.last_name}</strong> ({user.email}) wirklich löschen?
              </p>
            </div>
          </div>

          {/* Löschtyp-Auswahl */}
          <div className="space-y-4 mb-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-primary">
                Löschtyp wählen:
              </label>
              
              {/* Soft Delete Option */}
              <div className="flex items-start space-x-3 p-4 border border-card-secondary rounded-lg hover:bg-card-secondary transition-colors">
                <input
                  type="radio"
                  id="soft-delete"
                  name="deleteType"
                  value="soft"
                  checked={deleteType === 'soft'}
                  onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                  className="mt-1 w-4 h-4 text-blue-600 border-card-secondary rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="soft-delete" className="text-sm font-medium text-primary cursor-pointer">
                    Soft-Delete (Empfohlen)
                  </label>
                  <p className="text-xs text-secondary mt-1">
                    Der Benutzer wird deaktiviert und kann später wiederhergestellt werden.
                  </p>
                </div>
              </div>

              {/* Hard Delete Option */}
              <div className="flex items-start space-x-3 p-4 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <input
                  type="radio"
                  id="hard-delete"
                  name="deleteType"
                  value="hard"
                  checked={deleteType === 'hard'}
                  onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                  className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <label htmlFor="hard-delete" className="text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer">
                    Hard-Delete (Permanent)
                  </label>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Der Benutzer wird permanent aus der Datenbank entfernt. Diese Aktion kann nicht rückgängig gemacht werden!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hard Delete Bestätigung */}
          {deleteType === 'hard' && (
            <div className="space-y-3 mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                      ⚠️ ACHTUNG: Hard-Delete ist permanent!
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Alle Daten des Benutzers werden unwiderruflich gelöscht. 
                      Geben Sie <strong>"LÖSCHEN"</strong> ein, um fortzufahren.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Bestätigung eingeben:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="LÖSCHEN"
                  className="w-full px-3 py-2 bg-card border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-primary placeholder:text-tertiary"
                />
                {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
              </div>
            </div>
          )}

          {/* Soft Delete Hinweis */}
          {deleteType === 'soft' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Soft-Delete:</strong> Der Benutzer wird deaktiviert und kann später wiederhergestellt werden.
                    Er kann sich jedoch nicht mehr anmelden.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <AdminModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Abbrechen
          </button>
          
          {deleteType === 'soft' ? (
            <button
              type="button"
              onClick={handleSoftDelete}
              className="btn btn-primary flex items-center space-x-2"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Lösche...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  <span>Soft-Delete</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleHardDelete}
              className="btn btn-danger flex items-center space-x-2"
              disabled={isDeleting || confirmationText !== 'LÖSCHEN'}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Lösche permanent...</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span>Hard-Delete</span>
                </>
              )}
            </button>
          )}
        </AdminModalFooter>
      </div>
    </AdminModalBackdrop>
  );
};

// Validierungsfunktionen
const validateCreateUser = (data: UserCreateData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!data.email) errors.email = 'E-Mail ist erforderlich';
  if (!data.first_name) errors.first_name = 'Vorname ist erforderlich';
  if (!data.last_name) errors.last_name = 'Nachname ist erforderlich';
  if (!data.password) errors.password = 'Passwort ist erforderlich';
  if (data.password !== data.password_confirm) errors.password_confirm = 'Passwörter stimmen nicht überein';
  
  return errors;
};

const validateUpdateUser = (data: UserUpdateData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (data.email && !data.email.includes('@')) errors.email = 'Ungültige E-Mail-Adresse';
  
  return errors;
};

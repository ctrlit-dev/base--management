/**
 * LCREE User Management Component
 * ===============================
 * 
 * Vollständige Benutzerverwaltung mit Liste, Suche, Filtern und CRUD-Operationen.
 * 
 * Features:
 * - Benutzer auflisten mit Rollen-Badges (mit Glow-Effekt)
 * - Suche und Filter nach Rolle, Status, etc.
 * - Benutzer bearbeiten, löschen, hinzufügen
 * - Soft-Delete und Wiederherstellung
 * - Bulk-Operationen
 * - Responsive Design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { userManagementApi } from '../../../lib/api/userManagement';
import type { UserFilters, CreateUserData, UpdateUserData } from '../../../lib/api/userManagement';
import type { User } from '../../../lib/api/auth';
import { AddUserModal, EditUserModal, DeleteUserModal } from './UserManagementModals';
import { ROLE_CONFIG } from '../../../lib/constants/roles';
import { AdminErrorAlert, AdminLoadingSpinner, AdminEmptyState } from './AdminErrorComponents';

// Status-Badges
const StatusBadge: React.FC<{ isActive: boolean; isDeleted?: boolean }> = ({ isActive, isDeleted }) => {
  if (isDeleted) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Gelöscht
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? (
        <>
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Aktiv
        </>
      ) : (
        <>
          <XCircleIcon className="w-3 h-3 mr-1" />
          Inaktiv
        </>
      )}
    </span>
  );
};

// Rollen-Badge mit Glow-Effekt
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const config = ROLE_CONFIG[role];
  
  // Fallback für unbekannte Rollen
  if (!config) {
    return (
      <motion.span
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-gray-500 shadow-lg shadow-gray-500/50 hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Unbekannte Rolle"
      >
        <UserIcon className="w-4 h-4 mr-1.5" />
        {role || 'Unbekannt'}
      </motion.span>
    );
  }

  const IconComponent = config.icon;

  return (
    <motion.span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${config.color} shadow-lg ${config.glowColor} hover:shadow-xl transition-all duration-300`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={config.description}
    >
      <IconComponent className="w-4 h-4 mr-1.5" />
      {config.label}
    </motion.span>
  );
};

// Benutzer-Karte
const UserCard: React.FC<{
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onRestore?: (user: User) => void;
}> = ({ user, onEdit, onDelete, onToggleStatus, onRestore }) => {
  const isDeleted = user.is_deleted || false;
  const canEdit = !isDeleted;
  const canDelete = !isDeleted;
  const canRestore = isDeleted;

  return (
    <motion.div
      className={`card-base card-padding-md hover:shadow-lg transition-all duration-300 ${
        isDeleted ? 'opacity-60 bg-card-tertiary' : 'bg-card'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="space-y-4">
        {/* Header mit Avatar und Name */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          
          {/* Name und Rolle */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-primary truncate">
              {user.first_name} {user.last_name}
            </h3>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* E-Mail */}
        <div>
          <p className="text-secondary text-sm truncate">{user.email}</p>
        </div>

        {/* Status und Login-Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <StatusBadge isActive={user.is_active} isDeleted={isDeleted} />
            
            {/* Aktionen */}
            <div className="flex items-center space-x-1">
              {canEdit && (
                <motion.button
                  onClick={() => onEdit(user)}
                  className="p-1.5 text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Benutzer bearbeiten"
                >
                  <PencilIcon className="w-4 h-4" />
                </motion.button>
              )}

              {!isDeleted && (
                <motion.button
                  onClick={() => onToggleStatus(user)}
                  className={`p-1.5 rounded transition-colors ${
                    user.is_active
                      ? 'text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={user.is_active ? 'Benutzer deaktivieren' : 'Benutzer aktivieren'}
                >
                  {user.is_active ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </motion.button>
              )}

              {canDelete && (
                <motion.button
                  onClick={() => onDelete(user)}
                  className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Benutzer löschen"
                >
                  <TrashIcon className="w-4 h-4" />
                </motion.button>
              )}

              {canRestore && onRestore && (
                <motion.button
                  onClick={() => onRestore(user)}
                  className="p-1.5 text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Benutzer wiederherstellen"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Letzter Login */}
          {user.last_login && (
            <div className="text-xs text-tertiary">
              Letzter Login: {new Date(user.last_login).toLocaleDateString('de-DE')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Such- und Filter-Bar
const SearchAndFilterBar: React.FC<{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onAddUser: () => void;
  isLoading: boolean;
}> = ({ searchTerm, onSearchChange, filters, onFiltersChange, onAddUser, isLoading }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="card-base card-padding-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary">Benutzer-Management</h2>
        <motion.button
          onClick={onAddUser}
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Neuer Benutzer</span>
        </motion.button>
      </div>

      {/* Such-Bar */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
        <input
          type="text"
          placeholder="Benutzer suchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary placeholder:text-tertiary"
        />
      </div>

      {/* Filter-Toggle */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-secondary hover:text-blue-600 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filter</span>
        </motion.button>

        {isLoading && (
          <div className="flex items-center space-x-2 text-secondary">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Lade...</span>
          </div>
        )}
      </div>

      {/* Filter-Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-card-secondary"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rolle-Filter */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Rolle
                </label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => onFiltersChange({ ...filters, role: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary"
                >
                  <option value="">Alle Rollen</option>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status-Filter */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Status
                </label>
                <select
                  value={filters.is_active?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    onFiltersChange({
                      ...filters,
                      is_active: value === '' ? undefined : value === 'true',
                    });
                  }}
                  className="w-full px-3 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary"
                >
                  <option value="">Alle Status</option>
                  <option value="true">Aktiv</option>
                  <option value="false">Inaktiv</option>
                </select>
              </div>

              {/* Gelöscht-Filter */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Gelöschte Benutzer
                </label>
                <select
                  value={filters.is_deleted?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    onFiltersChange({
                      ...filters,
                      is_deleted: value === '' ? undefined : value === 'true',
                    });
                  }}
                  className="w-full px-3 py-2 bg-card border border-card-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary"
                >
                  <option value="">Alle Benutzer</option>
                  <option value="false">Nicht gelöscht</option>
                  <option value="true">Gelöscht</option>
                </select>
              </div>
            </div>

            {/* Filter zurücksetzen */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onFiltersChange({})}
                className="text-sm text-secondary hover:text-blue-600 transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Hauptkomponente
export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);

  // Benutzer laden
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchFilters: UserFilters = {
        ...filters,
        search: searchTerm || undefined,
      };

      const response = await userManagementApi.getUsers(searchFilters);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setUsers(response.data.results);
      }
    } catch (err) {
      setError('Fehler beim Laden der Benutzer');
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filters]);

  // Benutzer laden bei Änderungen
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Benutzer hinzufügen
  const handleAddUser = useCallback(async (userData: CreateUserData) => {
    try {
      const response = await userManagementApi.createUser(userData);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      setShowAddModal(false);
      loadUsers();
      return true;
    } catch (err) {
      setError('Fehler beim Erstellen des Benutzers');
      return false;
    }
  }, [loadUsers]);

  // Benutzer bearbeiten
  const handleEditUser = useCallback(async (userId: number, userData: UpdateUserData) => {
    try {
      const response = await userManagementApi.updateUser(userId, userData);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      setEditingUser(null);
      loadUsers();
      return true;
    } catch (err) {
      setError('Fehler beim Aktualisieren des Benutzers');
      return false;
    }
  }, [loadUsers]);

  // Benutzer löschen (Soft oder Hard Delete)
  const handleDeleteUser = useCallback(async (user: User, isHardDelete: boolean = false) => {
    try {
      let response;
      
      if (isHardDelete) {
        response = await userManagementApi.hardDeleteUser(user.id);
      } else {
        response = await userManagementApi.softDeleteUser(user.id);
      }
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      setShowDeleteModal(null);
      loadUsers();
      return true;
    } catch (err) {
      setError(`Fehler beim ${isHardDelete ? 'permanenten' : 'soft-'}Löschen des Benutzers`);
      return false;
    }
  }, [loadUsers]);

  // Benutzer wiederherstellen
  const handleRestoreUser = useCallback(async (user: User) => {
    try {
      const response = await userManagementApi.restoreUser(user.id);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      loadUsers();
      return true;
    } catch (err) {
      setError('Fehler beim Wiederherstellen des Benutzers');
      return false;
    }
  }, [loadUsers]);

  // Benutzer-Status umschalten
  const handleToggleStatus = useCallback(async (user: User) => {
    try {
      const response = await userManagementApi.toggleUserStatus(user.id, !user.is_active);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      loadUsers();
      return true;
    } catch (err) {
      setError('Fehler beim Ändern des Benutzer-Status');
      return false;
    }
  }, [loadUsers]);

  // Gefilterte Benutzer
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email.toLowerCase();
        
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Fehler-Anzeige */}
      {error && (
        <AdminErrorAlert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Such- und Filter-Bar */}
      <SearchAndFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        onAddUser={() => setShowAddModal(true)}
        isLoading={isLoading}
      />

      {/* Benutzer-Liste */}
      {isLoading ? (
        <AdminLoadingSpinner text="Lade Benutzer..." />
      ) : filteredUsers.length === 0 ? (
        <AdminEmptyState
          icon={UserIcon}
          title={searchTerm || Object.keys(filters).length > 0 ? 'Keine Benutzer gefunden' : 'Keine Benutzer vorhanden'}
          description={searchTerm || Object.keys(filters).length > 0 
            ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
            : 'Erstellen Sie den ersten Benutzer für Ihr System.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={setEditingUser}
                onDelete={setShowDeleteModal}
                onToggleStatus={handleToggleStatus}
                onRestore={handleRestoreUser}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
      />

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUser}
      />

      <DeleteUserModal
        isOpen={!!showDeleteModal}
        user={showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
};

export default UserManagement;

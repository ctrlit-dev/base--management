import { Suspense, lazy } from 'react';
import { SettingsHeader, MaintenanceModeAlert } from '@/features/settings/settings/SettingsComponents';
import { UserManagement } from '@/features/settings/admin/UserManagement';
import { useSettings } from '@/hooks/useSettings';
import type { SettingsTab } from '@/types/settings';

// Lazy Loading für alle Settings-Komponenten
const AuthenticationSettings = lazy(() => import('./tabs/AuthenticationSettings'));
const CompanySettings = lazy(() => import('./tabs/CompanySettings'));
const SystemSettingsTab = lazy(() => import('./tabs/SystemSettings'));
const SecuritySettings = lazy(() => import('./tabs/SecuritySettings'));
const NotificationsSettings = lazy(() => import('./tabs/NotificationsSettings'));
const BackupSettings = lazy(() => import('./tabs/BackupSettings'));
const PrivacySettings = lazy(() => import('./tabs/PrivacySettings'));
const LogsSettings = lazy(() => import('./tabs/LogsSettings'));

interface SettingsTabContentProps {
  activeTab: SettingsTab;
  onBack: () => void;
}

export function SettingsTabContent({ activeTab, onBack }: SettingsTabContentProps) {
  const { settings } = useSettings();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'authentication':
        return <AuthenticationSettings />;
      case 'company':
        return <CompanySettings />;
      case 'system':
        return <SystemSettingsTab />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'backup':
        return <BackupSettings />;
      case 'users':
        return <UserManagement />;
      case 'privacy':
        return <PrivacySettings />;
      case 'logs':
        return <LogsSettings />;
      default:
        return <AuthenticationSettings />;
    }
  };

  const getTabTitle = () => {
    const titles: Record<SettingsTab, string> = {
      authentication: 'Authentifizierung',
      company: 'Firmen-Einstellungen',
      system: 'System',
      security: 'Sicherheit',
      notifications: 'Benachrichtigungen',
      backup: 'Backup & Wartung',
      users: 'Benutzer-Management',
      privacy: 'Datenschutz',
      logs: 'Logs & Aktivitäten'
    };
    return titles[activeTab] || 'Einstellungen';
  };

  const getTabDescription = () => {
    const descriptions: Record<SettingsTab, string> = {
      authentication: 'Verwalten Sie die Authentifizierungs-Einstellungen und Sicherheitsrichtlinien',
      company: 'Konfigurieren Sie Firmen-spezifische Einstellungen und Informationen',
      system: 'System-Status und grundlegende Konfigurationen',
      security: 'Sicherheitsrichtlinien und Zugriffskontrollen',
      notifications: 'Benachrichtigungs-Einstellungen und Kommunikationspräferenzen',
      backup: 'Backup-Strategien und Wartungsoptionen',
      users: 'Benutzerverwaltung und Rollenzuweisungen',
      privacy: 'Datenschutz-Einstellungen und Compliance',
      logs: 'System-Logs und Aktivitätsverfolgung'
    };
    return descriptions[activeTab] || '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <SettingsHeader
        title={getTabTitle()}
        description={getTabDescription()}
        onBack={onBack}
      />

      {/* Wartungsmodus-Warnung */}
      <MaintenanceModeAlert settings={settings} />

      {/* Tab Content mit Lazy Loading */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-text-secondary">Lade {getTabTitle()}...</span>
          </div>
        }
      >
        {renderTabContent()}
      </Suspense>
    </div>
  );
}

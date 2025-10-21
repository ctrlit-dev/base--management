import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SettingsSection } from '@/features/settings/settings/SettingsComponents';
import { useSettings } from '@/hooks/useSettings';
import { SETTINGS_SECTIONS } from '@/config/settingsConfig';
import type { SystemSettings } from '@/types/settings';

interface SecuritySettingsProps {
  onSave?: () => void;
  onFieldChange?: (field: string | number | symbol, value: any) => void;
}

function SecuritySettings({ onSave, onFieldChange }: SecuritySettingsProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const {
    settings,
    isLoading,
    isSaving,
    successMessage,
    errors,
    saveSettings,
    updateSetting
  } = useSettings();

  const sections = SETTINGS_SECTIONS.security || [];

  const handleFieldChange = (field: string | number | symbol, value: any) => {
    updateSetting(field as keyof SystemSettings, value);
    setHasUnsavedChanges(true);
    onFieldChange?.(field, value);
  };

  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      setHasUnsavedChanges(false);
      onSave?.();
    }
  };

  useEffect(() => {
    if (settings && !isLoading) {
      setHasUnsavedChanges(false);
    }
  }, [settings, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-text-secondary">Lade Sicherheits-Einstellungen...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Speichern-Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            hasUnsavedChanges && !isSaving
              ? 'bg-accent-blue text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Speichern...
            </div>
          ) : (
            'Einstellungen speichern'
          )}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg"
        >
          {successMessage}
        </motion.div>
      )}

      {/* Settings Content */}
      <div className="card p-8">
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SettingsSection
              key={index}
              title={section.title}
              icon={section.icon}
              fields={section.fields}
              settings={settings}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default SecuritySettings;

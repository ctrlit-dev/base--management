/**
 * Settings Hook
 * =============
 * 
 * Custom Hook für Settings-Management.
 * DRY-Prinzip: Zentrale Logik für alle Settings-Operationen.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../services/apiServices';
import { userManager } from '../lib/api/auth';
import { useFormValidation } from './useFormValidation';
import { DEFAULT_SETTINGS, SETTINGS_VALIDATION_RULES } from '../config/settingsConfig';
import type { SystemSettings, SettingsValidationErrors } from '../types/settings';
import toast from 'react-hot-toast';

export const useSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form-Validierung
  const validation = useFormValidation(SETTINGS_VALIDATION_RULES);

  /**
   * Einstellungen laden
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Lade Einstellungen...');
      
      const response = await settingsService.getSettings();
      console.log('API Response:', response);
      
      if (response) {
        // Prüfe verschiedene mögliche Antwortformate
        if (Array.isArray(response) && response.length > 0) {
          setSettings(response[0]);
          console.log('Einstellungen geladen (Array-Format):', response[0]);
        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
          setSettings(response);
          console.log('Einstellungen geladen (Objekt-Format):', response);
        } else {
          console.warn('Unerwartetes Antwortformat:', response);
        }
      } else {
        console.warn('Keine Einstellungen erhalten, verwende Standardwerte');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      
      // Bei Token-Problemen zur Anmeldung umleiten
      if (error instanceof Error && error.message.includes('Token-Refresh fehlgeschlagen')) {
        toast.error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        userManager.logout();
        navigate('/login');
        return;
      }
      
      // Nur bei echten Fehlern einen Toast anzeigen
      if (error instanceof Error && error.message.includes('HTTP')) {
        toast.error(`API-Fehler: ${error.message}`);
      } else if (error instanceof Error && error.message.includes('Network')) {
        toast.error('Netzwerkfehler: Backend nicht erreichbar');
      } else {
        console.warn('Verwende Standardwerte aufgrund von Fehler:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Einstellungen speichern
   */
  const saveSettings = useCallback(async () => {
    try {
      setIsSaving(true);
      validation.clearErrors();
      
      // Validierung
      if (!validation.validateForm(settings)) {
        return false;
      }
      
      await settingsService.updateSettings(settings);
      setSuccessMessage('Einstellungen erfolgreich gespeichert!');
      toast.success('Einstellungen erfolgreich gespeichert!');
      
      // Nach 3 Sekunden Erfolgsmeldung ausblenden
      setTimeout(() => setSuccessMessage(''), 3000);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      
      // Bei Token-Problemen zur Anmeldung umleiten
      if (error instanceof Error && error.message.includes('Token-Refresh fehlgeschlagen')) {
        toast.error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        userManager.logout();
        navigate('/login');
        return false;
      }
      
      // Spezifische Fehlermeldungen
      if (error instanceof Error && error.message.includes('HTTP')) {
        toast.error(`Speicher-Fehler: ${error.message}`);
      } else if (error instanceof Error && error.message.includes('Network')) {
        toast.error('Netzwerkfehler: Backend nicht erreichbar');
      } else {
        toast.error('Fehler beim Speichern der Einstellungen');
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings, validation, navigate]);

  /**
   * Einstellung ändern
   */
  const updateSetting = useCallback((field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Entferne Fehler für dieses Feld
    validation.clearError(field);
  }, [validation]);

  /**
   * Alle Einstellungen zurücksetzen
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    validation.clearErrors();
    setSuccessMessage('');
  }, [validation]);

  return {
    // State
    settings,
    isLoading,
    isSaving,
    successMessage,
    errors: validation.errors,
    isValid: validation.isValid,
    
    // Actions
    loadSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    
    // Validation
    validateField: validation.validateField,
    clearError: validation.clearError,
    clearErrors: validation.clearErrors
  };
};

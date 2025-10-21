import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  KeyIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  MapPinIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { SecondaryButton, DangerButton, WarningButton } from '../components/ui/buttons/ButtonComponents';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { TopNavigation } from '../components/common/TopNavigation';
import { SettingsSidebar } from '../components/forms/SettingsSidebar';
import { userManager, authApi, type Session, type ProfileSettings, type User } from '../lib/api/auth';
import { useBackgroundStore } from '../store/backgroundStore';
import Avatar from '../components/Avatar';
import PasskeyManager from '../features/auth/PasskeyManager';
import PasswordStrengthMeter from '../features/auth/PasswordStrengthMeter';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';
import { handleApiError, handleFormError, logError } from '../utils/errorHandling';
import { validatePasswordConfirmation } from '../utils/passwordUtils';

type Tab = 'profile' | 'security' | 'passkeys' | 'sessions' | 'device-security';

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { backgroundType } = useBackgroundStore();

  // Form States
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    language: 'de'
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Profile Settings State
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    notifications_enabled: true,
    dashboard_widgets: {},
    device_verification: true,
    biometric_login: false,
    device_encryption: true,
    remote_logout: true
  });

  // Mock-Daten für vertrauenswürdige Geräte (wird später durch echte API ersetzt)
  const [trustedDevices] = useState([
    {
      id: 'device_1',
      name: 'Mein Arbeitslaptop',
      type: 'laptop',
      last_seen: '2024-01-15T10:30:00Z',
      location: 'Berlin, Deutschland',
      trusted: true
    },
    {
      id: 'device_2',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      last_seen: '2024-01-14T15:45:00Z',
      location: 'München, Deutschland',
      trusted: true
    }
  ]);

  // Form validation hooks
  const profileValidation = useFormValidation<typeof profileForm>({
    first_name: commonValidationRules.firstName,
    last_name: commonValidationRules.lastName,
    email: commonValidationRules.email
  });

  const passwordValidation = useFormValidation<typeof passwordForm>({
    current_password: { required: true, message: 'Aktuelles Passwort ist erforderlich' },
    new_password: commonValidationRules.password
  });

  useEffect(() => {
    const currentUser = userManager.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setProfileForm({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
        language: currentUser.language || 'de'
      });
      
      // Lade aktuelle Benutzerdaten vom Server
      loadCurrentUser();
      
      // Lade Sessions und ProfileSettings
      loadSessions();
      loadProfileSettings();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Funktion zum Laden der aktuellen Benutzerdaten vom Server
  const loadCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.data) {
        // Aktualisiere lokale Benutzerdaten
        userManager.setCurrentUser(response.data);
        setUser(response.data);
        
        // Aktualisiere auch das Formular
        setProfileForm({
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          email: response.data.email,
          language: response.data.language || 'de'
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzerdaten:', error);
    }
  };

  // Funktionen zum Laden der Daten
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await authApi.getSessions();
      if (response.data) {
        setSessions(response.data.sessions);
      } else if (response.error) {
        console.error('Fehler beim Laden der Sessions:', response.error);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadProfileSettings = async () => {
    try {
      const response = await authApi.getProfileSettings();
      if (response.data) {
        setProfileSettings(response.data);
      } else if (response.error) {
        console.error('Fehler beim Laden der Profile-Einstellungen:', response.error);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Profile-Einstellungen:', error);
    }
  };

  const handleLogout = () => {
    userManager.logout();
    navigate('/login');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validiere das Formular
    if (!profileValidation.validateForm(profileForm)) {
      const errorMap: Record<string, string> = {};
      Object.entries(profileValidation.errors).forEach(([key, value]) => {
        if (value) errorMap[key] = value;
      });
      setErrors(errorMap);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.updateProfile(profileForm);
      
      if (response.data) {
        // Aktualisiere den lokalen Benutzer
        userManager.setCurrentUser(response.data);
        setUser(response.data);
        
        setSuccessMessage('Profil erfolgreich aktualisiert!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Verwende zentrale Fehlerbehandlung
        const formErrors = handleFormError(response);
        const errorMap: Record<string, string> = {};
        formErrors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        setErrors(errorMap);
      }
    } catch (error) {
      logError(error, 'ProfileUpdate');
      const errorMessage = handleApiError(error, 'Fehler beim Aktualisieren des Profils');
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validiere das Formular
    if (!passwordValidation.validateForm(passwordForm)) {
      const errorMap: Record<string, string> = {};
      Object.entries(passwordValidation.errors).forEach(([key, value]) => {
        if (value) errorMap[key] = value;
      });
      setErrors(errorMap);
      setIsLoading(false);
      return;
    }

    // Validiere Passwort-Bestätigung
    const confirmationError = validatePasswordConfirmation(
      passwordForm.new_password, 
      passwordForm.confirm_password
    );
    if (!confirmationError.isValid) {
      setErrors({ confirm_password: confirmationError.error! });
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      
      if (response.data || response.message) {
        setSuccessMessage('Passwort erfolgreich geändert!');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Verwende zentrale Fehlerbehandlung
        const formErrors = handleFormError(response);
        const errorMap: Record<string, string> = {};
        formErrors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        setErrors(errorMap);
      }
    } catch (error) {
      logError(error, 'PasswordChange');
      const errorMessage = handleApiError(error, 'Fehler beim Ändern des Passworts');
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler für Session-Management
  const handleSessionTerminate = async (sessionId: string) => {
    try {
      const response = await authApi.terminateSession(sessionId);
      
      if (response.data || response.message) {
        // Aktualisiere die Sessions-Liste
        await loadSessions();
        setSuccessMessage('Session wurde erfolgreich beendet!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.error) {
        setErrors({ general: response.error });
      }
    } catch (error) {
      setErrors({ general: 'Fehler beim Beenden der Session' });
    }
  };

  const handleLogoutAllSessions = async (includeCurrent: boolean = false) => {
    try {
      const response = await authApi.logoutAllSessions(includeCurrent);
      
      if (response.data || response.message) {
        // Aktualisiere die Sessions-Liste
        await loadSessions();
        
        if (includeCurrent && response.data?.logout_required) {
          // Logout erforderlich - leite zur Login-Seite weiter
          setSuccessMessage('Alle Sessions wurden beendet. Sie werden abgemeldet...');
          setTimeout(() => {
            userManager.logout();
            navigate('/login');
          }, 2000);
        } else {
          setSuccessMessage(response.message || 'Sessions wurden beendet!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else if (response.error) {
        setErrors({ general: response.error });
      }
    } catch (error) {
      setErrors({ general: 'Fehler beim Beenden der Sessions' });
    }
  };

  const handleDeviceSecurityUpdate = async (setting: string, value: boolean) => {
    try {
      const updatedSettings = {
        ...profileSettings,
        [setting]: value
      };
      
      const response = await authApi.updateProfileSettings(updatedSettings);
      
      if (response.data) {
        setProfileSettings(response.data);
        setSuccessMessage('Einstellung wurde erfolgreich aktualisiert!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.error) {
        setErrors({ general: response.error });
      }
    } catch (error) {
      setErrors({ general: 'Fehler beim Aktualisieren der Einstellung' });
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      const response = await authApi.resendVerificationEmail(user?.email || '');
      
      if (response.error) {
        const errorMessage = handleApiError(response.error);
        setErrors({ general: errorMessage });
      } else {
        setEmailVerificationSent(true);
        setSuccessMessage('Verifizierungs-E-Mail wurde gesendet!');
        setTimeout(() => setSuccessMessage(''), 5000);
        
        // Lade aktuelle Benutzerdaten nach dem Senden der E-Mail
        await loadCurrentUser();
      }
    } catch (error) {
      logError(error, 'EmailVerification');
      const errorMessage = handleApiError(error, 'Fehler beim Senden der Verifizierungs-E-Mail');
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceUntrust = (deviceId: string) => {
    // Diese Funktion würde normalerweise eine API-Aufruf machen
    // Für jetzt zeigen wir nur eine Nachricht
    console.log('Device untrusted:', deviceId);
    setSuccessMessage('Gerät wurde erfolgreich entfernt!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (file: File) => {
    console.log('Starting avatar upload...');
    console.log('File:', file.name, file.size, file.type);
    
    setIsLoading(true);
    setErrors({});

    try {
      const response = await authApi.uploadAvatar(file);
      console.log('Avatar upload response:', response);
      
      if (response.data?.user) {
        // Aktualisiere den lokalen Benutzer
        userManager.setCurrentUser(response.data.user);
        setUser(response.data.user);
        
        setSuccessMessage('Profilbild erfolgreich hochgeladen!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.error) {
        console.error('Avatar upload error:', response.error);
        setErrors({ general: response.error });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setErrors({ general: 'Fehler beim Hochladen des Profilbilds' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await authApi.deleteAvatar();
      
      if (response.data?.user) {
        // Aktualisiere den lokalen Benutzer
        userManager.setCurrentUser(response.data.user);
        setUser(response.data.user);
        
        setSuccessMessage('Profilbild erfolgreich gelöscht!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.error) {
        setErrors({ general: response.error });
      }
    } catch (error) {
      setErrors({ general: 'Fehler beim Löschen des Profilbilds' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'profile' as const, name: 'Profil', icon: UserIcon },
    { id: 'security' as const, name: 'Sicherheit', icon: ShieldCheckIcon },
    { id: 'passkeys' as const, name: 'Passkeys', icon: KeyIcon },
    { id: 'sessions' as const, name: 'Sitzungen', icon: ComputerDesktopIcon },
    { id: 'device-security' as const, name: 'Geräte-Sicherheit', icon: DevicePhoneMobileIcon }
  ];

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Administrator',
      'MANAGER': 'Manager',
      'USER': 'Benutzer',
      'GUEST': 'Gast'
    };
    return roleNames[role] || role;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background-primary theme-transition flex items-center justify-center">
        <BackgroundRenderer type={backgroundType} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Lade Profil...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary theme-transition">
      <BackgroundRenderer type={backgroundType} />

      {/* Settings Sidebar */}
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <div className="relative z-10">
        {/* TOP Navigation */}
        <TopNavigation user={user} onLogout={handleLogout} onSettingsOpen={() => setIsSettingsOpen(true)} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary/50 rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Profil-Einstellungen</h1>
                <p className="text-text-secondary">Verwalten Sie Ihre Kontodaten und Sicherheitseinstellungen</p>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3"
              >
                <CheckIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-700 dark:text-green-300 font-medium">{successMessage}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <span className="text-red-700 dark:text-red-300 font-medium">{errors.general}</span>
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="card p-6">
                {/* User Profile Card */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <Avatar
                      user={user}
                      size="xl"
                      showUploadButton={true}
                      onUpload={handleAvatarUpload}
                      onDelete={handleAvatarDelete}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-1">
                    {user.first_name} {user.last_name}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-text-secondary text-sm">{user.email}</p>
                    {user.email_verified ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        <CheckIcon className="w-3 h-3 mr-1" />
                        Verifiziert
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        Nicht verifiziert
                      </span>
                    )}
                  </div>
                  {!user.email_verified && (
                    <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                        <div className="flex-1">
                          <p className="text-sm text-yellow-800 font-medium">
                            E-Mail-Adresse nicht verifiziert
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Bitte verifizieren Sie Ihre E-Mail-Adresse, um alle Funktionen nutzen zu können.
                          </p>
                          <WarningButton
                            onClick={handleSendEmailVerification}
                            disabled={isLoading || emailVerificationSent}
                            size="sm"
                            loading={isLoading}
                            loadingText="Wird gesendet..."
                          >
                            {emailVerificationSent ? 'E-Mail gesendet' : 'Verifizierungs-E-Mail senden'}
                          </WarningButton>
                        </div>
                      </div>
                    </div>
                  )}
                  <span className="inline-block px-3 py-1 bg-accent-blue/10 text-accent-blue text-xs font-medium rounded-full">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>

                {/* Navigation Tabs */}
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                            : 'text-text-secondary hover:text-text-primary hover:bg-background-primary/50'
                        }`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.name}</span>
                      </motion.button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="card overflow-hidden">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-8"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-violet rounded-xl flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-text-primary">Profil-Informationen</h2>
                        <p className="text-text-secondary">Aktualisieren Sie Ihre persönlichen Daten</p>
                      </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Vorname
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={profileForm.first_name}
                              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                              className="input w-full"
                              placeholder="Ihr Vorname"
                            />
                            <PencilIcon className="absolute right-3 top-3 w-5 h-5 text-text-secondary" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Nachname
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={profileForm.last_name}
                              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                              className="input w-full"
                              placeholder="Ihr Nachname"
                            />
                            <PencilIcon className="absolute right-3 top-3 w-5 h-5 text-text-secondary" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          E-Mail-Adresse
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="input w-full"
                            placeholder="ihre@email.com"
                          />
                          <EnvelopeIcon className="absolute right-3 top-3 w-5 h-5 text-text-secondary" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Sprache
                        </label>
                        <div className="relative">
                          <select
                            value={profileForm.language}
                            onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                            className="input w-full appearance-none"
                          >
                            <option value="de">Deutsch</option>
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                            <option value="es">Español</option>
                          </select>
                          <GlobeAltIcon className="absolute right-3 top-3 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-6">
                        <motion.button
                          type="submit"
                          disabled={isLoading}
                          className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isLoading ? 'Speichern...' : 'Änderungen speichern'}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-8"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <ShieldCheckIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-text-primary">Sicherheit</h2>
                        <p className="text-text-secondary">Verwalten Sie Ihr Passwort und Sicherheitseinstellungen</p>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Aktuelles Passwort
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            className="input w-full"
                            placeholder="Ihr aktuelles Passwort"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-text-secondary hover:text-text-primary transition-colors duration-200"
                          >
                            {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Neues Passwort
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            className="input w-full"
                            placeholder="Ihr neues Passwort"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-text-secondary hover:text-text-primary transition-colors duration-200"
                          >
                            {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Password Strength Meter */}
                        <PasswordStrengthMeter password={passwordForm.new_password} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Passwort bestätigen
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                            className="input w-full"
                            placeholder="Passwort wiederholen"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-text-secondary hover:text-text-primary transition-colors duration-200"
                          >
                            {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>
                        {errors.confirm_password && (
                          <p className="mt-2 text-sm text-red-500">{errors.confirm_password}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-6">
                        <motion.button
                          type="submit"
                          disabled={isLoading}
                          className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isLoading ? 'Ändern...' : 'Passwort ändern'}
                        </motion.button>
                      </div>
                    </form>

                    {/* Passkeys Section */}
                    <div className="mt-12 pt-8 border-t border-border-primary/20">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <KeyIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-text-primary">Passkeys</h3>
                          <p className="text-text-secondary">Verwalten Sie Ihre Passkeys für sichere Anmeldung</p>
                        </div>
                      </div>

                      <div className="card p-6">
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyIcon className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-text-primary mb-2">Passkeys verfügbar</h4>
                          <p className="text-text-secondary mb-6 max-w-md mx-auto">
                            Passkeys ermöglichen eine sichere, passwortlose Anmeldung mit biometrischen Daten oder Sicherheitsschlüsseln.
                          </p>
                          <motion.button
                            className="btn-primary px-6 py-3"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Passkey hinzufügen
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Passkeys Tab */}
                {activeTab === 'passkeys' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-8"
                  >
                    <PasskeyManager 
                      onSuccess={(message) => {
                        setSuccessMessage(message);
                        setTimeout(() => setSuccessMessage(''), 3000);
                      }}
                      onError={(error) => {
                        setErrors({ general: error });
                      }}
                    />
                  </motion.div>
                )}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-8"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <ComputerDesktopIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-text-primary">Aktive Sitzungen</h2>
                        <p className="text-text-secondary">Verwalten Sie Ihre aktiven Anmeldesitzungen</p>
                      </div>
                    </div>

                    {sessionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-text-secondary">Lade Sessions...</span>
                      </div>
                    ) : sessions.length > 0 ? (
                      <div className="space-y-4">
                        {sessions.map((session) => (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-6"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  session.is_current 
                                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                }`}>
                                  <ComputerDesktopIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-semibold text-text-primary">
                                      {session.device_name || 'Unbekanntes Gerät'}
                                    </h3>
                                    {session.is_current && (
                                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        Aktuell
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-text-secondary">
                                    <div className="flex items-center space-x-1">
                                      <MapPinIcon className="w-4 h-4" />
                                      <span>{session.ip_address}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="w-4 h-4" />
                                      <span>{formatDate(session.last_activity)}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-text-tertiary mt-1">
                                    {session.user_agent}
                                  </div>
                                </div>
                              </div>
                              {!session.is_current && (
                                <motion.button
                                  onClick={() => handleSessionTerminate(session.session_id)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Logout All Sessions Buttons */}
                        {sessions.filter(s => !s.is_current).length > 0 && (
                          <div className="mt-6 pt-6 border-t border-border-primary/20 space-y-3">
                            <SecondaryButton
                              onClick={() => handleLogoutAllSessions(false)}
                              fullWidth
                              className="session-button-orange"
                            >
                              Alle anderen Sessions beenden
                            </SecondaryButton>
                            
                            <DangerButton
                              onClick={() => handleLogoutAllSessions(true)}
                              fullWidth
                              className="session-button-red"
                            >
                              Alle Sessions beenden (inklusive dieser)
                            </DangerButton>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ComputerDesktopIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Keine aktiven Sessions</h3>
                        <p className="text-text-secondary">Es sind derzeit keine aktiven Sessions vorhanden.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Device Security Tab */}
                {activeTab === 'device-security' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-8"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-text-primary">Geräte-Sicherheit</h2>
                        <p className="text-text-secondary">Verwalten Sie vertrauenswürdige Geräte und Sicherheitseinstellungen</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Vertrauenswürdige Geräte */}
                      <div className="card p-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-text-primary mb-2">Vertrauenswürdige Geräte</h3>
                          <p className="text-text-secondary">Geräte, die für die Anmeldung ohne zusätzliche Verifizierung verwendet werden können</p>
                        </div>

                        <div className="space-y-4">
                          {trustedDevices.map((device) => (
                            <motion.div
                              key={device.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-lg border border-border-primary/20"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                  <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-text-primary">{device.name}</h4>
                                  <div className="flex items-center space-x-4 text-sm text-text-secondary">
                                    <span className="capitalize">{device.type}</span>
                                    <div className="flex items-center space-x-1">
                                      <MapPinIcon className="w-4 h-4" />
                                      <span>{device.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <ClockIcon className="w-4 h-4" />
                                      <span>{formatDate(device.last_seen)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <motion.button
                                onClick={() => handleDeviceUntrust(device.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Geräte-Verifizierung */}
                      <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">Geräte-Verifizierung</h3>
                            <p className="text-text-secondary">Neue Geräte müssen verifiziert werden</p>
                          </div>
                          <motion.button
                            onClick={() => handleDeviceSecurityUpdate('device_verification', !profileSettings.device_verification)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              profileSettings.device_verification ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                profileSettings.device_verification ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </motion.button>
                        </div>
                      </div>

                      {/* Biometrische Anmeldung */}
                      <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">Biometrische Anmeldung</h3>
                            <p className="text-text-secondary">Fingerabdruck oder Gesichtserkennung verwenden</p>
                          </div>
                          <motion.button
                            onClick={() => handleDeviceSecurityUpdate('biometric_login', !profileSettings.biometric_login)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              profileSettings.biometric_login ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                profileSettings.biometric_login ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </motion.button>
                        </div>
                      </div>

                      {/* Geräte-Verschlüsselung */}
                      <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">Geräte-Verschlüsselung</h3>
                            <p className="text-text-secondary">Lokale Daten auf dem Gerät verschlüsseln</p>
                          </div>
                          <motion.button
                            onClick={() => handleDeviceSecurityUpdate('device_encryption', !profileSettings.device_encryption)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              profileSettings.device_encryption ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                profileSettings.device_encryption ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </motion.button>
                        </div>
                      </div>

                      {/* Remote-Logout */}
                      <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">Remote-Logout</h3>
                            <p className="text-text-secondary">Von anderen Geräten abmelden können</p>
                          </div>
                          <motion.button
                            onClick={() => handleDeviceSecurityUpdate('remote_logout', !profileSettings.remote_logout)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              profileSettings.remote_logout ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                profileSettings.remote_logout ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LockClosedIcon, 
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SparklesIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { BackgroundRenderer } from '../../components/BackgroundRenderer';
import { SettingsSidebar } from '../../components/forms/SettingsSidebar';
import { SettingsButton } from '../../components/ui/buttons/SettingsButton';
import { FloatingLabel } from '../../components/ui/inputs/FloatingLabel';
import PasskeyLogin from './PasskeyLogin';
import { authApi, userManager, tokenManager } from '../../lib/api/auth';
import { useBackgroundStore } from '../../store/backgroundStore';

interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({ onSubmit, isLoading: externalIsLoading = false, error: externalError }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember_me: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const [currentStep, setCurrentStep] = useState<'login' | 'passkey-login'>('login');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestUsersExpanded, setIsTestUsersExpanded] = useState(false); // DEVELOPMENT: State für einklappbare Test-Buttons
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { backgroundType } = useBackgroundStore();

  // Check for Passkey support
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setIsPasskeySupported(true);
    }
  }, []);

  // Handle URL parameters for messages
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const message = searchParams.get('message');
    
    if (message === 'email_verification_required') {
      setSuccessMessage('Registrierung erfolgreich! Bitte verifizieren Sie Ihre E-Mail-Adresse.');
    } else if (message === 'registration_successful') {
      setSuccessMessage('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
    }
    
    // Clean up URL parameters after showing message
    if (message) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = 'E-Mail Adresse ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail Adresse ein';
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Wenn externe onSubmit-Funktion vorhanden ist, verwende diese
    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // Andernfalls verwende interne API-Logik
    setIsLoading(true);
    setApiError('');
    setErrors({});

    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
        remember_me: formData.remember_me,
      });

      if (response.error) {
        setApiError(response.error);
        return;
      }

      if (response.data) {
        // Tokens speichern
        tokenManager.setTokens(response.data.access, response.data.refresh);
        
        // Benutzerdaten speichern
        userManager.setCurrentUser(response.data.user);

        // Zur Dashboard-Seite navigieren
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setApiError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = () => {
    setCurrentStep('passkey-login');
  };

  const handlePasskeySuccess = async (tokens: { access: string; refresh: string }, user: any) => {
    try {
      // Speichere Tokens und Benutzerdaten
      localStorage.setItem('lcree_access', tokens.access);
      localStorage.setItem('lcree_refresh', tokens.refresh);
      localStorage.setItem('lcree_user', JSON.stringify(user));

      setSuccessMessage('Passkey-Authentifizierung erfolgreich!');
      
      // Prüfe ob Email verifiziert ist
      if (user.email_verified === false) {
        // Neuer Benutzer - weiterleiten zur Profilseite für Email-Verifizierung
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        // Bestehender Benutzer - weiterleiten zum Dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Passkey-Login-Daten:', error);
      setApiError('Fehler beim Speichern der Anmeldedaten');
    }
  };

  const handlePasskeyError = (error: string) => {
    setApiError(error);
    setCurrentStep('login');
  };

  const handlePasskeyCancel = () => {
    setCurrentStep('login');
  };

  return (
    <div className="min-h-screen bg-background-primary theme-transition flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <BackgroundRenderer type={backgroundType} />

      <div className="relative w-full max-w-md">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div 
            className="flex justify-center mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-accent-blue to-accent-violet rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <LockClosedIcon className="w-10 h-10 text-white relative z-10" />
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <SparklesIcon className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold text-text-primary mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Willkommen bei LCREE
          </motion.h1>
          
          <motion.p 
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Melden Sie sich an, um auf Ihr Dashboard zuzugreifen
          </motion.p>
        </motion.div>

        {/* Enhanced Login Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="card relative overflow-hidden"
        >
          {/* Form Background Animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-accent-violet/5"
            animate={{ 
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {currentStep === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1],
                    scale: { duration: 0.3 }
                  }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* E-Mail Field */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <FloatingLabel
                      id="email"
                      label="E-Mail Adresse"
                      type="email"
                      value={formData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      placeholder="ihre@email.com"
                      disabled={isLoading}
                      error={errors.email}
                      icon={<UserIcon className="h-5 w-5 input-icon" />}
                    />
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <FloatingLabel
                      id="password"
                      label="Passwort"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(value) => handleInputChange('password', value)}
                      placeholder="Ihr Passwort"
                      disabled={isLoading}
                      error={errors.password}
                      icon={<KeyIcon className="h-5 w-5 input-icon" />}
                      showPasswordToggle={true}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />
                  </motion.div>

                  {/* Remember Me & Forgot Password */}
                  <motion.div 
                    className="flex items-center justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <label className="flex items-center">
                      <motion.input
                        type="checkbox"
                        checked={formData.remember_me}
                        onChange={(e) => handleInputChange('remember_me', e.target.checked)}
                        className="rounded border-border-primary text-accent-blue focus:ring-0 focus:outline-none"
                        disabled={isLoading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      />
                      <span className="ml-2 text-sm text-text-secondary">
                        Angemeldet bleiben
                      </span>
                    </label>
                    <motion.button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-accent-blue hover:text-accent-violet transition-colors"
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Passwort vergessen?
                    </motion.button>
                  </motion.div>

                  {/* Success Message */}
                  <AnimatePresence>
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center"
                      >
                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
                        {successMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {(externalError || apiError) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                        {externalError || apiError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={externalIsLoading || isLoading}
                    className="w-full button-primary mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    {(externalIsLoading || isLoading) ? (
                      <div className="flex items-center justify-center">
                        <motion.div 
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Anmelden...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Anmelden
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* Passkey Step */}
              {currentStep === 'passkey-login' && (
                <motion.div
                  key="passkey"
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1],
                    scale: { duration: 0.3 }
                  }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                    {isLoading ? (
                      <motion.div
                        className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : successMessage ? (
                      <ShieldCheckIcon className="w-8 h-8 text-white" />
                    ) : (
                      <KeyIcon className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-text-primary">
                    {successMessage ? 'Erfolgreich!' : 
                     apiError ? 'Fehler' : 
                     'Mit Passkey anmelden'}
                  </h3>
                  
                  <p className="text-text-secondary">
                    {successMessage ? 'Sie werden weitergeleitet...' :
                     apiError ? apiError :
                     'Verwenden Sie Touch ID, Face ID, Windows Hello oder einen Sicherheitsschlüssel'}
                  </p>
                  
                  {isLoading && (
                    <motion.div
                      className="w-full bg-border-primary rounded-full h-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="bg-accent-blue h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                      />
                    </motion.div>
                  )}
                  
                  {!isLoading && !successMessage && (
                    <motion.button
                      onClick={() => setCurrentStep('login')}
                      className="w-full button-secondary flex items-center justify-center space-x-2 mt-6"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowRightIcon className="w-5 h-5 rotate-180" />
                      <span>Zurück zur Anmeldung</span>
                    </motion.button>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* Alternative Login Options */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-10"
            >
              {isPasskeySupported && currentStep === 'login' && (
                <div className="relative group">
                  {/* Subtle Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
                  
                  {/* Button */}
                  <button
                    onClick={handlePasskeyLogin}
                    className="relative w-full p-3 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5 hover:from-green-500/7 hover:to-emerald-500/7 hover:border-green-500/40 hover:scale-[1.01] hover:shadow-lg hover:shadow-green-500/15 transition-all duration-500 ease-out flex items-center justify-center space-x-2 active:scale-[0.99]"
                  >
                    {/* Icon */}
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ShieldCheckIcon className="w-5 h-5 text-green-600 group-hover:text-green-600/80 transition-colors duration-500 ease-out" />
                    </motion.div>
                    
                    {/* Text */}
                    <span className="font-medium text-green-600 group-hover:text-green-600/80 transition-colors duration-500 ease-out">
                      Mit Passkey anmelden
                    </span>
                    
                    {/* Subtle Arrow */}
                    <motion.div
                      animate={{
                        x: [0, 2, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRightIcon className="w-4 h-4 text-green-600/70 group-hover:text-green-600/60 transition-colors duration-500 ease-out" />
                    </motion.div>
                  </button>
                </div>
              )}
            </motion.div>

            {/* 
              ===========================================
              🚨 ENTWICKLUNG - TEST-BENUTZER-BUTTONS 🚨
              ===========================================
              
              ⚠️  WICHTIG: DIESER BEREICH MUSS VOR VERÖFFENTLICHUNG ENTFERNT WERDEN! ⚠️
              
              Dieser Code-Block ist nur für die Entwicklung gedacht und sollte:
              1. Vor dem Production-Build komplett entfernt werden
              2. Nicht in den Git-Repository committet werden (falls gewünscht)
              3. Nur im Development-Modus (import.meta.env.DEV) angezeigt werden
              
              Entfernung: Lösche den gesamten Block von Zeile ~425 bis ~542
              ===========================================
            */}
            {import.meta.env.DEV && currentStep === 'login' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="mt-6"
              >
                {/* Einklappbarer Header */}
                <motion.button
                  onClick={() => setIsTestUsersExpanded(!isTestUsersExpanded)}
                  className="w-full p-3 bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-500/20 rounded-lg hover:border-orange-500/30 hover:bg-gradient-to-r hover:from-orange-500/8 hover:to-red-500/8 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-orange-600 mb-1">
                        🚧 Entwicklung - Test-Benutzer (Allgemeines Benutzer-Management)
                      </h3>
                      <p className="text-xs text-orange-500/80">
                        Schnellzugriff für Entwicklung mit neuen Rollen
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: isTestUsersExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-orange-600"
                    >
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Einklappbare Test-Buttons */}
                <AnimatePresence>
                  {isTestUsersExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 bg-gradient-to-r from-orange-500/3 to-red-500/3 border border-orange-500/10 rounded-lg">
                        <div className="grid grid-cols-1 gap-2">
                          {/* Super Admin */}
                          <motion.button
                            onClick={() => {
                              setFormData({
                                email: 'superadmin@lcree.de',
                                password: 'superadmin123',
                                remember_me: false
                              });
                            }}
                            className="w-full p-2 text-xs rounded-md bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 hover:border-red-500/50 hover:bg-gradient-to-r hover:from-red-500/15 hover:to-red-600/15 transition-all duration-300 text-red-600 hover:text-red-700"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="font-medium">Super Admin (SUPER_ADMIN)</div>
                            <div className="text-red-500/70">superadmin@lcree.de</div>
                          </motion.button>

                          {/* Admin */}
                          <motion.button
                            onClick={() => {
                              setFormData({
                                email: 'admin@lcree.de',
                                password: 'admin123',
                                remember_me: false
                              });
                            }}
                            className="w-full p-2 text-xs rounded-md bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-purple-500/15 hover:to-purple-600/15 transition-all duration-300 text-purple-600 hover:text-purple-700"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="font-medium">Admin (ADMIN)</div>
                            <div className="text-purple-500/70">admin@lcree.de</div>
                          </motion.button>

                          {/* Manager */}
                          <motion.button
                            onClick={() => {
                              setFormData({
                                email: 'manager@lcree.de',
                                password: 'manager123',
                                remember_me: false
                              });
                            }}
                            className="w-full p-2 text-xs rounded-md bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-blue-500/15 hover:to-blue-600/15 transition-all duration-300 text-blue-600 hover:text-blue-700"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="font-medium">Manager (MANAGER)</div>
                            <div className="text-blue-500/70">manager@lcree.de</div>
                          </motion.button>

                          {/* User */}
                          <motion.button
                            onClick={() => {
                              setFormData({
                                email: 'user@lcree.de',
                                password: 'user123',
                                remember_me: false
                              });
                            }}
                            className="w-full p-2 text-xs rounded-md bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 hover:border-green-500/50 hover:bg-gradient-to-r hover:from-green-500/15 hover:to-green-600/15 transition-all duration-300 text-green-600 hover:text-green-700"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="font-medium">Standard User (USER)</div>
                            <div className="text-green-500/70">user@lcree.de</div>
                          </motion.button>

                          {/* Guest */}
                          <motion.button
                            onClick={() => {
                              setFormData({
                                email: 'guest@lcree.de',
                                password: 'guest123',
                                remember_me: false
                              });
                            }}
                            className="w-full p-2 text-xs rounded-md bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/30 hover:border-gray-500/50 hover:bg-gradient-to-r hover:from-gray-500/15 hover:to-gray-600/15 transition-all duration-300 text-gray-600 hover:text-gray-700"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="font-medium">Guest (GUEST)</div>
                            <div className="text-gray-500/70">guest@lcree.de</div>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Passkey Login */}
            {currentStep === 'passkey-login' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <PasskeyLogin
                  onSuccess={handlePasskeySuccess}
                  onError={handlePasskeyError}
                  onCancel={handlePasskeyCancel}
                />
              </motion.div>
            )}
            {/* 
              ===========================================
              🚨 ENDE ENTWICKLUNG - TEST-BENUTZER-BUTTONS 🚨
              ===========================================
            */}
          </div>
        </motion.div>

        {/* Register Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-text-secondary">
            Noch kein Account?{' '}
            <motion.button
              onClick={() => navigate('/register')}
              className="text-accent-blue hover:text-accent-violet transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Jetzt registrieren
            </motion.button>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-text-tertiary">
            © 2024 LCREE. Alle Rechte vorbehalten.
          </p>
        </motion.div>
      </div>

      {/* Settings Components */}
      <SettingsButton onClick={() => setIsSettingsOpen(true)} />
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

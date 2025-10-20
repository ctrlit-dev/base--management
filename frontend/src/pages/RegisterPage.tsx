import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SparklesIcon,
  KeyIcon,
  UserPlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { SettingsButton } from '../components/SettingsButton';
import { FloatingLabel } from '../components/FloatingLabel';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { authApi, userManager, tokenManager } from '../api/auth';
import { useBackgroundStore } from '../store/backgroundStore';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';
import { handleApiError, handleFormError, logError, handlePasskeyError } from '../utils/errorHandling';
import { validatePasswordConfirmation } from '../utils/passwordUtils';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

type RegistrationMode = 'normal' | 'passkey';

interface RegisterFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('normal');
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { backgroundType } = useBackgroundStore();



  // Form validation hook - spezifisch für RegisterPage
  const validation = useFormValidation<RegisterFormData>({
    firstName: commonValidationRules.firstName,
    lastName: commonValidationRules.lastName,
    email: commonValidationRules.email,
    password: commonValidationRules.password,
    acceptTerms: commonValidationRules.terms
  });

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const fillDummyData = () => {
    setFormData({
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max.mustermann@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
    });
    setErrors({}); // Clear any existing errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validiere das Formular
    if (!validation.validateForm(formData)) {
      const errorMap: Record<string, string> = {};
      Object.entries(validation.errors).forEach(([key, value]) => {
        if (value) errorMap[key] = value;
      });
      setErrors(errorMap);
      return;
    }

    // Zusätzliche Validierung für Passwort-Bestätigung bei normaler Registrierung
    if (registrationMode === 'normal') {
      const confirmationError = validatePasswordConfirmation(formData.password, formData.confirmPassword);
      if (!confirmationError.isValid) {
        setErrors({ confirmPassword: confirmationError.error! });
        return;
      }
    }

    console.log('Current registration mode:', registrationMode);
    setIsLoading(true);
    setErrors({});

    try {
      if (registrationMode === 'passkey') {
        console.log('Starting Passkey registration...');
        await handlePasskeyRegistration();
      } else {
        console.log('Starting normal registration...');
        await handleNormalRegistration();
      }
    } catch (error) {
      logError(error, 'Registration');
      const errorMessage = registrationMode === 'passkey' 
        ? handlePasskeyError(error)
        : handleApiError(error, 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNormalRegistration = async () => {
    // API-Daten vorbereiten
    const apiData = {
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      password: formData.password,
      password_confirm: formData.confirmPassword,
    };

    // API-Aufruf für Registrierung
    const response = await authApi.register(apiData);

    if (response.error) {
      // Verwende zentrale Fehlerbehandlung
      const formErrors = handleFormError(response);
      const fieldErrors: RegisterFormErrors = {};
      formErrors.forEach(error => {
        // Mappe Backend-Feldnamen zu Frontend-Feldnamen
        switch (error.field) {
          case 'email':
            fieldErrors.email = error.message;
            break;
          case 'first_name':
            fieldErrors.firstName = error.message;
            break;
          case 'last_name':
            fieldErrors.lastName = error.message;
            break;
          case 'password':
            fieldErrors.password = error.message;
            break;
          case 'password_confirm':
            fieldErrors.confirmPassword = error.message;
            break;
          default:
            fieldErrors.email = error.message; // Fallback
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Erfolgreiche Registrierung
    if (response.data?.email_verification_required) {
      console.log('E-Mail-Verifizierung erforderlich');
      navigate('/login?message=email_verification_required');
    } else {
      // Direkte Anmeldung möglich - automatischer Login
      try {
        const loginResponse = await authApi.login({
          email: formData.email,
          password: formData.password,
          remember_me: false,
        });

        if (loginResponse.data) {
          // Tokens speichern
          tokenManager.setTokens(loginResponse.data.access, loginResponse.data.refresh);
          
          // Benutzerdaten speichern
          userManager.setCurrentUser(loginResponse.data.user);

          // Zur Dashboard-Seite navigieren
          navigate('/dashboard');
        } else {
          // Falls automatischer Login fehlschlägt, zur Login-Seite
          navigate('/login?message=registration_successful');
        }
      } catch (loginError) {
        logError(loginError, 'AutoLogin');
        navigate('/login?message=registration_successful');
      }
    }
  };

  const handlePasskeyRegistration = async () => {
    console.log('Starting Passkey registration...');
    
    // Schritt 1: Registrierungsoptionen abrufen
    console.log('Requesting registration options...');
    const optionsResponse = await authApi.getPasskeyRegistrationOptions();
    
    if (!optionsResponse.data?.options) {
      throw new Error('Keine Registrierungsoptionen erhalten');
    }
    
    console.log('Registration options received:', optionsResponse.data.options);
    const options = optionsResponse.data.options;
    
    // Schritt 2: WebAuthn-Registrierung durchführen
    const challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
    console.log('Challenge converted to ArrayBuffer, length:', challenge.length);
    
    const userId = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));
    console.log('User ID converted to ArrayBuffer, length:', userId.length);
    
    // Erstelle WebAuthn-kompatible Optionen mit echten Benutzerdaten
    const webAuthnOptions = {
      challenge: challenge.buffer,
      rp: {
        id: "localhost",
        name: "LCREE Parfum System"
      },
      user: {
        id: userId.buffer,
        name: formData.email, // Verwende echte Email
        displayName: `${formData.firstName} ${formData.lastName}` // Verwende echte Namen
      },
      pubKeyCredParams: [
        { type: "public-key" as const, alg: -7 },
        { type: "public-key" as const, alg: -257 }
      ],
      timeout: 30000,
      attestation: "none" as AttestationConveyancePreference,
      authenticatorSelection: {
        userVerification: "discouraged" as UserVerificationRequirement,
        residentKey: "discouraged" as ResidentKeyRequirement,
        authenticatorAttachment: "cross-platform" as AuthenticatorAttachment
      },
      excludeCredentials: []
    };
    
    console.log('WebAuthn options prepared:', {
      challengeLength: challenge.length,
      userIdLength: userId.length,
      timeout: webAuthnOptions.timeout,
      userEmail: formData.email,
      userDisplayName: `${formData.firstName} ${formData.lastName}`
    });
    
    console.log('Calling navigator.credentials.create...');
    const credential = await navigator.credentials.create({
      publicKey: webAuthnOptions
    }) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Registrierung abgebrochen');
    }
    
    console.log('Credential received:', {
      id: credential.id,
      type: credential.type,
      rawIdLength: credential.rawId.byteLength
    });
    
    // Schritt 3: Credential an Backend senden
    console.log('Sending credential to backend...');
    const credentialForBackend = {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
        clientDataJSON: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)),
        transports: (credential.response as AuthenticatorAttestationResponse).getTransports?.() || []
      },
      type: credential.type
    };
    
    console.log('Sending credential to backend:', {
      id: credentialForBackend.id,
      rawIdLength: credentialForBackend.rawId.length,
      responseKeys: Object.keys(credentialForBackend.response),
      transports: credentialForBackend.response.transports
    });
    
    const registrationResponse = await authApi.registerPasskey({
      credential: credentialForBackend,
      session_data: optionsResponse.data.session_data, // Pass session data for new user flow
      user_data: {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName
      }
    });
    
    if (registrationResponse.data) {
      console.log('Registration successful:', registrationResponse.data);
      
      // Prüfe ob es ein neuer Benutzer ist
      if ((registrationResponse.data as any).is_new_user && (registrationResponse.data as any).access) {
        console.log('New user registered and logged in automatically');
        
        // Speichere Tokens und Benutzerdaten
        localStorage.setItem('lcree_access', (registrationResponse.data as any).access);
        localStorage.setItem('lcree_refresh', (registrationResponse.data as any).refresh);
        localStorage.setItem('lcree_user', JSON.stringify((registrationResponse.data as any).user));
        
        // Navigiere zur Profilseite für Email-Verifizierung
        navigate('/profile');
      } else {
        console.log('Existing user - passkey added');
        navigate('/login?message=passkey_added');
      }
    } else if (registrationResponse.error) {
      const errorMessage = handlePasskeyError(registrationResponse.error);
      throw new Error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary theme-transition flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <BackgroundRenderer type={backgroundType} />

      <div className="relative w-full max-w-md">
        {/* Enhanced Header - EXACT COPY from Login */}
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
              <UserPlusIcon className="w-10 h-10 text-white relative z-10" />
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
            Account erstellen
          </motion.h1>
          
          <motion.p 
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Erstellen Sie Ihr LCREE-Konto und starten Sie durch
          </motion.p>
        </motion.div>

        {/* Enhanced Registration Form - EXACT COPY from Login */}
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
            {/* Passkey-Registrierung Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <motion.button
                type="button"
                onClick={() => setRegistrationMode(registrationMode === 'normal' ? 'passkey' : 'normal')}
                className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  registrationMode === 'normal'
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-600 hover:from-green-500/15 hover:to-emerald-500/15'
                    : 'bg-gradient-to-r from-gray-500/5 to-gray-600/5 border border-gray-500/20 text-gray-600 hover:from-gray-500/10 hover:to-gray-600/10'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>
                    {registrationMode === 'normal' 
                      ? 'Mit Passkey registrieren' 
                      : 'Zur normalen Registrierung'
                    }
                  </span>
                  <ArrowRightIcon className={`w-4 h-4 transition-transform duration-300 ${
                    registrationMode === 'passkey' ? 'rotate-180' : ''
                  }`} />
                </div>
              </motion.button>
            </motion.div>

            {/* Dummy Data Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-4"
            >
              <motion.button
                type="button"
                onClick={fillDummyData}
                className="w-full py-2 px-4 rounded-lg text-xs font-medium transition-all duration-300 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 text-blue-600 hover:from-blue-500/15 hover:to-indigo-500/15 hover:border-blue-500/40"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <SparklesIcon className="w-3 h-3" />
                  <span>Dummy-Daten ausfüllen</span>
                </div>
              </motion.button>
            </motion.div>

            <AnimatePresence mode="wait">
              {registrationMode === 'normal' ? (
                <motion.form
                  key="normal-registration"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name Field */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <FloatingLabel
                    id="firstName"
                    label="Vorname"
                    type="text"
                    value={formData.firstName}
                    onChange={(value) => handleInputChange('firstName', value)}
                    placeholder="Max"
                    disabled={isLoading}
                    error={errors.firstName}
                    icon={<UserIcon className="h-5 w-5 input-icon" />}
                  />
                </motion.div>

                {/* Last Name Field */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                >
                  <FloatingLabel
                    id="lastName"
                    label="Nachname"
                    type="text"
                    value={formData.lastName}
                    onChange={(value) => handleInputChange('lastName', value)}
                    placeholder="Mustermann"
                    disabled={isLoading}
                    error={errors.lastName}
                    icon={<UserIcon className="h-5 w-5 input-icon" />}
                  />
                </motion.div>
              </div>

              {/* E-Mail Field */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <FloatingLabel
                  id="email"
                  label="E-Mail Adresse"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="max@mustermann.com"
                  disabled={isLoading}
                  error={errors.email}
                  icon={<UserIcon className="h-5 w-5 input-icon" />}
                />
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <FloatingLabel
                  id="password"
                  label="Passwort"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(value) => handleInputChange('password', value)}
                  placeholder="Mindestens 8 Zeichen"
                  disabled={isLoading}
                  error={errors.password}
                  icon={<KeyIcon className="h-5 w-5 input-icon" />}
                  showPasswordToggle={true}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
                
                {/* Password Strength Meter */}
                <PasswordStrengthMeter password={formData.password} />
                
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-error text-sm mt-2 flex items-center"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              >
                <FloatingLabel
                  id="confirmPassword"
                  label="Passwort bestätigen"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Passwort wiederholen"
                  disabled={isLoading}
                  error={errors.confirmPassword}
                  icon={<KeyIcon className="h-5 w-5 input-icon" />}
                  showPasswordToggle={true}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </motion.div>

              {/* Terms and Conditions */}
              <motion.div 
                className="flex items-start space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <motion.input
                  type="checkbox"
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  className="mt-1 rounded border-border-primary text-accent-blue focus:ring-0 focus:outline-none"
                  disabled={isLoading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                />
                <label htmlFor="acceptTerms" className="text-sm text-text-secondary">
                  Ich stimme den{' '}
                  <a href="#" className="text-accent-blue hover:text-accent-violet transition-colors">
                    Nutzungsbedingungen
                  </a>{' '}
                  und der{' '}
                  <a href="#" className="text-accent-blue hover:text-accent-violet transition-colors">
                    Datenschutzerklärung
                  </a>{' '}
                  zu.
                </label>
              </motion.div>
              
              <AnimatePresence>
                {errors.acceptTerms && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-error text-sm flex items-center"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {errors.acceptTerms}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full button-primary mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <motion.div 
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Wird erstellt...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Account erstellen
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </div>
                )}
              </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="passkey-registration"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Name Fields - Gleiche wie normale Registrierung */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* First Name Field */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <FloatingLabel
                        id="firstName"
                        label="Vorname"
                        type="text"
                        value={formData.firstName}
                        onChange={(value) => handleInputChange('firstName', value)}
                        placeholder="Max"
                        disabled={isLoading}
                        error={errors.firstName}
                        icon={<UserIcon className="h-5 w-5 input-icon" />}
                      />
                    </motion.div>

                    {/* Last Name Field */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45, duration: 0.5 }}
                    >
                      <FloatingLabel
                        id="lastName"
                        label="Nachname"
                        type="text"
                        value={formData.lastName}
                        onChange={(value) => handleInputChange('lastName', value)}
                        placeholder="Mustermann"
                        disabled={isLoading}
                        error={errors.lastName}
                        icon={<UserIcon className="h-5 w-5 input-icon" />}
                      />
                    </motion.div>
                  </div>

                  {/* E-Mail Field */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <FloatingLabel
                      id="email"
                      label="E-Mail Adresse"
                      type="email"
                      value={formData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      placeholder="max@mustermann.com"
                      disabled={isLoading}
                      error={errors.email}
                      icon={<UserIcon className="h-5 w-5 input-icon" />}
                    />
                  </motion.div>

                  {/* Passkey Info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                      </motion.div>
                      <div>
                        <h3 className="text-sm font-semibold text-green-600 mb-1">
                          Sichere Passkey-Registrierung
                        </h3>
                        <p className="text-xs text-green-500/80">
                          Mit Passkeys können Sie sich ohne Passwort anmelden. Verwenden Sie Ihren Fingerabdruck, 
                          Gesichtserkennung oder ein Sicherheitsschlüssel.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Terms and Conditions */}
                  <motion.div 
                    className="flex items-start space-x-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <motion.input
                      type="checkbox"
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                      className="mt-1 rounded border-border-primary text-accent-blue focus:ring-0 focus:outline-none"
                      disabled={isLoading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-text-secondary">
                      Ich stimme den{' '}
                      <a href="#" className="text-accent-blue hover:text-accent-violet transition-colors">
                        Nutzungsbedingungen
                      </a>{' '}
                      und der{' '}
                      <a href="#" className="text-accent-blue hover:text-accent-violet transition-colors">
                        Datenschutzerklärung
                      </a>{' '}
                      zu.
                    </label>
                  </motion.div>
                  
                  <AnimatePresence>
                    {errors.acceptTerms && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-error text-sm flex items-center"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.acceptTerms}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full button-primary mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <motion.div 
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Passkey wird erstellt...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <ShieldCheckIcon className="w-5 h-5 mr-2" />
                        Mit Passkey registrieren
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Back to Login Text Link - Outside Card */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <motion.button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-accent-blue hover:text-accent-violet transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Zurück zur Anmeldung
          </motion.button>
        </motion.div>

        {/* Footer - EXACT COPY from Login */}
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


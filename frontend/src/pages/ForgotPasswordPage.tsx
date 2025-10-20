import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { SettingsButton } from '../components/SettingsButton';
import { FloatingLabel } from '../components/FloatingLabel';
import { authApi } from '../api/auth';
import { useBackgroundStore } from '../store/backgroundStore';

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { backgroundType } = useBackgroundStore();

  const validateForm = (): boolean => {
    const newErrors: Partial<ForgotPasswordFormData> = {};
    if (!formData.email) {
      newErrors.email = 'E-Mail Adresse ist erforderlich.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail Format.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ForgotPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authApi.requestPasswordReset({
        email: formData.email,
      });

      if (response.error) {
        setErrors({ email: response.error });
        return;
      }

      // Erfolgreiche Anfrage
      setIsSuccess(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setErrors({ email: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    
    try {
      const response = await authApi.requestPasswordReset({
        email: formData.email,
      });

      if (response.error) {
        alert(response.error);
      } else {
        alert('Reset-Link wurde erneut gesendet.');
      }
    } catch (err) {
      console.error('Resend email error:', err);
      alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
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
              <EnvelopeIcon className="w-10 h-10 text-white relative z-10" />
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
            Passwort vergessen?
          </motion.h1>
          
          <motion.p 
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Kein Problem! Wir senden Ihnen einen Link zum Zurücksetzen
          </motion.p>
        </motion.div>

        {/* Enhanced Form Card - EXACT COPY from Login */}
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
              {!isSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                      {/* E-Mail Field - EXACT COPY from Login */}
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

                  {/* Submit Button - EXACT COPY from Login */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full button-primary mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <motion.div 
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Wird gesendet...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Reset-Link senden
                        <ArrowLeftIcon className="w-5 h-5 ml-2 rotate-180" />
                      </div>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6"
                >
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-success to-emerald-500 rounded-full mx-auto flex items-center justify-center"
                  >
                    <CheckCircleIcon className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* Success Message */}
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                      E-Mail gesendet!
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts an{' '}
                      <span className="font-medium text-text-primary">{formData.email}</span> gesendet.
                    </p>
                    <p className="text-sm text-text-tertiary">
                      Prüfen Sie auch Ihren Spam-Ordner, falls die E-Mail nicht ankommt.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      onClick={handleResendEmail}
                      disabled={isLoading}
                      className="w-full p-3 rounded-lg border border-border-primary hover:bg-background-tertiary transition-colors flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full"
                          />
                          <span>Wird gesendet...</span>
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="w-5 h-5" />
                          <span>Erneut senden</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1 }}
                      onClick={() => navigate('/login')}
                      className="w-full button-primary flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                      <span>Zurück zur Anmeldung</span>
                    </motion.button>
                  </div>
                </motion.div>
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
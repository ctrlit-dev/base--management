import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authApi } from '../api/auth';

interface PasskeyLoginProps {
  onSuccess: (tokens: { access: string; refresh: string }, user: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const PasskeyLogin: React.FC<PasskeyLoginProps> = ({ onSuccess, onError, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'ready' | 'authenticating' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  const authenticateWithPasskey = async () => {
    setLoading(true);
    setStep('authenticating');
    setErrorMessage('');

    try {
      // Schritt 1: Authentifizierungsoptionen abrufen
      console.log('Requesting authentication options...');
      const optionsResponse = await authApi.getPasskeyAuthenticationOptions();
      if (!optionsResponse.data?.options) {
        throw new Error('Keine Authentifizierungsoptionen erhalten');
      }

      console.log('Authentication options received:', optionsResponse.data.options);

      // Schritt 2: Konvertiere Base64-Challenge zu ArrayBuffer
      const options = optionsResponse.data.options;
      const challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      
      console.log('Challenge converted to ArrayBuffer, length:', challenge.length);
      
      // Erstelle WebAuthn-kompatible Optionen
      const webAuthnOptions = {
        ...options,
        challenge: challenge.buffer,
        allowCredentials: options.allowCredentials?.map((cred: any) => {
          try {
            // Prüfe ob die ID bereits ein ArrayBuffer ist
            if (cred.id instanceof ArrayBuffer) {
              return {
                ...cred,
                id: cred.id
              };
            }
            
            // Versuche Base64-Dekodierung
            const decodedId = Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)).buffer;
            return {
              ...cred,
              id: decodedId
            };
          } catch (error) {
            console.warn('Failed to decode credential ID, skipping:', cred.id, error);
            // Überspringe ungültige Credential-IDs
            return null;
          }
        }).filter(Boolean) // Entferne null-Werte
      };

      console.log('WebAuthn options prepared:', {
        challengeLength: challenge.length,
        allowCredentialsCount: webAuthnOptions.allowCredentials?.length || 0,
        timeout: webAuthnOptions.timeout
      });

      // Schritt 3: WebAuthn-Authentifizierung durchführen
      console.log('Calling navigator.credentials.get...');
      const credential = await navigator.credentials.get({
        publicKey: webAuthnOptions
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentifizierung abgebrochen');
      }

      console.log('Credential received:', {
        id: credential.id,
        type: credential.type,
        rawIdLength: credential.rawId.byteLength
      });

      // Schritt 4: Credential an Backend senden
      console.log('Sending credential to backend...');
      const authResponse = await authApi.authenticatePasskey(credential);
      if (authResponse.data) {
        setStep('success');
        setTimeout(() => {
          onSuccess(
            { access: authResponse.data!.access, refresh: authResponse.data!.refresh },
            authResponse.data!.user
          );
        }, 1000);
      } else if (authResponse.error) {
        throw new Error(authResponse.error);
      }
    } catch (error: any) {
      console.error('Passkey authentication error:', error);
      setStep('error');
      
      let errorMsg = '';
      if (error.name === 'NotSupportedError') {
        errorMsg = 'Passkeys werden von diesem Browser nicht unterstützt';
      } else if (error.name === 'NotAllowedError') {
        errorMsg = 'Authentifizierung wurde abgebrochen';
      } else if (error.name === 'InvalidStateError') {
        errorMsg = 'Keine Passkeys für diesen Browser registriert';
      } else {
        errorMsg = error.message || error.error || 'Fehler bei der Passkey-Authentifizierung';
      }
      
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep('ready');
    setErrorMessage('');
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          {step === 'success' ? (
            <CheckCircleIcon className="w-8 h-8 text-white" />
          ) : step === 'error' ? (
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          ) : (
            <KeyIcon className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {step === 'success' ? 'Erfolgreich!' : 
           step === 'error' ? 'Fehler' : 
           'Mit Passkey anmelden'}
        </h2>

        {/* Description */}
        <p className="text-text-secondary mb-6">
          {step === 'success' ? 'Sie werden weitergeleitet...' :
           step === 'error' ? errorMessage :
           'Verwenden Sie Ihren Passkey für eine sichere Anmeldung'}
        </p>

        {/* Status */}
        {step === 'authenticating' && (
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-text-secondary">Authentifizierung läuft...</span>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {step === 'ready' && (
            <motion.button
              onClick={authenticateWithPasskey}
              disabled={loading}
              className="btn-passkey-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Authentifizierung läuft...' : 'Passkey verwenden'}
            </motion.button>
          )}

          {step === 'error' && (
            <div className="space-y-3">
              <motion.button
                onClick={handleRetry}
                className="btn-passkey-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Erneut versuchen
              </motion.button>
              {onCancel && (
                <motion.button
                  onClick={onCancel}
                  className="btn-passkey-cancel"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Abbrechen
                </motion.button>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-green-600 font-medium">
              ✓ Authentifizierung erfolgreich
            </div>
          )}
        </div>

        {/* Info */}
        {step === 'ready' && (
          <div className="mt-6 text-xs text-text-tertiary">
            Verwenden Sie Touch ID, Face ID, Windows Hello oder einen Sicherheitsschlüssel
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PasskeyLogin;

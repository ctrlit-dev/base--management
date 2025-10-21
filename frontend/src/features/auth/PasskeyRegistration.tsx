import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  KeyIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { authApi } from '../../lib/api/auth';
import { PrimaryButton } from '../../components/ui/buttons/ButtonComponents';

interface PasskeyRegistrationProps {
  onSuccess: (tokens: { access: string; refresh: string }, user: any) => void;
  onError: (error: string) => void;
}

type RegistrationStep = 'idle' | 'registering' | 'success' | 'error';

const PasskeyRegistration: React.FC<PasskeyRegistrationProps> = ({ onSuccess, onError }) => {
  const [step, setStep] = useState<RegistrationStep>('idle');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const registerWithPasskey = async () => {
    setLoading(true);
    setStep('registering');
    setErrorMessage('');
    
    try {
      console.log('Starting Passkey registration for new user...');
      
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
      
      // Erstelle WebAuthn-kompatible Optionen
      const webAuthnOptions = {
        challenge: challenge.buffer,
        rp: {
          id: "localhost",  // Explizit localhost setzen
          name: "LCREE Parfum System"
        },
        user: {
          id: userId.buffer,
          name: options.user.name,
          displayName: options.user.displayName
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
        timeout: 30000,  // 30 Sekunden für lokale Entwicklung
        attestation: "none" as AttestationConveyancePreference,
        authenticatorSelection: {
          userVerification: "discouraged" as UserVerificationRequirement,
          residentKey: "discouraged" as ResidentKeyRequirement,
          authenticatorAttachment: "cross-platform" as AuthenticatorAttachment // Verwende Cross-Platform für neue Benutzer
        },
        // Für neue Benutzer: Keine excludeCredentials verwenden
        excludeCredentials: []
      };
      
      console.log('WebAuthn options prepared:', {
        challengeLength: challenge.length,
        userIdLength: userId.length,
        timeout: webAuthnOptions.timeout,
        authenticatorAttachment: webAuthnOptions.authenticatorSelection.authenticatorAttachment
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
      
      const registrationResponse = await authApi.registerPasskey(credentialForBackend);
      
      if (registrationResponse.data) {
        setStep('success');
        console.log('Registration successful:', registrationResponse.data);
        
        // Prüfe ob es ein neuer Benutzer ist
        if (registrationResponse.data.is_new_user && registrationResponse.data.access) {
          console.log('New user registered and logged in automatically');
          setTimeout(() => {
            onSuccess(
              { 
                access: registrationResponse.data!.access, 
                refresh: registrationResponse.data!.refresh 
              },
              registrationResponse.data!.user
            );
          }, 1000);
        } else {
          console.log('Existing user - passkey added');
          setTimeout(() => {
            setStep('idle');
          }, 2000);
        }
      } else if (registrationResponse.error) {
        throw new Error(registrationResponse.error);
      }
      
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      setStep('error');
      
      let errorMsg = 'Registrierung fehlgeschlagen';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Registrierung wurde abgebrochen oder nicht erlaubt';
      } else if (error.name === 'InvalidStateError') {
        errorMsg = 'Authenticator ist bereits registriert';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Passkeys werden von diesem Browser nicht unterstützt';
      } else if (error.name === 'SecurityError') {
        errorMsg = 'Sicherheitsfehler - verwenden Sie HTTPS oder localhost';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'idle':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <KeyIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Mit Passkey registrieren
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Erstellen Sie einen sicheren Account ohne Passwort. Verwenden Sie Ihr Smartphone oder einen Sicherheitsschlüssel.
            </p>
            <PrimaryButton
              onClick={registerWithPasskey}
              disabled={loading}
              loading={loading}
              loadingText="Registrierung läuft..."
              leftIcon={<KeyIcon className="h-5 w-5" />}
              fullWidth
            >
              Passkey registrieren
            </PrimaryButton>
          </div>
        );

      case 'registering':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Passkey wird erstellt...
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bitte folgen Sie den Anweisungen auf Ihrem Gerät
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                Scannen Sie den QR-Code mit Ihrem Smartphone
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                Oder verwenden Sie Windows Hello / Touch ID
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Registrierung erfolgreich!
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Sie wurden automatisch angemeldet. Bitte verifizieren Sie Ihre E-Mail-Adresse.
            </p>
            <div className="flex items-center justify-center text-sm text-blue-600">
              <ArrowRightIcon className="h-4 w-4 mr-1" />
              Weiterleitung zur Profilseite...
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Registrierung fehlgeschlagen
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {errorMessage}
            </p>
            <button
              onClick={() => {
                setStep('idle');
                setErrorMessage('');
              }}
              className="btn-secondary-outline"
            >
              Erneut versuchen
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      {renderContent()}
    </motion.div>
  );
};

export default PasskeyRegistration;

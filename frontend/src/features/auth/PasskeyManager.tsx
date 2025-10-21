import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { authApi } from '../../lib/api/auth';
import { passkeyLogger } from '../../lib/logger';

interface PasskeyCredential {
  id: number;
  credential_id: string;
  credential_id_display: string;
  transports: string[];
  attestation_type: string;
  created_at: string;
  last_used_at: string | null;
  sign_count: number;
}

interface PasskeyManagerProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const PasskeyManager: React.FC<PasskeyManagerProps> = ({ onSuccess, onError }) => {
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Lade Passkeys beim Mount
  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    setLoading(true);
    try {
      const response = await authApi.getPasskeys();
      if (response.data) {
        setCredentials(response.data.credentials);
      } else if (response.error) {
        onError?.(response.error);
      }
    } catch (_error) {
      onError?.('Fehler beim Laden der Passkeys');
    } finally {
      setLoading(false);
    }
  };

  const registerPasskey = async () => {
    setRegistering(true);
    
    // Debug-Logging aktivieren
    const debugLog = (message: string, data?: any) => {
      passkeyLogger.debug(message, data);
    };
    
    try {
      debugLog('Starting passkey registration process');
      
      // Schritt 1: Registrierungsoptionen abrufen
      debugLog('Step 1: Getting registration options');
      const optionsResponse = await authApi.getPasskeyRegistrationOptions();
      
      if (!optionsResponse.data?.options) {
        debugLog('ERROR: No registration options received', optionsResponse);
        throw new Error('Keine Registrierungsoptionen erhalten');
      }

      debugLog('Registration options received successfully', {
        hasOptions: !!optionsResponse.data.options,
        hasSessionData: !!(optionsResponse.data as any).session_data,
        optionsKeys: Object.keys(optionsResponse.data.options),
        sessionDataKeys: Object.keys((optionsResponse.data as any).session_data || {})
      });

      passkeyLogger.info('Registration options received', optionsResponse.data.options);
      passkeyLogger.info('Session data received', (optionsResponse.data as any).session_data);

      // Speichere Session-Daten für späteren Gebrauch
      const sessionData = (optionsResponse.data as any).session_data;
      if (sessionData) {
        localStorage.setItem('passkey_session_data', JSON.stringify(sessionData));
        debugLog('Session data saved to localStorage', sessionData);
      }

      // Schritt 2: Konvertiere Base64-Challenge zu ArrayBuffer
      debugLog('Step 2: Converting Base64 data to ArrayBuffer');
      const options = optionsResponse.data.options;
      const challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      
      debugLog('Challenge conversion', {
        originalChallenge: options.challenge.substring(0, 20) + '...',
        challengeLength: challenge.length,
        challengeBufferLength: challenge.buffer.byteLength
      });
      
      // Konvertiere user.id von Base64 zu ArrayBuffer
      const userId = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));
      
      debugLog('User ID conversion', {
        originalUserId: options.user.id.substring(0, 20) + '...',
        userIdLength: userId.length,
        userIdBufferLength: userId.buffer.byteLength
      });

      // Erstelle WebAuthn-kompatible Optionen
      debugLog('Step 3: Creating WebAuthn-compatible options');
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
        attestation: "none",
        authenticatorSelection: {
          userVerification: "discouraged",
          residentKey: "discouraged",
          authenticatorAttachment: "cross-platform" // Verwende Cross-Platform für zusätzliche Passkeys
        },
        // Für lokale Entwicklung: Keine excludeCredentials verwenden
        // Windows Hello hat Probleme mit mehreren Passkeys für dieselbe Domain
        excludeCredentials: [] // Leer lassen für lokale Entwicklung
      };

      debugLog('WebAuthn options prepared', {
        hasChallenge: !!webAuthnOptions.challenge,
        hasUser: !!webAuthnOptions.user,
        hasExcludeCredentials: !!webAuthnOptions.excludeCredentials,
        excludeCredentialsCount: webAuthnOptions.excludeCredentials?.length || 0,
        timeout: webAuthnOptions.timeout,
        authenticatorSelection: webAuthnOptions.authenticatorSelection
      });

      passkeyLogger.debug('WebAuthn options prepared', {
        ...webAuthnOptions,
        challenge: '[ArrayBuffer]',
        user: { ...webAuthnOptions.user, id: '[ArrayBuffer]' }
      });

      // Schritt 3: WebAuthn-Registrierung durchführen
      debugLog('Step 4: Calling navigator.credentials.create');
      
      // Zusätzliche Debugging-Informationen
      passkeyLogger.debug('Final WebAuthn options before create', {
        rp: webAuthnOptions.rp,
        user: { ...webAuthnOptions.user, id: '[ArrayBuffer]' },
        challenge: '[ArrayBuffer]',
        pubKeyCredParams: webAuthnOptions.pubKeyCredParams,
        timeout: webAuthnOptions.timeout,
        attestation: webAuthnOptions.attestation,
        authenticatorSelection: webAuthnOptions.authenticatorSelection,
        excludeCredentials: webAuthnOptions.excludeCredentials?.length || 0
      });
      
      // Prüfe WebAuthn-Unterstützung
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn wird von diesem Browser nicht unterstützt');
      }
      
      // Prüfe ob der Browser Passkeys unterstützt
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      passkeyLogger.debug('Platform authenticator available', available);
      
      // Prüfe weitere WebAuthn-Features
      passkeyLogger.debug('WebAuthn features check', {
        publicKeyCredentialSupported: !!window.PublicKeyCredential,
        navigatorCredentialsSupported: !!navigator.credentials,
        createSupported: typeof navigator.credentials.create === 'function',
        currentOrigin: window.location.origin,
        currentProtocol: window.location.protocol,
        isSecureContext: window.isSecureContext,
        userAgent: navigator.userAgent
      });
      
      const credential = await navigator.credentials.create({
        publicKey: webAuthnOptions
      }) as PublicKeyCredential;

      if (!credential) {
        debugLog('ERROR: Credential creation was cancelled or failed');
        throw new Error('Registrierung abgebrochen');
      }

      debugLog('Credential created successfully', {
        id: credential.id,
        type: credential.type,
        rawIdLength: credential.rawId.byteLength,
        responseType: credential.response?.constructor?.name
      });

      // Schritt 4: Konvertiere Credential für Backend
      debugLog('Step 5: Converting credential for backend');
      const credentialForBackend = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
          clientDataJSON: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)),
          transports: (credential.response as AuthenticatorAttestationResponse).getTransports?.() || []
        },
        type: credential.type,
        session_data: sessionData // Füge Session-Daten hinzu
      };

      // Zusätzlich: Füge Session-Daten auch auf oberster Ebene hinzu für Fallback
      const requestData = {
        credential: credentialForBackend,
        session_data: sessionData // Doppelte Sicherheit
      };

      debugLog('Request data prepared', {
        credentialId: credentialForBackend.id,
        rawIdLength: credentialForBackend.rawId.length,
        responseKeys: Object.keys(credentialForBackend.response),
        transports: credentialForBackend.response.transports,
        hasSessionData: !!sessionData
      });

      passkeyLogger.debug('Request data prepared', {
        credentialId: credentialForBackend.id,
        rawIdLength: credentialForBackend.rawId.length,
        responseKeys: Object.keys(credentialForBackend.response),
        transports: credentialForBackend.response.transports,
        sessionData: sessionData
      });

      // Schritt 5: Credential an Backend senden
      debugLog('Step 6: Sending credential to backend');
      const registerResponse = await authApi.registerPasskey(requestData);
      
      debugLog('Backend response received', {
        hasData: !!registerResponse.data,
        hasError: !!registerResponse.error,
        hasMessage: !!registerResponse.message,
        responseKeys: Object.keys(registerResponse)
      });
      
      if (registerResponse.data) {
        debugLog('SUCCESS: Passkey registered successfully');
        onSuccess?.('Passkey erfolgreich registriert!');
        await loadPasskeys(); // Liste aktualisieren
        // Bereinige Session-Daten
        localStorage.removeItem('passkey_session_data');
      } else if (registerResponse.error) {
        debugLog('ERROR: Backend returned error', registerResponse.error);
        passkeyLogger.error('Registration error', registerResponse.error);
        onError?.(registerResponse.error);
      }
    } catch (error: any) {
      debugLog('ERROR: Registration failed', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) + '...'
      });
      
      passkeyLogger.error('Registration error details', error);
      passkeyLogger.error('Error stack', error.stack);
      
      // Bereinige Session-Daten bei Fehler
      localStorage.removeItem('passkey_session_data');
      
      // WebAuthn-spezifische Fehler
      if (error.name === 'NotSupportedError') {
        debugLog('ERROR: Browser does not support WebAuthn');
        onError?.('Passkeys werden von diesem Browser nicht unterstützt. Bitte verwenden Sie einen modernen Browser wie Chrome, Firefox oder Safari.');
      } else if (error.name === 'NotAllowedError') {
        debugLog('ERROR: User cancelled or denied registration');
        passkeyLogger.warn('NotAllowedError details', error);
        passkeyLogger.warn('Possible causes', {
          userCancelled: 'User cancelled the operation',
          timeout: 'Timeout occurred',
          browserRestrictions: 'Browser security restrictions',
          invalidOptions: 'Invalid WebAuthn options'
        });
        onError?.('Registrierung wurde abgebrochen oder verweigert. Mögliche Ursachen: Zeitüberschreitung, Browser-Sicherheitsbeschränkungen oder ungültige Optionen. Bitte versuchen Sie es erneut.');
      } else if (error.name === 'InvalidStateError') {
        debugLog('ERROR: Passkey already exists for this browser');
        onError?.('Ein Passkey ist bereits für diesen Browser registriert. Bitte verwenden Sie ein anderes Gerät oder löschen Sie den bestehenden Passkey.');
      } else if (error.name === 'ConstraintError') {
        debugLog('ERROR: Authenticator does not meet requirements');
        onError?.('Das Authenticator-Gerät erfüllt nicht die Sicherheitsanforderungen. Bitte verwenden Sie ein anderes Gerät.');
      } else if (error.name === 'UnknownError') {
        debugLog('ERROR: Unknown WebAuthn error');
        onError?.('Unbekannter Fehler bei der Passkey-Registrierung. Bitte versuchen Sie es erneut.');
      } else if (error.name === 'SecurityError') {
        debugLog('ERROR: Security error (likely HTTPS required)');
        onError?.('Sicherheitsfehler. Bitte stellen Sie sicher, dass Sie eine sichere Verbindung verwenden (HTTPS).');
      } else if (error.name === 'AbortError') {
        debugLog('ERROR: Registration was aborted');
        onError?.('Registrierung wurde abgebrochen. Bitte versuchen Sie es erneut.');
      } else {
        // Backend-Fehler oder andere Fehler
        debugLog('ERROR: Other error occurred', error);
        const errorMessage = error.message || error.error || 'Fehler bei der Passkey-Registrierung';
        onError?.(errorMessage);
      }
    } finally {
      setRegistering(false);
    }
  };

  const deletePasskey = async (credentialId: string) => {
    setDeleting(credentialId);
    try {
      const response = await authApi.deletePasskey(credentialId);
      if (response.data || response.message) {
        onSuccess?.('Passkey erfolgreich entfernt!');
        await loadPasskeys(); // Liste aktualisieren
      } else if (response.error) {
        onError?.(response.error);
      }
    } catch (_error) {
      onError?.('Fehler beim Löschen des Passkeys');
    } finally {
      setDeleting(null);
    }
  };

  const getTransportIcon = (transports: string[]) => {
    if (transports.includes('internal')) {
      return <ComputerDesktopIcon className="w-5 h-5" />;
    } else if (transports.includes('usb') || transports.includes('nfc') || transports.includes('ble')) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />;
    }
    return <KeyIcon className="w-5 h-5" />;
  };

  const getTransportText = (transports: string[]) => {
    if (transports.includes('internal')) {
      return 'Integriert (Touch ID, Face ID, Windows Hello)';
    } else if (transports.includes('usb')) {
      return 'USB-Sicherheitsschlüssel';
    } else if (transports.includes('nfc')) {
      return 'NFC-Sicherheitsschlüssel';
    } else if (transports.includes('ble')) {
      return 'Bluetooth-Sicherheitsschlüssel';
    }
    return 'Unbekanntes Gerät';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <KeyIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Passkeys</h2>
            <p className="text-text-secondary">Verwalten Sie Ihre passwortlosen Anmeldedaten</p>
          </div>
        </div>
        
        <motion.button
          onClick={registerPasskey}
          disabled={registering}
          className="btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {registering ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Registriere...</span>
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              <span>Passkey hinzufügen</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Passkeys Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-text-secondary">Lade Passkeys...</span>
        </div>
      ) : credentials.length > 0 ? (
        <div className="space-y-4">
          {credentials.map((credential) => (
            <motion.div
              key={credential.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    {getTransportIcon(credential.transports)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {getTransportText(credential.transports)}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>Erstellt: {formatDate(credential.created_at)}</span>
                      </div>
                      {credential.last_used_at && (
                        <div className="flex items-center space-x-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Zuletzt verwendet: {formatDate(credential.last_used_at)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-text-tertiary mt-1">
                      ID: {credential.credential_id_display} • {credential.sign_count} Verwendungen
                    </div>
                  </div>
                </div>
                
                <motion.button
                  onClick={() => deletePasskey(credential.credential_id)}
                  disabled={deleting === credential.credential_id}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {deleting === credential.credential_id ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <TrashIcon className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Keine Passkeys vorhanden</h3>
          <p className="text-text-secondary mb-6">
            Registrieren Sie Ihren ersten Passkey für eine sichere, passwortlose Anmeldung.
          </p>
          <motion.button
            onClick={registerPasskey}
            disabled={registering}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {registering ? 'Registriere...' : 'Ersten Passkey registrieren'}
          </motion.button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Was sind Passkeys?</h4>
            <p className="text-sm text-blue-700">
              Passkeys sind eine moderne, sichere Alternative zu Passwörtern. Sie verwenden biometrische Daten 
              (Touch ID, Face ID, Windows Hello) oder Sicherheitsschlüssel für die Anmeldung. 
              Sie sind phishing-sicher und funktionieren ohne Passwörter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasskeyManager;

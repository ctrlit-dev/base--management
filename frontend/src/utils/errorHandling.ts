/**
 * Error Handling Utilities
 * =======================
 * 
 * Zentrale Fehlerbehandlung für API-Aufrufe und Formulare.
 * Bietet konsistente Fehlerbehandlung im gesamten System.
 */

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  status?: number;
}

export interface FormError {
  field: string;
  message: string;
}

/**
 * Behandelt API-Fehler und gibt benutzerfreundliche Nachrichten zurück
 * 
 * @param error - Der aufgetretene Fehler
 * @param fallbackMessage - Fallback-Nachricht falls keine spezifische gefunden wird
 * @returns Benutzerfreundliche Fehlermeldung
 */
export const handleApiError = (error: any, fallbackMessage?: string): string => {
  // Wenn es bereits eine formatierte Nachricht ist
  if (typeof error === 'string') {
    return error;
  }

  // Backend-Fehler mit strukturierten Daten
  if (error?.error) {
    return error.error;
  }

  // Django REST Framework Fehler
  if (error?.errors) {
    // Wenn es Feld-spezifische Fehler sind, nimm den ersten
    if (typeof error.errors === 'object') {
      const firstError = Object.values(error.errors)[0];
      if (Array.isArray(firstError)) {
        return firstError[0] as string;
      }
      return firstError as string;
    }
    return error.errors;
  }

  // HTTP-Status-spezifische Fehler
  if (error?.status) {
    switch (error.status) {
      case 400:
        return 'Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Eingaben.';
      case 401:
        return 'Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.';
      case 403:
        return 'Sie haben keine Berechtigung für diese Aktion.';
      case 404:
        return 'Die angeforderte Ressource wurde nicht gefunden.';
      case 409:
        return 'Ein Konflikt ist aufgetreten. Möglicherweise existiert der Datensatz bereits.';
      case 422:
        return 'Die Eingabedaten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.';
      case 429:
        return 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
      case 500:
        return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
      case 502:
      case 503:
      case 504:
        return 'Der Server ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
      default:
        return fallbackMessage || 'Ein unbekannter Fehler ist aufgetreten.';
    }
  }

  // Netzwerk-Fehler
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
  }

  // WebAuthn-spezifische Fehler
  if (error?.name) {
    switch (error.name) {
      case 'NotSupportedError':
        return 'Passkeys werden von diesem Browser nicht unterstützt. Bitte verwenden Sie einen modernen Browser.';
      case 'NotAllowedError':
        return 'Die Passkey-Operation wurde abgebrochen oder verweigert.';
      case 'InvalidStateError':
        return 'Ein Passkey ist bereits für diesen Browser registriert.';
      case 'ConstraintError':
        return 'Das Authenticator-Gerät erfüllt nicht die Sicherheitsanforderungen.';
      case 'SecurityError':
        return 'Sicherheitsfehler. Bitte verwenden Sie eine sichere Verbindung (HTTPS).';
      case 'AbortError':
        return 'Die Operation wurde abgebrochen.';
      default:
        return error.message || fallbackMessage || 'Ein unbekannter Fehler ist aufgetreten.';
    }
  }

  // Fallback für unbekannte Fehler
  return error?.message || fallbackMessage || 'Ein unbekannter Fehler ist aufgetreten.';
};

/**
 * Behandelt Formular-Fehler und gibt strukturierte Fehler zurück
 * 
 * @param error - Der aufgetretene Fehler
 * @returns Array von Formular-Fehlern
 */
export const handleFormError = (error: any): FormError[] => {
  const errors: FormError[] = [];

  // Backend-Fehler mit Feld-spezifischen Nachrichten
  if (error?.errors && typeof error.errors === 'object') {
    Object.entries(error.errors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        errors.push({
          field,
          message: messages[0] as string
        });
      } else {
        errors.push({
          field,
          message: messages as string
        });
      }
    });
  }

  // Allgemeine Fehler
  if (errors.length === 0 && error?.error) {
    errors.push({
      field: 'general',
      message: error.error
    });
  }

  return errors;
};

/**
 * Behandelt Passkey-spezifische Fehler
 * 
 * @param error - Der aufgetretene Passkey-Fehler
 * @returns Benutzerfreundliche Passkey-Fehlermeldung
 */
export const handlePasskeyError = (error: any): string => {
  // WebAuthn-Fehler haben bereits spezifische Behandlung in handleApiError
  if (error?.name) {
    return handleApiError(error);
  }

  // Backend-Passkey-Fehler
  if (error?.error) {
    const errorMessage = error.error.toLowerCase();
    
    if (errorMessage.includes('origin')) {
      return 'Origin-Verifikation fehlgeschlagen. Dies kann bei Cross-Device Authentication auftreten.';
    }
    if (errorMessage.includes('challenge')) {
      return 'Challenge-Verifikation fehlgeschlagen. Die Registrierungssession ist abgelaufen.';
    }
    if (errorMessage.includes('signature')) {
      return 'Signatur-Verifikation fehlgeschlagen. Das Authenticator-Gerät konnte nicht verifiziert werden.';
    }
    if (errorMessage.includes('credential')) {
      return 'Passkey-Credential nicht gefunden oder ungültig.';
    }
    
    return error.error;
  }

  return handleApiError(error, 'Fehler bei der Passkey-Operation');
};

/**
 * Loggt Fehler für Debugging-Zwecke
 * 
 * @param error - Der zu loggende Fehler
 * @param context - Zusätzlicher Kontext für das Logging
 */
export const logError = (error: any, context?: string): void => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  
  console.error(`${contextStr}[${timestamp}] Error:`, error);
  
  // In Produktion könnten hier zusätzliche Logging-Services aufgerufen werden
  // z.B. Sentry, LogRocket, etc.
};

/**
 * Erstellt eine benutzerfreundliche Fehlermeldung für verschiedene Szenarien
 * 
 * @param scenario - Das Fehler-Szenario
 * @param details - Zusätzliche Details
 * @returns Benutzerfreundliche Nachricht
 */
export const createErrorMessage = (scenario: string, details?: any): string => {
  switch (scenario) {
    case 'network':
      return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
    case 'timeout':
      return 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.';
    case 'validation':
      return 'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.';
    case 'authentication':
      return 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
    case 'authorization':
      return 'Sie haben keine Berechtigung für diese Aktion.';
    case 'not_found':
      return 'Die angeforderte Ressource wurde nicht gefunden.';
    case 'server_error':
      return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
    case 'passkey_registration':
      return 'Passkey-Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
    case 'passkey_authentication':
      return 'Passkey-Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
    default:
      return details?.message || 'Ein unbekannter Fehler ist aufgetreten.';
  }
};

/**
 * Retry-Logik für fehlgeschlagene API-Aufrufe
 * 
 * @param fn - Die auszuführende Funktion
 * @param maxRetries - Maximale Anzahl von Wiederholungen
 * @param delay - Verzögerung zwischen Wiederholungen in ms
 * @returns Promise mit dem Ergebnis der Funktion
 */
export const retryApiCall = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Bei bestimmten Fehlern nicht wiederholen
      if (error?.status && [400, 401, 403, 404, 422].includes(error.status)) {
        throw error;
      }
      
      // Bei der letzten Versuch den Fehler werfen
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Warten vor dem nächsten Versuch
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
};

/**
 * Password Utilities
 * ==================
 * 
 * Zentrale Funktionen für Passwort-Validierung und -Stärke-Berechnung.
 * Eliminiert Code-Duplikation zwischen Login/Register/Profile-Komponenten.
 */

export interface PasswordStrengthChecks {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export interface PasswordStrength {
  score: number;
  checks: PasswordStrengthChecks;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

/**
 * Berechnet die Stärke eines Passworts
 * 
 * @param password - Das zu bewertende Passwort
 * @returns PasswordStrength-Objekt mit Score und Checks
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  const checks: PasswordStrengthChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // Zähle erfüllte Kriterien
  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  // Bestimme Stärke-Level
  let strength: PasswordStrength['strength'];
  if (score <= 1) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'medium';
  } else if (score <= 4) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    score,
    checks,
    strength
  };
};

/**
 * Validiert ein Passwort gegen alle Kriterien
 * 
 * @param password - Das zu validierende Passwort
 * @returns Objekt mit Validierungsstatus und Fehlermeldungen
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const strength = calculatePasswordStrength(password);
  const errors: string[] = [];

  if (!strength.checks.length) {
    errors.push('Passwort muss mindestens 8 Zeichen lang sein');
  }
  if (!strength.checks.lowercase) {
    errors.push('Passwort muss Kleinbuchstaben enthalten');
  }
  if (!strength.checks.uppercase) {
    errors.push('Passwort muss Großbuchstaben enthalten');
  }
  if (!strength.checks.number) {
    errors.push('Passwort muss Zahlen enthalten');
  }
  if (!strength.checks.special) {
    errors.push('Passwort muss Sonderzeichen enthalten');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generiert eine Passwort-Stärke-Farbe basierend auf dem Score
 * 
 * @param strength - Die Passwort-Stärke
 * @returns CSS-Klassenname für die Farbe
 */
export const getPasswordStrengthColor = (strength: PasswordStrength['strength']): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-blue-500';
    case 'very-strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Generiert eine Passwort-Stärke-Hintergrundfarbe
 * 
 * @param strength - Die Passwort-Stärke
 * @returns CSS-Klassenname für die Hintergrundfarbe
 */
export const getPasswordStrengthBgColor = (strength: PasswordStrength['strength']): string => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-blue-500';
    case 'very-strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Übersetzt Passwort-Stärke in deutschen Text
 * 
 * @param strength - Die Passwort-Stärke
 * @returns Deutscher Text für die Stärke
 */
export const getPasswordStrengthText = (strength: PasswordStrength['strength']): string => {
  switch (strength) {
    case 'weak':
      return 'Schwach';
    case 'medium':
      return 'Mittel';
    case 'strong':
      return 'Stark';
    case 'very-strong':
      return 'Sehr stark';
    default:
      return 'Unbekannt';
  }
};

/**
 * Prüft, ob zwei Passwörter übereinstimmen
 * 
 * @param password - Das ursprüngliche Passwort
 * @param confirmPassword - Das zu bestätigende Passwort
 * @returns Objekt mit Validierungsstatus und Fehlermeldung
 */
export const validatePasswordConfirmation = (
  password: string, 
  confirmPassword: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (!confirmPassword) {
    return {
      isValid: false,
      error: 'Passwort-Bestätigung ist erforderlich'
    };
  }
  
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwörter stimmen nicht überein'
    };
  }
  
  return { isValid: true };
};

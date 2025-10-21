/**
 * Zentrale Form-Validierung für Admin-Bereich
 * ===========================================
 * 
 * DRY-Prinzip: Wiederverwendbare Validierungsfunktionen für alle Admin-Formulare
 * um Duplikation zu vermeiden und Konsistenz zu gewährleisten.
 * 
 * Design und Funktionalität bleiben unverändert!
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// E-Mail-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'E-Mail-Adresse ist erforderlich';
  }
  
  if (!/\S+@\S+\.\S+/.test(email)) {
    return 'Ungültige E-Mail-Adresse';
  }
  
  return null;
};

// Passwort-Validierung - zentrale Funktion für alle Admin-Formulare
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Passwort ist erforderlich';
  }
  
  if (password.length < 8) {
    return 'Passwort muss mindestens 8 Zeichen lang sein';
  }
  
  return null;
};

// Passwort-Bestätigung - zentrale Funktion für alle Admin-Formulare
export const validatePasswordConfirm = (password: string, passwordConfirm: string): string | null => {
  if (!passwordConfirm) {
    return 'Passwort-Bestätigung ist erforderlich';
  }
  
  if (password !== passwordConfirm) {
    return 'Passwörter stimmen nicht überein';
  }
  
  return null;
};

// Name-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateName = (name: string, fieldName: string): string | null => {
  if (!name || !name.trim()) {
    return `${fieldName} ist erforderlich`;
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} muss mindestens 2 Zeichen lang sein`;
  }
  
  return null;
};

// Vorname-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateFirstName = (firstName: string): string | null => {
  return validateName(firstName, 'Vorname');
};

// Nachname-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateLastName = (lastName: string): string | null => {
  return validateName(lastName, 'Nachname');
};

// Rolle-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateRole = (role: string): string | null => {
  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'GUEST'];
  
  if (!role) {
    return 'Rolle ist erforderlich';
  }
  
  if (!validRoles.includes(role)) {
    return 'Ungültige Rolle ausgewählt';
  }
  
  return null;
};

// Sprache-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateLanguage = (language: string): string | null => {
  const validLanguages = ['de', 'en'];
  
  if (!language) {
    return 'Sprache ist erforderlich';
  }
  
  if (!validLanguages.includes(language)) {
    return 'Ungültige Sprache ausgewählt';
  }
  
  return null;
};

// Zeitzone-Validierung - zentrale Funktion für alle Admin-Formulare
export const validateTimezone = (timezone: string): string | null => {
  const validTimezones = ['Europe/Berlin', 'UTC'];
  
  if (!timezone) {
    return 'Zeitzone ist erforderlich';
  }
  
  if (!validTimezones.includes(timezone)) {
    return 'Ungültige Zeitzone ausgewählt';
  }
  
  return null;
};

// Benutzer-Erstellung-Validierung - zentrale Funktion für AddUserModal
export const validateCreateUser = (userData: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role: string;
  language?: string;
  timezone?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // E-Mail validieren
  const emailError = validateEmail(userData.email);
  if (emailError) errors.email = emailError;
  
  // Namen validieren
  const firstNameError = validateFirstName(userData.first_name);
  if (firstNameError) errors.first_name = firstNameError;
  
  const lastNameError = validateLastName(userData.last_name);
  if (lastNameError) errors.last_name = lastNameError;
  
  // Passwort validieren
  const passwordError = validatePassword(userData.password);
  if (passwordError) errors.password = passwordError;
  
  const passwordConfirmError = validatePasswordConfirm(userData.password, userData.password_confirm);
  if (passwordConfirmError) errors.password_confirm = passwordConfirmError;
  
  // Rolle validieren
  const roleError = validateRole(userData.role);
  if (roleError) errors.role = roleError;
  
  // Optionale Felder validieren
  if (userData.language) {
    const languageError = validateLanguage(userData.language);
    if (languageError) errors.language = languageError;
  }
  
  if (userData.timezone) {
    const timezoneError = validateTimezone(userData.timezone);
    if (timezoneError) errors.timezone = timezoneError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Benutzer-Update-Validierung - zentrale Funktion für EditUserModal
export const validateUpdateUser = (userData: {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  language?: string;
  timezone?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Nur vorhandene Felder validieren
  if (userData.email !== undefined) {
    const emailError = validateEmail(userData.email);
    if (emailError) errors.email = emailError;
  }
  
  if (userData.first_name !== undefined) {
    const firstNameError = validateFirstName(userData.first_name);
    if (firstNameError) errors.first_name = firstNameError;
  }
  
  if (userData.last_name !== undefined) {
    const lastNameError = validateLastName(userData.last_name);
    if (lastNameError) errors.last_name = lastNameError;
  }
  
  if (userData.role !== undefined) {
    const roleError = validateRole(userData.role);
    if (roleError) errors.role = roleError;
  }
  
  if (userData.language !== undefined) {
    const languageError = validateLanguage(userData.language);
    if (languageError) errors.language = languageError;
  }
  
  if (userData.timezone !== undefined) {
    const timezoneError = validateTimezone(userData.timezone);
    if (timezoneError) errors.timezone = timezoneError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { 
  calculatePasswordStrength, 
  getPasswordStrengthColor, 
  getPasswordStrengthBgColor, 
  getPasswordStrengthText
} from '../utils/passwordUtils';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

/**
 * Wiederverwendbare Passwort-Stärke-Anzeige
 * 
 * Zeigt die Stärke eines Passworts mit visueller Fortschrittsanzeige
 * und optionalen Anforderungen an.
 */
export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRequirements = true,
  className = ''
}) => {
  const passwordStrength = calculatePasswordStrength(password);

  // Zeige nichts an, wenn kein Passwort eingegeben wurde
  if (!password) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`mt-3 ${className}`}
    >
      <div className="space-y-2">
        {/* Stärke-Balken */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-500 ${getPasswordStrengthBgColor(passwordStrength.strength)}`}
              initial={{ width: 0 }}
              animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength.strength)}`}>
            {getPasswordStrengthText(passwordStrength.strength)}
          </span>
        </div>

        {/* Anforderungen */}
        {showRequirements && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
            <div className={`flex items-center space-x-2 ${
              passwordStrength.checks.length ? 'text-green-500' : 'text-gray-400'
            }`}>
              <CheckIcon className={`w-3 h-3 ${passwordStrength.checks.length ? 'opacity-100' : 'opacity-30'}`} />
              <span>Mindestens 8 Zeichen</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              passwordStrength.checks.lowercase ? 'text-green-500' : 'text-gray-400'
            }`}>
              <CheckIcon className={`w-3 h-3 ${passwordStrength.checks.lowercase ? 'opacity-100' : 'opacity-30'}`} />
              <span>Kleinbuchstaben</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              passwordStrength.checks.uppercase ? 'text-green-500' : 'text-gray-400'
            }`}>
              <CheckIcon className={`w-3 h-3 ${passwordStrength.checks.uppercase ? 'opacity-100' : 'opacity-30'}`} />
              <span>Großbuchstaben</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              passwordStrength.checks.number ? 'text-green-500' : 'text-gray-400'
            }`}>
              <CheckIcon className={`w-3 h-3 ${passwordStrength.checks.number ? 'opacity-100' : 'opacity-30'}`} />
              <span>Zahlen</span>
            </div>
            <div className={`flex items-center space-x-2 col-span-2 ${
              passwordStrength.checks.special ? 'text-green-500' : 'text-gray-400'
            }`}>
              <CheckIcon className={`w-3 h-3 ${passwordStrength.checks.special ? 'opacity-100' : 'opacity-30'}`} />
              <span>Sonderzeichen</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PasswordStrengthMeter;

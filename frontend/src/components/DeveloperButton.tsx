import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import { DeveloperMenu } from './DeveloperMenu';

interface DeveloperButtonProps {
  className?: string;
}

export function DeveloperButton({ className = '' }: DeveloperButtonProps) {
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  return (
    <>
      {/* Developer Menu Button - schwebend mittig */}
      <motion.button
        onClick={() => setIsDevMenuOpen(true)}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Developer Menu öffnen"
      >
        <CodeBracketIcon className="w-6 h-6" />
      </motion.button>

      {/* Developer Menu */}
      <DeveloperMenu 
        isOpen={isDevMenuOpen} 
        onClose={() => setIsDevMenuOpen(false)} 
      />
    </>
  );
}

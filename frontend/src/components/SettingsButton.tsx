import { motion } from 'framer-motion';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="
        fixed top-1/2 right-4 -translate-y-1/2
        w-14 h-14
        bg-background-secondary
        border border-border-primary
        rounded-full
        shadow-lg
        hover:shadow-xl
        flex items-center justify-center
        z-30
        theme-transition
      "
      whileHover={{ 
        scale: 1.1,
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Cog6ToothIcon className="w-6 h-6 text-text-primary" />
      </motion.div>
      
      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-accent-blue/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
}

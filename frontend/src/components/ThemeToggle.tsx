import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import { SunIcon, MoonIcon, SparklesIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <motion.button
      onClick={toggleTheme}
      className="
        p-3 rounded-xl
        bg-background-secondary
        border border-border-primary
        hover:bg-background-tertiary
        theme-transition
        flex items-center justify-center
        w-12 h-12
        relative overflow-hidden
      "
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-violet/20"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Icon Container */}
      <motion.div
        className="relative z-10"
        animate={{ 
          rotate: isDarkMode ? 0 : 180,
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 0.5, ease: "easeInOut" },
          scale: { duration: 0.3, ease: "easeOut" }
        }}
      >
        <AnimatePresence mode="wait">
          {isDarkMode ? (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <SunIcon className="w-6 h-6 text-yellow-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <MoonIcon className="w-6 h-6 text-blue-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sparkle Effect */}
      <motion.div
        className="absolute -top-1 -right-1"
        animate={{ 
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <SparklesIcon className="w-3 h-3 text-yellow-400" />
      </motion.div>
    </motion.button>
  );
}
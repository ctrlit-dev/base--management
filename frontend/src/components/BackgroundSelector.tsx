import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackgroundStore, BackgroundType } from '../store/backgroundStore';
import { 
  SparklesIcon, 
  Squares2X2Icon, 
  CircleStackIcon, 
  CpuChipIcon,
  SwatchIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

const backgroundOptions = [
  {
    id: 'default' as BackgroundType,
    name: 'Standard',
    description: 'Klassischer animierter Hintergrund',
    icon: SparklesIcon,
    color: 'from-blue-400 to-purple-400'
  },
  {
    id: 'minimal' as BackgroundType,
    name: 'Minimal',
    description: 'Einfacher Gradient ohne Animationen',
    icon: PaintBrushIcon,
    color: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
  },
  {
    id: 'cosmic' as BackgroundType,
    name: 'Kosmisch',
    description: 'Sterne und Galaxie-Effekte',
    icon: CircleStackIcon,
    color: 'from-purple-900 to-indigo-900'
  },
  {
    id: 'geometric' as BackgroundType,
    name: 'Geometrisch',
    description: 'Geometrische Formen und Muster',
    icon: Squares2X2Icon,
    color: 'from-emerald-400 to-cyan-400'
  },
  {
    id: 'particles' as BackgroundType,
    name: 'Partikel',
    description: 'Viele kleine animierte Partikel',
    icon: CpuChipIcon,
    color: 'from-orange-400 to-red-400'
  },
  {
    id: 'gradient' as BackgroundType,
    name: 'Gradient',
    description: 'Smooth Farbverläufe',
    icon: SwatchIcon,
    color: 'from-pink-400 to-violet-400'
  }
];

export function BackgroundSelector() {
  const { backgroundType, setBackgroundType } = useBackgroundStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Hintergrund auswählen"
      >
        <PaintBrushIcon className="w-6 h-6 text-text-primary" />
        
        {/* Active indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-accent-blue rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 right-0 w-64 bg-background-secondary border border-border-primary rounded-xl shadow-lg z-50 p-2"
          >
            <div className="text-sm font-medium text-text-primary mb-3 px-2">
              Hintergrund auswählen
            </div>
            
            <div className="space-y-1">
              {backgroundOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = backgroundType === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => {
                      setBackgroundType(option.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full p-3 rounded-lg text-left
                      flex items-center space-x-3
                      transition-colors duration-200
                      ${isSelected 
                        ? 'bg-accent-blue/10 border border-accent-blue/20' 
                        : 'hover:bg-background-tertiary'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      bg-gradient-to-br ${option.color}
                    `}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {option.name}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {option.description}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-accent-blue rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

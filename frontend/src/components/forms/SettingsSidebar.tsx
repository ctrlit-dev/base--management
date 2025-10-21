import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { useBackgroundStore, type BackgroundType } from '../../store/backgroundStore';
import { useNavigationStore } from '../../store/navigationStore';
import { 
  XMarkIcon,
  PaintBrushIcon,
  SparklesIcon,
  Squares2X2Icon,
  CircleStackIcon,
  CpuChipIcon,
  SwatchIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  CheckIcon,
  Bars3Icon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

const backgroundOptions = [
  {
    id: 'default' as BackgroundType,
    name: 'Standard',
    description: 'Klassischer animierter Hintergrund',
    icon: SparklesIcon,
    gradient: 'from-blue-400 via-purple-500 to-indigo-600'
  },
  {
    id: 'minimal' as BackgroundType,
    name: 'Minimal',
    description: 'Einfacher Gradient ohne Animationen',
    icon: PaintBrushIcon,
    gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
  },
  {
    id: 'cosmic' as BackgroundType,
    name: 'Kosmisch',
    description: 'Sterne und Galaxie-Effekte',
    icon: CircleStackIcon,
    gradient: 'from-purple-900 via-indigo-900 to-black'
  },
  {
    id: 'geometric' as BackgroundType,
    name: 'Geometrisch',
    description: 'Geometrische Formen und Muster',
    icon: Squares2X2Icon,
    gradient: 'from-emerald-400 via-cyan-500 to-teal-600'
  },
  {
    id: 'particles' as BackgroundType,
    name: 'Partikel',
    description: 'Viele kleine animierte Partikel',
    icon: CpuChipIcon,
    gradient: 'from-orange-400 via-red-500 to-pink-600'
  },
  {
    id: 'gradient' as BackgroundType,
    name: 'Gradient',
    description: 'Smooth Farbverläufe',
    icon: SwatchIcon,
    gradient: 'from-pink-400 via-purple-500 to-indigo-600'
  }
];

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { backgroundType, setBackgroundType } = useBackgroundStore();
  const { isStickyNavigation, toggleStickyNavigation } = useNavigationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Cog6ToothIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Einstellungen</h2>
                    <p className="text-sm text-blue-100">Design anpassen</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 overflow-y-auto h-full bg-gray-50/50 dark:bg-gray-800/50">
              {/* Theme Section */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    {isDarkMode ? (
                      <MoonIcon className="w-5 h-5 text-white" />
                    ) : (
                      <SunIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Theme</h3>
                </div>
                
                <motion.button
                  onClick={toggleTheme}
                  className="w-full p-6 rounded-2xl card-base hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 group shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-between">
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mt-1">
                        {isDarkMode ? 'Dunkles Design aktiviert' : 'Helles Design aktiviert'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                        isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-lg"
                          animate={{ x: isDarkMode ? 28 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Navigation Section */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                    {isStickyNavigation ? (
                      <Bars3Icon className="w-5 h-5 text-white" />
                    ) : (
                      <Bars3BottomLeftIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Navigation</h3>
                </div>
                
                <motion.button
                  onClick={toggleStickyNavigation}
                  className="w-full p-6 rounded-2xl card-base hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 group shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-between">
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        {isStickyNavigation ? 'Sticky Navigation' : 'Normale Navigation'}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mt-1">
                        {isStickyNavigation 
                          ? 'Navigation bleibt beim Scrollen sichtbar' 
                          : 'Navigation scrollt mit dem Inhalt mit'
                        }
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                        isStickyNavigation ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-lg"
                          animate={{ x: isStickyNavigation ? 28 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Background Section */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <PaintBrushIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hintergrund</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {backgroundOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = backgroundType === option.id;
                    
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => setBackgroundType(option.id)}
                        className={`
                          relative p-4 rounded-2xl text-left overflow-hidden
                          transition-all duration-200 group
                          card-base
                          hover:border-blue-500 dark:hover:border-blue-400
                          ${isSelected 
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg' 
                            : 'hover:shadow-md'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Background Preview */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-10 dark:opacity-20`} />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${option.gradient} shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center"
                              >
                                <CheckIcon className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 drop-shadow-sm">
                            {option.name}
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed drop-shadow-sm">
                            {option.description}
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Aktuelle Einstellungen</h3>
                
                <div className="p-4 rounded-2xl card-base shadow-sm">
                  <div className="space-y-3">
                    <div className="flex-between">
                      <span className="text-gray-700 dark:text-gray-300">Theme:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </div>
                    <div className="flex-between">
                      <span className="text-gray-700 dark:text-gray-300">Navigation:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {isStickyNavigation ? 'Sticky' : 'Normal'}
                      </span>
                    </div>
                    <div className="flex-between">
                      <span className="text-gray-700 dark:text-gray-300">Hintergrund:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {backgroundOptions.find(opt => opt.id === backgroundType)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

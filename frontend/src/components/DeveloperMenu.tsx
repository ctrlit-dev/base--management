import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  CodeBracketIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  BugAntIcon,
  EyeIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  TrashIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../store/themeStore';
import { useBackgroundStore } from '../store/backgroundStore';
import { useNavigationStore } from '../store/navigationStore';

interface DeveloperMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperMenu({ isOpen, onClose }: DeveloperMenuProps) {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { backgroundType, setBackgroundType } = useBackgroundStore();
  const { isStickyNavigation, toggleStickyNavigation } = useNavigationStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'toast' | 'components' | 'settings' | 'utils' | 'docs'>('toast');

  // Toast Test Funktionen
  const showSuccessToast = () => {
    toast.success('Erfolgreiche Operation! 🎉');
  };

  const showErrorToast = () => {
    toast.error('Ein Fehler ist aufgetreten! ❌');
  };

  const showInfoToast = () => {
    toast('Information: Das ist eine Info-Nachricht! ℹ️', {
      icon: 'ℹ️',
      duration: 5000,
    });
  };

  const showLoadingToast = () => {
    const loadingToast = toast.loading('Lade Daten...');
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success('Daten erfolgreich geladen!');
    }, 3000);
  };

  const showCustomToast = () => {
    toast('Benutzerdefinierte Nachricht mit längerer Dauer!', {
      duration: 8000,
      icon: '🚀',
    });
  };

  const showPersistentToast = () => {
    toast('Diese Nachricht bleibt bestehen!', {
      duration: Infinity,
      icon: '⚠️',
    });
  };

  const clearAllToasts = () => {
    toast.dismiss();
    toast.success('Alle Toasts wurden gelöscht!');
  };

  // Utility Funktionen
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('In Zwischenablage kopiert!');
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    toast.success('Local Storage geleert!');
  };

  const clearSessionStorage = () => {
    sessionStorage.clear();
    toast.success('Session Storage geleert!');
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const tabs = [
    { id: 'toast', label: 'Toast Tests', icon: CheckCircleIcon },
    { id: 'components', label: 'Komponenten', icon: EyeIcon },
    { id: 'settings', label: 'Einstellungen', icon: Cog6ToothIcon },
    { id: 'utils', label: 'Utilities', icon: BugAntIcon },
    { id: 'docs', label: 'Dokumentation', icon: DocumentTextIcon },
  ];

  const backgroundOptions = [
    { id: 'default', name: 'Standard', gradient: 'from-blue-400 via-purple-500 to-indigo-600' },
    { id: 'minimal', name: 'Minimal', gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900' },
    { id: 'cosmic', name: 'Kosmisch', gradient: 'from-purple-900 via-indigo-900 to-black' },
    { id: 'geometric', name: 'Geometrisch', gradient: 'from-emerald-400 via-cyan-500 to-teal-600' },
    { id: 'particles', name: 'Partikel', gradient: 'from-orange-400 via-red-500 to-pink-600' },
    { id: 'gradient', name: 'Gradient', gradient: 'from-pink-400 via-purple-500 to-indigo-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Developer Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[80vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl rounded-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <CodeBracketIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Developer Menu</h2>
                    <p className="text-sm text-purple-100">Tools für Entwicklung und Testing</p>
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

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex space-x-1 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 h-full overflow-y-auto bg-gray-50/50 dark:bg-gray-800/50">
              <AnimatePresence mode="wait">
                {activeTab === 'toast' && (
                  <motion.div
                    key="toast"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Toast Tests
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <motion.button
                          onClick={showSuccessToast}
                          className="p-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <CheckCircleIcon className="w-5 h-5 mx-auto mb-2" />
                          Success Toast
                        </motion.button>
                        
                        <motion.button
                          onClick={showErrorToast}
                          className="p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ExclamationTriangleIcon className="w-5 h-5 mx-auto mb-2" />
                          Error Toast
                        </motion.button>
                        
                        <motion.button
                          onClick={showInfoToast}
                          className="p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <InformationCircleIcon className="w-5 h-5 mx-auto mb-2" />
                          Info Toast
                        </motion.button>
                        
                        <motion.button
                          onClick={showLoadingToast}
                          className="p-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ClockIcon className="w-5 h-5 mx-auto mb-2" />
                          Loading Toast
                        </motion.button>
                        
                        <motion.button
                          onClick={showCustomToast}
                          className="p-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <DocumentTextIcon className="w-5 h-5 mx-auto mb-2" />
                          Custom Toast
                        </motion.button>
                        
                        <motion.button
                          onClick={showPersistentToast}
                          className="p-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ClipboardDocumentIcon className="w-5 h-5 mx-auto mb-2" />
                          Persistent Toast
                        </motion.button>
                      </div>
                      
                      <motion.button
                        onClick={clearAllToasts}
                        className="mt-4 w-full p-3 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <TrashIcon className="w-4 h-4 inline mr-2" />
                        Alle Toasts löschen
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'components' && (
                  <motion.div
                    key="components"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Komponenten Showcase
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Hier werden alle verfügbaren Komponenten angezeigt. Navigiere zur Komponenten-Seite für eine vollständige Übersicht.
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                            <motion.button
                              onClick={() => {
                                toast.success('Navigiere zur Komponenten-Seite...');
                                navigate('/components');
                                onClose();
                              }}
                              className="btn-primary"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <EyeIcon className="w-4 h-4 mr-2" />
                              Komponenten Showcase
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                toast.success('Navigiere zur Template-Seite...');
                                navigate('/template');
                                onClose();
                              }}
                              className="btn-secondary"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <DocumentTextIcon className="w-4 h-4 mr-2" />
                              Template Seite
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                toast.success('Navigiere zur Beispiel-Seite...');
                                navigate('/example');
                                onClose();
                              }}
                              className="btn-secondary"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <CodeBracketIcon className="w-4 h-4 mr-2" />
                              Beispiel Seite
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Theme & Design Einstellungen
                      </h3>
                      
                      {/* Theme Toggle */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                              {isDarkMode ? (
                                <MoonIcon className="w-5 h-5 text-white" />
                              ) : (
                                <SunIcon className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isDarkMode ? 'Dunkles Design aktiviert' : 'Helles Design aktiviert'}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={toggleTheme}
                            className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                              isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full shadow-lg"
                              animate={{ x: isDarkMode ? 28 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </div>
                      </div>

                      {/* Navigation Toggle */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                              {isStickyNavigation ? (
                                <Bars3Icon className="w-5 h-5 text-white" />
                              ) : (
                                <Bars3BottomLeftIcon className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {isStickyNavigation ? 'Sticky Navigation' : 'Normale Navigation'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isStickyNavigation 
                                  ? 'Navigation bleibt beim Scrollen sichtbar' 
                                  : 'Navigation scrollt mit dem Inhalt mit'
                                }
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={toggleStickyNavigation}
                            className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
                              isStickyNavigation ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              className="w-5 h-5 bg-white rounded-full shadow-lg"
                              animate={{ x: isStickyNavigation ? 28 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </div>
                      </div>

                      {/* Background Options */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                          Hintergrund Optionen
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {backgroundOptions.map((option) => {
                            const isSelected = backgroundType === option.id;
                            return (
                              <motion.button
                                key={option.id}
                                onClick={() => setBackgroundType(option.id as any)}
                                className={`p-3 rounded-lg text-left transition-all duration-200 ${
                                  isSelected 
                                    ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className={`w-full h-8 rounded-md bg-gradient-to-r ${option.gradient} mb-2`} />
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {option.name}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'utils' && (
                  <motion.div
                    key="utils"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Developer Utilities
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.button
                          onClick={() => copyToClipboard('Developer Menu Test')}
                          className="p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-left"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ClipboardDocumentIcon className="w-5 h-5 mb-2" />
                          <div className="font-semibold">Text kopieren</div>
                          <div className="text-sm opacity-90">Kopiert Test-Text in Zwischenablage</div>
                        </motion.button>
                        
                        <motion.button
                          onClick={clearLocalStorage}
                          className="p-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors text-left"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <TrashIcon className="w-5 h-5 mb-2" />
                          <div className="font-semibold">Local Storage leeren</div>
                          <div className="text-sm opacity-90">Löscht alle lokalen Daten</div>
                        </motion.button>
                        
                        <motion.button
                          onClick={clearSessionStorage}
                          className="p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors text-left"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <TrashIcon className="w-5 h-5 mb-2" />
                          <div className="font-semibold">Session Storage leeren</div>
                          <div className="text-sm opacity-90">Löscht alle Session-Daten</div>
                        </motion.button>
                        
                        <motion.button
                          onClick={reloadPage}
                          className="p-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors text-left"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ArrowPathIcon className="w-5 h-5 mb-2" />
                          <div className="font-semibold">Seite neu laden</div>
                          <div className="text-sm opacity-90">Lädt die aktuelle Seite neu</div>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'docs' && (
                  <motion.div
                    key="docs"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Dokumentation
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <DocumentTextIcon className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              Dokumentation in Entwicklung
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              Hier wird bald eine umfassende Dokumentation verfügbar sein.
                            </p>
                            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                              <p>📚 API-Dokumentation</p>
                              <p>🔧 Komponenten-Guide</p>
                              <p>🎨 Design-System</p>
                              <p>⚡ Performance-Tipps</p>
                              <p>🐛 Troubleshooting</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.button
                            onClick={() => {
                               toast('Dokumentation wird bald verfügbar sein!', { icon: 'ℹ️' });
                            }}
                            className="p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <DocumentTextIcon className="w-5 h-5 mb-2" />
                            <div className="font-semibold">API Dokumentation</div>
                            <div className="text-sm opacity-90">Backend API Referenz</div>
                          </motion.button>
                          
                          <motion.button
                            onClick={() => {
                               toast('Komponenten-Guide wird bald verfügbar sein!', { icon: 'ℹ️' });
                            }}
                            className="p-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <EyeIcon className="w-5 h-5 mb-2" />
                            <div className="font-semibold">Komponenten-Guide</div>
                            <div className="text-sm opacity-90">UI-Komponenten Übersicht</div>
                          </motion.button>
                          
                          <motion.button
                            onClick={() => {
                               toast('Design-System wird bald verfügbar sein!', { icon: 'ℹ️' });
                            }}
                            className="p-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <PaintBrushIcon className="w-5 h-5 mb-2" />
                            <div className="font-semibold">Design-System</div>
                            <div className="text-sm opacity-90">Farben, Typografie, Spacing</div>
                          </motion.button>
                          
                          <motion.button
                            onClick={() => {
                               toast('Troubleshooting-Guide wird bald verfügbar sein!', { icon: 'ℹ️' });
                            }}
                            className="p-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <BugAntIcon className="w-5 h-5 mb-2" />
                            <div className="font-semibold">Troubleshooting</div>
                            <div className="text-sm opacity-90">Häufige Probleme & Lösungen</div>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

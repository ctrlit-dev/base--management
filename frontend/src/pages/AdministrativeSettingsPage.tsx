import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { TopNavigation } from '../components/common/TopNavigation';
import { SettingsSidebar } from '../components/forms/SettingsSidebar';
import { userManager } from '../lib/api/auth';
import { useBackgroundStore } from '../store/backgroundStore';
import { useNavigationStore } from '../store/navigationStore';
import { useSettings } from '../hooks/useSettings';
import { SETTINGS_TABS } from '../config/settingsConfig';
import { DeveloperMenu } from '../components/DeveloperMenu';
import { SettingsTabContent } from '../features/settings/SettingsTabContent';
import type { User } from '../lib/api/auth';
import type { SettingsTab } from '../types/settings';

export function AdministrativeSettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('authentication');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const { backgroundType } = useBackgroundStore();
  const { isStickyNavigation } = useNavigationStore();

  // Settings-Hook für zentrale Logik
  const {
    loadSettings
  } = useSettings();

  // Memoized handlers
  const handleSettingsToggle = useCallback(() => {
    setIsSettingsOpen(prev => !prev);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleTabChange = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
  }, []);

  const handleLogout = useCallback(() => {
    userManager.logout();
    navigate('/login');
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Memoized computed values - nicht mehr benötigt da in SettingsTabContent verschoben

  useEffect(() => {
    const fetchUserAndSettings = async () => {
      const currentUser = userManager.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Prüfe Admin-Berechtigung
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
          navigate('/forbidden');
          return;
        }
        await loadSettings();
      } else {
        navigate('/login');
      }
    };
    fetchUserAndSettings();
  }, [navigate, loadSettings]);

  // Dynamische Header-Höhe messen
  useEffect(() => {
    const measureHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);
      }
    };

    // Initial messen
    measureHeaderHeight();

    // Bei Resize neu messen
    window.addEventListener('resize', measureHeaderHeight);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, [isStickyNavigation]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background-primary theme-transition flex items-center justify-center">
        <BackgroundRenderer type={backgroundType} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Lade Einstellungen...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary theme-transition">
      <BackgroundRenderer type={backgroundType} />
      
      {/* Top Navigation */}
      <TopNavigation 
        user={user}
        onSettingsOpen={handleSettingsToggle}
        onLogout={handleLogout}
      />

      {/* Settings Sidebar */}
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Developer Menu Button - schwebend mittig */}
      <motion.button
        onClick={() => setIsDevMenuOpen(true)}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Developer Menu öffnen"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </motion.button>

      {/* Main Content */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div 
          className={`card border-r-0 rounded-none transition-all duration-300 ease-in-out sticky ${
            isStickyNavigation ? `top-[${headerHeight}px] h-[calc(100vh-${headerHeight}px)]` : 'top-0 h-screen'
          } ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
          style={{
            top: isStickyNavigation ? `${headerHeight}px` : '0px',
            height: isStickyNavigation ? `calc(100vh - ${headerHeight}px)` : '100vh'
          }}
        >
          <div className="min-h-full flex flex-col relative">
            {/* Header */}
            <div className={`flex items-center mb-6 transition-all duration-300 ${
              isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
            }`}>
              <motion.div
                className="overflow-hidden"
                animate={{ 
                  width: isSidebarCollapsed ? 0 : 'auto',
                  opacity: isSidebarCollapsed ? 0 : 1
                }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  width: { delay: isSidebarCollapsed ? 0 : 0.1 }
                }}
              >
                <h1 className="text-xl font-semibold text-text-primary whitespace-nowrap">
                  Admin-Einstellungen
                </h1>
              </motion.div>
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg hover:bg-background-tertiary transition-colors flex-shrink-0"
              >
                <Bars3Icon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Tab Navigation */}
            <nav className="space-y-2 flex-1">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center py-3 transition-all duration-300 ${
                      isActive
                        ? 'bg-accent-blue text-white'
                        : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                    } ${
                      isSidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'
                    }`}
                    title={isSidebarCollapsed ? tab.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <motion.div 
                      className="overflow-hidden ml-2"
                      animate={{ 
                        width: isSidebarCollapsed ? 0 : 'auto',
                        opacity: isSidebarCollapsed ? 0 : 1
                      }}
                      transition={{ 
                        duration: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        width: { delay: isSidebarCollapsed ? 0 : 0.1 }
                      }}
                    >
                      <div className="font-medium whitespace-nowrap">{tab.name}</div>
                    </motion.div>
                  </button>
                );
              })}
            </nav>

            {/* Logo im unteren Bereich */}
            <div className={`flex justify-center py-4 ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}>
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Pulse Glow Effekt - kleinerer Glow wenn Sidebar eingeklappt */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    scale: isSidebarCollapsed ? [0.5, 0.7, 0.5] : [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
                  }}
                />
                
                {/* Logo - klickbar für Developer Menu */}
                <div className="relative z-10">
                  <button
                    onClick={() => setIsDevMenuOpen(true)}
                    className="transition-all duration-300 hover:scale-105 focus:outline-none rounded-full"
                    title="Developer Menu öffnen"
                  >
                    <img 
                      src="/src/assets/creecore.svg" 
                      alt="CreeCore Logo" 
                      className={`${isSidebarCollapsed ? 'w-16 h-16' : 'w-32 h-32'} transition-all duration-300`}
                    />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <motion.div 
          className="flex-1 p-6"
          animate={{ marginLeft: isSidebarCollapsed ? 0 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <SettingsTabContent 
            activeTab={activeTab}
            onBack={handleBackToDashboard}
          />
        </motion.div>
      </div>

      {/* Developer Menu */}
      <DeveloperMenu 
        isOpen={isDevMenuOpen} 
        onClose={() => setIsDevMenuOpen(false)} 
      />
    </div>
  );
}
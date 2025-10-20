import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { TopNavigation } from '../components/TopNavigation';
import { userManager } from '../api/auth';
import { useBackgroundStore } from '../store/backgroundStore';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'PRODUCTION' | 'WAREHOUSE' | 'SALES' | 'VIEWER';
  is_active: boolean;
  avatar?: string;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { backgroundType } = useBackgroundStore();

  const handleLogout = () => {
    userManager.logout();
    navigate('/login');
  };

  useEffect(() => {
    // Prüfe, ob Benutzer eingeloggt ist
    if (!userManager.isLoggedIn()) {
      navigate('/login');
      return;
    }

    // Lade Benutzerdaten
    const currentUser = userManager.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, [navigate]);

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Administrator',
      'PRODUCTION': 'Produktion',
      'WAREHOUSE': 'Lager',
      'SALES': 'Verkauf',
      'VIEWER': 'Betrachter'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'ADMIN': 'from-purple-500 to-purple-600',
      'PRODUCTION': 'from-green-500 to-green-600',
      'WAREHOUSE': 'from-yellow-500 to-yellow-600',
      'SALES': 'from-blue-500 to-blue-600',
      'VIEWER': 'from-gray-500 to-gray-600'
    };
    return roleColors[role] || 'from-gray-500 to-gray-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background-primary theme-transition flex items-center justify-center">
        <BackgroundRenderer type={backgroundType} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div 
            className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-text-secondary">Lade Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary theme-transition">
      {/* Dynamic Background */}
      <BackgroundRenderer type={backgroundType} />

      {/* Settings Sidebar */}
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <div className="relative z-10">
        {/* TOP Navigation */}
        <TopNavigation user={user} onLogout={handleLogout} onSettingsOpen={() => setIsSettingsOpen(true)} />
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="px-6 py-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
              <p className="text-text-secondary">Willkommen zurück, {user.first_name}!</p>
            </div>
            
            {/* User Info Card */}
            <motion.div
              className="flex items-center space-x-3 px-4 py-2 bg-background-secondary/50 rounded-lg border border-border-primary/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-violet rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-text-secondary">{user.email}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Welcome Card */}
            <motion.div
              className="card p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor(user.role)} rounded-xl flex items-center justify-center`}>
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Willkommen, {user.first_name}!
                  </h3>
                  <p className="text-text-secondary">
                    Rolle: {getRoleDisplayName(user.role)}
                  </p>
                </div>
              </div>
              <p className="text-text-secondary text-sm">
                Sie sind erfolgreich in Ihr LCREE-Konto eingeloggt.
              </p>
            </motion.div>

            {/* Account Info Card */}
            <motion.div
              className="card p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Kontoinformationen
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">E-Mail:</span>
                  <span className="text-text-primary font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Rolle:</span>
                  <span className="text-text-primary font-medium">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status:</span>
                  <span className="text-success font-medium">
                    {user.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Registriert:</span>
                  <span className="text-text-primary font-medium">
                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div
              className="card p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Schnellaktionen
              </h3>
              <div className="space-y-3">
                <motion.button
                  className="w-full p-3 bg-gradient-to-r from-accent-blue/10 to-accent-violet/10 border border-accent-blue/20 rounded-lg text-accent-blue hover:from-accent-blue/15 hover:to-accent-violet/15 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span className="font-medium">Einstellungen</span>
                  </div>
                </motion.button>
                
                <motion.button
                  className="w-full p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg text-green-600 hover:from-green-500/15 hover:to-emerald-500/15 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span className="font-medium">Sicherheit</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Additional Test Content for Scrolling */}
            <motion.div
              className="col-span-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">Scroll-Test Bereich</h2>
              
              {/* Test Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="card p-6"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{i + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          Test Karte {i + 1}
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Scroll-Test Inhalt
                        </p>
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm">
                      Dies ist eine Test-Karte, um das Scrollen zu testen. 
                      Die Navigation sollte sticky bleiben.
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Long Content Section */}
              <motion.div
                className="card p-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.3 }}
              >
                <h3 className="text-xl font-bold text-text-primary mb-6">Langer Inhalt für Scroll-Test</h3>
                
                <div className="space-y-6">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="border-l-4 border-accent-blue pl-6">
                      <h4 className="text-lg font-semibold text-text-primary mb-2">
                        Abschnitt {i + 1}
                      </h4>
                      <p className="text-text-secondary leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure 
                        dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                      </p>
                      <div className="mt-4 flex space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">A{i + 1}</span>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">B{i + 1}</span>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">C{i + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Statistics Section */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                {[
                  { title: 'Gesamt Benutzer', value: '1,234', color: 'from-blue-500 to-blue-600' },
                  { title: 'Aktive Sessions', value: '567', color: 'from-green-500 to-green-600' },
                  { title: 'Heute Online', value: '89', color: 'from-purple-500 to-purple-600' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="card p-6"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-text-secondary text-sm">{stat.title}</p>
                        <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                      </div>
                      <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                        <span className="text-white font-bold text-xl">{stat.value[0]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Final Test Section */}
              <motion.div
                className="card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.7 }}
              >
                <h3 className="text-xl font-bold text-text-primary mb-4">Navigation Test Status</h3>
                <div className="flex items-center space-x-4 p-4 bg-background-secondary/50 rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-text-primary font-medium">
                    Navigation ist aktuell: <strong>Sticky</strong>
                  </span>
                </div>
                <p className="text-text-secondary mt-4">
                  Scrollen Sie nach oben und unten, um zu testen, ob die Navigation 
                  am oberen Bildschirmrand bleibt.
                  Sie können die Einstellung in den Einstellungen ändern.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TopNavigation } from '../components/common/TopNavigation';
import { SettingsSidebar } from '../components/forms/SettingsSidebar';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { DeveloperButton } from '../components/DeveloperButton';
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Mock User für Navigation
const mockUser = {
  id: 1,
  email: 'user@example.com',
  first_name: 'Max',
  last_name: 'Mustermann',
  role: 'ADMIN' as const,
  is_active: true,
  language: 'de',
  timezone: 'Europe/Berlin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

interface TemplatePageProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  showDevMenu?: boolean;
}

export function TemplatePage({ 
  title = "Neue Seite", 
  subtitle = "Beschreibung der Seite",
  children,
  showDevMenu = true 
}: TemplatePageProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  const handleLogout = () => {
    toast.success('Abgemeldet!');
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <BackgroundRenderer />
      
      {/* Top Navigation */}
      <TopNavigation 
        user={mockUser} 
        onLogout={handleLogout}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      {/* Developer Button - wird automatisch angezeigt wenn Developer Mode aktiviert ist */}
      <DeveloperButton />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              {title}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Page Content */}
          <div className="space-y-8">
            {children || (
              <div className="text-center py-16">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CodeBracketIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Template bereit für Inhalt
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Diese Seite ist eine Vorlage mit Navigation, Sidebar und Developer-Menü. 
                    Fügen Sie hier Ihren Inhalt hinzu.
                  </p>
                  <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                    <p>✅ Top Navigation mit allen Menüpunkten</p>
                    <p>✅ Settings Sidebar für Theme-Einstellungen</p>
                    <p>✅ Developer Menu für Testing</p>
                    <p>✅ Dark/Light Mode Support</p>
                    <p>✅ Responsive Design</p>
                    <p>✅ Animations mit Framer Motion</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Settings Sidebar */}
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

// Beispiel für eine spezifische Seite mit dem Template
export function ExamplePage() {
  return (
    <TemplatePage 
      title="Beispiel Seite" 
      subtitle="Eine Beispiel-Seite mit dem Template"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Card 1
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Hier ist der Inhalt der ersten Card.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Card 2
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Hier ist der Inhalt der zweiten Card.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Card 3
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Hier ist der Inhalt der dritten Card.
          </p>
        </div>
      </div>
    </TemplatePage>
  );
}


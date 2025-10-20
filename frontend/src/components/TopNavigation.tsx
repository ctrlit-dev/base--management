import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  BeakerIcon,
  ShoppingCartIcon,
  StarIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { UserDropdown } from './UserDropdown';
import { useNavigationStore } from '../store/navigationStore';

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

interface TopNavigationProps {
  user: User;
  onLogout: () => void;
  onSettingsOpen: () => void;
}

export function TopNavigation({ user, onLogout, onSettingsOpen }: TopNavigationProps) {
  const { isStickyNavigation } = useNavigationStore();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-background-secondary/90 backdrop-blur-lg shadow-sm z-20 ${
        isStickyNavigation ? 'sticky top-0' : 'relative'
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-violet rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">LCREE</span>
          </motion.div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Analytics</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BeakerIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Parfüme</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CubeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Materialien</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCartIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Bestellungen</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Produktion</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <StarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Bewertungen</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WrenchScrewdriverIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Tools</span>
            </motion.button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* User Dropdown */}
            <UserDropdown user={user} onLogout={onLogout} />

            {/* Settings Button */}
            <motion.button
              onClick={onSettingsOpen}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-primary/30 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Einstellungen"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

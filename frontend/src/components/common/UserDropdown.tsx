import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Avatar from '../Avatar';
import type { User } from '../../types/user';

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
}

export function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Schließe Dropdown beim Klicken außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      id: 'profile',
      label: 'Mein Profil',
      icon: UserIcon,
      onClick: () => {
        setIsOpen(false);
        navigate('/profile');
      }
    },
    {
      id: 'settings',
      label: 'Einstellungen',
      icon: Cog6ToothIcon,
      onClick: () => {
        setIsOpen(false);
        navigate('/admin/settings');
      }
    }
  ];

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Administrator',
      'MANAGER': 'Manager',
      'USER': 'Benutzer',
      'GUEST': 'Gast'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-background-primary/20 rounded-lg hover:bg-background-primary/30 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Avatar user={user} size="sm" />
        <span className="text-sm font-medium text-text-primary">
          {user.first_name} {user.last_name}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg rounded-xl z-20 overflow-hidden"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-accent-blue font-medium">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={item.onClick}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                      whileHover={{ x: 4 }}
                    >
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200/50 dark:border-gray-700/50" />

              {/* Logout */}
              <motion.button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                whileHover={{ x: 4 }}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Abmelden</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

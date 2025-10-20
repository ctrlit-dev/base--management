import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  user: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showUploadButton?: boolean;
  onUpload?: (file: File) => void;
  onDelete?: () => void;
}

export function Avatar({ 
  user, 
  size = 'md', 
  className = '', 
  showUploadButton = false,
  onUpload,
  onDelete 
}: AvatarProps) {
  const getInitials = () => {
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-12 h-12 text-sm';
      case 'lg':
        return 'w-16 h-16 text-lg';
      case 'xl':
        return 'w-24 h-24 text-xl';
      default:
        return 'w-12 h-12 text-sm';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const initials = getInitials();
  const sizeClasses = getSizeClasses();

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Container */}
      <div className={`${sizeClasses} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-accent-blue to-accent-violet text-white font-semibold`}>
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={`${user.first_name} ${user.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Upload Button */}
      {showUploadButton && (
        <div className="absolute -bottom-1 -right-1">
          <motion.label
            className="w-6 h-6 bg-background-primary rounded-full border-2 border-background-secondary hover:bg-background-secondary cursor-pointer flex items-center justify-center transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.label>
        </div>
      )}

      {/* Delete Button */}
      {showUploadButton && user.avatar && onDelete && (
        <div className="absolute -top-1 -right-1">
          <motion.button
            onClick={onDelete}
            className="w-5 h-5 bg-red-500 rounded-full border-2 border-background-primary hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      )}
    </div>
  );
}

export default Avatar;

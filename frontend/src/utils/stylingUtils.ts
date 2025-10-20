/**
 * LCREE Styling Utilities
 * ========================
 * 
 * Zentrale Styling-Utilities für konsistente UI.
 * Eliminiert DRY-Verletzungen durch wiederverwendbare CSS-Funktionen.
 */

// Action Color Utilities
export const getActionColor = (action: string): string => {
  if (action.includes('DELETE') || action.includes('HARD_DELETE')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  }
  if (action.includes('CREATE') || action.includes('RESTORE')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  }
  if (action.includes('UPDATE') || action.includes('SOFT_DELETE')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

// Action Icon Utilities
export const getActionIcon = (action: string) => {
  if (action.includes('DELETE') || action.includes('HARD_DELETE')) {
    return 'XCircleIcon';
  }
  if (action.includes('CREATE') || action.includes('RESTORE')) {
    return 'CheckCircleIcon';
  }
  if (action.includes('UPDATE') || action.includes('SOFT_DELETE')) {
    return 'ExclamationTriangleIcon';
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return 'UserIcon';
  }
  return 'InformationCircleIcon';
};

// Card Styling Utilities
export const getPaddingClasses = (padding: 'none' | 'sm' | 'md' | 'lg'): string => {
  switch (padding) {
    case 'none':
      return '';
    case 'sm':
      return 'p-4';
    case 'lg':
      return 'p-8';
    default:
      return 'p-6';
  }
};

export const getShadowClasses = (shadow: 'none' | 'sm' | 'md' | 'lg'): string => {
  switch (shadow) {
    case 'none':
      return '';
    case 'sm':
      return 'shadow-sm';
    case 'md':
      return 'shadow-md';
    case 'lg':
      return 'shadow-lg';
    default:
      return 'shadow-sm';
  }
};

export const getRoundedClasses = (rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl'): string => {
  switch (rounded) {
    case 'none':
      return '';
    case 'sm':
      return 'rounded-sm';
    case 'md':
      return 'rounded-md';
    case 'lg':
      return 'rounded-lg';
    case 'xl':
      return 'rounded-xl';
    default:
      return 'rounded-lg';
  }
};

// Form Styling Utilities
export const getFormVariantClasses = (variant: 'default' | 'filled' | 'outlined'): string => {
  switch (variant) {
    case 'filled':
      return 'bg-gray-100 dark:bg-gray-700 border-0 rounded-lg';
    case 'outlined':
      return 'bg-transparent border-2 rounded-lg';
    default:
      return 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md';
  }
};

export const getFormSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'lg':
      return 'px-4 py-3 text-lg';
    default:
      return 'px-3 py-2 text-base';
  }
};

export const getFormStateClasses = (state: 'default' | 'error' | 'success' | 'loading'): string => {
  switch (state) {
    case 'error':
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    case 'success':
      return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    case 'loading':
      return 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';
    default:
      return 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';
  }
};

// Button Styling Utilities
export const getButtonVariantClasses = (variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'warning'): string => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    outline: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
  };
  return variants[variant];
};

export const getButtonSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'lg':
      return 'px-6 py-3 text-lg';
    default:
      return 'px-4 py-2 text-base';
  }
};

export const getButtonStateClasses = (state: 'default' | 'loading' | 'success' | 'error'): string => {
  switch (state) {
    case 'loading':
      return 'opacity-75 cursor-not-allowed';
    case 'success':
      return 'bg-green-600 hover:bg-green-700 text-white';
    case 'error':
      return 'bg-red-600 hover:bg-red-700 text-white';
    default:
      return '';
  }
};

// Date/Time Formatting Utilities
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatTime = (time: string | Date): string => {
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return timeObj.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status Utilities
export const getStatusColor = (status: 'active' | 'inactive' | 'pending' | 'error' | 'success'): string => {
  switch (status) {
    case 'active':
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'inactive':
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Animation Utilities
export const getAnimationClasses = (animation: 'fade' | 'slide' | 'scale' | 'none'): string => {
  switch (animation) {
    case 'fade':
      return 'transition-opacity duration-200';
    case 'slide':
      return 'transition-transform duration-200';
    case 'scale':
      return 'transition-transform duration-200';
    default:
      return '';
  }
};

// Layout Utilities
export const getSpacingClasses = (spacing: 'none' | 'sm' | 'md' | 'lg' | 'xl'): string => {
  switch (spacing) {
    case 'none':
      return '';
    case 'sm':
      return 'space-y-2';
    case 'md':
      return 'space-y-4';
    case 'lg':
      return 'space-y-6';
    case 'xl':
      return 'space-y-8';
    default:
      return 'space-y-4';
  }
};

export const getGridClasses = (columns: 1 | 2 | 3 | 4 | 6 | 12): string => {
  switch (columns) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-1 md:grid-cols-2';
    case 3:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 4:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    case 6:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
    case 12:
      return 'grid-cols-12';
    default:
      return 'grid-cols-1 md:grid-cols-2';
  }
};

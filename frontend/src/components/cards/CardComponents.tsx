/**
 * Card Components
 * ===============
 * 
 * Wiederverwendbare Card-Komponenten für konsistente Layouts.
 * Bietet verschiedene Card-Patterns für verschiedene Use Cases.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/outline';

// Base Card Component
interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  rounded = 'lg',
  border = true,
  hover = false,
  onClick,
}) => {
  const getPaddingClasses = () => {
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

  const getShadowClasses = () => {
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

  const getRoundedClasses = () => {
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

  const baseClasses = `
    bg-white dark:bg-gray-800
    ${getPaddingClasses()}
    ${getShadowClasses()}
    ${getRoundedClasses()}
    ${border ? 'border border-gray-200 dark:border-gray-700' : ''}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  if (onClick) {
    return (
      <motion.div
        className={baseClasses}
        onClick={onClick}
        whileHover={{ scale: hover ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

// Card with Header
interface CardWithHeaderProps extends BaseCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  onClose?: () => void;
}

export const CardWithHeader: React.FC<CardWithHeaderProps> = ({
  title,
  subtitle,
  headerAction,
  onClose,
  children,
  padding = 'md',
  ...props
}) => {
  return (
    <BaseCard padding="none" {...props}>
      {(title || subtitle || headerAction || onClose) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {headerAction}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className={padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6'}>
        {children}
      </div>
    </BaseCard>
  );
};

// Collapsible Card
interface CollapsibleCardProps extends CardWithHeaderProps {
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  isOpen,
  onToggle,
  defaultOpen = false,
  children,
  ...props
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);
  const isOpenState = isOpen !== undefined ? isOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const headerAction = (
    <button
      onClick={handleToggle}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {isOpenState ? (
        <ChevronUpIcon className="w-5 h-5" />
      ) : (
        <ChevronDownIcon className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <CardWithHeader
      {...props}
      headerAction={headerAction}
    >
      <motion.div
        initial={false}
        animate={{ height: isOpenState ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        {isOpenState && children}
      </motion.div>
    </CardWithHeader>
  );
};

// Stats Card
interface StatsCardProps extends BaseCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  ...props
}) => {
  const getTrendColor = () => {
    if (!change) return '';
    
    switch (change.type) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <BaseCard {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className={`text-sm ${getTrendColor()}`}>
              {change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}
              {change.value}
            </p>
          )}
        </div>
        
        {icon && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

// Feature Card
interface FeatureCardProps extends BaseCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  featured?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  action,
  featured = false,
  ...props
}) => {
  return (
    <BaseCard
      {...props}
      className={`
        ${featured ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        ${props.className || ''}
      `}
    >
      <div className="text-center">
        {icon && (
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
        
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

// List Card
interface ListCardProps extends BaseCardProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  emptyMessage?: string;
  onItemClick?: (item: any) => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  items,
  emptyMessage = 'Keine Einträge gefunden',
  onItemClick,
  ...props
}) => {
  return (
    <BaseCard padding="none" {...props}>
      {items.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 ${onItemClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : ''}`}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {item.icon && (
                    <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                      {item.icon}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                
                {item.action && (
                  <div className="flex-shrink-0">
                    {item.action}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseCard>
  );
};

// Grid Card Container
interface GridCardContainerProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GridCardContainer: React.FC<GridCardContainerProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}) => {
  const getGridClasses = () => {
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    };
    
    const gapClasses = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    };
    
    return `${columnClasses[columns]} ${gapClasses[gap]}`;
  };

  return (
    <div className={`grid ${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

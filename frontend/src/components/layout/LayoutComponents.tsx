/**
 * Layout Components Library
 * ========================
 * 
 * Zentrale Layout-Komponenten für konsistente Strukturen.
 * Eliminiert wiederholte Layout-Styles.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Container Component
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  padding = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={`mx-auto ${sizeClasses[size]} ${padding ? 'container-padding' : ''} ${className}`}>
      {children}
    </div>
  );
};

// Section Component
interface SectionProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'secondary' | 'tertiary';
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  spacing = 'md',
  background = 'default',
  className = ''
}) => {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };

  const backgroundClasses = {
    default: 'bg-background-primary',
    secondary: 'bg-background-secondary',
    tertiary: 'bg-background-tertiary'
  };

  return (
    <section className={`${spacingClasses[spacing]} ${backgroundClasses[background]} ${className}`}>
      {children}
    </section>
  );
};

// Grid Component
interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  responsive = true,
  className = ''
}) => {
  const getColumnClasses = () => {
    if (responsive) {
      const responsiveClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
      };
      return responsiveClasses[columns];
    } else {
      return `grid-cols-${columns}`;
    }
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div className={`grid ${getColumnClasses()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Flex Component
interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'md',
  className = ''
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse'
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={`
      flex 
      ${directionClasses[direction]} 
      ${justifyClasses[justify]} 
      ${alignClasses[align]} 
      ${wrap ? 'flex-wrap' : ''} 
      ${gapClasses[gap]} 
      ${className}
    `}>
      {children}
    </div>
  );
};

// Stack Component (vertikaler Flex)
interface StackProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  className = ''
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={`flex flex-col ${spacingClasses[spacing]} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
};

// HStack Component (horizontaler Flex)
interface HStackProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export const HStack: React.FC<HStackProps> = ({
  children,
  spacing = 'md',
  align = 'center',
  className = ''
}) => {
  const spacingClasses = {
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={`flex flex-row ${spacingClasses[spacing]} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
};

// Center Component
interface CenterProps {
  children: React.ReactNode;
  className?: string;
}

export const Center: React.FC<CenterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`flex-center ${className}`}>
      {children}
    </div>
  );
};

// Spacer Component
interface SpacerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  axis?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  axis = 'vertical',
  className = ''
}) => {
  const sizeClasses = {
    sm: '4',
    md: '6',
    lg: '8',
    xl: '12',
    '2xl': '16',
    '3xl': '24'
  };

  const axisClasses = {
    horizontal: `w-${sizeClasses[size]}`,
    vertical: `h-${sizeClasses[size]}`,
    both: `w-${sizeClasses[size]} h-${sizeClasses[size]}`
  };

  return (
    <div className={`${axisClasses[axis]} ${className}`} />
  );
};

// Divider Component
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: 'default' | 'light' | 'dark';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 'thin',
  color = 'default',
  className = ''
}) => {
  const thicknessClasses = {
    thin: orientation === 'horizontal' ? 'h-px' : 'w-px',
    medium: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
    thick: orientation === 'horizontal' ? 'h-1' : 'w-1'
  };

  const colorClasses = {
    default: 'bg-gray-200 dark:bg-gray-700',
    light: 'bg-gray-100 dark:bg-gray-800',
    dark: 'bg-gray-300 dark:bg-gray-600'
  };

  const orientationClasses = {
    horizontal: 'w-full',
    vertical: 'h-full'
  };

  return (
    <div className={`
      ${thicknessClasses[thickness]} 
      ${colorClasses[color]} 
      ${orientationClasses[orientation]} 
      ${className}
    `} />
  );
};

// Page Layout Component
interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  className = ''
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {header && (
        <header className="flex-shrink-0">
          {header}
        </header>
      )}
      
      <div className="flex flex-1">
        {sidebar && (
          <aside className="flex-shrink-0">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      {footer && (
        <footer className="flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
};

// Card Layout Component
interface CardLayoutProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CardLayout: React.FC<CardLayoutProps> = ({
  children,
  padding = 'md',
  className = ''
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div className={`card-base ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

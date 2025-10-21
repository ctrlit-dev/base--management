/**
 * Bundle Optimization
 * ==================
 * 
 * Optimierungen für Bundle-Größe und Performance.
 */

// Tree-shaking optimierte Imports
export { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton,
  SuccessButton,
  WarningButton,
  GhostButton,
  OutlineButton,
  IconButton,
  ButtonGroup 
} from '../components/ui/buttons/ButtonComponents';

export { 
  BaseCard, 
  CardWithHeader, 
  CollapsibleCard, 
  StatsCard, 
  FeatureCard, 
  ListCard, 
  GridCardContainer 
} from '../components/ui/cards/CardComponents';

export { 
  BaseInput, 
  PasswordInput, 
  BaseSelect, 
  BaseCheckbox, 
  Textarea 
} from '../components/forms/FormComponents';

export { 
  Container, 
  Section, 
  Grid, 
  Stack, 
  HStack,
  Center,
  CardLayout 
} from '../components/layout/LayoutComponents';

// Lazy Loading für schwere Komponenten
export const LazyComponentShowcase = () => import('../pages/ComponentShowcasePage');
export const LazyAdministrativeSettings = () => import('../pages/AdministrativeSettingsPage');
export const LazyDashboard = () => import('../pages/DashboardPage');

// Code Splitting für Features
export const LazyAuthFeatures = () => import('../features/auth');
export const LazySettingsFeatures = () => import('../features/settings');
export const LazyProductFeatures = () => import('../features/products');

// Optimierte Icon-Imports (nur verwendete Icons)
export {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  Bars3Icon,
  UserIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  ClockIcon,
  KeyIcon,
  LockClosedIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  BeakerIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  HeartIcon,
  StarIcon,
  ShoppingCartIcon,
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Performance-optimierte Utility-Funktionen
export {
  debounce,
  throttle,
  useMemoizedCallback,
  useMemoizedValue,
  withMemo,
  useLazyLoad,
  useVirtualScroll,
  PerformanceMonitor,
  usePerformanceMonitor,
  lazyImport,
  useCleanup
} from './performance';

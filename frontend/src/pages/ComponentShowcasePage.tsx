import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon,
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowPathIcon,
  BugAntIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  Bars3BottomLeftIcon,
  UserIcon,
  HeartIcon,
  StarIcon,
  ShoppingCartIcon,
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { TopNavigation } from '../components/common/TopNavigation';
import { SettingsSidebar } from '../components/forms/SettingsSidebar';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { DeveloperButton } from '../components/DeveloperButton';
import { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  SuccessButton, 
  GhostButton, 
  OutlineButton, 
  WarningButton,
  IconButton,
  ButtonGroup 
} from '../components/ui/buttons/ButtonComponents';
import { 
  BaseInput, 
  PasswordInput, 
  BaseSelect, 
  BaseCheckbox, 
  Textarea
} from '../components/forms/FormComponents';
import { 
  BaseCard, 
  CardWithHeader, 
  CollapsibleCard, 
  StatsCard, 
  FeatureCard, 
  ListCard, 
  GridCardContainer 
} from '../components/ui/cards/CardComponents';
import { useThemeStore } from '../store/themeStore';
import { useBackgroundStore } from '../store/backgroundStore';
import { useNavigationStore } from '../store/navigationStore';
import toast from 'react-hot-toast';

// Mock User für Navigation
const mockUser = {
  id: 1,
  email: 'developer@example.com',
  first_name: 'Developer',
  last_name: 'User',
  role: 'ADMIN' as const,
  is_active: true,
  language: 'de',
  timezone: 'Europe/Berlin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export function ComponentShowcasePage() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { backgroundType } = useBackgroundStore();
  const { isStickyNavigation, toggleStickyNavigation } = useNavigationStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('buttons');
  const [formData, setFormData] = useState({
    textInput: '',
    passwordInput: '',
    selectValue: '',
    checkboxValue: false,
    textareaValue: '',
  });

  const sections = [
    { id: 'buttons', label: 'Buttons', icon: CheckCircleIcon },
    { id: 'forms', label: 'Formulare', icon: DocumentTextIcon },
    { id: 'cards', label: 'Cards', icon: ClipboardDocumentIcon },
    { id: 'navigation', label: 'Navigation', icon: Bars3Icon },
    { id: 'icons', label: 'Icons', icon: SparklesIcon },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code in Zwischenablage kopiert!');
  };

  const handleLogout = () => {
    toast.success('Abgemeldet!');
  };

  const buttonVariants = [
    { name: 'Primary', component: PrimaryButton, code: '<PrimaryButton>Primary Button</PrimaryButton>' },
    { name: 'Secondary', component: SecondaryButton, code: '<SecondaryButton>Secondary Button</SecondaryButton>' },
    { name: 'Danger', component: DangerButton, code: '<DangerButton>Danger Button</DangerButton>' },
    { name: 'Success', component: SuccessButton, code: '<SuccessButton>Success Button</SuccessButton>' },
    { name: 'Warning', component: WarningButton, code: '<WarningButton>Warning Button</WarningButton>' },
    { name: 'Ghost', component: GhostButton, code: '<GhostButton>Ghost Button</GhostButton>' },
    { name: 'Outline', component: OutlineButton, code: '<OutlineButton>Outline Button</OutlineButton>' },
  ];

  const buttonSizes = [
    { name: 'Small', size: 'sm' as const, code: '<Button size="sm">Small Button</Button>' },
    { name: 'Medium', size: 'md' as const, code: '<Button size="md">Medium Button</Button>' },
    { name: 'Large', size: 'lg' as const, code: '<Button size="lg">Large Button</Button>' },
  ];

  const buttonStates = [
    { name: 'Default', state: 'default' as const, code: '<Button>Default Button</Button>' },
    { name: 'Loading', state: 'loading' as const, code: '<Button loading>Loading Button</Button>' },
    { name: 'Success', state: 'success' as const, code: '<Button state="success">Success Button</Button>' },
    { name: 'Error', state: 'error' as const, code: '<Button state="error">Error Button</Button>' },
  ];

  const formComponents = [
    { name: 'Text Input', code: '<BaseInput label="Name" placeholder="Ihr Name" />' },
    { name: 'Password Input', code: '<PasswordInput label="Passwort" placeholder="Ihr Passwort" />' },
    { name: 'Select', code: '<BaseSelect label="Auswahl" options={[{value: "1", label: "Option 1"}]} />' },
    { name: 'Checkbox', code: '<BaseCheckbox label="Ich stimme zu" />' },
    { name: 'Textarea', code: '<Textarea label="Nachricht" placeholder="Ihre Nachricht" />' },
  ];

  const cardTypes = [
    { name: 'Base Card', code: '<BaseCard>Card Content</BaseCard>' },
    { name: 'Card with Header', code: '<CardWithHeader title="Card Title">Content</CardWithHeader>' },
    { name: 'Stats Card', code: '<StatsCard title="Statistik" value="123" />' },
    { name: 'Feature Card', code: '<FeatureCard title="Feature" description="Beschreibung" />' },
  ];

  const navigationItems = [
    { name: 'Dashboard', icon: HomeIcon, code: '<HomeIcon className="w-5 h-5" />' },
    { name: 'Analytics', icon: ChartBarIcon, code: '<ChartBarIcon className="w-5 h-5" />' },
    { name: 'Parfüme', icon: BeakerIcon, code: '<BeakerIcon className="w-5 h-5" />' },
    { name: 'Materialien', icon: CubeIcon, code: '<CubeIcon className="w-5 h-5" />' },
    { name: 'Bestellungen', icon: ShoppingCartIcon, code: '<ShoppingCartIcon className="w-5 h-5" />' },
    { name: 'Produktion', icon: ClipboardDocumentListIcon, code: '<ClipboardDocumentListIcon className="w-5 h-5" />' },
    { name: 'Bewertungen', icon: StarIcon, code: '<StarIcon className="w-5 h-5" />' },
    { name: 'Tools', icon: WrenchScrewdriverIcon, code: '<WrenchScrewdriverIcon className="w-5 h-5" />' },
  ];

  const iconExamples = [
    { name: 'User', icon: UserIcon, code: '<UserIcon className="w-6 h-6" />' },
    { name: 'Heart', icon: HeartIcon, code: '<HeartIcon className="w-6 h-6" />' },
    { name: 'Star', icon: StarIcon, code: '<StarIcon className="w-6 h-6" />' },
    { name: 'Home', icon: HomeIcon, code: '<HomeIcon className="w-6 h-6" />' },
    { name: 'Chart', icon: ChartBarIcon, code: '<ChartBarIcon className="w-6 h-6" />' },
    { name: 'Settings', icon: Cog6ToothIcon, code: '<Cog6ToothIcon className="w-6 h-6" />' },
    { name: 'Paint', icon: PaintBrushIcon, code: '<PaintBrushIcon className="w-6 h-6" />' },
    { name: 'Sparkles', icon: SparklesIcon, code: '<SparklesIcon className="w-6 h-6" />' },
  ];

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
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Komponenten Showcase
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Eine vollständige Übersicht aller verfügbaren UI-Komponenten mit Beispielen und Code-Snippets.
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Buttons Section */}
            {activeSection === 'buttons' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-bold text-text-primary">Buttons</h2>
                
                {/* Button Variants */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">Varianten</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buttonVariants.map((variant) => {
                      const Component = variant.component;
                      return (
                        <BaseCard key={variant.name} className="p-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-text-primary">{variant.name}</h4>
                            <div className="flex justify-center">
                              <Component>{variant.name} Button</Component>
                            </div>
                            <div className="flex items-center justify-between">
                              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                                {variant.code}
                              </code>
                              <IconButton
                                icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                                onClick={() => copyToClipboard(variant.code)}
                                className="flex-shrink-0"
                                aria-label="Code kopieren"
                              />
                            </div>
                          </div>
                        </BaseCard>
                      );
                    })}
                  </div>
                </div>

                {/* Button Sizes */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">Größen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {buttonSizes.map((size) => (
                      <BaseCard key={size.name} className="p-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-text-primary">{size.name}</h4>
                          <div className="flex justify-center">
                            <Button size={size.size}>{size.name} Button</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                              {size.code}
                            </code>
                            <IconButton
                              icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                              onClick={() => copyToClipboard(size.code)}
                              className="flex-shrink-0"
                              aria-label="Code kopieren"
                            />
                          </div>
                        </div>
                      </BaseCard>
                    ))}
                  </div>
                </div>

                {/* Button States */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">Zustände</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {buttonStates.map((state) => (
                      <BaseCard key={state.name} className="p-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-text-primary">{state.name}</h4>
                          <div className="flex justify-center">
                            <Button state={state.state}>{state.name} Button</Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                              {state.code}
                            </code>
                            <IconButton
                              icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                              onClick={() => copyToClipboard(state.code)}
                              className="flex-shrink-0"
                              aria-label="Code kopieren"
                            />
                          </div>
                        </div>
                      </BaseCard>
                    ))}
                  </div>
                </div>

                {/* Button Group */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">Button Group</h3>
                  <BaseCard className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <ButtonGroup>
                          <PrimaryButton>Erste</PrimaryButton>
                          <SecondaryButton>Zweite</SecondaryButton>
                          <DangerButton>Dritte</DangerButton>
                        </ButtonGroup>
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                          {'<ButtonGroup><PrimaryButton>Erste</PrimaryButton><SecondaryButton>Zweite</SecondaryButton><DangerButton>Dritte</DangerButton></ButtonGroup>'}
                        </code>
                        <IconButton
                          icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                          onClick={() => copyToClipboard('<ButtonGroup><PrimaryButton>Erste</PrimaryButton><SecondaryButton>Zweite</SecondaryButton><DangerButton>Dritte</DangerButton></ButtonGroup>')}
                          className="flex-shrink-0"
                          aria-label="Code kopieren"
                        />
                      </div>
                    </div>
                  </BaseCard>
                </div>
              </motion.div>
            )}

            {/* Forms Section */}
            {activeSection === 'forms' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-bold text-text-primary">Formulare</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form Examples */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-text-primary">Beispiele</h3>
                    
                    <BaseCard className="p-6">
                      <div className="space-y-4">
                        <BaseInput
                          label="Name"
                          placeholder="Ihr Name"
                          value={formData.textInput}
                          onChange={(e) => setFormData({...formData, textInput: e.target.value})}
                        />
                        
                        <PasswordInput
                          label="Passwort"
                          placeholder="Ihr Passwort"
                          value={formData.passwordInput}
                          onChange={(e) => setFormData({...formData, passwordInput: e.target.value})}
                        />
                        
                        <BaseSelect
                          label="Auswahl"
                          value={formData.selectValue}
                          onChange={(value) => setFormData({...formData, selectValue: value})}
                          options={[
                            { value: 'option1', label: 'Option 1' },
                            { value: 'option2', label: 'Option 2' },
                            { value: 'option3', label: 'Option 3' },
                          ]}
                          placeholder="Wählen Sie eine Option"
                        />
                        
                        <BaseCheckbox
                          label="Ich stimme den Bedingungen zu"
                          checked={formData.checkboxValue}
                          onChange={(checked) => setFormData({...formData, checkboxValue: checked})}
                        />
                        
                        <Textarea
                          label="Nachricht"
                          placeholder="Ihre Nachricht"
                          value={formData.textareaValue}
                          onChange={(e) => setFormData({...formData, textareaValue: e.target.value})}
                          rows={4}
                        />
                      </div>
                    </BaseCard>
                  </div>

                  {/* Form Code Examples */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-text-primary">Code Beispiele</h3>
                    
                    {formComponents.map((component) => (
                      <BaseCard key={component.name} className="p-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-text-primary">{component.name}</h4>
                          <div className="flex items-center justify-between">
                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                              {component.code}
                            </code>
                            <IconButton
                              icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                              onClick={() => copyToClipboard(component.code)}
                              className="flex-shrink-0"
                              aria-label="Code kopieren"
                            />
                          </div>
                        </div>
                      </BaseCard>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cards Section */}
            {activeSection === 'cards' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-bold text-text-primary">Cards</h2>
                
                <div className="space-y-8">
                  {/* Card Examples */}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Beispiele</h3>
                    <GridCardContainer columns={2} gap="lg">
                      <BaseCard>
                        <h4 className="font-semibold text-text-primary mb-2">Base Card</h4>
                        <p className="text-text-secondary">Eine einfache Card mit Inhalt.</p>
                      </BaseCard>
                      
                      <CardWithHeader title="Card mit Header" subtitle="Eine Card mit Titel und Untertitel">
                        <p className="text-text-secondary">Inhalt der Card mit Header.</p>
                      </CardWithHeader>
                      
                      <StatsCard
                        title="Gesamt Verkäufe"
                        value="€12,345"
                        change={{ value: '12%', type: 'increase' }}
                        icon={<ChartBarIcon className="w-8 h-8" />}
                      />
                      
                      <FeatureCard
                        title="Neues Feature"
                        description="Beschreibung des neuen Features"
                        icon={<SparklesIcon className="w-6 h-6" />}
                        action={<PrimaryButton>Mehr erfahren</PrimaryButton>}
                      />
                    </GridCardContainer>
                  </div>

                  {/* Card Code Examples */}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Code Beispiele</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cardTypes.map((card) => (
                        <BaseCard key={card.name} className="p-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-text-primary">{card.name}</h4>
                            <div className="flex items-center justify-between">
                              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                                {card.code}
                              </code>
                              <IconButton
                                icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                                onClick={() => copyToClipboard(card.code)}
                                className="flex-shrink-0"
                                aria-label="Code kopieren"
                              />
                            </div>
                          </div>
                        </BaseCard>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Section */}
            {activeSection === 'navigation' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-bold text-text-primary">Navigation</h2>
                
                <div className="space-y-8">
                  {/* Navigation Examples */}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Navigation Items</h3>
                    <BaseCard className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {navigationItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.name} className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium text-text-primary">{item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </BaseCard>
                  </div>

                  {/* Navigation Code Examples */}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Code Beispiele</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <BaseCard key={item.name} className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                <h4 className="font-semibold text-text-primary">{item.name}</h4>
                              </div>
                              <div className="flex items-center justify-between">
                                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                                  {item.code}
                                </code>
                                <IconButton
                                  icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                                  onClick={() => copyToClipboard(item.code)}
                                  className="flex-shrink-0"
                                  aria-label="Code kopieren"
                                />
                              </div>
                            </div>
                          </BaseCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Icons Section */}
            {activeSection === 'icons' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-bold text-text-primary">Icons</h2>
                
                <div className="space-y-8">
                  {/* Icon Examples */}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Verfügbare Icons</h3>
                    <BaseCard className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
                        {iconExamples.map((icon) => {
                          const Icon = icon.icon;
                          return (
                            <div key={icon.name} className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                              <span className="text-xs font-medium text-text-primary text-center">{icon.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </BaseCard>
                  </div>

                  {/* Icon Code Examples */}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Code Beispiele</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {iconExamples.map((icon) => {
                        const Icon = icon.icon;
                        return (
                          <BaseCard key={icon.name} className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                <h4 className="font-semibold text-text-primary">{icon.name}</h4>
                              </div>
                              <div className="flex items-center justify-between">
                                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200 flex-1 mr-2">
                                  {icon.code}
                                </code>
                                <IconButton
                                  icon={<ClipboardDocumentIcon className="w-4 h-4" />}
                                  onClick={() => copyToClipboard(icon.code)}
                                  className="flex-shrink-0"
                                  aria-label="Code kopieren"
                                />
                              </div>
                            </div>
                          </BaseCard>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
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

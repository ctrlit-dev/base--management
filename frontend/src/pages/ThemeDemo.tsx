import { ThemeToggle } from '../components/ThemeToggle';

export function ThemeDemo() {
  return (
    <div className="min-h-screen bg-background-primary theme-transition">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              LCREE Designsystem Demo
            </h1>
            <p className="text-text-secondary">
              Elegant Tech Luxury - Light & Dark Mode
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Primary Card */}
          <div className="card glow-on-hover">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Primary Card
            </h3>
            <p className="text-text-secondary mb-4">
              Diese Karte zeigt das LCREE Designsystem in Aktion. 
              Der Hintergrund und die Farben ändern sich automatisch 
              zwischen Light und Dark Mode.
            </p>
            <button className="btn-primary">
              Primary Button
            </button>
          </div>

          {/* Secondary Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Input Demo
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="E-Mail Adresse"
                className="input w-full"
              />
              <input
                type="password"
                placeholder="Passwort"
                className="input w-full"
              />
              <button className="btn-primary w-full">
                Anmelden
              </button>
            </div>
          </div>

          {/* Glass Card */}
          <div className="card glass">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Glass Effect
            </h3>
            <p className="text-text-secondary">
              Diese Karte verwendet den Glassmorphism-Effekt 
              mit Backdrop-Blur für einen modernen Look.
            </p>
          </div>
        </div>

        {/* Color Palette */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Farbpalette
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ backgroundColor: 'var(--color-accent-blue)' }}
              ></div>
              <p className="text-sm text-text-secondary">Accent Blue</p>
            </div>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ backgroundColor: 'var(--color-accent-violet)' }}
              ></div>
              <p className="text-sm text-text-secondary">Accent Violet</p>
            </div>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ backgroundColor: 'var(--color-success)' }}
              ></div>
              <p className="text-sm text-text-secondary">Success</p>
            </div>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ backgroundColor: 'var(--color-error)' }}
              ></div>
              <p className="text-sm text-text-secondary">Error</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

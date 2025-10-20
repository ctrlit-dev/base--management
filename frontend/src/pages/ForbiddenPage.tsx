import { motion } from 'framer-motion';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { BackgroundRenderer } from '../components/BackgroundRenderer';
import { useBackgroundStore } from '../store/backgroundStore';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { backgroundType } = useBackgroundStore();

  return (
    <div className="min-h-screen bg-background-primary theme-transition flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <BackgroundRenderer type={backgroundType} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="mb-8">
          <ShieldExclamationIcon className="w-24 h-24 mx-auto text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-text-primary mb-4">
          403
        </h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Zugriff verweigert
        </h2>
        <p className="text-text-secondary mb-8 max-w-md">
          Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary px-6 py-3"
        >
          Zurück zum Dashboard
        </button>
      </motion.div>
    </div>
  );
}

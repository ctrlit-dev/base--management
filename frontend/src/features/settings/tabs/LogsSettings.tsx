import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RealActivityLogs, RealErrorLogs } from '@/features/settings/settings/RealLogComponents';

function LogsSettings() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuliere Ladezeit für Logs
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-text-secondary">Lade Logs...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-6">
        <div className="card p-6">
          <RealActivityLogs />
        </div>
        <div className="card p-6">
          <RealErrorLogs />
        </div>
      </div>
    </motion.div>
  );
}

export default LogsSettings;

import React, { useEffect, useState, useRef } from 'react';
import { toast as hotToast, Toast } from 'react-hot-toast';

interface CustomToastProps {
  toast: Toast;
  message: string;
  type: 'success' | 'error' | 'loading' | 'blank';
  darkMode: boolean;
}

export function CustomToast({ toast, message, type, darkMode }: CustomToastProps) {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (toast.duration === Infinity) return; // Keine Progressbar für persistente Toasts

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - toast.createdAt;
      const remaining = Math.max(0, toast.duration - elapsed);
      const progressPercent = (remaining / toast.duration) * 100;
      
      setProgress(progressPercent);
      
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Automatische Schließung wenn Progressbar abgelaufen ist
        handleClose();
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [toast.duration, toast.createdAt]);

  const handleClose = () => {
    if (isRemoved) return; // Verhindere mehrfache Schließung
    
    setIsRemoved(true);
    setIsClosing(true);
    
    // Stoppe die Progressbar-Animation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Sofortige Entfernung
    hotToast.remove(toast.id);
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-900/80 via-emerald-800/80 to-emerald-700/80',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-400',
          progressColor: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-900/80 via-red-800/80 to-red-700/80',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400',
          progressColor: 'bg-gradient-to-r from-red-500 to-red-400',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'loading':
        return {
          bg: 'bg-gradient-to-r from-blue-900/80 via-blue-800/80 to-blue-700/80',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-400',
          progressColor: 'bg-gradient-to-r from-blue-500 to-blue-400',
          icon: (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-600/80',
          iconBg: 'bg-slate-500/20',
          iconColor: 'text-slate-400',
          progressColor: 'bg-gradient-to-r from-slate-500 to-slate-400',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const style = getToastStyle();

  // Verhindere Rendering wenn Toast entfernt wurde
  if (isRemoved) {
    return null;
  }

  return (
    <div className={`relative ${isClosing ? 'toast-slide-out' : 'toast-slide-in'} p-4 shadow-2xl backdrop-blur-md border border-white/10 ${style.bg}`}>
      {/* Toast Content */}
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center ${style.iconColor}`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div
          className={`h-full ${style.progressColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

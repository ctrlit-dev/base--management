import { Toaster as HotToaster } from 'react-hot-toast';
import { useThemeStore } from '../store/themeStore';
import { CustomToast } from './CustomToast';

export function Toaster() {
  const { darkMode } = useThemeStore();

  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          padding: 0,
          margin: 0,
          boxShadow: 'none',
          border: 'none',
          minWidth: '320px',
          maxWidth: '400px',
        },
      }}
    >
      {(toast) => (
        <CustomToast
          toast={toast}
          message={toast.message as string}
          type={toast.type as 'success' | 'error' | 'loading' | 'blank'}
          darkMode={darkMode}
        />
      )}
    </HotToaster>
  );
}

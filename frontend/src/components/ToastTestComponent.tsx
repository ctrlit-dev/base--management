import React from 'react';
import toast from 'react-hot-toast';

export function ToastTestComponent() {
  const showSuccessToast = () => {
    toast.success('Erfolgreiche Operation!');
  };

  const showErrorToast = () => {
    toast.error('Ein Fehler ist aufgetreten!');
  };

  const showLoadingToast = () => {
    toast.loading('Lade Daten...');
  };

  const showCustomToast = () => {
    toast('Dies ist eine benutzerdefinierte Nachricht!', {
      duration: 6000,
    });
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
        Toast Test
      </h3>
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={showSuccessToast}
          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          Success
        </button>
        <button
          onClick={showErrorToast}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
        >
          Error
        </button>
        <button
          onClick={showLoadingToast}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Loading
        </button>
        <button
          onClick={showCustomToast}
          className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
        >
          Custom
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, Download } from 'lucide-react';
import { Button } from './ui/button';

export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [supportsPWA, setSupportsPWA] = useState(false);

  useEffect(() => {
    // Check if PWA is supported
    setSupportsPWA('serviceWorker' in navigator && 'PushManager' in window);

    // Check if app is running in standalone mode
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  if (!supportsPWA) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Info size={16} />
          <span className="text-sm font-medium">
            PWA not supported in this browser
          </span>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
          Try using Chrome, Edge, or Safari for the best experience.
        </p>
      </div>
    );
  }

  if (isInstalled && isStandalone) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">
            App is installed and running in standalone mode
          </span>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
          You're enjoying the full PWA experience!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <Download size={16} />
        <span className="text-sm font-medium">
          Install The Food App
        </span>
      </div>
      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 mb-3">
        Install this app on your device for quick access and offline functionality.
      </p>
      <div className="text-xs text-blue-600 dark:text-blue-400">
        <p>• Look for the install banner below</p>
        <p>• Or use your browser's menu to add to home screen</p>
      </div>
    </div>
  );
} 
/**
 * Login Screen Component (Stub - Phase 2)
 */

import { useEffect } from 'react';
import { log, LogCategory } from '../../utils/logger';

export function LoginScreen() {
  // Component mount/unmount logging
  useEffect(() => {
    log.info(LogCategory.UI, 'LoginScreen mounted');
    return () => {
      log.debug(LogCategory.UI, 'LoginScreen unmounting');
    };
  }, []);

  const handleGoogleSignIn = () => {
    log.action('Google sign in button clicked', { component: 'LoginScreen' });
  };

  const handleEmailSignIn = () => {
    log.action('Email sign in button clicked', { component: 'LoginScreen' });
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
          LN
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">LinkedIn Network Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered networking assistant
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={handleGoogleSignIn} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Sign in with Google
          </button>

          <button onClick={handleEmailSignIn} className="w-full px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Sign in with Email
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Authentication coming in Phase 2
        </p>
      </div>
    </div>
  );
}

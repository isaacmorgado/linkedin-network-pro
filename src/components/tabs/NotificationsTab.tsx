/**
 * Notifications Tab (Stub - Phase 4)
 */

import { useEffect } from 'react';
import { log, LogCategory } from '../../utils/logger';

export function NotificationsTab() {
  // Component mount/unmount logging
  useEffect(() => {
    log.info(LogCategory.UI, 'NotificationsTab mounted');
    return () => {
      log.debug(LogCategory.UI, 'NotificationsTab unmounting');
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <p className="text-sm text-gray-500">
        Job alerts, connection updates, and more
      </p>
      <div className="text-center py-12 text-gray-400">
        Coming in Phase 4
      </div>
    </div>
  );
}

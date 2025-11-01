
import { useState, useEffect } from 'react';
import { syncService } from '@/services/syncService';
import { useAppStore } from '@/stores/appStore';

export function useSyncStatus() {
  const [status, setStatus] = useState(syncService.getSyncStatus());
  const lastSyncTimestamp = useAppStore((state) => state.lastSyncTimestamp);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(syncService.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTimestamp]);

  const getLastSyncText = () => {
    if (!status.lastSyncTimestamp) {
      return 'Never synced';
    }

    const now = Date.now();
    const diff = now - status.lastSyncTimestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return {
    ...status,
    lastSyncText: getLastSyncText(),
    forceSyncNow: () => syncService.forceSyncNow(),
  };
}

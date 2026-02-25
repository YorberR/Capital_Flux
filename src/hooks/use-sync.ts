import { useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncEngine } from '../features/sync/engine';
import { useSyncStore } from '../store/sync-store';
import { syncQueries } from '../db/queries';
import { SyncStats, SyncEventHandlers } from '../features/sync/types';

export function useSync(handlers?: SyncEventHandlers) {
  const {
    isOnline,
    isSyncing,
    lastSyncAt,
    pendingCount,
    setOnline,
    setSyncing,
    setLastSyncAt,
    setPendingCount,
    triggerSync,
  } = useSyncStore();

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    syncEngine.setHandlers({
      onSyncStart: () => {
        setSyncing(true);
        handlersRef.current?.onSyncStart?.();
      },
      onSyncComplete: (stats: SyncStats) => {
        setSyncing(false);
        setLastSyncAt(stats.lastSyncAt);
        handlersRef.current?.onSyncComplete?.(stats);
      },
      onSyncError: (error: Error) => {
        setSyncing(false);
        handlersRef.current?.onSyncError?.(error);
      },
      onConflict: (resolution) => handlersRef.current?.onConflict?.(resolution),
      onProgress: (progress) => handlersRef.current?.onProgress?.(progress),
    });

    syncEngine.initialize();

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setOnline(online);
    });

    const updatePendingCount = async () => {
      const count = await syncQueries.getPendingCount();
      setPendingCount(count.wallets + count.transactions);
    };

    updatePendingCount();

    return () => {
      syncEngine.destroy();
      unsubscribeNetInfo();
    };
  }, [setOnline, setSyncing, setLastSyncAt, setPendingCount]);

  const manualSync = useCallback(async () => {
    return triggerSync();
  }, [triggerSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncAt,
    pendingCount,
    manualSync,
  };
}

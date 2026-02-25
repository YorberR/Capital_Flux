import { create } from 'zustand';
import { SyncStatus } from '../types';
import { syncEngine } from '../features/sync/engine';
import { SyncStats } from '../features/sync/types';

interface SyncStore extends SyncStatus {
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (lastSyncAt: string | null) => void;
  setPendingCount: (count: number) => void;
  triggerSync: () => Promise<SyncStats | null>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  isOnline: true,
  lastSyncAt: null,
  pendingCount: 0,
  isSyncing: false,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setPendingCount: (pendingCount) => set({ pendingCount }),

  triggerSync: async () => {
    if (get().isSyncing) return null;
    
    set({ isSyncing: true });
    
    try {
      const stats = await syncEngine.sync();
      set({
        isSyncing: false,
        lastSyncAt: stats.lastSyncAt,
        pendingCount: stats.totalPending - stats.synced,
      });
      return stats;
    } catch (error) {
      set({ isSyncing: false });
      throw error;
    }
  },
}));

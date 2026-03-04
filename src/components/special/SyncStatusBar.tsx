import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/use-theme';
import { useSyncStore } from '../../store/sync-store';

interface SyncStatusBarProps {
  compact?: boolean;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ compact = false }) => {
  const colors = useColors();
  const { isOnline, isSyncing, pendingCount, lastSyncAt } = useSyncStore();

  const getStatusConfig = () => {
    if (!isOnline) {
      return { color: colors.accentAmber, icon: 'cloud-offline', label: 'Offline' };
    }
    if (isSyncing) {
      return { color: colors.accentBlue, icon: 'sync', label: 'Syncing...' };
    }
    if (pendingCount > 0) {
      return { color: colors.accentAmber, icon: 'cloud-upload', label: `${pendingCount} pending` };
    }
    return { color: colors.accentGreen, icon: 'cloud-done', label: 'Synced' };
  };

  const status = getStatusConfig();

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: `${status.color}20` }]}>
        <Ionicons name={status.icon as any} size={14} color={status.color} />
        <Text style={[styles.compactText, { color: status.color }]}>{status.label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.statusRow}>
        <Ionicons name={status.icon as any} size={16} color={status.color} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>{status.label}</Text>
      </View>
      {lastSyncAt && (
        <Text style={[styles.timestamp, { color: colors.textMuted }]}>
          Last sync: {new Date(lastSyncAt).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 24,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

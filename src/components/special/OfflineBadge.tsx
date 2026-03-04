import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/use-theme';

interface OfflineBadgeProps {
  size?: 'small' | 'medium';
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ size = 'small' }) => {
  const colors = useColors();

  const isSmall = size === 'small';
  const iconSize = isSmall ? 10 : 12;
  const fontSize = isSmall ? 10 : 12;
  const padding = isSmall ? 4 : 6;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.accentAmber}20`,
          paddingHorizontal: padding,
          paddingVertical: padding / 2,
        },
      ]}
    >
      <Ionicons name="cloud-offline" size={iconSize} color={colors.accentAmber} />
      <Text style={[styles.text, { color: colors.accentAmber, fontSize }]}>
        Offline
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
  },
});

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../../hooks/use-theme';
import { BorderRadius } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style,
  intensity = 'medium' 
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: intensity === 'low' 
            ? `${colors.backgroundSecondary}99`
            : intensity === 'high'
              ? `${colors.backgroundTertiary}E6`
              : `${colors.backgroundSecondary}CC`,
          borderColor: `${colors.border}66`,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});

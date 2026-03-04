import React from 'react';
import { Text, useColorScheme, View } from 'react-native';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
      gap: 16,
    }}>
      <Text style={{ fontSize: 48 }}>🧭</Text>
      <Text style={{
        fontSize: 18, fontWeight: '600',
        color: isDark ? '#94A3B8' : '#475569',
      }}>
        Próximamente
      </Text>
      <Text style={{
        fontSize: 14, textAlign: 'center', paddingHorizontal: 40,
        color: isDark ? '#475569' : '#94A3B8',
      }}>
        Aquí podrás explorar estadísticas y reportes de tus finanzas.
      </Text>
    </View>
  );
}

import { Link } from 'expo-router';
import { Text, useColorScheme, View } from 'react-native';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20,
      backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
    }}>
      <Text style={{
        fontSize: 24, fontWeight: 'bold',
        color: isDark ? '#F8FAFC' : '#0F172A',
      }}>
        Capital Flux
      </Text>
      <Link href="/" dismissTo style={{ marginTop: 15, paddingVertical: 15 }}>
        <Text style={{ color: '#7C3AED', fontSize: 16 }}>
          Ir al inicio
        </Text>
      </Link>
    </View>
  );
}

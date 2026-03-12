import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';

// ─── SettingItem ─────────────────────────────────────────────────────────────

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement, isDestructive }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({pressed}) => ({
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
        backgroundColor: pressed && onPress ? colors.backgroundTertiary : colors.backgroundSecondary,
        gap: Spacing.md,
        borderCurve: 'continuous',
      })}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={{
        width: 40, height: 40, borderRadius: BorderRadius.md,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: isDestructive ? colors.accentRed + '15' : colors.brandPrimary + '15',
        borderCurve: 'continuous',
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: FontSizes.body, fontWeight: '500', color: isDestructive ? colors.accentRed : colors.textPrimary }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>)}
    </Pressable>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{
      fontSize: FontSizes.caption, fontWeight: '600', color: colors.textSecondary,
      marginTop: Spacing.xl, marginBottom: Spacing.md, marginLeft: Spacing.sm,
      letterSpacing: 1,
    }}>
      {title.toUpperCase()}
    </Text>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [biometrics, setBiometrics] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              // AuthGuard in _layout.tsx will redirect to login automatically
            } catch {
              Alert.alert('Error', 'No se pudo cerrar la sesión. Intenta de nuevo.');
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
      }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 22 }}>✖️</Text>
        </Pressable>
        <Text style={{ fontSize: FontSizes.heading3, fontWeight: '600', color: colors.textPrimary }}>
          Configuración
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* User email mini card */}
        {user?.email && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
            padding: Spacing.lg, borderRadius: BorderRadius.xl,
            backgroundColor: colors.brandPrimary + '12',
            marginBottom: Spacing.md,
            borderCurve: 'continuous',
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: colors.brandPrimary,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: FontSizes.body }}>
                {user.email.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: FontSizes.body }}>
                {user.email.split('@')[0]}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>
                {user.email}
              </Text>
            </View>
          </View>
        )}

        <SectionHeader title="Cuenta" />
        <SettingItem
          icon="👤" title="Perfil" subtitle="Ver mis datos de cuenta"
          onPress={() => router.push('/settings/profile' as any)}
        />
        <SettingItem
          icon="💳" title="Mis Billeteras" subtitle="Administrar cuentas"
          onPress={() => router.push('/wallets' as any)}
        />

        <SectionHeader title="Apariencia" />
        <SettingItem
          icon={isDark ? '🌙' : '☀️'}
          title="Modo Oscuro"
          subtitle={isDark ? 'Activo' : 'Inactivo'}
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.brandPrimary + '80' }}
              thumbColor={isDark ? colors.brandPrimary : colors.textMuted}
            />
          }
        />

        <SectionHeader title="Preferencias" />
        <SettingItem
          icon="🔐" title="Biometría" subtitle="Usar huella para acceder"
          rightElement={
            <Switch
              value={biometrics} onValueChange={setBiometrics}
              trackColor={{ false: colors.border, true: colors.brandPrimary + '80' }}
              thumbColor={biometrics ? colors.brandPrimary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="🔔" title="Notificaciones" subtitle="Alertas de cambios bruscos"
          rightElement={
            <Switch
              value={notifications} onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.brandPrimary + '80' }}
              thumbColor={notifications ? colors.brandPrimary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="📊" title="Tasa Predeterminada" subtitle="BCV Oficial"
          onPress={() => Alert.alert('Tasa', 'Función próximamente')}
        />

        <SectionHeader title="General" />
        <SettingItem icon="ℹ️" title="Versión" subtitle="1.0.0 (Beta)" />

        <SettingItem
          icon="🚪"
          title={signingOut ? 'Cerrando sesión…' : 'Cerrar Sesión'}
          isDestructive
          onPress={signingOut ? undefined : handleSignOut}
        />

        <View style={{ alignItems: 'center', marginTop: Spacing.xxxl }}>
          <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted, textAlign: 'center' }}>
            Capital Flux{'\n'}Hecho con ❤️ para Venezuela
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

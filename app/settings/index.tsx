import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';

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
      style={{
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
        backgroundColor: colors.backgroundSecondary, gap: Spacing.md,
        borderCurve: 'continuous',
      }}
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

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const [biometrics, setBiometrics] = useState(false);
  const [notifications, setNotifications] = useState(true);

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
        contentContainerStyle={{ paddingBottom: 60 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Cuenta" />
        <SettingItem
          icon="👤" title="Perfil" subtitle="Gestionar datos del usuario"
          onPress={() => Alert.alert('Perfil', 'Función en desarrollo')}
        />
        <SettingItem
          icon="💳" title="Mis Billeteras" subtitle="Administrar cuentas"
          onPress={() => router.push('/wallets' as any)}
        />

        <SectionHeader title="Apariencia" />
        <SettingItem
          icon="🌙" title="Modo Oscuro" subtitle="El tema se adapta al sistema"
          rightElement={
            <Switch
              value={isDark}
              disabled={true}
              trackColor={{ false: colors.border, true: colors.brandPrimary + '50' }}
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
              trackColor={{ false: colors.border, true: colors.brandPrimary + '50' }}
              thumbColor={biometrics ? colors.brandPrimary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="🔔" title="Notificaciones" subtitle="Alertas de cambios bruscos"
          rightElement={
            <Switch
              value={notifications} onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.brandPrimary + '50' }}
              thumbColor={notifications ? colors.brandPrimary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="📊" title="Tasa Predeterminada" subtitle="BCV Oficial"
          onPress={() => Alert.alert('Tasa', 'Función en desarrollo')}
        />

        <SectionHeader title="General" />
        <SettingItem
          icon="ℹ️" title="Versión" subtitle="1.0.0 (Demo)"
        />
        <SettingItem
          icon="🚪" title="Cerrar Sesión" isDestructive
          onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro?')}
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

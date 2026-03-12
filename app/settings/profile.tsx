import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';

// ─── Avatar Initials ─────────────────────────────────────────────────────────

function getInitials(email: string): string {
  const [localPart] = email.split('@');
  const parts = localPart.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase();
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
      backgroundColor: colors.backgroundSecondary, gap: Spacing.md,
      borderCurve: 'continuous',
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: BorderRadius.md,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.brandPrimary + '15',
        borderCurve: 'continuous',
      }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted, fontWeight: '500' }}>
          {label}
        </Text>
        <Text style={{ fontSize: FontSizes.body, color: colors.textPrimary, fontWeight: '500' }} selectable>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const email = user?.email ?? '—';
  const initials = user?.email ? getInitials(user.email) : '??';
  const userId = user?.id ?? '—';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-VE', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';
  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('es-VE', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';
  const provider = user?.app_metadata?.provider ?? 'email';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
      }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 22 }}>✖️</Text>
        </Pressable>
        <Text style={{ fontSize: FontSizes.heading3, fontWeight: '600', color: colors.textPrimary }}>
          Mi Perfil
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Card */}
        <View style={{
          alignItems: 'center', paddingVertical: Spacing.xxl,
          borderRadius: BorderRadius.xl, marginBottom: Spacing.xxl,
          backgroundColor: colors.backgroundSecondary,
          borderCurve: 'continuous',
        }}>
          {/* Avatar circle */}
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: colors.brandPrimary,
            justifyContent: 'center', alignItems: 'center',
            marginBottom: Spacing.lg,
            boxShadow: `0 6px 24px ${colors.brandPrimary}66`,
          } as any}>
            <Text style={{ fontSize: 34, fontWeight: '700', color: '#FFFFFF' }}>
              {initials}
            </Text>
          </View>

          <Text style={{ fontSize: FontSizes.heading2, fontWeight: '700', color: colors.textPrimary }}>
            {email.split('@')[0]}
          </Text>
          <Text style={{ fontSize: FontSizes.bodySm, color: colors.textSecondary, marginTop: 2 }}>
            {email}
          </Text>

          {/* Provider badge */}
          <View style={{
            marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
            borderRadius: BorderRadius.full, backgroundColor: colors.brandPrimary + '20',
          }}>
            <Text style={{ fontSize: FontSizes.caption, color: colors.brandPrimary, fontWeight: '600' }}>
              {provider === 'email' ? '📧 Email' : `🔗 ${provider}`}
            </Text>
          </View>
        </View>

        {/* Info section */}
        <Text style={{
          fontSize: FontSizes.caption, fontWeight: '600', color: colors.textSecondary,
          marginBottom: Spacing.md, marginLeft: Spacing.sm, letterSpacing: 1,
        }}>
          INFORMACIÓN DE CUENTA
        </Text>

        <InfoRow label="Correo electrónico" value={email} emoji="📧" />
        <InfoRow label="Miembro desde" value={createdAt} emoji="📅" />
        <InfoRow label="Último acceso" value={lastSignIn} emoji="🕒" />
        <InfoRow label="ID de usuario" value={userId.slice(0, 8) + '...' + userId.slice(-4)} emoji="🔑" />

      </ScrollView>
    </View>
  );
}

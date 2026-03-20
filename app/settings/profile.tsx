import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';
import { supabase } from '../../src/lib/supabase';

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

// ─── Password Field ──────────────────────────────────────────────────────────

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{
        fontSize: FontSizes.caption, fontWeight: '600',
        color: colors.textMuted, marginBottom: Spacing.sm,
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: BorderRadius.md,
        borderCurve: 'continuous',
      }}>
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
            color: colors.textPrimary, fontSize: FontSizes.body,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={onToggleVisibility}
          style={{
            paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
            justifyContent: 'center', alignItems: 'center',
          }}
          hitSlop={8}
        >
          <Text style={{ fontSize: 18 }}>{visible ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  // ── Password Change Handler ──

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una letra mayúscula.';
    if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.';
    if (!/[!@#$%^&*(),.?":{}\|<>]/.test(pwd)) return 'Debe incluir al menos un carácter especial.';
    return null;
  };

  const handleChangePassword = async () => {
    // Validations
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Ingresa tu contraseña actual.');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Ingresa la nueva contraseña.');
      return;
    }

    const validationError = validatePassword(newPassword.trim());
    if (validationError) {
      Alert.alert('Contraseña débil', validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setChangingPassword(true);
    try {
      // Step 1: Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'La contraseña actual es incorrecta.');
        return;
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Success
      Alert.alert('✅ ¡Listo!', 'Tu contraseña ha sido actualizada exitosamente.');

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setShowPasswordSection(false);
    } catch (err) {
      const message = (err as Error).message ?? 'Error al cambiar la contraseña.';
      Alert.alert('Error', message);
    } finally {
      setChangingPassword(false);
    }
  };

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
        {/* ── Avatar Card ── */}
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

        {/* ── Info section ── */}
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

        {/* ── Change Password Section ── */}
        <Text style={{
          fontSize: FontSizes.caption, fontWeight: '600', color: colors.textSecondary,
          marginBottom: Spacing.md, marginLeft: Spacing.sm, letterSpacing: 1,
          marginTop: Spacing.xxl,
        }}>
          SEGURIDAD
        </Text>

        {!showPasswordSection ? (
          <Pressable
            id="btn-show-change-password"
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center',
              padding: Spacing.lg, borderRadius: BorderRadius.lg,
              backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
              gap: Spacing.md, borderCurve: 'continuous',
            })}
            onPress={() => setShowPasswordSection(true)}
          >
            <View style={{
              width: 40, height: 40, borderRadius: BorderRadius.md,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: colors.accentAmber + '15',
              borderCurve: 'continuous',
            }}>
              <Text style={{ fontSize: 20 }}>🔒</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSizes.body, color: colors.textPrimary, fontWeight: '500' }}>
                Cambiar contraseña
              </Text>
              <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted }}>
                Actualiza tu contraseña de acceso
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: colors.textMuted }}>›</Text>
          </Pressable>
        ) : (
          <View style={{
            borderRadius: BorderRadius.lg,
            backgroundColor: colors.backgroundSecondary,
            padding: Spacing.xl,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: colors.accentAmber + '30',
          }}>
            {/* Section Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              marginBottom: Spacing.xl, gap: Spacing.md,
            }}>
              <Text style={{ fontSize: 20 }}>🔒</Text>
              <Text style={{ fontSize: FontSizes.heading3, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>
                Cambiar contraseña
              </Text>
              <Pressable
                onPress={() => {
                  setShowPasswordSection(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
                hitSlop={8}
              >
                <Text style={{ fontSize: 18 }}>✖️</Text>
              </Pressable>
            </View>

            {/* Current Password */}
            <PasswordField
              label="Contraseña actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Ingresa tu contraseña actual"
              visible={showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword((v) => !v)}
            />

            {/* New Password */}
            <PasswordField
              label="Nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 8 caracteres"
              visible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((v) => !v)}
            />

            {/* Password strength hints */}
            {newPassword.length > 0 && (
              <View style={{ marginBottom: Spacing.lg, marginTop: -Spacing.sm, gap: 4 }}>
                {[
                  { test: newPassword.length >= 8, label: '8+ caracteres' },
                  { test: /[A-Z]/.test(newPassword), label: 'Una mayúscula' },
                  { test: /[0-9]/.test(newPassword), label: 'Un número' },
                  { test: /[!@#$%^&*(),.?":{}\|<>]/.test(newPassword), label: 'Un carácter especial' },
                ].map((rule) => (
                  <View
                    key={rule.label}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
                  >
                    <Text style={{ fontSize: 12 }}>{rule.test ? '✅' : '⬜'}</Text>
                    <Text style={{
                      fontSize: FontSizes.caption,
                      color: rule.test ? colors.accentGreen : colors.textMuted,
                    }}>
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Confirm Password */}
            <PasswordField
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              visible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
            />

            {/* Mismatch warning */}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={{
                fontSize: FontSizes.caption, color: colors.accentRed,
                marginTop: -Spacing.sm, marginBottom: Spacing.md,
              }}>
                ⚠️ Las contraseñas no coinciden
              </Text>
            )}

            {/* Match indicator */}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text style={{
                fontSize: FontSizes.caption, color: colors.accentGreen,
                marginTop: -Spacing.sm, marginBottom: Spacing.md,
              }}>
                ✅ Las contraseñas coinciden
              </Text>
            )}

            {/* Submit Button */}
            <Pressable
              id="btn-submit-change-password"
              style={({ pressed }) => ({
                padding: Spacing.lg, borderRadius: BorderRadius.md,
                alignItems: 'center', marginTop: Spacing.sm,
                backgroundColor: colors.brandPrimary,
                opacity: changingPassword ? 0.6 : pressed ? 0.85 : 1,
                borderCurve: 'continuous',
              })}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: FontSizes.body, fontWeight: '600' }}>
                  Actualizar contraseña
                </Text>
              )}
            </Pressable>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

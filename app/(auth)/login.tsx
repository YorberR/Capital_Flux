import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/lib/auth-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const colors = Colors.dark;

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const handleAuth = async () => {
    const emailTrimmed = email.trim().toLowerCase();
    const passwordTrimmed = password.trim();

    // Basic validation
    if (!emailTrimmed || !passwordTrimmed) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (isRegister && !displayName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre.');
      return;
    }

    const passError = (passwordTrimmed: string) => {
      if (passwordTrimmed.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
      if (!/[A-Z]/.test(passwordTrimmed)) return 'Debe incluir al menos una letra mayúscula.';
      if (!/[0-9]/.test(passwordTrimmed)) return 'Debe incluir al menos un número.';
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordTrimmed)) return 'Debe incluir al menos un carácter especial.';
      return null;
    };

    if (isRegister) {
      const errorMsg = passError(passwordTrimmed);
      if (errorMsg) {
        Alert.alert('Contraseña débil', errorMsg);
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await signUp(emailTrimmed, passwordTrimmed);
        if (error) throw error;
        Alert.alert(
          '¡Cuenta creada! ✅',
          'Revisa tu correo para verificar tu cuenta, luego inicia sesión.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        );
      } else {
        const { error } = await signIn(emailTrimmed, passwordTrimmed);
        if (error) throw error;
        // Navigation handled by AuthGuard in _layout.tsx
      }
    } catch (err) {
      const message = (err as Error).message ?? 'Error de autenticación';
      let friendlyMessage = message;

      if (message.includes('Invalid login credentials')) {
        friendlyMessage = 'Correo o contraseña incorrectos.';
      } else if (message.includes('Email not confirmed')) {
        friendlyMessage = 'Confirma tu correo antes de ingresar.';
      } else if (message.includes('User already registered')) {
        friendlyMessage = 'Ya existe una cuenta con ese correo.';
      }

      Alert.alert('Error', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={['#0F0F1A', '#1A0A2E', '#0F0F1A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glow accent */}
      <View style={styles.glowCircle} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View style={styles.brandSection}>
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            style={styles.logoContainer}
          >
            <Text style={styles.logoText}>CF</Text>
          </LinearGradient>
          <Text style={styles.brandName}>Capital Flux</Text>
          <Text style={styles.brandTagline}>
            Tu billetera para economías volátiles
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <Pressable
              id="btn-login-mode"
              style={[styles.modeBtn, !isRegister && styles.modeBtnActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeBtnText, !isRegister && styles.modeBtnTextActive]}>
                Ingresar
              </Text>
            </Pressable>
            <Pressable
              id="btn-register-mode"
              style={[styles.modeBtn, isRegister && styles.modeBtnActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeBtnText, isRegister && styles.modeBtnTextActive]}>
                Crear cuenta
              </Text>
            </Pressable>
          </View>

          {/* Display Name (register only) */}
          {isRegister && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                id="input-display-name"
                style={getInputStyle('name')}
                placeholder="Tu nombre"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              id="input-email"
              style={getInputStyle('email')}
              placeholder="tu@correo.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              id="input-password"
              style={getInputStyle('password')}
              placeholder={isRegister ? 'Mínimo 6 caracteres' : '••••••••'}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleAuth}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            id="btn-auth-submit"
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            onPress={handleAuth}
            disabled={loading}
          >
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isRegister ? 'Crear cuenta' : 'Ingresar'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Disclaimer */}
          {isRegister && (
            <Text style={styles.disclaimer}>
              Al crear tu cuenta aceptas guardar tu información de manera segura en Supabase.
              Tu información es privada y solo tú puedes acceder a ella.
            </Text>
          )}
        </View>

        {/* Venezuela hint */}
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>🇻🇪 Diseñado para el bolsillo venezolano</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  glowCircle: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#7C3AED',
    opacity: 0.12,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxxl,
  },
  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandName: {
    color: '#F8FAFC',
    fontSize: FontSizes.heading1,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: FontSizes.bodySm,
    textAlign: 'center',
  },
  // Card
  card: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 24,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#0F0F1A',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#7C3AED',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: FontSizes.bodySm,
    fontWeight: '500',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Fields
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: '#94A3B8',
    fontSize: FontSizes.caption,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: '#F8FAFC',
    fontSize: FontSizes.body,
  },
  inputFocused: {
    borderColor: '#7C3AED',
  },
  // Submit
  submitBtn: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Disclaimer
  disclaimer: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 17,
  },
  // Hint
  hintRow: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  hintText: {
    color: '#475569',
    fontSize: FontSizes.caption,
  },
});

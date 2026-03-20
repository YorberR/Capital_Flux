import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';
import { useWalletStore } from '../../src/store/wallet-store';

type Currency = 'USD' | 'VES' | 'EUR' | 'COP';

const currencies: { id: Currency; label: string; symbol: string; emoji: string }[] = [
  { id: 'USD', label: 'Dólar', symbol: '$', emoji: '🇺🇸' },
  { id: 'VES', label: 'Bolívar', symbol: 'Bs.', emoji: '🇻🇪' },
  { id: 'EUR', label: 'Euro', symbol: '€', emoji: '🇪🇺' },
  { id: 'COP', label: 'Peso', symbol: 'COL$', emoji: '🇨🇴' },
];

const walletColors = ['#4F46E5', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];

export default function NewWalletScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const createWallet = useWalletStore((state) => state.createWallet);

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [balance, setBalance] = useState('0');
  const [selectedColor, setSelectedColor] = useState(walletColors[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la billetera');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una billetera');
      return;
    }

    setIsSubmitting(true);
    const parsedBalance = parseFloat(balance.replace(',', '.'));
    
    try {
      const newWallet = await createWallet(
        {
          name: name.trim(),
          currency,
          balance: isNaN(parsedBalance) ? 0 : parsedBalance,
          color: selectedColor,
        },
        user.id
      );

      if (newWallet) {
        Alert.alert('Éxito', 'Billetera creada correctamente');
        router.back();
      } else {
        Alert.alert('Error', 'No se pudo crear la billetera');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado al crear la billetera');
    } finally {
      setIsSubmitting(false);
    }
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
          Nueva Billetera
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Card */}
        <View style={{
          backgroundColor: selectedColor,
          borderRadius: BorderRadius.xl, padding: Spacing.xxl, marginBottom: Spacing.xxl,
          borderCurve: 'continuous',
          boxShadow: `0 6px 24px ${selectedColor}44`,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.bodySm, marginBottom: 4 }}>
            Vista previa
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: FontSizes.heading1, fontWeight: '700' }}>
            {name || 'Mi Billetera'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.bodySm, marginTop: Spacing.sm }}>
            {currencies.find(c => c.id === currency)?.emoji} {currency}
          </Text>
        </View>

        {/* Name */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
          Nombre
        </Text>
        <View style={{
          backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
          borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.xl,
          borderCurve: 'continuous',
        }}>
          <TextInput
            style={{ color: colors.textPrimary, paddingVertical: Spacing.md, fontSize: FontSizes.body }}
            placeholder="Ej: Mi Billetera USD"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Currency */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.sm }}>
          Moneda
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl }}>
          {currencies.map(c => (
            <Pressable
              key={c.id}
              style={{
                width: '47%', padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 2,
                alignItems: 'center', gap: 4,
                backgroundColor: currency === c.id ? colors.brandPrimary + '15' : colors.backgroundSecondary,
                borderColor: currency === c.id ? colors.brandPrimary : colors.border,
                borderCurve: 'continuous',
              }}
              onPress={() => setCurrency(c.id)}
            >
              <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
              <Text style={{
                fontSize: FontSizes.heading1, fontWeight: '700',
                color: currency === c.id ? colors.brandPrimary : colors.textMuted,
              }}>
                {c.symbol}
              </Text>
              <Text style={{ fontSize: FontSizes.caption, color: colors.textPrimary }}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Balance */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
          Balance inicial
        </Text>
        <View style={{
          backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
          borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.xl,
          borderCurve: 'continuous',
        }}>
          <TextInput
            style={{ color: colors.textPrimary, paddingVertical: Spacing.md, fontSize: FontSizes.body }}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Colors */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.sm }}>
          Color
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl }}>
          {walletColors.map(color => (
            <Pressable
              key={color}
              style={{
                width: 44, height: 44, borderRadius: 22,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: color,
                borderWidth: selectedColor === color ? 3 : 0,
                borderColor: '#FFFFFF',
              }}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          style={{
            backgroundColor: isSubmitting ? colors.textMuted : colors.brandPrimary, padding: Spacing.lg, borderRadius: BorderRadius.md,
            alignItems: 'center', marginTop: Spacing.xl,
            borderCurve: 'continuous',
          }}
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          <Text style={{ color: '#FFFFFF', fontSize: FontSizes.body, fontWeight: '600' }}>
            {isSubmitting ? 'Creando...' : 'Crear Billetera'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

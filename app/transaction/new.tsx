import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { BorderRadius, DefaultCategories, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';

const WALLETS = [
  { id: 'demo1', name: 'USD Principal', currency: 'USD', balance: 150, icon: '💵' },
  { id: 'demo2', name: 'Bolívares', currency: 'VES', balance: 5600, icon: '🇻🇪' },
  { id: 'demo3', name: 'Euros', currency: 'EUR', balance: 75, icon: '💶' },
];

export default function NewTransactionScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ type?: string; walletId?: string }>();
  const type = (params.type as 'income' | 'expense') || 'expense';

  const [selectedWalletId, setSelectedWalletId] = useState(params.walletId || WALLETS[0].id);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const typeColor = type === 'income' ? colors.accentGreen : colors.accentRed;
  const categories = DefaultCategories.filter(c => c.type === type || c.type === 'transfer');

  const handleCreate = () => {
    if (!amount) {
      Alert.alert('Error', 'Por favor ingresa un monto');
      return;
    }
    Alert.alert('Éxito', 'Transacción registrada (modo demo)');
    router.back();
  };

  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.' && amount.includes('.')) {
      return;
    } else {
      setAmount(prev => prev + key);
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
          {type === 'income' ? '📥 Nuevo Ingreso' : '📤 Nuevo Gasto'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Selector */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.md }}>
          Billetera
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xl }}>
          {WALLETS.map((wallet) => (
            <Pressable
              key={wallet.id}
              style={{
                padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 2, marginRight: Spacing.md,
                alignItems: 'center', gap: Spacing.sm, minWidth: 100,
                backgroundColor: selectedWalletId === wallet.id ? colors.brandPrimary + '15' : colors.backgroundSecondary,
                borderColor: selectedWalletId === wallet.id ? colors.brandPrimary : colors.border,
                borderCurve: 'continuous',
              }}
              onPress={() => setSelectedWalletId(wallet.id)}
            >
              <Text style={{ fontSize: 20 }}>{wallet.icon}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>{wallet.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>
                ${wallet.balance?.toLocaleString('es-VE', { maximumFractionDigits: 0 }) || '0'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Amount Display */}
        <Pressable
          style={{
            alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg, marginBottom: Spacing.xl,
            backgroundColor: typeColor + '10', borderCurve: 'continuous',
          }}
        >
          <Text style={{ color: typeColor, fontSize: FontSizes.body, fontWeight: '600' }}>
            {type === 'income' ? '+' : '-'}
          </Text>
          <Text selectable style={{
            color: typeColor, fontSize: 44, fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}>
            ${amount || '0.00'}
          </Text>
        </Pressable>

        {/* Category Selector */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.md }}>
          Categoría
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {categories.map(cat => (
            <Pressable
              key={cat.id}
              style={{
                paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.xl, borderWidth: 1,
                backgroundColor: selectedCategory === cat.id ? cat.color + '15' : colors.backgroundSecondary,
                borderColor: selectedCategory === cat.id ? cat.color : colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 4,
                borderCurve: 'continuous',
              }}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
              <Text style={{
                fontSize: FontSizes.caption, fontWeight: '500',
                color: selectedCategory === cat.id ? cat.color : colors.textSecondary,
              }}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Numpad */}
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl,
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(key => (
            <Pressable
              key={key}
              style={{
                width: '31.5%', paddingVertical: Spacing.lg, alignItems: 'center',
                borderRadius: BorderRadius.md,
                backgroundColor: key === '⌫' ? colors.accentRed + '10' : colors.backgroundSecondary,
                borderCurve: 'continuous',
              }}
              onPress={() => handleNumpad(key)}
            >
              <Text style={{
                fontSize: FontSizes.heading1, fontWeight: '500',
                color: key === '⌫' ? colors.accentRed : colors.textPrimary,
              }}>{key}</Text>
            </Pressable>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          style={{
            padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center',
            backgroundColor: typeColor, borderCurve: 'continuous',
          }}
          onPress={handleCreate}
        >
          <Text style={{ color: '#FFFFFF', fontSize: FontSizes.body, fontWeight: '600' }}>
            {type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

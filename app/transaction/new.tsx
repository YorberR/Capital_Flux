import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import {
  BorderRadius,
  CurrencySymbols,
  DefaultCategories,
  FontSizes,
  Spacing,
} from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';
import { useWalletStore } from '../../src/store/wallet-store';
import { useCategoryStore } from '../../src/store/category-store';
import { useTransactionStore } from '../../src/store/transaction-store';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NewTransactionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ type?: string; walletId?: string }>();
  const type = (params.type as 'income' | 'expense') || 'expense';

  // Real wallets from Supabase
  const wallets = useWalletStore((s) => s.wallets);
  const fetchWallets = useWalletStore((s) => s.fetchWallets);
  const createTransaction = useTransactionStore((s) => s.createTransaction);
  
  const customCategories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  useEffect(() => {
    if (user) {
      fetchCategories(user.id);
    }
  }, [user, fetchCategories]);

  const [selectedWalletId, setSelectedWalletId] = useState(params.walletId || wallets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const typeColor = type === 'income' ? colors.accentGreen : colors.accentRed;
  
  const allCategories = [...customCategories, ...DefaultCategories];
  const categories = allCategories.filter((c) => c.type === type || c.type === 'transfer');
  
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const handleCreate = async () => {
    // ── Validations ──
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para registrar transacciones.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Error', 'Selecciona una billetera.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría.');
      return;
    }

    // ── Create transaction in Supabase ──
    setSaving(true);
    try {
      const result = await createTransaction(
        {
          wallet_id: selectedWalletId,
          type,
          amount: numericAmount,
          currency: selectedWallet?.currency ?? 'USD',
          date: new Date().toISOString(),
          category_id: selectedCategory,
          description: description.trim() || null,
        },
        user.id
      );

      if (result) {
        // Refresh wallets to get updated balance
        await fetchWallets(user.id);

        Alert.alert(
          '✅ ¡Listo!',
          `${type === 'income' ? 'Ingreso' : 'Gasto'} de ${CurrencySymbols[selectedWallet?.currency ?? 'USD'] ?? '$'}${numericAmount.toFixed(2)} registrado exitosamente.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const errorMsg = useTransactionStore.getState().error;
        Alert.alert('Error', errorMsg ?? 'No se pudo registrar la transacción.');
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message ?? 'Error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.' && amount.includes('.')) {
      return;
    } else if (key === '.' && amount === '') {
      setAmount('0.');
    } else {
      // Limit to 2 decimal places
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setAmount((prev) => prev + key);
    }
  };

  const currencySymbol = CurrencySymbols[selectedWallet?.currency ?? 'USD'] ?? '$';

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
          {type === 'income' ? '📥 Nuevo Ingreso' : '📤 Nuevo Gasto'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Wallet Selector ── */}
        <Text style={{
          fontSize: FontSizes.bodySm, fontWeight: '500',
          color: colors.textSecondary, marginBottom: Spacing.md,
        }}>
          Billetera
        </Text>

        {wallets.length === 0 ? (
          <Link href="/wallets/new" asChild>
            <Pressable
              style={{
                padding: Spacing.xl, borderRadius: BorderRadius.lg,
                borderWidth: 1, borderStyle: 'dashed',
                borderColor: colors.border, alignItems: 'center',
                marginBottom: Spacing.xl, gap: Spacing.sm,
                borderCurve: 'continuous',
              }}
            >
              <Text style={{ fontSize: 28 }}>💼</Text>
              <Text style={{ color: colors.textMuted, fontSize: FontSizes.bodySm }}>
                Crea una billetera primero
              </Text>
            </Pressable>
          </Link>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.xl }}
          >
            {wallets.map((wallet) => (
              <Pressable
                key={wallet.id}
                style={{
                  padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 2,
                  marginRight: Spacing.md, alignItems: 'center', gap: Spacing.sm, minWidth: 100,
                  backgroundColor: selectedWalletId === wallet.id
                    ? (wallet.color || colors.brandPrimary) + '15'
                    : colors.backgroundSecondary,
                  borderColor: selectedWalletId === wallet.id
                    ? (wallet.color || colors.brandPrimary)
                    : colors.border,
                  borderCurve: 'continuous',
                }}
                onPress={() => setSelectedWalletId(wallet.id)}
              >
                <Text style={{ fontSize: 20 }}>{wallet.icon}</Text>
                <Text style={{
                  color: colors.textPrimary, fontSize: FontSizes.bodySm, fontWeight: '500',
                }}>
                  {wallet.name}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>
                  {CurrencySymbols[wallet.currency] ?? wallet.currency}
                  {wallet.balance?.toLocaleString('es-VE', { maximumFractionDigits: 2 }) ?? '0'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Amount Display ── */}
        <Pressable
          style={{
            alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg,
            marginBottom: Spacing.xl, backgroundColor: typeColor + '10',
            borderCurve: 'continuous',
          }}
        >
          <Text style={{ color: typeColor, fontSize: FontSizes.body, fontWeight: '600' }}>
            {type === 'income' ? '+' : '-'}
          </Text>
          <Text selectable style={{
            color: typeColor, fontSize: 44, fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}>
            {currencySymbol}{amount || '0.00'}
          </Text>
        </Pressable>

        {/* ── Category Selector ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <Text style={{
            fontSize: FontSizes.bodySm, fontWeight: '500',
            color: colors.textSecondary,
          }}>
            Categoría
          </Text>
          <Link href="/categories/new" asChild>
            <Pressable>
              <Text style={{ color: colors.brandPrimary, fontSize: FontSizes.bodySm, fontWeight: '600' }}>
                + Nueva
              </Text>
            </Pressable>
          </Link>
        </View>
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl,
        }}>
          {categories.map((cat) => (
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

        {/* ── Description (optional) ── */}
        <Text style={{
          fontSize: FontSizes.bodySm, fontWeight: '500',
          color: colors.textSecondary, marginBottom: Spacing.md,
        }}>
          Descripción (opcional)
        </Text>
        <TextInput
          id="input-description"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 1, borderColor: colors.border,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
            color: colors.textPrimary, fontSize: FontSizes.body,
            marginBottom: Spacing.xl,
          }}
          placeholder="Ej: Almuerzo, Pago de servicio..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          maxLength={100}
        />

        {/* ── Numpad ── */}
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl,
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
            <Pressable
              key={key}
              style={({ pressed }) => ({
                width: '31.5%', paddingVertical: Spacing.lg, alignItems: 'center',
                borderRadius: BorderRadius.md,
                backgroundColor: key === '⌫'
                  ? colors.accentRed + (pressed ? '25' : '10')
                  : pressed
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                borderCurve: 'continuous',
              })}
              onPress={() => handleNumpad(key)}
            >
              <Text style={{
                fontSize: FontSizes.heading1, fontWeight: '500',
                color: key === '⌫' ? colors.accentRed : colors.textPrimary,
              }}>{key}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Submit ── */}
        <Pressable
          id="btn-create-transaction"
          style={({ pressed }) => ({
            padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center',
            backgroundColor: typeColor, borderCurve: 'continuous',
            opacity: (saving || wallets.length === 0) ? 0.5 : pressed ? 0.85 : 1,
          })}
          onPress={handleCreate}
          disabled={saving || wallets.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: FontSizes.body, fontWeight: '600' }}>
              {type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

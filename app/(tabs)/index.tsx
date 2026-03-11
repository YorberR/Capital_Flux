import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BorderRadius, CurrencySymbols, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';
import { useWalletStore } from '../../src/store/wallet-store';
import { useTransactionStore } from '../../src/store/transaction-store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  const symbol = CurrencySymbols[currency] ?? currency;
  const formatted = Math.abs(amount).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const {
    wallets,
    loading: walletsLoading,
    fetchWallets,
  } = useWalletStore();

  const {
    transactions,
    loading: txLoading,
    fetchTransactions,
  } = useTransactionStore();

  const isLoading = walletsLoading || txLoading;

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchWallets(user.id),
      fetchTransactions(user.id),
    ]);
  }, [user]);

  // Total balance in USD (from USD wallets only)
  const totalUSD = wallets
    .filter((w) => w.currency === 'USD')
    .reduce((sum, w) => sum + w.balance, 0);

  const recentTx = transactions.slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.brandPrimary}
          colors={[colors.brandPrimary]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: 60,
        paddingBottom: Spacing.lg,
      }}>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: FontSizes.bodySm }}>
            Hola 👋
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: FontSizes.heading1, fontWeight: '700' }}>
            Tu balance total
          </Text>
        </View>
        <Pressable
          id="btn-settings"
          style={{
            width: 44, height: 44, borderRadius: 22,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: colors.backgroundSecondary,
          }}
          onPress={() => router.push('/settings' as any)}
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
      </View>

      {/* ── Balance Card ── */}
      <View style={{
        marginHorizontal: Spacing.xl,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        marginBottom: Spacing.lg,
        backgroundColor: colors.brandSecondary,
        borderCurve: 'continuous',
        boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)',
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.bodySm }}>
          Balance Total (USD)
        </Text>
        {walletsLoading && wallets.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 12 }} />
        ) : (
          <Text selectable style={{
            color: '#FFFFFF',
            fontSize: FontSizes.displayLg,
            fontWeight: '700',
            marginVertical: Spacing.sm,
            fontVariant: ['tabular-nums'],
          }}>
            ${totalUSD.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </Text>
        )}

        {/* Per-currency chips */}
        {wallets.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
            {wallets.map((w) => (
              <View key={w.id} style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: BorderRadius.md,
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: FontSizes.caption }}>
                  {w.icon} {w.currency}: {formatCurrency(w.balance, w.currency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {wallets.length === 0 && !walletsLoading && (
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FontSizes.caption, marginTop: Spacing.sm }}>
            Crea tu primera billetera para comenzar
          </Text>
        )}
      </View>

      {/* ── Quick Actions ── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xxl }}>
        {[
          { label: 'Ingreso', emoji: '📥', color: colors.accentGreen, route: '/transaction/new?type=income' },
          { label: 'Gasto', emoji: '📤', color: colors.accentRed, route: '/transaction/new?type=expense' },
          { label: 'Tasas', emoji: '📊', color: colors.accentBlue, route: '/(tabs)/rates' },
          { label: 'Cambio', emoji: '💱', color: colors.brandPrimary, route: '/(tabs)/converter' },
        ].map((action) => (
          <Pressable
            key={action.label}
            id={`btn-action-${action.label.toLowerCase()}`}
            style={({pressed}) => ({
              flex: 1, alignItems: 'center', paddingVertical: Spacing.lg,
              borderRadius: BorderRadius.lg, gap: Spacing.sm,
              backgroundColor: action.color + (pressed ? '25' : '15'),
              borderCurve: 'continuous',
            })}
            onPress={() => { try { router.push(action.route as any); } catch { } }}
          >
            <Text style={{ fontSize: 24 }}>{action.emoji}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: FontSizes.caption, fontWeight: '500' }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Recent Transactions ── */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
      }}>
        <Text style={{ color: colors.textPrimary, fontSize: FontSizes.heading3, fontWeight: '600' }}>
          Transacciones Recientes
        </Text>
        <Pressable id="btn-view-all-tx" onPress={() => router.push('/wallets' as any)}>
          <Text style={{ color: colors.brandPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>
            Ver todas
          </Text>
        </Pressable>
      </View>

      <View style={{
        marginHorizontal: Spacing.xl,
        borderRadius: BorderRadius.lg,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border + '66',
        padding: Spacing.lg,
        borderCurve: 'continuous',
        overflow: 'hidden',
      }}>
        {txLoading && transactions.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xxxl }}>
            <ActivityIndicator color={colors.brandPrimary} />
          </View>
        ) : recentTx.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.lg }}>
            <Text style={{ fontSize: 48 }}>🧾</Text>
            <Text style={{ color: colors.textMuted, fontSize: FontSizes.bodySm }}>
              No hay transacciones aún
            </Text>
          </View>
        ) : (
          recentTx.map((tx, index) => (
            <Pressable
              key={tx.id}
              id={`tx-row-${tx.id}`}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: Spacing.md, gap: Spacing.md,
                ...(index < recentTx.length - 1 ? {
                  borderBottomWidth: 1, borderBottomColor: colors.divider,
                } : {}),
              }}
              onPress={() => router.push(`/transaction/${tx.id}` as any)}
            >
              <View style={{
                width: 40, height: 40, borderRadius: BorderRadius.md,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: (tx.type === 'income' ? colors.accentGreen : colors.accentRed) + '15',
                borderCurve: 'continuous',
              }}>
                <Text style={{ fontSize: 16 }}>
                  {tx.type === 'income' ? '📥' : tx.type === 'expense' ? '📤' : '🔄'}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.textPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>
                  {tx.description ?? tx.category_id ?? (tx.type === 'income' ? 'Ingreso' : 'Gasto')}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>
                  {formatDate(tx.date)}
                </Text>
              </View>
              <Text selectable style={{
                color: tx.type === 'income' ? colors.accentGreen : colors.accentRed,
                fontSize: FontSizes.bodySm, fontWeight: '600',
                fontVariant: ['tabular-nums'],
              }}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      {/* ── Wallets Section ── */}
      <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: Spacing.md,
        }}>
          <Text style={{ color: colors.textPrimary, fontSize: FontSizes.heading3, fontWeight: '600' }}>
            Mis Billeteras
          </Text>
          <Pressable id="btn-new-wallet" onPress={() => router.push('/wallets/new' as any)}>
            <Text style={{ color: colors.brandPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>
              + Nueva
            </Text>
          </Pressable>
        </View>

        {wallets.length === 0 && !walletsLoading && (
          <Pressable
            id="btn-create-first-wallet"
            style={{
              alignItems: 'center', paddingVertical: Spacing.xxl,
              borderRadius: BorderRadius.lg, borderWidth: 1,
              borderColor: colors.border + '80', borderStyle: 'dashed',
            }}
            onPress={() => router.push('/wallets/new' as any)}
          >
            <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>💼</Text>
            <Text style={{ color: colors.textMuted, fontSize: FontSizes.bodySm }}>
              Crea tu primera billetera
            </Text>
          </Pressable>
        )}

        {wallets.map((wallet) => (
          <Pressable
            key={wallet.id}
            id={`wallet-row-${wallet.id}`}
            style={({pressed}) => ({
              flexDirection: 'row', alignItems: 'center',
              padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
              backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
              gap: Spacing.md,
              borderCurve: 'continuous',
            })}
            onPress={() => router.push(`/wallets/${wallet.id}` as any)}
          >
            <View style={{
              width: 44, height: 44, borderRadius: BorderRadius.md,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: (wallet.color || '#4F46E5') + '15',
              borderCurve: 'continuous',
            }}>
              <Text style={{ fontSize: 20 }}>{wallet.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: FontSizes.body, fontWeight: '600' }}>
                {wallet.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>
                {wallet.currency}
              </Text>
            </View>
            <Text selectable style={{
              color: colors.textPrimary, fontSize: FontSizes.body, fontWeight: '600',
              fontVariant: ['tabular-nums'],
            }}>
              {formatCurrency(wallet.balance, wallet.currency)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

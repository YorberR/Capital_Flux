import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { DEMO_TRANSACTIONS, DEMO_WALLETS, formatCurrency, formatDate } from '../../src/data/demo';
import { useTheme } from '../../src/hooks/use-theme';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const totalBalanceUSD = DEMO_WALLETS
    .filter(w => w.currency === 'USD')
    .reduce((sum, w) => sum + w.balance, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brandPrimary}
        />
      }
    >
      {/* Header */}
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

      {/* Balance Card */}
      <View
        style={{
          marginHorizontal: Spacing.xl,
          borderRadius: BorderRadius.xl,
          padding: Spacing.xxl,
          marginBottom: Spacing.lg,
          backgroundColor: colors.brandSecondary,
          borderCurve: 'continuous',
          boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.bodySm }}>
          Balance Total (USD)
        </Text>
        <Text selectable style={{
          color: '#FFFFFF',
          fontSize: FontSizes.displayLg,
          fontWeight: '700',
          marginVertical: Spacing.sm,
          fontVariant: ['tabular-nums'],
        }}>
          ${totalBalanceUSD.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
          {DEMO_WALLETS.map((wallet) => (
            <View key={wallet.id} style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: BorderRadius.md,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: FontSizes.caption }}>
                {wallet.icon} {wallet.currency}: {wallet.balance.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xxl }}>
        {[
          { label: 'Ingreso', emoji: '📥', color: colors.accentGreen, route: '/transaction/new?type=income' },
          { label: 'Gasto', emoji: '📤', color: colors.accentRed, route: '/transaction/new?type=expense' },
          { label: 'Tasas', emoji: '📊', color: colors.accentBlue, route: '/(tabs)/rates' },
          { label: 'Cambio', emoji: '💱', color: colors.brandPrimary, route: '/(tabs)/converter' },
        ].map((action) => (
          <Pressable
            key={action.label}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: Spacing.lg,
              borderRadius: BorderRadius.lg, gap: Spacing.sm,
              backgroundColor: action.color + '15',
              borderCurve: 'continuous',
            }}
            onPress={() => { try { router.push(action.route as any); } catch { } }}
          >
            <Text style={{ fontSize: 24 }}>{action.emoji}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: FontSizes.caption, fontWeight: '500' }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
      }}>
        <Text style={{ color: colors.textPrimary, fontSize: FontSizes.heading3, fontWeight: '600' }}>
          Transacciones Recientes
        </Text>
        <Pressable onPress={() => router.push('/wallets' as any)}>
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
        {DEMO_TRANSACTIONS.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.lg }}>
            <Text style={{ fontSize: 48 }}>🧾</Text>
            <Text style={{ color: colors.textMuted, fontSize: FontSizes.bodySm }}>
              No hay transacciones aún
            </Text>
          </View>
        ) : (
          DEMO_TRANSACTIONS.map((tx, index) => (
            <Pressable
              key={tx.id}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: Spacing.md, gap: Spacing.md,
                ...(index < DEMO_TRANSACTIONS.length - 1 ? {
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
                <Text style={{ fontSize: 16 }}>{tx.categoryIcon}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.textPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>
                  {tx.category}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>
                  {tx.walletName} · {formatDate(tx.date)}
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

      {/* Wallets Section */}
      <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: Spacing.md,
        }}>
          <Text style={{ color: colors.textPrimary, fontSize: FontSizes.heading3, fontWeight: '600' }}>
            Mis Billeteras
          </Text>
          <Pressable onPress={() => router.push('/wallets/new' as any)}>
            <Text style={{ color: colors.brandPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>
              + Nueva
            </Text>
          </Pressable>
        </View>
        {DEMO_WALLETS.map((wallet) => (
          <Pressable
            key={wallet.id}
            style={{
              flexDirection: 'row', alignItems: 'center',
              padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
              backgroundColor: colors.backgroundSecondary,
              gap: Spacing.md,
              borderCurve: 'continuous',
            }}
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

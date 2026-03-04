import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { DEMO_WALLETS, formatCurrency } from '../../src/data/demo';
import { useTheme } from '../../src/hooks/use-theme';

export default function WalletsScreen() {
  const { colors } = useTheme();
  const [wallets] = useState(DEMO_WALLETS);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
      }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 22 }}>⬅️</Text>
        </Pressable>
        <Text style={{ fontSize: FontSizes.heading2, fontWeight: '600', color: colors.textPrimary }}>
          Billeteras
        </Text>
        <Pressable onPress={() => router.push('/wallets/new' as any)}>
          <Text style={{ fontSize: 22 }}>➕</Text>
        </Pressable>
      </View>

      {/* Total */}
      <View style={{
        marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
        borderRadius: BorderRadius.lg, backgroundColor: colors.brandSecondary,
        padding: Spacing.lg, borderCurve: 'continuous',
        boxShadow: '0 4px 16px rgba(79, 70, 229, 0.25)',
      }}>
        <Text style={{ fontSize: FontSizes.bodySm, color: 'rgba(255,255,255,0.8)' }}>Balance Total</Text>
        <Text selectable style={{
          fontSize: FontSizes.display, fontWeight: '700', marginTop: 4, color: '#FFFFFF',
          fontVariant: ['tabular-nums'],
        }}>
          ${totalBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {wallets.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: Spacing.lg }}>
            <Text style={{ fontSize: 64 }}>💳</Text>
            <Text style={{ fontSize: FontSizes.body, color: colors.textMuted }}>No hay billeteras aún</Text>
            <Pressable
              style={{ backgroundColor: colors.brandPrimary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md }}
              onPress={() => router.push('/wallets/new' as any)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Crear Billetera</Text>
            </Pressable>
          </View>
        ) : (
          wallets.map((wallet) => (
            <Pressable
              key={wallet.id}
              style={{
                flexDirection: 'row', alignItems: 'center',
                padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, gap: Spacing.md,
                backgroundColor: colors.backgroundSecondary,
                borderCurve: 'continuous',
              }}
              onPress={() => router.push(`/wallets/${wallet.id}` as any)}
            >
              <View style={{
                width: 48, height: 48, borderRadius: BorderRadius.md,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: (wallet.color || '#4F46E5') + '15',
                borderCurve: 'continuous',
              }}>
                <Text style={{ fontSize: 22 }}>{wallet.icon}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: FontSizes.body, fontWeight: '600', color: colors.textPrimary }}>
                  {wallet.name}
                </Text>
                <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted }}>{wallet.currency}</Text>
              </View>
              <Text selectable style={{
                fontSize: FontSizes.body, fontWeight: '600', color: colors.textPrimary,
                fontVariant: ['tabular-nums'],
              }}>
                {formatCurrency(wallet.balance, wallet.currency)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { DEMO_TRANSACTIONS, DEMO_WALLETS, formatCurrency, formatDate } from '../../src/data/demo';
import { useTheme } from '../../src/hooks/use-theme';

export default function WalletDetailScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();

    const walletId = typeof id === 'string' ? id : '';
    const wallet = DEMO_WALLETS.find(w => w.id === walletId) || { id: '0', name: 'Demo Wallet', currency: 'USD', balance: 0, color: '#4F46E5', icon: '💳' };
    const walletTxs = DEMO_TRANSACTIONS.filter(tx => tx.walletId === walletId);

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
                    {wallet.name}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 40 }}
                contentInsetAdjustmentBehavior="automatic"
            >
                {/* Wallet Card */}
                <View style={{
                    backgroundColor: wallet.color || '#4F46E5',
                    borderRadius: BorderRadius.xl, padding: Spacing.xxl, marginBottom: Spacing.xl,
                    borderCurve: 'continuous',
                    boxShadow: `0 6px 24px ${wallet.color}44`,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.lg }}>
                        <View style={{
                            width: 56, height: 56, borderRadius: BorderRadius.lg,
                            justifyContent: 'center', alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderCurve: 'continuous',
                        }}>
                            <Text style={{ fontSize: 28 }}>{wallet.icon}</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: FontSizes.heading1, fontWeight: 'bold', color: '#FFFFFF' }}>{wallet.name}</Text>
                            <Text style={{ fontSize: FontSizes.body, color: 'rgba(255,255,255,0.8)' }}>{wallet.currency}</Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: FontSizes.bodySm, color: 'rgba(255,255,255,0.8)' }}>Balance Disponible</Text>
                    <Text selectable style={{
                        fontSize: FontSizes.displayLg, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4,
                        fontVariant: ['tabular-nums'],
                    }}>
                        {formatCurrency(wallet.balance, wallet.currency)}
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl }}>
                    <Pressable
                        style={{
                            flex: 1, alignItems: 'center', paddingVertical: Spacing.lg,
                            borderRadius: BorderRadius.md, backgroundColor: colors.accentGreen + '15',
                            borderCurve: 'continuous', gap: 4,
                        }}
                        onPress={() => router.push(`/transaction/new?type=income&walletId=${walletId}` as any)}
                    >
                        <Text style={{ fontSize: 20 }}>📥</Text>
                        <Text style={{ color: colors.accentGreen, fontWeight: '600', fontSize: FontSizes.caption }}>Ingreso</Text>
                    </Pressable>
                    <Pressable
                        style={{
                            flex: 1, alignItems: 'center', paddingVertical: Spacing.lg,
                            borderRadius: BorderRadius.md, backgroundColor: colors.accentRed + '15',
                            borderCurve: 'continuous', gap: 4,
                        }}
                        onPress={() => router.push(`/transaction/new?type=expense&walletId=${walletId}` as any)}
                    >
                        <Text style={{ fontSize: 20 }}>📤</Text>
                        <Text style={{ color: colors.accentRed, fontWeight: '600', fontSize: FontSizes.caption }}>Gasto</Text>
                    </Pressable>
                </View>

                {/* Transactions */}
                <Text style={{ fontSize: FontSizes.heading3, fontWeight: '600', marginBottom: Spacing.md, color: colors.textPrimary }}>
                    Transacciones
                </Text>
                {walletTxs.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: Spacing.xxxxl, gap: Spacing.md }}>
                        <Text style={{ fontSize: 48 }}>🧾</Text>
                        <Text style={{ color: colors.textMuted, fontSize: FontSizes.bodySm }}>
                            Sin transacciones en esta billetera
                        </Text>
                    </View>
                ) : (
                    walletTxs.map((tx) => (
                        <Pressable
                            key={tx.id}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
                                backgroundColor: colors.backgroundSecondary, gap: Spacing.md,
                                borderCurve: 'continuous',
                            }}
                            onPress={() => router.push(`/transaction/${tx.id}` as any)}
                        >
                            <View style={{
                                width: 40, height: 40, borderRadius: BorderRadius.sm,
                                justifyContent: 'center', alignItems: 'center',
                                backgroundColor: (tx.type === 'income' ? colors.accentGreen : colors.accentRed) + '15',
                            }}>
                                <Text style={{ fontSize: 16 }}>{tx.categoryIcon}</Text>
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={{ color: colors.textPrimary, fontSize: FontSizes.bodySm, fontWeight: '500' }}>{tx.category}</Text>
                                <Text style={{ color: colors.textMuted, fontSize: FontSizes.caption }}>{formatDate(tx.date)}</Text>
                            </View>
                            <Text selectable style={{
                                color: tx.type === 'income' ? colors.accentGreen : colors.accentRed,
                                fontWeight: '600', fontSize: FontSizes.bodySm,
                                fontVariant: ['tabular-nums'],
                            }}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                            </Text>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

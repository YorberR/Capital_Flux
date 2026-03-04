import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { DEMO_TRANSACTIONS, formatCurrency } from '../../src/data/demo';
import { useTheme } from '../../src/hooks/use-theme';

export default function TransactionDetailScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();

    const txId = typeof id === 'string' ? id : '';
    const tx = DEMO_TRANSACTIONS.find(t => t.id === txId) || {
        id: 'demo', type: 'expense' as const, amount: 12.50, currency: 'USD',
        date: new Date().toISOString(), walletName: 'USD Principal',
        category: 'Comida', categoryIcon: '🍔'
    };

    const isIncome = tx.type === 'income';
    const typeColor = isIncome ? colors.accentGreen : colors.accentRed;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
            }}>
                <Pressable onPress={() => router.back()}>
                    <Text style={{ fontSize: 22 }}>⬅️</Text>
                </Pressable>
                <Text style={{ fontSize: FontSizes.heading3, fontWeight: '600', color: colors.textPrimary }}>
                    Detalle de Transacción
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={{ paddingHorizontal: Spacing.xl }}
                contentContainerStyle={{ paddingBottom: 40 }}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
            >
                <View style={{
                    backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.lg,
                    padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.xl,
                    borderCurve: 'continuous',
                }}>
                    {/* Logo */}
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: typeColor + '15', marginBottom: Spacing.lg,
                    }}>
                        <Text style={{ fontSize: 36 }}>{tx.categoryIcon}</Text>
                    </View>

                    <Text style={{ fontSize: FontSizes.heading2, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.sm }}>
                        {tx.category}
                    </Text>

                    <Text selectable style={{
                        fontSize: FontSizes.display, fontWeight: '700', color: typeColor,
                        fontVariant: ['tabular-nums'], marginBottom: Spacing.sm,
                    }}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                    </Text>

                    <View style={{ backgroundColor: typeColor + '20', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full }}>
                        <Text style={{ color: typeColor, fontSize: FontSizes.caption, fontWeight: '600' }}>
                            {isIncome ? 'INGRESO' : 'GASTO'}
                        </Text>
                    </View>
                </View>

                {/* Details List */}
                <View style={{
                    backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.lg,
                    padding: Spacing.xl, borderCurve: 'continuous',
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSizes.body }}>Fecha</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: FontSizes.body, fontWeight: '500' }}>
                            {new Date(tx.date).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSizes.body }}>Billetera</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: FontSizes.body, fontWeight: '500' }}>
                            {tx.walletName}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSizes.body }}>Estado</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentGreen }} />
                            <Text style={{ color: colors.textPrimary, fontSize: FontSizes.body, fontWeight: '500' }}>Completado</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md }}>
                        <Text style={{ color: colors.textSecondary, fontSize: FontSizes.body }}>ID Referencia</Text>
                        <Text selectable style={{ color: colors.textMuted, fontSize: FontSizes.body, fontVariant: ['tabular-nums'] }}>
                            #{tx.id.toUpperCase()}-{(Math.random() * 10000).toFixed(0)}
                        </Text>
                    </View>
                </View>

                <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: FontSizes.caption, marginTop: Spacing.xl }}>
                    Registro en modo demostración
                </Text>
            </ScrollView>
        </View>
    );
}

import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../../src/constants/theme';
import { DEMO_RATES } from '../../../src/data/demo';
import { useTheme } from '../../../src/hooks/use-theme';

type RateSource = 'bcv' | 'parallel' | 'binance';

const rateSources: { id: RateSource; label: string; color: string; emoji: string }[] = [
  { id: 'bcv', label: 'BCV', color: '#3B82F6', emoji: '🏛️' },
  { id: 'parallel', label: 'Paralelo', color: '#F59E0B', emoji: '📊' },
  { id: 'binance', label: 'Binance', color: '#10B981', emoji: '🔗' },
];

export default function RatesScreen() {
  const { colors } = useTheme();
  const [selectedSource, setSelectedSource] = useState<RateSource>('bcv');
  const [refreshing, setRefreshing] = useState(false);

  const filteredRates = DEMO_RATES[selectedSource] || [];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
      }}>
        <Text style={{ fontSize: FontSizes.heading1, fontWeight: '700', color: colors.textPrimary }}>
          📈 Tasas de Cambio
        </Text>
        <Pressable onPress={onRefresh}>
          <Text style={{ fontSize: 22 }}>🔄</Text>
        </Pressable>
      </View>

      {/* Source Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xl }}>
        {rateSources.map((source) => (
          <Pressable
            key={source.id}
            style={{
              flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
              borderWidth: 2, alignItems: 'center', gap: 4,
              backgroundColor: selectedSource === source.id ? source.color + '15' : colors.backgroundSecondary,
              borderColor: selectedSource === source.id ? source.color : colors.border,
              borderCurve: 'continuous',
            }}
            onPress={() => setSelectedSource(source.id)}
          >
            <Text style={{ fontSize: 16 }}>{source.emoji}</Text>
            <Text style={{
              fontSize: FontSizes.bodySm, fontWeight: '600',
              color: selectedSource === source.id ? source.color : colors.textSecondary,
            }}>
              {source.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Rates List */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: 100 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
        }
      >
        {filteredRates.length === 0 ? (
          <View style={{
            alignItems: 'center', paddingVertical: Spacing.xxxxl, gap: Spacing.md,
            backgroundColor: colors.card, borderRadius: BorderRadius.lg,
            borderWidth: 1, borderColor: colors.border + '66', padding: Spacing.lg,
            borderCurve: 'continuous',
          }}>
            <Text style={{ fontSize: 48 }}>📊</Text>
            <Text style={{ fontSize: FontSizes.body, fontWeight: '500', color: colors.textMuted }}>
              No hay tasas disponibles
            </Text>
          </View>
        ) : (
          filteredRates.map((rate) => (
            <View
              key={rate.id}
              style={{
                backgroundColor: colors.card, borderRadius: BorderRadius.lg,
                borderWidth: 1, borderColor: colors.border + '66',
                padding: Spacing.lg, marginBottom: Spacing.lg,
                borderCurve: 'continuous',
              }}
            >
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: Spacing.sm,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={{ fontSize: FontSizes.body, fontWeight: '600', color: colors.textPrimary }}>
                    {rate.base}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>→</Text>
                  <Text style={{ fontSize: FontSizes.body, fontWeight: '600', color: colors.textPrimary }}>
                    {rate.target}
                  </Text>
                </View>
                <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted }}>
                  ⏱ Demo
                </Text>
              </View>
              <Text selectable style={{
                fontSize: FontSizes.display, fontWeight: '700', color: colors.textPrimary,
                marginBottom: 4, fontVariant: ['tabular-nums'],
              }}>
                {rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{ fontSize: FontSizes.caption, color: colors.textMuted }}>
                Bs. por 1 {rate.base}
              </Text>
            </View>
          ))
        )}

        {/* Comparison Section */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text style={{ fontSize: FontSizes.heading3, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.md }}>
            Comparación USD/VES
          </Text>
          {rateSources.map((source) => {
            const sourceRates = DEMO_RATES[source.id];
            const usdRate = sourceRates?.find(r => r.base === 'USD');
            if (!usdRate) return null;
            return (
              <View
                key={source.id}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
                  backgroundColor: colors.backgroundSecondary,
                  borderCurve: 'continuous',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={{ fontSize: 16 }}>{source.emoji}</Text>
                  <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: source.color }}>
                    {source.label}
                  </Text>
                </View>
                <Text selectable style={{
                  fontSize: FontSizes.bodySm, fontWeight: '600', color: colors.textPrimary,
                  fontVariant: ['tabular-nums'],
                }}>
                  {usdRate.rate.toFixed(2)} VES
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

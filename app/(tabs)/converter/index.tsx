import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BorderRadius, FontSizes, Spacing } from '../../../src/constants/theme';
import { CONVERSION_RATES } from '../../../src/data/demo';
import { useTheme } from '../../../src/hooks/use-theme';

type Currency = 'VES' | 'USD' | 'EUR' | 'COP';

const currencies: { id: Currency; symbol: string; name: string; emoji: string }[] = [
  { id: 'VES', symbol: 'Bs.', name: 'Bolívar', emoji: '🇻🇪' },
  { id: 'USD', symbol: '$', name: 'Dólar', emoji: '🇺🇸' },
  { id: 'EUR', symbol: '€', name: 'Euro', emoji: '🇪🇺' },
  { id: 'COP', symbol: 'COL$', name: 'Peso', emoji: '🇨🇴' },
];

export default function ConverterScreen() {
  const { colors } = useTheme();
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('VES');
  const [amount, setAmount] = useState('');

  const getConvertedAmount = () => {
    if (!amount) return '0.00';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0.00';
    if (fromCurrency === toCurrency) return numAmount.toFixed(2);

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = CONVERSION_RATES[rateKey];
    if (!rate) return '?.??';

    return (numAmount * rate).toFixed(2);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === 'C') {
      setAmount('');
    } else if (key === '.') {
      if (amount.includes('.')) return;
      setAmount(prev => prev + key);
    } else {
      setAmount(prev => prev + key);
    }
  };

  const fromData = currencies.find(c => c.id === fromCurrency)!;
  const toData = currencies.find(c => c.id === toCurrency)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg,
      }}>
        <Text style={{ fontSize: FontSizes.heading1, fontWeight: '700', color: colors.textPrimary }}>
          💱 Conversor
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: 100 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Converter Card */}
        <View style={{
          backgroundColor: colors.brandPrimary + '10',
          borderRadius: BorderRadius.xl,
          padding: Spacing.xl,
          marginBottom: Spacing.lg,
          borderCurve: 'continuous',
        }}>
          {/* From Section */}
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <Text style={{ fontSize: FontSizes.caption, fontWeight: '600', color: colors.textSecondary }}>
              DESDE
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {currencies.map(c => (
                <Pressable
                  key={c.id}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: 6,
                    borderRadius: BorderRadius.xl, borderWidth: 1,
                    backgroundColor: fromCurrency === c.id ? colors.brandPrimary + '15' : colors.backgroundSecondary,
                    borderColor: fromCurrency === c.id ? colors.brandPrimary : colors.border,
                    borderCurve: 'continuous',
                  }}
                  onPress={() => setFromCurrency(c.id)}
                >
                  <Text style={{
                    fontSize: FontSizes.bodySm, fontWeight: '600',
                    color: fromCurrency === c.id ? colors.brandPrimary : colors.textSecondary,
                  }}>
                    {c.emoji} {c.id}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text selectable style={{
              fontSize: FontSizes.displayLg, fontWeight: '700', color: colors.textPrimary,
              fontVariant: ['tabular-nums'],
            }} numberOfLines={1}>
              {fromData.symbol} {amount || '0'}
            </Text>
          </View>

          {/* Swap Button */}
          <Pressable
            style={{
              alignSelf: 'center', padding: Spacing.md, marginVertical: Spacing.sm,
              backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.full,
              width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
            }}
            onPress={handleSwap}
          >
            <Text style={{ fontSize: 24 }}>🔄</Text>
          </Pressable>

          {/* To Section */}
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <Text style={{ fontSize: FontSizes.caption, fontWeight: '600', color: colors.textSecondary }}>
              HACIA
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {currencies.map(c => (
                <Pressable
                  key={c.id}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: 6,
                    borderRadius: BorderRadius.xl, borderWidth: 1,
                    backgroundColor: toCurrency === c.id ? colors.accentGreen + '15' : colors.backgroundSecondary,
                    borderColor: toCurrency === c.id ? colors.accentGreen : colors.border,
                    borderCurve: 'continuous',
                  }}
                  onPress={() => setToCurrency(c.id)}
                >
                  <Text style={{
                    fontSize: FontSizes.bodySm, fontWeight: '600',
                    color: toCurrency === c.id ? colors.accentGreen : colors.textSecondary,
                  }}>
                    {c.emoji} {c.id}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text selectable style={{
              fontSize: FontSizes.displayLg, fontWeight: '700', color: colors.accentGreen,
              fontVariant: ['tabular-nums'],
            }} numberOfLines={1}>
              {toData.symbol} {getConvertedAmount()}
            </Text>
          </View>
        </View>

        {/* Rate Info */}
        {fromCurrency !== toCurrency && (
          <Text style={{
            textAlign: 'center', fontSize: FontSizes.bodySm,
            color: colors.textMuted, marginBottom: Spacing.xl,
          }}>
            Tasa BCV de referencia (demo)
          </Text>
        )}

        {/* Numpad */}
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
          gap: Spacing.sm,
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(key => (
            <Pressable
              key={key}
              style={{
                width: '30%', paddingVertical: Spacing.xl,
                borderRadius: BorderRadius.lg, alignItems: 'center',
                backgroundColor: key === '⌫' ? colors.accentRed + '15' : colors.backgroundSecondary,
                borderCurve: 'continuous',
              }}
              onPress={() => handleNumpad(key)}
            >
              <Text style={{
                fontSize: FontSizes.heading1, fontWeight: '500',
                color: key === '⌫' ? colors.accentRed : colors.textPrimary,
              }}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

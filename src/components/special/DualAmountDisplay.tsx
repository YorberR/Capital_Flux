import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/use-theme';
import { CurrencySymbols } from '../../constants/theme';

interface DualAmountDisplayProps {
  primaryAmount: number;
  primaryCurrency: string;
  secondaryAmount?: number;
  secondaryCurrency?: string;
  size?: 'small' | 'medium' | 'large';
  showRate?: boolean;
}

export const DualAmountDisplay: React.FC<DualAmountDisplayProps> = ({
  primaryAmount,
  primaryCurrency,
  secondaryAmount,
  secondaryCurrency,
  size = 'medium',
  showRate = false,
}) => {
  const colors = useColors();

  const formatAmount = (amount: number, currency: string): string => {
    const symbol = CurrencySymbols[currency] || currency;
    const formatted = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${symbol} ${formatted}`;
  };

  const fontSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  const secondaryFontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.primary,
          { color: colors.textPrimary, fontSize },
        ]}
      >
        {formatAmount(primaryAmount, primaryCurrency)}
      </Text>
      {secondaryAmount !== undefined && secondaryCurrency && (
        <View style={styles.secondaryContainer}>
          <Text
            style={[
              styles.secondary,
              { color: colors.textSecondary, fontSize: secondaryFontSize },
            ]}
          >
            {formatAmount(secondaryAmount, secondaryCurrency)}
          </Text>
          {showRate && secondaryAmount > 0 && primaryAmount > 0 && (
            <Text style={[styles.rate, { color: colors.textMuted }]}>
              1 {primaryCurrency} = {formatAmount(secondaryAmount / primaryAmount, secondaryCurrency)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  primary: {
    fontWeight: '700',
  },
  secondaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondary: {
    fontWeight: '500',
  },
  rate: {
    fontSize: 10,
  },
});

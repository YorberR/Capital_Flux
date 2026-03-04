import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/use-theme';

export type RateSource = 'bcv' | 'parallel' | 'binance';

interface RateSourceOption {
  id: RateSource;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const rateSources: RateSourceOption[] = [
  {
    id: 'bcv',
    label: 'BCV Oficial',
    description: 'Banco Central de Venezuela',
    icon: 'business',
    color: '#3B82F6',
  },
  {
    id: 'parallel',
    label: 'Dolar Today',
    description: 'Tasa paralela no oficial',
    icon: 'trending-up',
    color: '#F59E0B',
  },
  {
    id: 'binance',
    label: 'Binance P2P',
    description: 'Mercado P2P de Binance',
    icon: 'swap-horizontal',
    color: '#10B981',
  },
];

interface RateSelectorProps {
  selectedSource: RateSource;
  onSelect: (source: RateSource) => void;
  showDescriptions?: boolean;
}

export const RateSelector: React.FC<RateSelectorProps> = ({
  selectedSource,
  onSelect,
  showDescriptions = true,
}) => {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Tipo de tasa
      </Text>
      <View style={styles.optionsContainer}>
        {rateSources.map((source) => {
          const isSelected = selectedSource === source.id;
          return (
            <TouchableOpacity
              key={source.id}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? `${source.color}20`
                    : colors.backgroundSecondary,
                  borderColor: isSelected ? source.color : colors.border,
                },
              ]}
              onPress={() => onSelect(source.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${source.color}20` },
                ]}
              >
                <Ionicons
                  name={source.icon as any}
                  size={20}
                  color={source.color}
                />
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  {source.label}
                </Text>
                {showDescriptions && (
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textMuted },
                    ]}
                  >
                    {source.description}
                  </Text>
                )}
              </View>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={source.color}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
  },
});

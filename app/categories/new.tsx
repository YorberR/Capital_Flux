import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, FontSizes, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/hooks/use-theme';
import { useAuth } from '../../src/lib/auth-context';
import { useCategoryStore } from '../../src/store/category-store';

const categoryColors = ['#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#6366F1', '#F97316', '#EF4444', '#14B8A6'];
const categoryIcons = ['🍔', '🚗', '🛒', '🎮', '🏥', '📚', '⚡', '💰', '💻', '📈', '🎁', '🏠', '✈️', '🐶', '👗', '👶'];
type CategoryType = 'expense' | 'income' | 'transfer';

export default function NewCategoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const createCategory = useCategoryStore((state) => state.createCategory);

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(categoryIcons[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una categoría');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newCategory = await createCategory(
        {
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
          type
        },
        user.id
      );

      if (newCategory) {
        Alert.alert('Éxito', 'Categoría creada correctamente');
        router.back();
      } else {
        const errorMsg = useCategoryStore.getState().error;
        Alert.alert('Error', errorMsg ?? 'No se pudo crear la categoría');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado al crear la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Nueva Categoría
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.xl }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xxl }}>
            <View style={{
                paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
                borderRadius: BorderRadius.xl, borderWidth: 1,
                backgroundColor: selectedColor + '15',
                borderColor: selectedColor,
                flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
            }}>
                <Text style={{ fontSize: 28 }}>{selectedIcon}</Text>
                <Text style={{
                    fontSize: FontSizes.heading3, fontWeight: '600',
                    color: selectedColor,
                }}>
                    {name || 'Nombre Categoría'}
                </Text>
            </View>
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm, textTransform: 'capitalize' }}>
                {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transferencia'}
            </Text>
        </View>

        {/* Tipo */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.sm }}>
          Tipo
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
          {(['expense', 'income', 'transfer'] as const).map(t => (
            <Pressable
              key={t}
              style={{
                flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 2,
                alignItems: 'center',
                backgroundColor: type === t ? colors.brandPrimary + '15' : colors.backgroundSecondary,
                borderColor: type === t ? colors.brandPrimary : colors.border,
                borderCurve: 'continuous',
              }}
              onPress={() => setType(t)}
            >
              <Text style={{
                fontSize: FontSizes.body, fontWeight: '600',
                color: type === t ? colors.brandPrimary : colors.textMuted,
              }}>
                {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Traspaso'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Nombre */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
          Nombre
        </Text>
        <View style={{
          backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
          borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.xl,
          borderCurve: 'continuous',
        }}>
          <TextInput
            style={{ color: colors.textPrimary, paddingVertical: Spacing.md, fontSize: FontSizes.body }}
            placeholder="Ej: Viajes"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
        </View>

        {/* Ícono */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.sm }}>
          Ícono
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {categoryIcons.map(icon => (
            <Pressable
              key={icon}
              style={{
                width: 48, height: 48, borderRadius: BorderRadius.md, borderWidth: 2,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: selectedIcon === icon ? colors.backgroundTertiary : 'transparent',
                borderColor: selectedIcon === icon ? colors.brandPrimary : 'transparent',
              }}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={{ fontSize: 24 }}>{icon}</Text>
            </Pressable>
          ))}
        </View>

        {/* Color */}
        <Text style={{ fontSize: FontSizes.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.sm }}>
          Color
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl }}>
          {categoryColors.map(color => (
            <Pressable
              key={color}
              style={{
                width: 44, height: 44, borderRadius: 22,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: color,
                borderWidth: selectedColor === color ? 3 : 0,
                borderColor: '#FFFFFF',
              }}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          style={{
            backgroundColor: isSubmitting ? colors.textMuted : colors.brandPrimary, padding: Spacing.lg, borderRadius: BorderRadius.md,
            alignItems: 'center', marginTop: Spacing.xl,
            borderCurve: 'continuous',
          }}
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          <Text style={{ color: '#FFFFFF', fontSize: FontSizes.body, fontWeight: '600' }}>
            {isSubmitting ? 'Creando...' : 'Crear Categoría'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

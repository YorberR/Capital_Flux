import { useColorScheme } from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';

export type ThemeColors = typeof Colors.dark;

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const colors = isDark ? Colors.dark : Colors.light;

  return { colors, isDark, colorScheme };
};

export const useColors = (): ThemeColors => {
  const colorScheme = useColorScheme();
  return colorScheme !== 'light' ? Colors.dark : Colors.light;
};

export { BorderRadius, FontSizes, Spacing };


import { useThemeContext } from '../lib/theme-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';

export type ThemeColors = typeof Colors.dark;

export const useTheme = () => {
  const { isDark, mode, toggle, setMode } = useThemeContext();
  const colors = isDark ? Colors.dark : Colors.light;

  return { colors, isDark, mode, toggle, setMode };
};

export const useColors = (): ThemeColors => {
  const { isDark } = useThemeContext();
  return isDark ? Colors.dark : Colors.light;
};

export { BorderRadius, FontSizes, Spacing };

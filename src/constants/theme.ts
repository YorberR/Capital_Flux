export const Colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#F1F5F9',
    brandPrimary: '#7C3AED',
    brandSecondary: '#4F46E5',
    accentGreen: '#10B981',
    accentRed: '#EF4444',
    accentAmber: '#F59E0B',
    accentBlue: '#3B82F6',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: 'rgba(248, 250, 252, 0.8)',
  },
  dark: {
    background: '#0F0F1A',
    backgroundSecondary: '#1A1A2E',
    backgroundTertiary: '#252540',
    brandPrimary: '#7C3AED',
    brandSecondary: '#4F46E5',
    accentGreen: '#10B981',
    accentRed: '#EF4444',
    accentAmber: '#F59E0B',
    accentBlue: '#3B82F6',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#475569',
    border: '#334155',
    divider: '#1E293B',
    overlay: 'rgba(0, 0, 0, 0.6)',
    card: 'rgba(26, 26, 46, 0.8)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSizes = {
  caption: 12,
  bodySm: 14,
  body: 16,
  heading3: 18,
  heading2: 20,
  heading1: 24,
  display: 32,
  displayLg: 36,
} as const;

export const CurrencySymbols: Record<string, string> = {
  VES: 'Bs.',
  USD: '$',
  EUR: '€',
  COP: 'COL$',
};

export const CurrencyNames: Record<string, string> = {
  VES: 'Bolívar',
  USD: 'US Dollar',
  EUR: 'Euro',
  COP: 'Colombian Peso',
};

export const DefaultCategories = [
  { id: 'food', name: 'Comida', icon: '🍔', color: '#F59E0B', type: 'expense' as const },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#3B82F6', type: 'expense' as const },
  { id: 'shopping', name: 'Compras', icon: '🛒', color: '#EC4899', type: 'expense' as const },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎮', color: '#8B5CF6', type: 'expense' as const },
  { id: 'health', name: 'Salud', icon: '🏥', color: '#10B981', type: 'expense' as const },
  { id: 'education', name: 'Educación', icon: '📚', color: '#6366F1', type: 'expense' as const },
  { id: 'utilities', name: 'Servicios', icon: '⚡', color: '#F97316', type: 'expense' as const },
  { id: 'salary', name: 'Salario', icon: '💰', color: '#10B981', type: 'income' as const },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#7C3AED', type: 'income' as const },
  { id: 'investment', name: 'Inversión', icon: '📈', color: '#3B82F6', type: 'income' as const },
  { id: 'gift', name: 'Regalo', icon: '🎁', color: '#EC4899', type: 'income' as const },
  { id: 'transfer', name: 'Transferencia', icon: '🔄', color: '#64748B', type: 'transfer' as const },
];

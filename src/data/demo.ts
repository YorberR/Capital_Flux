export interface Wallet {
    id: string;
    name: string;
    currency: string;
    balance: number;
    color: string;
    icon: string;
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency: string;
    date: string;
    walletId: string;
    walletName: string;
    category: string;
    categoryIcon: string;
}

export const DEMO_WALLETS: Wallet[] = [
    { id: '1', name: 'USD Principal', currency: 'USD', balance: 150.00, color: '#4F46E5', icon: '💵' },
    { id: '2', name: 'Bolívares', currency: 'VES', balance: 5600.00, color: '#10B981', icon: '🇻🇪' },
    { id: '3', name: 'Euros', currency: 'EUR', balance: 75.00, color: '#3B82F6', icon: '💶' },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
    { id: 't1', type: 'income', amount: 50.00, currency: 'USD', date: new Date().toISOString(), walletId: '1', walletName: 'USD Principal', category: 'Salario', categoryIcon: '💰' },
    { id: 't2', type: 'expense', amount: 12.50, currency: 'USD', date: new Date(Date.now() - 86400000).toISOString(), walletId: '1', walletName: 'USD Principal', category: 'Comida', categoryIcon: '🍔' },
    { id: 't3', type: 'expense', amount: 850.00, currency: 'VES', date: new Date(Date.now() - 172800000).toISOString(), walletId: '2', walletName: 'Bolívares', category: 'Transporte', categoryIcon: '🚗' },
    { id: 't4', type: 'income', amount: 25.00, currency: 'EUR', date: new Date(Date.now() - 259200000).toISOString(), walletId: '3', walletName: 'Euros', category: 'Freelance', categoryIcon: '💻' },
];

export const DEMO_RATES = {
    bcv: [
        { id: 'r1', base: 'USD', target: 'VES', rate: 86.50, source: 'bcv' as const },
        { id: 'r2', base: 'EUR', target: 'VES', rate: 94.20, source: 'bcv' as const },
    ],
    parallel: [
        { id: 'r3', base: 'USD', target: 'VES', rate: 93.75, source: 'parallel' as const },
        { id: 'r4', base: 'EUR', target: 'VES', rate: 102.10, source: 'parallel' as const },
    ],
    binance: [
        { id: 'r5', base: 'USD', target: 'VES', rate: 91.30, source: 'binance' as const },
    ],
};

export const CONVERSION_RATES: Record<string, number> = {
    'USD_VES': 86.50,
    'VES_USD': 1 / 86.50,
    'EUR_VES': 94.20,
    'VES_EUR': 1 / 94.20,
    'USD_EUR': 0.92,
    'EUR_USD': 1.087,
    'USD_COP': 4000,
    'COP_USD': 0.00025,
    'EUR_COP': 4350,
    'COP_EUR': 0.00023,
    'VES_COP': 0.046,
    'COP_VES': 21.74,
};

export function formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = { USD: '$', VES: 'Bs.', EUR: '€', COP: 'COL$' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Math.abs(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    } catch {
        return '';
    }
}

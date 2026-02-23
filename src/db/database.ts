import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'capital_flux.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance REAL DEFAULT 0,
      icon TEXT DEFAULT 'wallet',
      color TEXT DEFAULT '#4F46E5',
      is_active INTEGER DEFAULT 1,
      pending_sync INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      wallet_id TEXT NOT NULL,
      category_id TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      original_amount REAL,
      exchange_rate REAL,
      rate_source TEXT,
      description TEXT,
      date TEXT NOT NULL,
      pending_sync INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id TEXT PRIMARY KEY NOT NULL,
      base_currency TEXT NOT NULL,
      target_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      source TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_wallets_pending_sync ON wallets(pending_sync);
    CREATE INDEX IF NOT EXISTS idx_transactions_pending_sync ON transactions(pending_sync);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(base_currency, target_currency, source);
  `);

  await seedDefaultCategories(database);
}

async function seedDefaultCategories(database: SQLite.SQLiteDatabase): Promise<void> {
  const existingCategories = await database.getAllAsync<{ id: string }>(
    'SELECT id FROM categories LIMIT 1'
  );

  if (existingCategories.length > 0) {
    return;
  }

  const defaultCategories = [
    { id: 'food', name: 'Food', icon: 'restaurant', color: '#F59E0B', type: 'expense' },
    { id: 'transport', name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense' },
    { id: 'shopping', name: 'Shopping', icon: 'cart', color: '#EC4899', type: 'expense' },
    { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#8B5CF6', type: 'expense' },
    { id: 'health', name: 'Health', icon: 'medical', color: '#10B981', type: 'expense' },
    { id: 'education', name: 'Education', icon: 'school', color: '#6366F1', type: 'expense' },
    { id: 'utilities', name: 'Utilities', icon: 'flash', color: '#F97316', type: 'expense' },
    { id: 'salary', name: 'Salary', icon: 'wallet', color: '#10B981', type: 'income' },
    { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#7C3AED', type: 'income' },
    { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#3B82F6', type: 'income' },
    { id: 'gift', name: 'Gift', icon: 'gift', color: '#EC4899', type: 'income' },
    { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', color: '#64748B', type: 'transfer' },
  ];

  for (const category of defaultCategories) {
    await database.runAsync(
      'INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)',
      [category.id, category.name, category.icon, category.color, category.type]
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS wallets;
    DROP TABLE IF EXISTS exchange_rates;
    DROP TABLE IF EXISTS categories;
  `);
  await initializeDatabase(database);
}

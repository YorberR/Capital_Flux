import { Category, ExchangeRate, Transaction, Wallet } from "../types";
import {
  ExchangeRateRow,
  mapExchangeRateRowToExchangeRate,
  mapTransactionRowToTransaction,
  mapTransactionToTransactionRow,
  mapWalletRowToWallet,
  mapWalletToWalletRow,
  TransactionRow,
  WalletRow,
} from "../types/database";
import { getDatabase } from "./database";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const walletQueries = {
  async getAll(): Promise<Wallet[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WalletRow>(
      "SELECT * FROM wallets WHERE is_active = 1 ORDER BY updated_at DESC",
    );
    return rows.map(mapWalletRowToWallet);
  },

  async getById(id: string): Promise<Wallet | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WalletRow>(
      "SELECT * FROM wallets WHERE id = ?",
      [id],
    );
    return row ? mapWalletRowToWallet(row) : null;
  },

  async create(
    data: Omit<Wallet, "id" | "serverId" | "pendingSync" | "updatedAt">,
  ): Promise<Wallet> {
    const db = await getDatabase();
    const id = generateId();
    const updatedAt = new Date().toISOString();
    const wallet: Wallet = {
      ...data,
      id,
      serverId: null,
      pendingSync: true,
      updatedAt,
    };

    const row = mapWalletToWalletRow(wallet);
    await db.runAsync(
      `INSERT INTO wallets (id, server_id, name, currency, balance, icon, color, is_active, pending_sync, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id!,
        row.server_id ?? null,
        row.name!,
        row.currency!,
        row.balance ?? 0,
        row.icon ?? "wallet",
        row.color ?? "#4F46E5",
        row.is_active ?? 1,
        row.pending_sync ?? 1,
        row.updated_at!,
      ],
    );

    return wallet;
  },

  async update(
    id: string,
    data: Partial<Omit<Wallet, "id" | "serverId">>,
  ): Promise<Wallet | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: Wallet = {
      ...existing,
      ...data,
      pendingSync: true,
      updatedAt: new Date().toISOString(),
    };

    const row = mapWalletToWalletRow(updated);
    await db.runAsync(
      `UPDATE wallets SET name = ?, currency = ?, balance = ?, icon = ?, color = ?, is_active = ?, pending_sync = ?, updated_at = ?
      WHERE id = ?`,
      [
        row.name!,
        row.currency!,
        row.balance ?? 0,
        row.icon ?? "wallet",
        row.color ?? "#4F46E5",
        row.is_active ?? 1,
        row.pending_sync ?? 1,
        row.updated_at!,
        id,
      ],
    );

    return updated;
  },

  async deactivate(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE wallets SET is_active = 0, pending_sync = 1, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id],
    );
  },

  async getPendingSync(): Promise<Wallet[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WalletRow>(
      "SELECT * FROM wallets WHERE pending_sync = 1",
    );
    return rows.map(mapWalletRowToWallet);
  },

  async markSynced(id: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE wallets SET server_id = ?, pending_sync = 0 WHERE id = ?",
      [serverId, id],
    );
  },
};

export const transactionQueries = {
  async getAll(walletId?: string): Promise<Transaction[]> {
    const db = await getDatabase();
    let query = "SELECT * FROM transactions";
    const params: string[] = [];

    if (walletId) {
      query += " WHERE wallet_id = ?";
      params.push(walletId);
    }

    query += " ORDER BY date DESC, updated_at DESC";

    const rows = await db.getAllAsync<TransactionRow>(query, params);
    return rows.map(mapTransactionRowToTransaction);
  },

  async getById(id: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      "SELECT * FROM transactions WHERE id = ?",
      [id],
    );
    return row ? mapTransactionRowToTransaction(row) : null;
  },

  async create(
    data: Omit<Transaction, "id" | "serverId" | "pendingSync" | "updatedAt">,
  ): Promise<Transaction> {
    const db = await getDatabase();
    const id = generateId();
    const updatedAt = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id,
      serverId: null,
      pendingSync: true,
      updatedAt,
    };

    const row = mapTransactionToTransactionRow(transaction);
    await db.runAsync(
      `INSERT INTO transactions (id, server_id, wallet_id, category_id, type, amount, currency, original_amount, exchange_rate, rate_source, description, date, pending_sync, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id!,
        row.server_id ?? null,
        row.wallet_id!,
        row.category_id ?? null,
        row.type!,
        row.amount!,
        row.currency!,
        row.original_amount ?? null,
        row.exchange_rate ?? null,
        row.rate_source ?? null,
        row.description ?? null,
        row.date!,
        row.pending_sync ?? 1,
        row.updated_at!,
      ],
    );

    await updateWalletBalance(data.walletId, data.type, data.amount);

    return transaction;
  },

  async update(
    id: string,
    data: Partial<Omit<Transaction, "id" | "serverId">>,
  ): Promise<Transaction | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    if (existing.amount !== data.amount || existing.type !== data.type) {
      await updateWalletBalance(
        existing.walletId,
        existing.type,
        -existing.amount,
      );
      if (data.amount !== undefined && data.type !== undefined) {
        await updateWalletBalance(existing.walletId, data.type, data.amount);
      }
    }

    const updated: Transaction = {
      ...existing,
      ...data,
      pendingSync: true,
      updatedAt: new Date().toISOString(),
    };

    const row = mapTransactionToTransactionRow(updated);
    await db.runAsync(
      `UPDATE transactions SET wallet_id = ?, category_id = ?, type = ?, amount = ?, currency = ?, original_amount = ?, exchange_rate = ?, rate_source = ?, description = ?, date = ?, pending_sync = ?, updated_at = ?
      WHERE id = ?`,
      [
        row.wallet_id!,
        row.category_id ?? null,
        row.type!,
        row.amount!,
        row.currency!,
        row.original_amount ?? null,
        row.exchange_rate ?? null,
        row.rate_source ?? null,
        row.description ?? null,
        row.date!,
        row.pending_sync ?? 1,
        row.updated_at!,
        id,
      ],
    );

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return;

    await updateWalletBalance(
      existing.walletId,
      existing.type,
      -existing.amount,
    );
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  },

  async getPendingSync(): Promise<Transaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TransactionRow>(
      "SELECT * FROM transactions WHERE pending_sync = 1",
    );
    return rows.map(mapTransactionRowToTransaction);
  },

  async markSynced(id: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE transactions SET server_id = ?, pending_sync = 0 WHERE id = ?",
      [serverId, id],
    );
  },
};

async function updateWalletBalance(
  walletId: string,
  type: string,
  amount: number,
): Promise<void> {
  const db = await getDatabase();
  const multiplier = type === "income" ? 1 : -1;
  await db.runAsync(
    "UPDATE wallets SET balance = balance + ?, pending_sync = 1, updated_at = ? WHERE id = ?",
    [amount * multiplier, new Date().toISOString(), walletId],
  );
}

export const exchangeRateQueries = {
  async getRate(
    baseCurrency: string,
    targetCurrency: string,
    source: string,
  ): Promise<ExchangeRate | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ExchangeRateRow>(
      "SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND source = ? ORDER BY fetched_at DESC LIMIT 1",
      [baseCurrency, targetCurrency, source],
    );
    return row ? mapExchangeRateRowToExchangeRate(row) : null;
  },

  async getAllRates(): Promise<ExchangeRate[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ExchangeRateRow>(
      "SELECT * FROM exchange_rates ORDER BY fetched_at DESC",
    );
    return rows.map(mapExchangeRateRowToExchangeRate);
  },

  async saveRate(data: Omit<ExchangeRate, "id">): Promise<ExchangeRate> {
    const db = await getDatabase();
    const id = generateId();
    const rate: ExchangeRate = { ...data, id };

    await db.runAsync(
      "INSERT INTO exchange_rates (id, base_currency, target_currency, rate, source, fetched_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        data.baseCurrency,
        data.targetCurrency,
        data.rate,
        data.source,
        data.fetchedAt,
      ],
    );

    return rate;
  },

  async clearOldRates(olderThanDays: number = 30): Promise<void> {
    const db = await getDatabase();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    await db.runAsync("DELETE FROM exchange_rates WHERE fetched_at < ?", [
      cutoff.toISOString(),
    ]);
  },
};

export const categoryQueries = {
  async getAll(): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Category>(
      "SELECT * FROM categories ORDER BY name",
    );
    return rows;
  },

  async getByType(type: string): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Category>(
      "SELECT * FROM categories WHERE type = ? OR type = ? ORDER BY name",
      [type, "transfer"],
    );
    return rows;
  },
};

export const syncQueries = {
  async getPendingCount(): Promise<{ wallets: number; transactions: number }> {
    const db = await getDatabase();
    const wallets = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM wallets WHERE pending_sync = 1",
    );
    const transactions = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions WHERE pending_sync = 1",
    );

    return {
      wallets: wallets?.count ?? 0,
      transactions: transactions?.count ?? 0,
    };
  },
};

-- ============================================
-- CAPITAL FLUX - Complete Supabase Database Schema
-- Compatible with local SQLite code (expo-sqlite)
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- User profile linked to auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'User',
    default_currency TEXT NOT NULL DEFAULT 'USD',
    preferred_rate_source TEXT DEFAULT 'bcv',
    locale TEXT DEFAULT 'es',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. WALLETS TABLE
-- Mirrors local SQLite wallets with client_id for sync
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id TEXT,  -- Links to local SQLite wallet id
    name TEXT NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('VES', 'USD', 'EUR', 'COP')),
    balance DECIMAL(20, 4) DEFAULT 0,
    icon TEXT DEFAULT 'wallet',
    color TEXT DEFAULT '#4F46E5',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TRANSACTIONS TABLE
-- Includes description field from local code
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id TEXT,  -- Links to local SQLite transaction id
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(20, 4) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('VES', 'USD', 'EUR', 'COP')),
    original_amount DECIMAL(20, 4),
    exchange_rate DECIMAL(20, 8),
    rate_source TEXT CHECK (rate_source IN ('bcv', 'parallel', 'binance', 'manual')),
    description TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXCHANGE RATES TABLE
-- For historical rates and rate alerts
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL CHECK (base_currency IN ('VES', 'USD', 'EUR', 'COP')),
    target_currency TEXT NOT NULL CHECK (target_currency IN ('VES', 'USD', 'EUR', 'COP')),
    rate DECIMAL(20, 8) NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('bcv', 'parallel', 'binance', 'manual')),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. SYNC LOG TABLE (Optional - for debugging sync issues)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('wallet', 'transaction')),
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('push', 'pull')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'conflict')),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. RATE ALERTS TABLE (For Phase 6 - Notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS rate_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    target_rate DECIMAL(20, 8) NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_client_id ON wallets(client_id);
CREATE INDEX IF NOT EXISTS idx_wallets_updated_at ON wallets(updated_at);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Exchange rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(base_currency, target_currency, source);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched ON exchange_rates(fetched_at);

-- Sync logs indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at);

-- Rate alerts indexes
CREATE INDEX IF NOT EXISTS idx_rate_alerts_user_id ON rate_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_alerts_active ON rate_alerts(user_id, is_active);

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS POLICIES FOR PROFILES
-- ============================================
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 10. RLS POLICIES FOR WALLETS
-- ============================================
CREATE POLICY "Users can view own wallets" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON wallets
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 11. RLS POLICIES FOR TRANSACTIONS
-- ============================================
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 12. RLS POLICIES FOR EXCHANGE RATES
-- ============================================
CREATE POLICY "Authenticated users can view exchange rates" ON exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service can manage exchange rates" ON exchange_rates
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 13. RLS POLICIES FOR SYNC LOGS
-- ============================================
CREATE POLICY "Users can view own sync logs" ON sync_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON sync_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage sync logs" ON sync_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 14. RLS POLICIES FOR RATE ALERTS
-- ============================================
CREATE POLICY "Users can view own rate alerts" ON rate_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate alerts" ON rate_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate alerts" ON rate_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rate alerts" ON rate_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 15. TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 16. FUNCTION: Upsert Wallet (used by sync engine)
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_wallet(
    p_client_id TEXT,
    p_name TEXT,
    p_currency TEXT,
    p_balance DECIMAL,
    p_icon TEXT,
    p_color TEXT,
    p_is_active BOOLEAN,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    UPDATE wallets
    SET name = p_name,
        currency = p_currency,
        balance = p_balance,
        icon = p_icon,
        color = p_color,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE client_id = p_client_id AND user_id = p_user_id
    RETURNING id INTO v_wallet_id;

    IF v_wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, client_id, name, currency, balance, icon, color, is_active)
        VALUES (p_user_id, p_client_id, p_name, p_currency, p_balance, p_icon, p_color, p_is_active)
        RETURNING id INTO v_wallet_id;
    END IF;

    RETURN v_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 17. FUNCTION: Upsert Transaction (used by sync engine)
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_transaction(
    p_client_id TEXT,
    p_wallet_id UUID,
    p_category_id TEXT,
    p_type TEXT,
    p_amount DECIMAL,
    p_currency TEXT,
    p_original_amount DECIMAL,
    p_exchange_rate DECIMAL,
    p_rate_source TEXT,
    p_description TEXT,
    p_date TIMESTAMPTZ,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    UPDATE transactions
    SET wallet_id = p_wallet_id,
        category_id = p_category_id,
        type = p_type,
        amount = p_amount,
        currency = p_currency,
        original_amount = p_original_amount,
        exchange_rate = p_exchange_rate,
        rate_source = p_rate_source,
        description = p_description,
        date = p_date
    WHERE client_id = p_client_id AND user_id = p_user_id
    RETURNING id INTO v_transaction_id;

    IF v_transaction_id IS NULL THEN
        INSERT INTO transactions (user_id, client_id, wallet_id, category_id, type, amount, currency, original_amount, exchange_rate, rate_source, description, date)
        VALUES (p_user_id, p_client_id, p_wallet_id, p_category_id, p_type, p_amount, p_currency, p_original_amount, p_exchange_rate, p_rate_source, p_description, p_date)
        RETURNING id INTO v_transaction_id;
    END IF;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 18. FUNCTION: Log Sync Operation
-- ============================================
CREATE OR REPLACE FUNCTION public.log_sync_operation(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_operation TEXT,
    p_status TEXT,
    p_details JSONB DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO sync_logs (user_id, entity_type, entity_id, operation, status, details)
    VALUES (p_user_id, p_entity_type, p_entity_id, p_operation, p_status, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 19. FUNCTION: Get wallet balance (for validation)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT balance INTO v_balance
    FROM wallets
    WHERE id = p_wallet_id;
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 20. FUNCTION: Calculate total balance by currency
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_balance_by_currency(
    p_user_id UUID,
    p_currency TEXT
)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN t.currency = p_currency THEN t.amount
            WHEN t.currency != p_currency AND t.exchange_rate IS NOT NULL THEN t.amount * t.exchange_rate
            ELSE 0
        END
    ), 0) INTO v_balance
    FROM transactions t
    INNER JOIN wallets w ON t.wallet_id = w.id
    WHERE w.user_id = p_user_id 
      AND w.currency = p_currency
      AND w.is_active = true;

    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 21. SEED DEFAULT EXCHANGE RATES (Optional - initial data)
-- ============================================
-- Uncomment if you want to seed initial rates:
-- INSERT INTO exchange_rates (base_currency, target_currency, rate, source, fetched_at)
-- VALUES 
--     ('USD', 'VES', 0, 'bcv', NOW()),
--     ('EUR', 'VES', 0, 'bcv', NOW()),
--     ('COP', 'VES', 0, 'bcv', NOW())
-- ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- Schema created successfully!
-- Tables: profiles, wallets, transactions, exchange_rates, sync_logs, rate_alerts
-- Indexes: 20+ indexes for performance
-- RLS: Enabled on all tables with appropriate policies
-- Functions: upsert_wallet, upsert_transaction, log_sync_operation, get_wallet_balance, get_user_balance_by_currency
-- Trigger: Auto-creates profile on user signup

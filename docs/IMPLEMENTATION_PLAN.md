# Capital Flux — Digital Wallet

Digital wallet designed for volatile economies such as Venezuela's, with multi-currency support, real-time exchange rates (official BCV, parallel, USDT P2P), and a polished mobile-first UI.

> [!IMPORTANT]
> Plan revised on 2026-03-04. Offline-first sync has been **deferred** to a later phase. The priority is a fully functional, visually polished mobile app with demo data first, then real API integration.

> [!NOTE]
> **Progress Status:**
> - ✅ Phase 1 — Foundation: COMPLETED
> - ⚠️ Phase 2 — Offline-First: DEFERRED (code exists in `src/db/`, `src/features/sync/` but is not active)
> - 🔄 Phase 3 — UI/UX: IN PROGRESS
> - 📋 Phase 4 — Exchange Rate Engine: PENDING
> - 📋 Phase 5 — Security: PENDING
> - 📋 Phase 6 — Polish & Advanced Features: PENDING

---

## Current Status

The Android build compiles successfully with:
- `newArchEnabled: false` (avoids C++ linker errors on Windows)
- `c++_shared` linked in native CMake files for gesture-handler, screens, safe-area-context
- SplashScreen removed from root layout (was causing infinite loading)
- All screens use hardcoded demo data — no `expo-sqlite` calls at runtime

### What Works
- ✅ Android build compiles (`gradlew assembleDebug`)
- ✅ Root layout with Stack navigation
- ✅ Tab navigation (Dashboard, Rates, Converter)
- ✅ Route files for: wallets, wallet detail, new wallet, transactions, new transaction, settings
- ✅ Design system with dark/light mode colors in `src/constants/theme.ts`
- ✅ Special components exist: `RateSelector`, `DualAmountDisplay`, `SyncStatusBar`, `OfflineBadge`

### What Doesn't Work / Is Missing
- ❌ App shows loading spinner instead of UI content on emulator (JS-side issue, not build)
- ❌ Screens use inline color definitions instead of shared `theme.ts`
- ❌ No Reanimated animations active
- ❌ No haptic feedback on actions
- ❌ Special components are not integrated into screens
- ❌ `CurrencyReconversion` component missing
- ❌ `expo-sqlite` not called at runtime (deferred)
- ❌ No Supabase integration active

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| **Framework** | React Native + Expo SDK 55 | ✅ Active |
| **Language** | TypeScript | ✅ Active |
| **Navigation** | Expo Router v4 (file-based) | ✅ Active |
| **State** | Zustand (UI), demo data (hardcoded) | 🟨 Partial |
| **Local DB** | expo-sqlite | ⏸️ Deferred |
| **Backend** | Supabase | ⏸️ Deferred |
| **Sync** | Custom engine from Phase 2 | ⏸️ Deferred |
| **Security** | expo-secure-store, expo-local-auth | 📋 Future |
| **i18n** | expo-localization + i18next | 📋 Future |
| **Exchange Rates** | BCV, DolarApi, Binance P2P | 📋 Future |

---

## Project Structure

```
Capital_Flux/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root Stack layout
│   ├── index.tsx                 # Redirects to /(tabs)
│   ├── (auth)/                   # Auth routes (placeholder)
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx           # Tab layout (Dashboard, Rates, Converter)
│   │   ├── index.tsx             # Dashboard screen
│   │   ├── explore.tsx           # Hidden placeholder
│   │   ├── rates/index.tsx       # Exchange rates screen
│   │   └── converter/index.tsx   # Currency converter screen
│   ├── wallets/                  # Wallet management stack
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Wallet list
│   │   ├── new.tsx               # Create wallet
│   │   └── [id].tsx              # Wallet detail
│   ├── transaction/              # Transaction management stack
│   │   ├── _layout.tsx
│   │   ├── new.tsx               # Create transaction
│   │   └── [id].tsx              # Transaction detail
│   ├── settings/                 # Settings stack
│   │   ├── _layout.tsx
│   │   └── index.tsx             # Settings screen
│   └── modal.tsx                 # Modal route
├── src/
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Button, GlassCard, Input
│   │   └── special/              # RateSelector, DualAmountDisplay, SyncStatusBar, OfflineBadge
│   ├── constants/theme.ts        # Design system tokens
│   ├── db/                       # ⏸️ SQLite (deferred)
│   ├── features/sync/            # ⏸️ Sync engine (deferred)
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Supabase, auth context, query provider
│   ├── store/                    # Zustand stores
│   └── types/                    # TypeScript types
├── docs/
├── app.json
├── package.json
└── tsconfig.json
```

---

## Implementation Phases

### Phase 1 — Foundation ✅ COMPLETED

- Expo project with TypeScript, Expo Router v4
- Supabase client config (`src/lib/supabase.ts`)
- Auth context placeholder (`src/lib/auth-context.tsx`)
- TanStack Query provider (`src/lib/query-provider.tsx`)
- Database types (`src/lib/database.types.ts`)

---

### Phase 2 — Offline-First ⏸️ DEFERRED

> [!WARNING]
> Phase 2 code exists in `src/db/` and `src/features/sync/` but is **not called** from any screen. 
> It caused native build failures and runtime crashes. Re-enable only after the app is stable and running on mobile.

**Existing code (inactive):**
- `src/db/database.ts` — SQLite init and table creation
- `src/db/queries.ts` — CRUD operations
- `src/features/sync/engine.ts` — Sync orchestrator
- `src/features/sync/conflict-resolver.ts` — Conflict resolution
- `src/features/sync/__tests__/` — Unit tests
- `src/store/sync-store.ts` — Zustand sync state
- `src/hooks/use-sync.ts` — Sync hook

---

### Phase 3 — UI/UX 🔄 IN PROGRESS

The current priority. Get all screens rendering correctly on Android with a polished, premium look.

#### 3.1 — Fix Loading Screen (CRITICAL)

The app compiles but shows a loading spinner. Must fix the JS-side issue:

- [ ] Verify the metro bundler serves JS correctly to the emulator
- [ ] Ensure no hidden async calls block rendering at root level
- [ ] Test with `npx expo start` and reload on device
- [ ] Confirm all screens render without crashes

#### 3.2 — Screens to Implement / Fix

| Screen | File | Status |
|--------|------|--------|
| **Dashboard** | `app/(tabs)/index.tsx` | 🟨 Exists, uses demo data, needs polish |
| **Wallets List** | `app/wallets/index.tsx` | 🟨 Exists, needs theme integration |
| **Wallet Detail** | `app/wallets/[id].tsx` | 🟨 Exists, basic |
| **New Wallet** | `app/wallets/new.tsx` | 🟨 Exists, functional |
| **New Transaction** | `app/transaction/new.tsx` | 🟨 Exists, needs RateSelector |
| **Transaction Detail** | `app/transaction/[id].tsx` | 🟨 Exists, basic |
| **Exchange Rates** | `app/(tabs)/rates/index.tsx` | 🟨 Exists with demo rates |
| **Converter** | `app/(tabs)/converter/index.tsx` | 🟨 Exists, functional |
| **Settings** | `app/settings/index.tsx` | 🟨 Exists, needs content |

#### 3.3 — Design System Enforcement

All screens currently define colors inline. Refactor to use the shared theme:

- [ ] Refactor all screens to import colors from `src/constants/theme.ts`
- [ ] Create a `useTheme` hook that returns the correct color set based on `useColorScheme()`
- [ ] Use `borderCurve: 'continuous'` for rounded corners
- [ ] Use `boxShadow` instead of legacy elevation styles
- [ ] Add `selectable` prop to financial data text (balances, amounts)
- [ ] Use `fontVariant: 'tabular-nums'` on numeric displays
- [ ] Use `contentContainerStyle` for ScrollView padding instead of wrapper padding

#### 3.4 — Special Venezuela Components Integration

- [ ] Integrate `RateSelector` into `transaction/new.tsx`
- [ ] Integrate `DualAmountDisplay` into wallet cards and transaction rows
- [ ] Show `OfflineBadge` on demo transactions (visual placeholder)
- [ ] Create `CurrencyReconversion` component for Bs.S → Bs.D handling

#### 3.5 — Navigation Polish

Following the Expo UI guidelines:

- [ ] Use Stack.Screen `options={{ title: "..." }}` for all page titles instead of custom headers
- [ ] Add `contentInsetAdjustmentBehavior="automatic"` to all ScrollViews
- [ ] Use `presentation: 'modal'` for new wallet/transaction screens
- [ ] Use `Link` from expo-router instead of `router.push()` where possible

#### 3.6 — Animations & Feedback

- [ ] Add entering/exiting animations with Reanimated for list items
- [ ] Add pull-to-refresh animations on Dashboard and Rates
- [ ] Add haptic feedback on financial actions (iOS, using `expo-haptics` conditionally)
- [ ] Add tab transition animations

---

### Phase 4 — Exchange Rate Engine (After Phase 3)

- **Adapters**: `bcv.ts`, `paralelo.ts`, `binance-p2p.ts` for rate APIs
- **`hyperinflation.ts`**: Percentage variations, depreciation, purchasing power calculations
- **`currency.ts`**: `decimal.js` integration for arbitrary-precision calculations

---

### Phase 5 — Security (After Phase 4)

- `expo-secure-store` for tokens and keys
- `expo-local-authentication` for biometrics
- Supabase Auth (Email, Google, Apple, Facebook)
- Auto-lock after idle time

---

### Phase 6 — Polish & Advanced (After Phase 5)

- Customizable categories with icons
- Reports: expenses by category, historical balance
- Notifications: exchange rate alerts
- CSV/PDF export
- Recurring transactions
- Re-enable offline-first sync from Phase 2 code

---

## Verification Plan

### Automated

```bash
# Type checking (should pass with no errors)
npx tsc --noEmit

# Unit tests (existing sync engine tests)
npx jest --testPathPattern=src/features/sync
```

### Manual (on emulator)

1. **App Launch**: Open app on Android emulator → Dashboard renders (no loading spinner)
2. **Tab Navigation**: Tap Tasas → shows rates. Tap Cambio → shows converter. Tap Inicio → back to dashboard
3. **Wallet Flow**: Dashboard → "Nueva" → fill form → create → returns to wallets list
4. **Transaction Flow**: Dashboard → "Ingreso" or "Gasto" → numpad works → register → returns
5. **Settings**: Dashboard → gear icon → settings screen renders
6. **Dark Mode**: All screens use dark theme colors by default
7. **Scrolling**: All ScrollViews scroll smoothly with no clipping

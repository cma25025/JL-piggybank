# Piggybank iOS — Product Brief & MVP Backlog

**Date**: 2026-03-15
**Author**: Claude PM
**Input**: ADR-001-ios-mobile-architecture.md

---

## Product Vision

Piggybank iOS is the same privacy-first, self-hosted piggybank — but in your pocket.
Parents manage children's allowances and teach compound interest, entirely on-device.
No accounts, no cloud, no data collection. Just a single SQLite file on the phone.

---

## Existing Feature Audit

| Feature | Web Status | Mobile Decision |
|---------|-----------|----------------|
| Account dashboard (list all accounts) | Complete | **P0** — Core screen |
| Create account (name, rate, period) | Complete | **P0** — Essential flow |
| Account detail (balance, stats) | Complete | **P0** — Core screen |
| Deposit transaction | Complete | **P0** — Core action |
| Withdrawal transaction | Complete | **P0** — Core action |
| Transaction history (list + filter) | Complete | **P0** — Core data |
| Manual interest calculation | Complete | **P0** — Key feature |
| Account statistics | Complete | **P1** — Nice for detail screen |
| Edit transaction | Complete | **P1** — Not critical for day-one |
| Delete transaction | Complete | **P1** — Not critical for day-one |
| Account settings (edit name/rate) | Complete | **P1** — Can edit later |
| Delete account (soft delete) | Complete | **P1** — Rare action |
| Parent PIN lock | Prototype only | **P1** — Important but not blocking |
| Auto interest cron (daily) | Complete | **P2** — iOS background limits |
| Category filtering | Complete | **P2** — Enhancement |
| Pagination | Complete | **P2** — FlatList handles this natively |

---

## MVP Scope: P0 (TestFlight Build)

### Screens

1. **Dashboard** — List of all accounts with balance and interest rate
2. **Create Account** — Form: child name, interest rate (%), compounding period
3. **Account Detail** — Balance display, transaction form, transaction history, interest trigger

### User Flows

**Flow 1: First Launch**
Open app → Empty state ("No accounts yet") → Tap "+" → Create account → Return to dashboard

**Flow 2: Record Transaction**
Dashboard → Tap account card → Enter amount → Select deposit/withdrawal → Select category → Submit → See updated balance + transaction in list

**Flow 3: Check Interest**
Account detail → Tap "Check & Pay Interest" → Interest calculated and posted → Balance updated

### What's Cut from P0

- **Transaction editing/deletion** — Corrections can wait. The ledger is append-only for MVP.
- **Parent PIN** — Important but not a TestFlight blocker. Users testing via TestFlight are already parents.
- **Account statistics panel** — The balance and transaction list tell the story. Stats are polish.
- **Background interest calculation** — Manual trigger only. iOS background restrictions make this complex.
- **Transaction filtering** — FlatList shows all transactions sorted by date. Enough for MVP.

---

## Prioritized Backlog

### P0 — Must Have for TestFlight Submission

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| 1 | Expo project scaffold with TypeScript | `npx expo start` runs without errors |
| 2 | SQLite database initialization | Schema matches web app; creates on first launch |
| 3 | Account repository (CRUD) | Create, read, list, soft-delete accounts via SQLite |
| 4 | Transaction repository | Create transaction, list by account, update balance |
| 5 | Interest calculator service | Compound interest formula matches web implementation |
| 6 | Dashboard screen | Shows account cards with name, balance, rate |
| 7 | Create Account screen | Form with validation; creates account in SQLite |
| 8 | Account Detail screen | Balance, transaction form, transaction list, interest button |
| 9 | Navigation (Expo Router) | Tab nav (Dashboard, Settings placeholder) + stack nav for detail |
| 10 | App icon and splash screen | Piggybank branding; required for TestFlight |
| 11 | EAS Build configuration | `eas.json` configured for iOS TestFlight builds |

### P1 — Important but Not Blocking TestFlight

| # | Feature |
|---|---------|
| 12 | Parent PIN (expo-secure-store + PIN pad UI) |
| 13 | Edit/delete transactions with balance recalculation |
| 14 | Account statistics panel |
| 15 | Account settings (edit name, rate, period) |
| 16 | Soft-delete account |
| 17 | Haptic feedback on transactions |
| 18 | Pull-to-refresh on dashboard and transaction list |

### P2 — Nice to Have / Future Sprint

| # | Feature |
|---|---------|
| 19 | Background interest calculation (expo-background-fetch) |
| 20 | Transaction category filtering |
| 21 | Data export (CSV) |
| 22 | iCloud backup of SQLite database |
| 23 | Multiple currency support |
| 24 | Dark mode |
| 25 | Widget (iOS home screen) |

---

## Success Metric

**One metric**: The TestFlight build installs and a parent can create an account,
record 3 transactions, and trigger interest calculation — all without network
connectivity — in under 60 seconds.

This validates: native performance, on-device storage, and core feature completeness.

---

## Risks Flagged for Claude Product Engineer

1. **Apple Developer Account** — Required before `eas build`. Cannot be automated.
2. **App naming** — "Piggybank" may conflict with existing App Store names. Consider "Piggybank - Family Allowance" or similar.
3. **Minimum iOS version** — Target iOS 16+ (covers 95%+ of devices, required for modern expo-sqlite).
4. **TestFlight review** — Apple reviews TestFlight builds. Ensure no placeholder content, working navigation, no crashes.

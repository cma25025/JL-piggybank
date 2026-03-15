# ADR-001: iOS Mobile Architecture for Piggybank

**Status**: Accepted
**Date**: 2026-03-15
**Author**: Claude Architect

---

## Context

Piggybank is a self-hosted virtual piggybank for parents to manage children's allowances
and teach compound interest. The current stack is:

- **Frontend**: Astro SSR (port 3000) + React 19 + Tailwind CSS
- **Backend**: Express 5 REST API (port 4000) with node-cron
- **Database**: SQLite3 (single file at `./data/piggybank.db`)
- **Deployment**: Docker (multi-stage build)
- **Auth**: 4-digit parent PIN (prototype only, not persisted in backend)

The goal is to transform this into a production-ready iOS mobile app deployable
via TestFlight, while preserving: self-hosted, privacy-first, no third-party
data collection.

---

## Decision

### Framework: Expo (React Native) with expo-sqlite

**Chosen over**: Capacitor, bare React Native, SwiftUI

### Rationale

| Criterion | Expo | Capacitor | Bare RN | SwiftUI |
|-----------|------|-----------|---------|---------|
| React code reuse | High (logic, patterns) | Highest (wrap existing web) | High | None |
| Native feel | Excellent | Web-in-shell | Excellent | Best |
| TestFlight via CI | EAS Build (turnkey) | Manual Xcode | Manual Xcode | Manual Xcode |
| SQLite on-device | expo-sqlite (built-in) | Plugin required | Plugin required | Core Data |
| TypeScript | Native | Native | Native | N/A |
| Codespaces dev | Expo Go + tunnel | Needs browser | Needs emulator | Needs macOS |

**Why Expo wins:**
1. **EAS Build** provides managed TestFlight submission from CI — no macOS machine required for builds.
2. **expo-sqlite** provides synchronous, on-device SQLite — the database layer maps 1:1.
3. React component logic (state, hooks, patterns) transfers directly. Only the JSX layer changes (`<View>` instead of `<div>`).
4. Expo SDK 52+ supports all needed native APIs (secure storage, haptics, local notifications).
5. The team already knows React + TypeScript — zero framework learning curve.

**Why NOT Capacitor:**
Capacitor wraps the existing web app in a WebView. While this would be the fastest path, it produces a web-app-in-a-shell that won't pass Apple's App Store Review (guideline 4.2 — minimum functionality). The app must feel native.

**Why NOT bare React Native:**
Additional build complexity with no benefit. Expo's managed workflow handles Xcode config, signing, and native module linking automatically.

---

## Target Architecture

```
piggybank-mobile/          # New Expo app (root of mobile project)
  app/                     # Expo Router (file-based routing)
    (tabs)/                # Tab navigator
      index.tsx            # Dashboard (account list)
      settings.tsx         # Global settings
    account/
      [id].tsx             # Account detail + transactions
    create-account.tsx     # New account form
  db/
    schema.ts              # SQLite schema (migrated from backend/database/db.js)
    migrations.ts          # Version-based migrations
    repository.ts          # Data access layer (accounts, transactions)
  services/
    interest.ts            # Interest calculator (migrated from backend/services/)
    transaction.ts         # Transaction manager (migrated from backend/services/)
  components/
    AccountCard.tsx         # Adapted from frontend/src/components/
    TransactionForm.tsx     # Adapted with React Native inputs
    TransactionList.tsx     # Adapted with FlatList
    PinPad.tsx             # Native PIN pad
  lib/
    types.ts               # Shared TypeScript types
    constants.ts           # Categories, compounding periods
  assets/                  # App icons, splash screen
```

### What Changes

| Layer | Web (Current) | Mobile (Target) |
|-------|--------------|-----------------|
| Frontend framework | Astro SSR + React | Expo Router + React Native |
| Styling | Tailwind CSS | React Native StyleSheet / NativeWind |
| Backend | Express REST API | Eliminated — logic moves on-device |
| Database | SQLite via `sqlite3` npm (server) | SQLite via `expo-sqlite` (on-device) |
| Data access | HTTP fetch to localhost:4000 | Direct function calls to repository layer |
| Interest cron | `node-cron` at 1 AM | `expo-background-fetch` or manual trigger |
| Auth/PIN | Not persisted | `expo-secure-store` (Keychain) |
| Deployment | Docker container | EAS Build → TestFlight |

### What Stays the Same

1. **SQLite schema** — identical tables (accounts, transactions)
2. **Business logic** — interest calculator, transaction manager (ported to TS)
3. **Data model** — accounts, transactions, soft deletes, balance ledger
4. **UI patterns** — dashboard → account detail → transactions
5. **Validation rules** — category validation, amount limits, all middleware logic

### Key Architectural Decisions

**1. Eliminate the client-server split.**
The web app runs Express + Astro as separate processes communicating over HTTP. The mobile app collapses this into a single process. The `repository.ts` layer replaces both the Express routes AND the `api.ts` fetch client. This is simpler, faster, and more reliable.

**2. Use Expo Router for navigation.**
File-based routing mirrors the existing Astro page structure (`/`, `/account/[id]`, `/settings`). This makes the mental model identical for developers.

**3. Store the PIN in Keychain via expo-secure-store.**
The web prototype stores the PIN in React state (lost on refresh). The mobile app persists it securely in the iOS Keychain, which survives app restarts and is encrypted at rest.

**4. Background interest calculation is P1, not P0.**
The web app uses `node-cron`. iOS background execution is heavily restricted. For MVP, interest calculation remains manual (tap "Check & Pay Interest"). Background fetch can be added later.

**5. NativeWind for styling.**
NativeWind brings Tailwind CSS syntax to React Native. This means the existing Tailwind classes from the web components can be adapted with minimal changes, reducing the style migration burden.

---

## Risks and Dependencies

| Risk | Severity | Mitigation |
|------|----------|------------|
| Apple Developer Account required for TestFlight | Blocker | Must be set up before first EAS build |
| expo-sqlite API differences from `sqlite3` npm | Medium | API is synchronous in SDK 52+; migration is straightforward |
| No background execution for interest cron | Low | Manual trigger for MVP; background fetch for P1 |
| App Store Review rejection (4.2 minimum functionality) | Medium | Ensure native navigation, haptic feedback, proper iOS patterns |
| No data sync between devices | Low | Acceptable for MVP (single-device, privacy-first) |
| Large initial bundle size from React Native | Low | Expo's tree-shaking + Hermes engine keep it manageable |

---

## Migration Path (Existing Code Reuse)

| Source File | Target | Reuse Level |
|------------|--------|-------------|
| `backend/database/db.js` | `db/schema.ts` | Schema identical, API wrapper rewritten |
| `backend/services/interestCalculator.js` | `services/interest.ts` | Logic 1:1, ported to TypeScript |
| `backend/services/transactionManager.js` | `services/transaction.ts` | Logic 1:1, ported to TypeScript |
| `backend/middleware/validation.js` | `services/validation.ts` | Logic 1:1, no Express dependency |
| `frontend/src/components/AccountCard.tsx` | `components/AccountCard.tsx` | Logic reused, JSX rewritten for RN |
| `frontend/src/components/TransactionForm.tsx` | `components/TransactionForm.tsx` | Logic reused, inputs adapted for RN |
| `frontend/src/components/TransactionList.tsx` | `components/TransactionList.tsx` | Logic reused, FlatList replaces table |
| `frontend/src/utils/api.ts` | Eliminated | Replaced by direct repository calls |

---

## Success Criteria

The architecture is successful when:
1. The app builds via `eas build --platform ios` without errors
2. All P0 features work with on-device SQLite (no network required)
3. The app passes Apple's TestFlight review
4. Zero third-party data collection (no analytics, no crash reporting, no telemetry)

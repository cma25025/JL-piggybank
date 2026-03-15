# Piggybank iOS Mobile App

A privacy-first, on-device piggybank app for teaching children financial literacy.
No cloud, no accounts, no data collection — just SQLite on your phone.

## Architecture

- **Framework**: Expo (React Native) with Expo Router
- **Database**: expo-sqlite (on-device, no server required)
- **Language**: TypeScript (strict mode)
- **Navigation**: File-based routing via Expo Router
- **Build/Deploy**: EAS Build for TestFlight

See [docs/ADR-001-ios-mobile-architecture.md](docs/ADR-001-ios-mobile-architecture.md) for the full architecture decision record.

## Project Structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root stack navigator
  (tabs)/               # Tab navigator
    _layout.tsx         # Tab configuration
    index.tsx           # Dashboard (account list)
    settings.tsx        # Settings screen
  account/[id].tsx      # Account detail + transactions
  create-account.tsx    # New account form
src/
  db/
    schema.ts           # SQLite schema initialization
    repository.ts       # Data access layer (accounts, transactions)
  services/
    interest.ts         # Compound interest calculator
    validation.ts       # Input validation (ported from Express middleware)
  components/
    AccountCard.tsx      # Account card component
    TransactionForm.tsx  # Deposit/withdrawal form
    TransactionList.tsx  # Transaction history list
  lib/
    types.ts            # TypeScript type definitions
    constants.ts        # Categories, colors, periods
```

## How to Run (Codespaces / Local Dev)

### Prerequisites
- Node.js 20+
- Expo Go app on your iOS device (for development)

### Install & Start

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your iOS device, or press `i` for iOS simulator (requires macOS with Xcode).

### Development in Codespaces

```bash
npm install
npx expo start --tunnel
```

The `--tunnel` flag creates a public URL that Expo Go can connect to from your phone,
even when running in a cloud Codespace.

## How to Build for TestFlight

### Prerequisites
1. An [Apple Developer Account](https://developer.apple.com/) ($99/year)
2. EAS CLI: `npm install -g eas-cli`
3. Logged into EAS: `eas login`

### Configure

Edit `eas.json` and replace the placeholder values in the `submit.production.ios` section:
- `appleId`: Your Apple ID email
- `ascAppId`: Your App Store Connect app ID
- `appleTeamId`: Your Apple Developer Team ID

### Build

```bash
# Build for TestFlight (production profile)
eas build --platform ios --profile production

# Or build for internal testing (no App Store Connect needed)
eas build --platform ios --profile preview
```

### Submit to TestFlight

```bash
eas submit --platform ios --profile production
```

This uploads the build to App Store Connect. From there, add testers in the
TestFlight section of App Store Connect.

### Full Build + Submit in One Command

```bash
eas build --platform ios --profile production --auto-submit
```

## Features (MVP / P0)

- Dashboard with all children's accounts
- Create new accounts with name, interest rate, and compounding period
- Record deposits and withdrawals with categories
- View transaction history
- Manual compound interest calculation
- All data stored locally on device (SQLite)
- Zero network connectivity required

## Legacy Web App

The original web app (Astro + Express) remains in `frontend/` and `backend/`
directories for reference. The mobile app replaces the client-server architecture
with a single on-device application.

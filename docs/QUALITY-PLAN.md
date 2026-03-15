# Piggybank iOS — Quality & Security Plan

**Date**: 2026-03-15
**Status**: Proposed

---

## Current State Assessment

| Area | Status | Gap |
|------|--------|-----|
| Unit tests (mobile) | None | Critical — zero coverage on all new code |
| Unit tests (backend) | 28 tests | Legacy — not used by mobile app |
| Integration tests | None | No end-to-end data flow testing |
| Linting | None | No ESLint, Prettier, or Biome configured |
| Type checking | Manual only | Not enforced in CI |
| CI/CD | None | No GitHub Actions pipeline |
| Pre-commit hooks | None | Nothing prevents bad code from landing |
| Privacy policy | None | Required for TestFlight/App Store |
| Security audit | None | No threat model, no dependency scanning |
| Dependency scanning | None | No `npm audit` in CI |

**Verdict**: We have no quality program. The mobile app has zero automated safety nets.

---

## Recommended Methodology: TDD for Services, Test-After for UI

### Why Not Pure TDD Everywhere?

Pure TDD (write test → red → green → refactor) makes sense for **deterministic business logic** like:
- Interest calculation (math, edge cases, rounding)
- Transaction processing (balance updates, insufficient funds)
- Validation (input boundaries, type checking)

It makes less sense for **UI components** where:
- Layout and styling iterate rapidly during design
- React Native component rendering requires device/emulator context
- The cost of maintaining fragile snapshot tests exceeds their value

### Recommended Approach

| Layer | Methodology | Rationale |
|-------|-------------|-----------|
| `src/db/repository.ts` | **TDD** | Data integrity is critical. Every query must be tested against a real SQLite instance. |
| `src/services/interest.ts` | **TDD** | Financial math must be proven correct. Edge cases (rounding, zero balance, leap years) must be caught before they ship. |
| `src/services/validation.ts` | **TDD** | Input boundaries are the security perimeter. Every validation rule needs a passing and failing test. |
| `src/components/*.tsx` | **Test-after** | Write component, then add smoke tests for critical interactions (submit, error display). Skip snapshot tests. |
| `app/*.tsx` | **Integration test-after** | Screen-level tests that verify data flows from SQLite through to rendered output. |

---

## Implementation Plan

### Layer 1: Test Infrastructure (Do First)

**1.1 Install test tooling**

```bash
npm install --save-dev jest @jest/globals ts-jest @testing-library/react-native \
  @testing-library/jest-native jest-expo eslint @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

**1.2 Configure Jest for Expo**

`jest.config.ts`:
```typescript
export default {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)'
  ],
  setupFilesAfterSetup: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/constants.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/db/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

**1.3 Configure ESLint + Prettier**

`.eslintrc.json`:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["error"] }]
  },
  "ignorePatterns": ["frontend/", "backend/", "node_modules/"]
}
```

**1.4 Pre-commit hooks (via simple npm script)**

`package.json` scripts:
```json
{
  "lint": "eslint 'src/**/*.{ts,tsx}' 'app/**/*.{ts,tsx}'",
  "typecheck": "tsc --noEmit",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "quality": "npm run typecheck && npm run lint && npm run test"
}
```

---

### Layer 2: Service Tests (TDD — Write These First)

**2.1 Interest Calculator Tests** (`src/services/__tests__/interest.test.ts`)

Must cover:
- [ ] Monthly compounding: correct interest for 1, 2, 12 periods
- [ ] Daily compounding: 365 periods = ~expected APY
- [ ] Weekly, quarterly, annually: each period type
- [ ] Zero balance returns failure
- [ ] Negative/zero interest rate edge case
- [ ] Not-due-yet returns correct days remaining
- [ ] Negligible interest (< $0.01) returns failure
- [ ] Rounding: interest is rounded to 2 decimal places (no floating point drift)
- [ ] Multiple missed periods: catch-up calculation is correct
- [ ] Last interest date is updated after successful calculation

**2.2 Validation Tests** (`src/services/__tests__/validation.test.ts`)

Must cover:
- [ ] Account name: empty, whitespace-only, >50 chars, valid
- [ ] Interest rate: negative, >1, NaN, valid
- [ ] Transaction amount: 0, negative, >999999.99, NaN, valid
- [ ] Category: invalid category for type, valid for each type
- [ ] Compounding period: invalid string, all valid values

**2.3 Repository Tests** (`src/db/__tests__/repository.test.ts`)

Must cover (using in-memory SQLite):
- [ ] Create account: returns account with ID, balance 0
- [ ] Create account: duplicate name throws
- [ ] Get all accounts: excludes soft-deleted
- [ ] Get account: returns null for nonexistent
- [ ] Create deposit: balance increases
- [ ] Create withdrawal: balance decreases
- [ ] Create withdrawal: insufficient funds throws
- [ ] Transaction list: ordered by date DESC
- [ ] Interest transaction: balance increases, treated like deposit
- [ ] Soft delete: account no longer returned by getAll

---

### Layer 3: Component Tests (Test-After)

**3.1 TransactionForm** (`src/components/__tests__/TransactionForm.test.tsx`)
- [ ] Renders deposit and withdrawal toggle
- [ ] Submitting with empty amount shows error
- [ ] Submitting valid deposit calls onSuccess
- [ ] Submitting withdrawal with insufficient funds shows error message
- [ ] Category chips render correctly for each type

**3.2 AccountCard** (`src/components/__tests__/AccountCard.test.tsx`)
- [ ] Renders account name, balance, rate
- [ ] onPress callback fires when tapped

**3.3 TransactionList** (`src/components/__tests__/TransactionList.test.tsx`)
- [ ] Renders empty state when no transactions
- [ ] Renders transaction rows with correct colors (green/red/indigo)
- [ ] Formats amounts to 2 decimal places

---

### Layer 4: Privacy & Security

**4.1 Privacy Policy** (`docs/PRIVACY-POLICY.md`)

Required for TestFlight. Must state:
- All data stored locally on device only
- No network requests, no analytics, no crash reporting
- No third-party SDKs that collect data
- No user accounts or authentication servers
- Data deleted when app is uninstalled
- No data shared with Apple, Anthropic, or any third party

**4.2 Security Threat Model** (`docs/SECURITY.md`)

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Physical device access | Medium | P1: Parent PIN via expo-secure-store (Keychain) |
| SQLite file extraction (jailbroken device) | Low | iOS sandbox prevents access on non-jailbroken devices |
| SQL injection via user input | Medium | All queries use parameterized statements (verified in repository.ts) |
| Integer overflow on balance | Low | JavaScript numbers handle values up to 2^53; validation caps at $999,999.99 |
| Floating point rounding errors | Medium | All monetary values rounded to 2 decimal places before storage |
| Dependency supply chain | Medium | Minimal dependencies; `npm audit` in CI |
| Memory dump of PIN | Low | PIN stored in Keychain via expo-secure-store, not in JS heap |

**4.3 Dependency Audit**

Add to CI:
```bash
npm audit --audit-level=high
```

Reject builds with high/critical vulnerabilities.

---

### Layer 5: CI/CD Pipeline

**`.github/workflows/quality.yml`**

```yaml
name: Quality Gate
on:
  push:
    branches: [main, 'claude/**']
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm audit --audit-level=high
```

**Quality gate**: All checks must pass before merge. No exceptions.

---

## Priority Order

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Install test tooling + Jest config | 30 min | Unblocks everything |
| 2 | Service tests (interest, validation) — TDD | 2-3 hrs | Highest — proves financial math is correct |
| 3 | Repository tests (SQLite CRUD) | 1-2 hrs | High — proves data integrity |
| 4 | ESLint + Prettier config | 30 min | Prevents style drift |
| 5 | Privacy Policy document | 30 min | Required for TestFlight |
| 6 | CI pipeline (GitHub Actions) | 30 min | Automates quality gate |
| 7 | Component smoke tests | 1-2 hrs | Medium — catches UI regressions |
| 8 | Security threat model | 1 hr | Documents risk posture |
| 9 | npm audit in CI | 15 min | Supply chain protection |

---

## Success Criteria

The quality program is working when:
1. `npm run quality` passes on every commit (typecheck + lint + tests)
2. Service layer has 95%+ coverage (interest calculator, validation)
3. Repository layer has 90%+ coverage
4. CI pipeline blocks PRs that fail quality gate
5. Privacy policy exists and is accurate
6. Zero high/critical npm audit findings
7. No `any` types in mobile codebase

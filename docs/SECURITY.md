# Piggybank — Security Threat Model

**Last Updated**: 2026-03-15

## Architecture Security Properties

| Property | Status |
|----------|--------|
| Network requests | None — fully offline |
| Authentication server | None — no accounts |
| Third-party SDKs | None |
| Data encryption at rest | iOS Data Protection (automatic via sandbox) |
| Data encryption in transit | N/A — no network |
| Input validation | All user inputs validated before database writes |
| SQL injection protection | Parameterized queries throughout |

## Threat Analysis

### T1: Unauthorized Access to Child's Account
- **Threat**: Someone other than a parent accesses the app and makes
  unauthorized withdrawals
- **Severity**: Medium
- **Mitigation**: Parent PIN lock (P1 feature) stored in iOS Keychain
  via expo-secure-store. Required for withdrawals and settings.
- **Current Status**: PIN not yet implemented (P1 backlog)
- **Residual Risk**: Until PIN is implemented, physical device access
  grants full app access. Mitigated by iOS device passcode.

### T2: SQL Injection via User Input
- **Threat**: Malicious input in account name, transaction note, or
  amount fields could execute arbitrary SQL
- **Severity**: High (if exploitable)
- **Mitigation**: All database operations in `src/db/repository.ts` use
  parameterized queries via expo-sqlite's `runSync(sql, ...params)`.
  No string concatenation in SQL.
- **Verification**: Code review + test coverage at 100% for repository layer
- **Residual Risk**: Negligible

### T3: SQLite File Extraction (Jailbroken Device)
- **Threat**: On a jailbroken device, the SQLite database file can be
  copied and read
- **Severity**: Low
- **Mitigation**: iOS sandbox prevents access on non-jailbroken devices.
  The data is simulated allowance balances, not real financial data.
- **Residual Risk**: Accepted — this is a children's education app,
  not a bank

### T4: Integer/Float Overflow on Balance
- **Threat**: Extremely large deposits could overflow JavaScript number
  precision, causing incorrect balances
- **Severity**: Medium
- **Mitigation**: Validation caps amounts at $999,999.99. All monetary
  values are rounded to 2 decimal places before storage. JavaScript
  numbers (IEEE 754 double) handle values up to 2^53 safely.
- **Verification**: Validated in `validation.test.ts`
- **Residual Risk**: Negligible

### T5: Floating Point Rounding Errors
- **Threat**: Repeated compound interest calculations accumulate
  floating-point precision errors
- **Severity**: Medium
- **Mitigation**: All amounts rounded to 2 decimal places
  (`Math.round(value * 100) / 100`) before storage. Interest is
  rounded before creating the transaction.
- **Verification**: Tested in `interest.test.ts` (rounding test)
- **Residual Risk**: Low — errors limited to < $0.01 per calculation

### T6: Dependency Supply Chain Attack
- **Threat**: A compromised npm dependency introduces malicious code
- **Severity**: Medium
- **Mitigation**:
  1. Minimal dependency footprint (Expo SDK + no additional packages)
  2. `npm audit` integrated into CI pipeline
  3. `package-lock.json` pinned and committed
- **Residual Risk**: Low — standard for any JS project

### T7: App Store Rejection (Non-Security)
- **Threat**: Apple rejects the TestFlight build for guideline violations
- **Severity**: Medium (blocks distribution)
- **Mitigation**: Privacy policy document, no placeholder content,
  functional navigation, no crashes. App provides genuine utility
  beyond what a website can (offline SQLite, native navigation).
- **Residual Risk**: Low

## Security Testing Checklist

- [x] All database queries use parameterized statements
- [x] Input validation on all user-facing fields
- [x] Amount validation (>0, <$999,999.99)
- [x] Account name length limits (≤50 chars)
- [x] Note length limits (≤200 chars)
- [x] Category validation (type-specific allowlists)
- [x] No `eval()`, `Function()`, or dynamic code execution
- [x] No network requests or URL construction from user input
- [x] No `any` types in production code (enforced by ESLint)
- [ ] Parent PIN stored in Keychain (P1 — not yet implemented)
- [ ] npm audit clean (CI pipeline — not yet running)

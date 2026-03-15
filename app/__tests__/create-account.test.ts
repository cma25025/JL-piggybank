/**
 * CreateAccountScreen — Business Logic Tests
 *
 * Tests the validation and account creation flow embedded in create-account.tsx.
 * Since we're in a node environment without a rendering library, we test the
 * handleCreate logic by simulating the component's state management and
 * verifying the correct validation/repository calls.
 *
 * NOTE: jest.config.ts testMatch needs to include app/__tests__ for these to run.
 */

import { createAccount } from "../../src/db/repository";
import { validateAccountName, validateInterestRate } from "../../src/services/validation";

jest.mock("../../src/db/repository");

const mockedCreateAccount = createAccount as jest.MockedFunction<typeof createAccount>;

/**
 * Replicates the handleCreate logic from create-account.tsx.
 * This mirrors the inline validation + creation flow in the component.
 */
function simulateHandleCreate(
  name: string,
  rateInput: string,
  period: string
): { error: string | null; created: boolean; navigatedBack: boolean } {
  let error: string | null = null;
  let created = false;
  let navigatedBack = false;

  // Step 1: validate account name
  const nameError = validateAccountName(name);
  if (nameError) {
    return { error: nameError, created, navigatedBack };
  }

  // Step 2: parse and validate rate (inline logic in the component)
  const ratePercent = parseFloat(rateInput);
  if (isNaN(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    return {
      error: "Interest rate must be between 0% and 100%",
      created,
      navigatedBack,
    };
  }

  // Step 3: convert to decimal and validate via service
  const rateDecimal = ratePercent / 100;
  const rateError = validateInterestRate(rateDecimal);
  if (rateError) {
    return { error: rateError, created, navigatedBack };
  }

  // Step 4: create account
  try {
    createAccount({
      name: name.trim(),
      interest_rate: rateDecimal,
      compounding_period: period as "monthly",
      initial_balance: 0,
    });
    created = true;
    navigatedBack = true;
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : "Failed to create account";
  }

  return { error, created, navigatedBack };
}

describe("CreateAccountScreen logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateAccount.mockReturnValue({
      id: 1,
      name: "Test",
      balance: 0,
      interest_rate: 0.05,
      compounding_period: "monthly",
      last_interest_date: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
    });
  });

  describe("happy path", () => {
    it("creates account with valid name, rate, and period", () => {
      const result = simulateHandleCreate("Charlie", "5", "monthly");

      expect(result.error).toBeNull();
      expect(result.created).toBe(true);
      expect(result.navigatedBack).toBe(true);
      expect(mockedCreateAccount).toHaveBeenCalledWith({
        name: "Charlie",
        interest_rate: 0.05,
        compounding_period: "monthly",
        initial_balance: 0,
      });
    });

    it("trims whitespace from name before creating", () => {
      const result = simulateHandleCreate("  Alice  ", "10", "weekly");

      expect(result.created).toBe(true);
      expect(mockedCreateAccount).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Alice" })
      );
    });

    it("converts percentage rate to decimal correctly", () => {
      simulateHandleCreate("Bob", "12.5", "quarterly");

      expect(mockedCreateAccount).toHaveBeenCalledWith(
        expect.objectContaining({ interest_rate: 0.125 })
      );
    });

    it("accepts 0% interest rate", () => {
      const result = simulateHandleCreate("Zero", "0", "monthly");

      expect(result.error).toBeNull();
      expect(result.created).toBe(true);
      expect(mockedCreateAccount).toHaveBeenCalledWith(
        expect.objectContaining({ interest_rate: 0 })
      );
    });

    it("accepts 100% interest rate", () => {
      const result = simulateHandleCreate("Max", "100", "annually");

      expect(result.error).toBeNull();
      expect(result.created).toBe(true);
      expect(mockedCreateAccount).toHaveBeenCalledWith(
        expect.objectContaining({ interest_rate: 1 })
      );
    });
  });

  describe("name validation", () => {
    it("returns error for empty name", () => {
      const result = simulateHandleCreate("", "5", "monthly");

      expect(result.error).not.toBeNull();
      expect(result.created).toBe(false);
      expect(mockedCreateAccount).not.toHaveBeenCalled();
    });

    it("returns error for whitespace-only name", () => {
      const result = simulateHandleCreate("   ", "5", "monthly");

      expect(result.error).not.toBeNull();
      expect(result.created).toBe(false);
    });

    it("returns error for name exceeding 50 characters", () => {
      const longName = "a".repeat(51);
      const result = simulateHandleCreate(longName, "5", "monthly");

      expect(result.error).toMatch(/50 characters/);
      expect(result.created).toBe(false);
    });
  });

  describe("interest rate validation (inline logic)", () => {
    it("returns error for non-numeric rate", () => {
      const result = simulateHandleCreate("Charlie", "abc", "monthly");

      expect(result.error).toBe("Interest rate must be between 0% and 100%");
      expect(result.created).toBe(false);
    });

    it("returns error for empty rate input", () => {
      const result = simulateHandleCreate("Charlie", "", "monthly");

      expect(result.error).toBe("Interest rate must be between 0% and 100%");
      expect(result.created).toBe(false);
    });

    it("returns error for negative rate", () => {
      const result = simulateHandleCreate("Charlie", "-5", "monthly");

      expect(result.error).toBe("Interest rate must be between 0% and 100%");
      expect(result.created).toBe(false);
    });

    it("returns error for rate above 100%", () => {
      const result = simulateHandleCreate("Charlie", "101", "monthly");

      expect(result.error).toBe("Interest rate must be between 0% and 100%");
      expect(result.created).toBe(false);
    });
  });

  describe("repository error handling", () => {
    it("captures duplicate name error from repository", () => {
      mockedCreateAccount.mockImplementation(() => {
        throw new Error("Account name already exists");
      });

      const result = simulateHandleCreate("Charlie", "5", "monthly");

      expect(result.error).toBe("Account name already exists");
      expect(result.created).toBe(false);
      expect(result.navigatedBack).toBe(false);
    });

    it("captures generic error from repository", () => {
      mockedCreateAccount.mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = simulateHandleCreate("Charlie", "5", "monthly");

      expect(result.error).toBe("Database error");
      expect(result.created).toBe(false);
    });

    it("handles non-Error throws from repository", () => {
      mockedCreateAccount.mockImplementation(() => {
        throw "unexpected string error";
      });

      const result = simulateHandleCreate("Charlie", "5", "monthly");

      expect(result.error).toBe("Failed to create account");
      expect(result.created).toBe(false);
    });
  });
});

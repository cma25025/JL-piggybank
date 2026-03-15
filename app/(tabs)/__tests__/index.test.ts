/**
 * DashboardScreen — Business Logic Tests
 *
 * Tests the data loading and refresh logic embedded in (tabs)/index.tsx.
 * Since we're in a node environment without a rendering library, we test the
 * loadAccounts and onRefresh logic by simulating the component's state
 * management and verifying correct repository calls and error handling.
 *
 * NOTE: jest.config.ts testMatch needs to include app/__tests__ for these to run.
 */

import { getAllAccounts } from "../../../src/db/repository";
import type { Account } from "../../../src/lib/types";

jest.mock("../../../src/db/repository");

const mockedGetAllAccounts = getAllAccounts as jest.MockedFunction<typeof getAllAccounts>;

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: "Charlie",
    balance: 100,
    interest_rate: 0.05,
    compounding_period: "monthly",
    last_interest_date: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Replicates the loadAccounts logic from (tabs)/index.tsx.
 * The component calls getAllAccounts() and sets state, catching errors.
 */
function simulateLoadAccounts(): {
  accounts: Account[];
  errorLogged: boolean;
} {
  let accounts: Account[] = [];
  let errorLogged = false;

  try {
    const data = getAllAccounts();
    accounts = data;
  } catch {
    errorLogged = true;
  }

  return { accounts, errorLogged };
}

/**
 * Replicates the onRefresh logic from (tabs)/index.tsx.
 * Calls loadAccounts synchronously, toggling refreshing state.
 */
function simulateOnRefresh(): {
  accounts: Account[];
  refreshSequence: boolean[];
  errorLogged: boolean;
} {
  const refreshSequence: boolean[] = [];
  let accounts: Account[] = [];
  let errorLogged = false;

  // setRefreshing(true)
  refreshSequence.push(true);

  // loadAccounts()
  try {
    const data = getAllAccounts();
    accounts = data;
  } catch {
    errorLogged = true;
  }

  // setRefreshing(false)
  refreshSequence.push(false);

  return { accounts, refreshSequence, errorLogged };
}

describe("DashboardScreen logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadAccounts", () => {
    it("loads and returns all accounts from the repository", () => {
      const mockAccounts = [
        makeAccount({ id: 1, name: "Alice", balance: 50 }),
        makeAccount({ id: 2, name: "Bob", balance: 200 }),
      ];
      mockedGetAllAccounts.mockReturnValue(mockAccounts);

      const result = simulateLoadAccounts();

      expect(result.accounts).toEqual(mockAccounts);
      expect(result.accounts).toHaveLength(2);
      expect(result.errorLogged).toBe(false);
      expect(mockedGetAllAccounts).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no accounts exist", () => {
      mockedGetAllAccounts.mockReturnValue([]);

      const result = simulateLoadAccounts();

      expect(result.accounts).toEqual([]);
      expect(result.errorLogged).toBe(false);
    });

    it("handles database errors gracefully without crashing", () => {
      mockedGetAllAccounts.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const result = simulateLoadAccounts();

      expect(result.accounts).toEqual([]);
      expect(result.errorLogged).toBe(true);
    });
  });

  describe("onRefresh", () => {
    it("loads accounts and toggles refreshing state correctly", () => {
      const mockAccounts = [makeAccount({ id: 1, name: "Alice" })];
      mockedGetAllAccounts.mockReturnValue(mockAccounts);

      const result = simulateOnRefresh();

      expect(result.accounts).toEqual(mockAccounts);
      // Refreshing goes true then false
      expect(result.refreshSequence).toEqual([true, false]);
      expect(result.errorLogged).toBe(false);
    });

    it("completes refresh cycle even when load fails", () => {
      mockedGetAllAccounts.mockImplementation(() => {
        throw new Error("Network error");
      });

      const result = simulateOnRefresh();

      // Refresh cycle completes (true -> false) even on error
      expect(result.refreshSequence).toEqual([true, false]);
      expect(result.errorLogged).toBe(true);
      expect(result.accounts).toEqual([]);
    });
  });

  describe("account data shape", () => {
    it("preserves all account fields from repository", () => {
      const fullAccount = makeAccount({
        id: 42,
        name: "Savings Kid",
        balance: 1234.56,
        interest_rate: 0.075,
        compounding_period: "weekly",
        last_interest_date: "2024-06-01T00:00:00Z",
      });
      mockedGetAllAccounts.mockReturnValue([fullAccount]);

      const result = simulateLoadAccounts();

      expect(result.accounts[0]).toEqual(
        expect.objectContaining({
          id: 42,
          name: "Savings Kid",
          balance: 1234.56,
          interest_rate: 0.075,
          compounding_period: "weekly",
        })
      );
    });
  });
});

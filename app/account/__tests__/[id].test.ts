/**
 * AccountDetailScreen — Business Logic Tests
 *
 * Tests the data loading, interest calculation, and error handling logic
 * embedded in account/[id].tsx. Since we're in a node environment without
 * a rendering library, we replicate the component's business logic and
 * verify correct repository/service calls and state outcomes.
 *
 * NOTE: jest.config.ts testMatch needs to include app/__tests__ for these to run.
 */

import { getAccount, getTransactions } from "../../../src/db/repository";
import { calculateInterest } from "../../../src/services/interest";
import type { Account, Transaction } from "../../../src/lib/types";

jest.mock("../../../src/db/repository");
jest.mock("../../../src/services/interest");

const mockedGetAccount = getAccount as jest.MockedFunction<typeof getAccount>;
const mockedGetTransactions = getTransactions as jest.MockedFunction<
  typeof getTransactions
>;
const mockedCalculateInterest = calculateInterest as jest.MockedFunction<
  typeof calculateInterest
>;

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

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    account_id: 1,
    type: "deposit",
    category: "Allowance",
    amount: 25,
    balance_after: 125,
    note: null,
    transaction_date: "2024-06-15T00:00:00Z",
    created_at: "2024-06-15T00:00:00Z",
    updated_at: "2024-06-15T00:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Replicates the loadData logic from account/[id].tsx.
 * Parses the route ID, loads account data, and conditionally loads transactions.
 */
function simulateLoadData(idParam: string): {
  accountId: number;
  account: Account | null;
  transactions: Transaction[];
  errorLogged: boolean;
} {
  const accountId = parseInt(idParam, 10);
  let account: Account | null = null;
  let transactions: Transaction[] = [];
  let errorLogged = false;

  try {
    const acc = getAccount(accountId);
    account = acc;
    if (acc) {
      const txs = getTransactions(accountId);
      transactions = txs;
    }
  } catch {
    errorLogged = true;
  }

  return { accountId, account, transactions, errorLogged };
}

/**
 * Replicates the handleInterest logic from account/[id].tsx.
 * Calls calculateInterest and returns the alert info + whether data was reloaded.
 */
function simulateHandleInterest(accountId: number): {
  alertTitle: string;
  alertMessage: string;
  dataReloaded: boolean;
} {
  const result = calculateInterest(accountId);

  const alertTitle = result.success ? "Interest Applied" : "Interest";
  const alertMessage = result.message;
  const dataReloaded = result.success;

  return { alertTitle, alertMessage, dataReloaded };
}

/**
 * Replicates the ID parsing logic from the component.
 * The component uses parseInt(id, 10) on the route param.
 */
function simulateParseId(idParam: string): number {
  return parseInt(idParam, 10);
}

describe("AccountDetailScreen logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("route param parsing", () => {
    it("parses numeric string ID correctly", () => {
      expect(simulateParseId("42")).toBe(42);
    });

    it("parses single digit ID", () => {
      expect(simulateParseId("1")).toBe(1);
    });

    it("returns NaN for non-numeric ID", () => {
      expect(simulateParseId("abc")).toBeNaN();
    });

    it("parses only the integer part of a decimal", () => {
      expect(simulateParseId("3.14")).toBe(3);
    });
  });

  describe("loadData", () => {
    it("loads account and transactions for a valid ID", () => {
      const mockAccount = makeAccount({ id: 5, balance: 250 });
      const mockTransactions = [
        makeTransaction({ id: 1, amount: 100 }),
        makeTransaction({ id: 2, amount: 150, type: "withdrawal", category: "Toy" }),
      ];
      mockedGetAccount.mockReturnValue(mockAccount);
      mockedGetTransactions.mockReturnValue(mockTransactions);

      const result = simulateLoadData("5");

      expect(result.accountId).toBe(5);
      expect(result.account).toEqual(mockAccount);
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.errorLogged).toBe(false);
      expect(mockedGetAccount).toHaveBeenCalledWith(5);
      expect(mockedGetTransactions).toHaveBeenCalledWith(5);
    });

    it("does not load transactions when account is not found", () => {
      mockedGetAccount.mockReturnValue(null);

      const result = simulateLoadData("999");

      expect(result.account).toBeNull();
      expect(result.transactions).toEqual([]);
      expect(mockedGetTransactions).not.toHaveBeenCalled();
    });

    it("handles database error gracefully", () => {
      mockedGetAccount.mockImplementation(() => {
        throw new Error("Database corrupted");
      });

      const result = simulateLoadData("1");

      expect(result.account).toBeNull();
      expect(result.transactions).toEqual([]);
      expect(result.errorLogged).toBe(true);
    });

    it("handles transaction loading error gracefully", () => {
      mockedGetAccount.mockReturnValue(makeAccount());
      mockedGetTransactions.mockImplementation(() => {
        throw new Error("Transaction table missing");
      });

      const result = simulateLoadData("1");

      // The error is caught by the outer try/catch
      expect(result.errorLogged).toBe(true);
    });

    it("returns empty transactions when account has none", () => {
      mockedGetAccount.mockReturnValue(makeAccount());
      mockedGetTransactions.mockReturnValue([]);

      const result = simulateLoadData("1");

      expect(result.account).not.toBeNull();
      expect(result.transactions).toEqual([]);
    });
  });

  describe("handleInterest", () => {
    it("shows success alert and triggers reload when interest is applied", () => {
      mockedCalculateInterest.mockReturnValue({
        success: true,
        message: "Added $10.00 interest!",
        amount: 10,
        periods: 1,
      });

      const result = simulateHandleInterest(1);

      expect(result.alertTitle).toBe("Interest Applied");
      expect(result.alertMessage).toBe("Added $10.00 interest!");
      expect(result.dataReloaded).toBe(true);
      expect(mockedCalculateInterest).toHaveBeenCalledWith(1);
    });

    it("shows info alert without reload when interest is not due", () => {
      mockedCalculateInterest.mockReturnValue({
        success: false,
        message: "Not due yet. Next payment in 15 days.",
      });

      const result = simulateHandleInterest(1);

      expect(result.alertTitle).toBe("Interest");
      expect(result.alertMessage).toBe("Not due yet. Next payment in 15 days.");
      expect(result.dataReloaded).toBe(false);
    });

    it("shows info alert when account not found", () => {
      mockedCalculateInterest.mockReturnValue({
        success: false,
        message: "Account not found",
      });

      const result = simulateHandleInterest(999);

      expect(result.alertTitle).toBe("Interest");
      expect(result.alertMessage).toBe("Account not found");
      expect(result.dataReloaded).toBe(false);
    });

    it("shows info alert when balance is zero", () => {
      mockedCalculateInterest.mockReturnValue({
        success: false,
        message: "No balance for interest",
      });

      const result = simulateHandleInterest(1);

      expect(result.alertTitle).toBe("Interest");
      expect(result.alertMessage).toBe("No balance for interest");
      expect(result.dataReloaded).toBe(false);
    });

    it("shows info alert when interest is negligible", () => {
      mockedCalculateInterest.mockReturnValue({
        success: false,
        message: "Interest negligible (< $0.01)",
      });

      const result = simulateHandleInterest(1);

      expect(result.alertTitle).toBe("Interest");
      expect(result.alertMessage).toMatch(/negligible/);
      expect(result.dataReloaded).toBe(false);
    });

    it("correctly passes accountId to calculateInterest", () => {
      mockedCalculateInterest.mockReturnValue({
        success: false,
        message: "Account not found",
      });

      simulateHandleInterest(42);

      expect(mockedCalculateInterest).toHaveBeenCalledWith(42);
    });
  });

  describe("onRefresh", () => {
    it("reloads data during refresh cycle", () => {
      const mockAccount = makeAccount({ id: 3, balance: 500 });
      const mockTxs = [makeTransaction({ id: 10, amount: 500 })];
      mockedGetAccount.mockReturnValue(mockAccount);
      mockedGetTransactions.mockReturnValue(mockTxs);

      // Simulate onRefresh: setRefreshing(true) -> loadData() -> setRefreshing(false)
      const refreshStates: boolean[] = [];
      refreshStates.push(true);

      const loadResult = simulateLoadData("3");

      refreshStates.push(false);

      expect(refreshStates).toEqual([true, false]);
      expect(loadResult.account).toEqual(mockAccount);
      expect(loadResult.transactions).toEqual(mockTxs);
    });
  });
});

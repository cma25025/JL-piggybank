/**
 * Repository Tests
 *
 * Tests the data access layer by mocking expo-sqlite.
 * Verifies correct SQL queries, parameter passing, and error handling.
 */

import {
  getAllAccounts,
  getAccount,
  createAccount,
  createTransaction,
  getTransactions,
  deleteAccount,
  getAccountStatistics,
  updateLastInterestDate,
} from "../repository";

// Mock expo-sqlite
const mockRunSync = jest.fn();
const mockGetFirstSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockExecSync = jest.fn();

jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    runSync: mockRunSync,
    getFirstSync: mockGetFirstSync,
    getAllSync: mockGetAllSync,
    execSync: mockExecSync,
  })),
}));

describe("Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllAccounts", () => {
    it("returns all non-deleted accounts ordered by name", () => {
      const mockAccounts = [
        { id: 1, name: "Alice", balance: 50 },
        { id: 2, name: "Bob", balance: 100 },
      ];
      mockGetAllSync.mockReturnValue(mockAccounts);

      const result = getAllAccounts();

      expect(result).toEqual(mockAccounts);
      expect(mockGetAllSync).toHaveBeenCalledWith(
        expect.stringContaining("deleted_at IS NULL"),
        // no additional args expected beyond the SQL
      );
      expect(mockGetAllSync).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY name")
      );
    });
  });

  describe("getAccount", () => {
    it("returns account when found", () => {
      const mockAccount = { id: 1, name: "Charlie", balance: 100 };
      mockGetFirstSync.mockReturnValue(mockAccount);

      const result = getAccount(1);

      expect(result).toEqual(mockAccount);
      expect(mockGetFirstSync).toHaveBeenCalledWith(
        expect.stringContaining("id = ?"),
        1
      );
    });

    it("returns null when account not found", () => {
      mockGetFirstSync.mockReturnValue(null);

      const result = getAccount(999);

      expect(result).toBeNull();
    });
  });

  describe("createAccount", () => {
    it("creates account and returns it", () => {
      const newAccount = {
        id: 1,
        name: "Charlie",
        balance: 0,
        interest_rate: 0.05,
        compounding_period: "monthly",
      };

      // No existing account with same name
      mockGetFirstSync
        .mockReturnValueOnce(null) // Check uniqueness
        .mockReturnValueOnce(newAccount); // Return created account

      mockRunSync.mockReturnValue({ lastInsertRowId: 1 });

      const result = createAccount({
        name: "Charlie",
        interest_rate: 0.05,
        compounding_period: "monthly",
      });

      expect(result).toEqual(newAccount);
      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO accounts"),
        "Charlie",
        0, // initial_balance default
        0.05,
        "monthly"
      );
    });

    it("throws error for duplicate account name", () => {
      mockGetFirstSync.mockReturnValue({ id: 1 }); // Existing account found

      expect(() =>
        createAccount({
          name: "Charlie",
          interest_rate: 0.05,
          compounding_period: "monthly",
        })
      ).toThrow("Account name already exists");
    });

    it("respects initial_balance parameter", () => {
      mockGetFirstSync
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 1, balance: 50 });
      mockRunSync.mockReturnValue({ lastInsertRowId: 1 });

      createAccount({
        name: "Charlie",
        interest_rate: 0.05,
        compounding_period: "monthly",
        initial_balance: 50,
      });

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT"),
        "Charlie",
        50,
        0.05,
        "monthly"
      );
    });
  });

  describe("createTransaction", () => {
    it("creates deposit and increases balance", () => {
      const mockAccount = { id: 1, balance: 100 };
      const mockTx = { id: 1, amount: 50, balance_after: 150 };

      mockGetFirstSync
        .mockReturnValueOnce(mockAccount) // Get account
        .mockReturnValueOnce(mockTx); // Return created transaction
      mockRunSync.mockReturnValue({ lastInsertRowId: 1 });

      const result = createTransaction({
        accountId: 1,
        type: "deposit",
        category: "Allowance",
        amount: 50,
      });

      expect(result).toEqual(mockTx);
      // Verify balance update: 100 + 50 = 150
      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE accounts SET balance"),
        150,
        1
      );
    });

    it("creates withdrawal and decreases balance", () => {
      const mockAccount = { id: 1, balance: 100 };
      mockGetFirstSync
        .mockReturnValueOnce(mockAccount)
        .mockReturnValueOnce({ id: 1, amount: 30, balance_after: 70 });
      mockRunSync.mockReturnValue({ lastInsertRowId: 1 });

      createTransaction({
        accountId: 1,
        type: "withdrawal",
        category: "Toy",
        amount: 30,
      });

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE accounts SET balance"),
        70,
        1
      );
    });

    it("throws insufficient funds for withdrawal exceeding balance", () => {
      mockGetFirstSync.mockReturnValue({ id: 1, balance: 10 });

      expect(() =>
        createTransaction({
          accountId: 1,
          type: "withdrawal",
          category: "Toy",
          amount: 50,
        })
      ).toThrow("Insufficient funds");
    });

    it("throws error when account not found", () => {
      mockGetFirstSync.mockReturnValue(null);

      expect(() =>
        createTransaction({
          accountId: 999,
          type: "deposit",
          category: "Allowance",
          amount: 10,
        })
      ).toThrow("Account not found");
    });

    it("throws error for invalid transaction type", () => {
      mockGetFirstSync.mockReturnValue({ id: 1, balance: 100 });

      expect(() =>
        createTransaction({
          accountId: 1,
          // @ts-expect-error testing invalid type
          type: "invalid",
          category: "Test",
          amount: 10,
        })
      ).toThrow("Invalid transaction type");
    });

    it("handles interest transactions like deposits", () => {
      mockGetFirstSync
        .mockReturnValueOnce({ id: 1, balance: 100 })
        .mockReturnValueOnce({ id: 1, amount: 5, balance_after: 105 });
      mockRunSync.mockReturnValue({ lastInsertRowId: 1 });

      createTransaction({
        accountId: 1,
        type: "interest",
        category: "Interest",
        amount: 5,
      });

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE accounts SET balance"),
        105,
        1
      );
    });

    it("rounds balance to 2 decimal places", () => {
      mockGetFirstSync
        .mockReturnValueOnce({ id: 1, balance: 100.999 })
        .mockReturnValueOnce({ id: 1, amount: 10.111, balance_after: 111.11 });
      mockRunSync.mockReturnValue({ lastInsertRowId: 1 });

      createTransaction({
        accountId: 1,
        type: "deposit",
        category: "Allowance",
        amount: 10.111,
      });

      // 100.999 + 10.111 = 111.11 (rounded)
      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE accounts SET balance"),
        111.11,
        1
      );
    });
  });

  describe("getTransactions", () => {
    it("returns transactions ordered by date DESC", () => {
      const mockTxs = [
        { id: 2, transaction_date: "2024-02-01" },
        { id: 1, transaction_date: "2024-01-01" },
      ];
      mockGetAllSync.mockReturnValue(mockTxs);

      const result = getTransactions(1);

      expect(result).toEqual(mockTxs);
      expect(mockGetAllSync).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY transaction_date DESC"),
        1
      );
    });

    it("excludes deleted transactions", () => {
      mockGetAllSync.mockReturnValue([]);

      getTransactions(1);

      expect(mockGetAllSync).toHaveBeenCalledWith(
        expect.stringContaining("deleted_at IS NULL"),
        1
      );
    });
  });

  describe("deleteAccount", () => {
    it("performs soft delete by setting deleted_at", () => {
      mockRunSync.mockReturnValue({});

      deleteAccount(1);

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("deleted_at"),
        1
      );
    });
  });

  describe("updateLastInterestDate", () => {
    it("updates last_interest_date to now", () => {
      mockRunSync.mockReturnValue({});

      updateLastInterestDate(1);

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining("last_interest_date"),
        1
      );
    });
  });

  describe("getAccountStatistics", () => {
    it("returns null when account not found", () => {
      mockGetFirstSync.mockReturnValue(null);

      const result = getAccountStatistics(999);

      expect(result).toBeNull();
    });

    it("returns statistics with correct totals", () => {
      mockGetFirstSync
        .mockReturnValueOnce({
          id: 1,
          balance: 150,
          created_at: "2024-01-01T00:00:00Z",
        }) // account
        .mockReturnValueOnce({ total: 200 }) // deposits
        .mockReturnValueOnce({ total: 50 }) // withdrawals
        .mockReturnValueOnce({ total: 10 }); // interest

      const result = getAccountStatistics(1);

      expect(result).not.toBeNull();
      expect(result!.total_deposits).toBe(200);
      expect(result!.total_withdrawals).toBe(50);
      expect(result!.total_interest_earned).toBe(10);
      expect(result!.current_balance).toBe(150);
      expect(result!.account_age_days).toBeGreaterThanOrEqual(0);
    });
  });
});

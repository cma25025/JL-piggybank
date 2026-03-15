/**
 * Interest Calculator Tests (TDD)
 *
 * These tests verify the compound interest formula and edge cases.
 * Since calculateInterest() depends on the database (repository layer),
 * we mock the repository functions and test the math + control flow.
 */

import { calculateInterest } from "../interest";
import * as repository from "../../db/repository";
import type { Account } from "../../lib/types";

jest.mock("../../db/repository");

const mockedRepo = repository as jest.Mocked<typeof repository>;

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: "Charlie",
    balance: 100,
    interest_rate: 0.05, // 5% APY
    compounding_period: "monthly",
    last_interest_date: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

describe("InterestCalculator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-07-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("calculateInterest", () => {
    it("returns failure when account not found", () => {
      mockedRepo.getAccount.mockReturnValue(null);

      const result = calculateInterest(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Account not found");
      expect(mockedRepo.createTransaction).not.toHaveBeenCalled();
    });

    it("returns failure when balance is zero", () => {
      mockedRepo.getAccount.mockReturnValue(makeAccount({ balance: 0 }));

      const result = calculateInterest(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe("No balance for interest");
    });

    it("returns failure when balance is negative", () => {
      mockedRepo.getAccount.mockReturnValue(makeAccount({ balance: -10 }));

      const result = calculateInterest(1);

      expect(result.success).toBe(false);
    });

    it("returns not-due-yet when less than one period has elapsed", () => {
      // Last interest was 15 days ago; monthly period = 30 days
      const fifteenDaysAgo = new Date("2024-06-16T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          last_interest_date: fifteenDaysAgo,
          compounding_period: "monthly",
        })
      );

      const result = calculateInterest(1);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Not due yet/);
      expect(result.message).toMatch(/\d+ day/);
    });

    it("calculates monthly interest correctly for 1 period", () => {
      // Last interest 31 days ago → 1 monthly period elapsed
      const thirtyOneDaysAgo = new Date("2024-05-31T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 1000,
          interest_rate: 0.12, // 12% APY
          compounding_period: "monthly",
          last_interest_date: thirtyOneDaysAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // 12% / 12 months = 1% per month → $10 on $1000
      expect(result.amount).toBe(10);
      expect(result.periods).toBe(1);
      expect(mockedRepo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 1,
          type: "interest",
          category: "Interest",
          amount: 10,
        })
      );
      expect(mockedRepo.updateLastInterestDate).toHaveBeenCalledWith(1);
    });

    it("calculates compound interest for multiple missed periods", () => {
      // 2 monthly periods elapsed
      const sixtyOneDaysAgo = new Date("2024-05-01T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 1000,
          interest_rate: 0.12, // 12% APY = 1% per month
          compounding_period: "monthly",
          last_interest_date: sixtyOneDaysAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // A = 1000 * (1.01)^2 = 1020.10 → interest = $20.10
      expect(result.amount).toBe(20.1);
      expect(result.periods).toBe(2);
    });

    it("calculates daily compounding correctly", () => {
      // 7 days elapsed with daily compounding
      const sevenDaysAgo = new Date("2024-06-24T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 10000,
          interest_rate: 0.0365, // 3.65% APY ≈ 0.01% per day
          compounding_period: "daily",
          last_interest_date: sevenDaysAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // rate per day = 0.0365 / 365 = 0.0001
      // A = 10000 * (1.0001)^7 ≈ 10007.003
      // interest ≈ $7.00
      expect(result.amount).toBeGreaterThanOrEqual(7);
      expect(result.amount).toBeLessThan(7.01);
      expect(result.periods).toBe(7);
    });

    it("calculates weekly compounding correctly", () => {
      // 21 days = 3 weekly periods
      const twentyOneDaysAgo = new Date("2024-06-10T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 520,
          interest_rate: 0.052, // 5.2% APY
          compounding_period: "weekly",
          last_interest_date: twentyOneDaysAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // rate per week = 0.052 / 52 = 0.001
      // A = 520 * (1.001)^3 ≈ 521.56
      expect(result.amount).toBeGreaterThan(1.5);
      expect(result.amount).toBeLessThan(1.6);
      expect(result.periods).toBe(3);
    });

    it("calculates quarterly compounding correctly", () => {
      // 182 days ≈ 2 quarterly periods
      const halfYearAgo = new Date("2024-01-01T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 1000,
          interest_rate: 0.08, // 8% APY
          compounding_period: "quarterly",
          last_interest_date: halfYearAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // rate per quarter = 0.08 / 4 = 0.02
      // A = 1000 * (1.02)^2 = 1040.40 → interest = $40.40
      expect(result.amount).toBe(40.4);
      expect(result.periods).toBe(2);
    });

    it("calculates annual compounding correctly", () => {
      // 400 days ≈ 1 annual period
      const overOneYearAgo = new Date("2023-05-28T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 1000,
          interest_rate: 0.05, // 5% APY
          compounding_period: "annually",
          last_interest_date: overOneYearAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // 1 annual period: 1000 * 1.05 = 1050 → $50
      expect(result.amount).toBe(50);
      expect(result.periods).toBe(1);
    });

    it("returns negligible when interest < $0.01", () => {
      // Very small balance, very low rate
      const thirtyOneDaysAgo = new Date("2024-05-31T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 0.01,
          interest_rate: 0.001, // 0.1% APY
          compounding_period: "monthly",
          last_interest_date: thirtyOneDaysAgo,
        })
      );

      const result = calculateInterest(1);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/negligible/i);
    });

    it("rounds interest to 2 decimal places", () => {
      // Set up a scenario that produces fractional cents
      const thirtyOneDaysAgo = new Date("2024-05-31T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 333.33,
          interest_rate: 0.07, // 7% APY
          compounding_period: "monthly",
          last_interest_date: thirtyOneDaysAgo,
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      // Verify amount has at most 2 decimal places
      const decimalPart = result.amount!.toString().split(".")[1] || "";
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    });

    it("uses created_at when last_interest_date is null", () => {
      // Account created 60+ days ago, never had interest
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 1000,
          interest_rate: 0.12,
          compounding_period: "monthly",
          last_interest_date: null,
          created_at: "2024-05-01T00:00:00Z", // ~61 days before July 1
        })
      );
      mockedRepo.createTransaction.mockReturnValue({} as ReturnType<typeof repository.createTransaction>);

      const result = calculateInterest(1);

      expect(result.success).toBe(true);
      expect(result.periods).toBe(2); // 2 monthly periods since creation
    });

    it("handles zero interest rate", () => {
      const thirtyOneDaysAgo = new Date("2024-05-31T00:00:00Z").toISOString();
      mockedRepo.getAccount.mockReturnValue(
        makeAccount({
          balance: 1000,
          interest_rate: 0,
          compounding_period: "monthly",
          last_interest_date: thirtyOneDaysAgo,
        })
      );

      const result = calculateInterest(1);

      // 0% interest = no interest to pay, negligible
      expect(result.success).toBe(false);
      expect(mockedRepo.createTransaction).not.toHaveBeenCalled();
    });
  });
});

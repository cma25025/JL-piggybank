/**
 * Validation Service Tests (TDD)
 *
 * Tests all input validation rules — the security perimeter of the app.
 * Every rule must have both a passing and failing test.
 */

import {
  validateAccountName,
  validateInterestRate,
  validateTransactionAmount,
  validateCategory,
  validateCompoundingPeriod,
} from "../validation";

describe("Validation", () => {
  describe("validateAccountName", () => {
    it("returns error for empty string", () => {
      expect(validateAccountName("")).not.toBeNull();
    });

    it("returns error for whitespace-only string", () => {
      expect(validateAccountName("   ")).not.toBeNull();
    });

    it("returns error for name exceeding 50 characters", () => {
      const longName = "a".repeat(51);
      expect(validateAccountName(longName)).toMatch(/50 characters/);
    });

    it("returns null for valid name", () => {
      expect(validateAccountName("Charlie")).toBeNull();
    });

    it("returns null for name at exactly 50 characters", () => {
      const exactName = "a".repeat(50);
      expect(validateAccountName(exactName)).toBeNull();
    });

    it("returns null for name with spaces", () => {
      expect(validateAccountName("Charlie Brown")).toBeNull();
    });
  });

  describe("validateInterestRate", () => {
    it("returns error for negative rate", () => {
      expect(validateInterestRate(-0.01)).not.toBeNull();
    });

    it("returns error for rate above 1 (100%)", () => {
      expect(validateInterestRate(1.01)).not.toBeNull();
    });

    it("returns error for NaN", () => {
      expect(validateInterestRate(NaN)).not.toBeNull();
    });

    it("returns null for 0%", () => {
      expect(validateInterestRate(0)).toBeNull();
    });

    it("returns null for 100% (rate = 1)", () => {
      expect(validateInterestRate(1)).toBeNull();
    });

    it("returns null for typical rate (5%)", () => {
      expect(validateInterestRate(0.05)).toBeNull();
    });
  });

  describe("validateTransactionAmount", () => {
    it("returns error for zero", () => {
      expect(validateTransactionAmount(0)).not.toBeNull();
    });

    it("returns error for negative", () => {
      expect(validateTransactionAmount(-5)).not.toBeNull();
    });

    it("returns error for NaN", () => {
      expect(validateTransactionAmount(NaN)).not.toBeNull();
    });

    it("returns error for amount exceeding $999,999.99", () => {
      expect(validateTransactionAmount(1000000)).toMatch(/999,999\.99/);
    });

    it("returns null for $0.01 (minimum valid amount)", () => {
      expect(validateTransactionAmount(0.01)).toBeNull();
    });

    it("returns null for $999,999.99 (maximum valid amount)", () => {
      expect(validateTransactionAmount(999999.99)).toBeNull();
    });

    it("returns null for typical amount", () => {
      expect(validateTransactionAmount(25.5)).toBeNull();
    });
  });

  describe("validateCategory", () => {
    it("returns null for valid deposit category 'Allowance'", () => {
      expect(validateCategory("deposit", "Allowance")).toBeNull();
    });

    it("returns null for valid deposit category 'Tooth Fairy'", () => {
      expect(validateCategory("deposit", "Tooth Fairy")).toBeNull();
    });

    it("returns null for valid deposit category 'Gift'", () => {
      expect(validateCategory("deposit", "Gift")).toBeNull();
    });

    it("returns null for valid deposit category 'Chore'", () => {
      expect(validateCategory("deposit", "Chore")).toBeNull();
    });

    it("returns null for valid deposit category 'Other'", () => {
      expect(validateCategory("deposit", "Other")).toBeNull();
    });

    it("returns error for invalid deposit category", () => {
      expect(validateCategory("deposit", "Toy")).not.toBeNull();
    });

    it("returns null for valid withdrawal category 'Toy'", () => {
      expect(validateCategory("withdrawal", "Toy")).toBeNull();
    });

    it("returns null for valid withdrawal category 'Candy'", () => {
      expect(validateCategory("withdrawal", "Candy")).toBeNull();
    });

    it("returns null for valid withdrawal category 'Savings Goal'", () => {
      expect(validateCategory("withdrawal", "Savings Goal")).toBeNull();
    });

    it("returns error for invalid withdrawal category", () => {
      expect(validateCategory("withdrawal", "Allowance")).not.toBeNull();
    });

    it("returns null for valid interest category 'Interest'", () => {
      expect(validateCategory("interest", "Interest")).toBeNull();
    });

    it("returns error for invalid interest category", () => {
      expect(validateCategory("interest", "Gift")).not.toBeNull();
    });
  });

  describe("validateCompoundingPeriod", () => {
    it("returns true for 'daily'", () => {
      expect(validateCompoundingPeriod("daily")).toBe(true);
    });

    it("returns true for 'weekly'", () => {
      expect(validateCompoundingPeriod("weekly")).toBe(true);
    });

    it("returns true for 'monthly'", () => {
      expect(validateCompoundingPeriod("monthly")).toBe(true);
    });

    it("returns true for 'quarterly'", () => {
      expect(validateCompoundingPeriod("quarterly")).toBe(true);
    });

    it("returns true for 'annually'", () => {
      expect(validateCompoundingPeriod("annually")).toBe(true);
    });

    it("returns false for invalid period", () => {
      expect(validateCompoundingPeriod("biweekly")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(validateCompoundingPeriod("")).toBe(false);
    });
  });
});

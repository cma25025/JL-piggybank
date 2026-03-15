import {
  DEPOSIT_CATEGORIES,
  WITHDRAWAL_CATEGORIES,
  INTEREST_CATEGORIES,
} from "../lib/constants";
import type { TransactionType, CompoundingPeriod } from "../lib/types";

export function validateAccountName(name: string): string | null {
  if (!name || name.trim() === "") return "Account name is required";
  if (name.length > 50) return "Account name must not exceed 50 characters";
  return null;
}

export function validateInterestRate(rate: number): string | null {
  if (isNaN(rate)) return "Interest rate must be a valid number";
  if (rate < 0 || rate > 1)
    return "Interest rate must be between 0 and 1 (0% to 100%)";
  return null;
}

export function validateTransactionAmount(amount: number): string | null {
  if (isNaN(amount)) return "Amount must be a valid number";
  if (amount <= 0) return "Amount must be greater than $0.00";
  if (amount > 999999.99) return "Amount must not exceed $999,999.99";
  return null;
}

export function validateCategory(
  type: TransactionType,
  category: string
): string | null {
  const validCategories =
    type === "deposit"
      ? DEPOSIT_CATEGORIES
      : type === "withdrawal"
        ? WITHDRAWAL_CATEGORIES
        : INTEREST_CATEGORIES;

  if (!(validCategories as readonly string[]).includes(category)) {
    return `Invalid category for ${type}`;
  }
  return null;
}

export function validateCompoundingPeriod(
  period: string
): period is CompoundingPeriod {
  return ["daily", "weekly", "monthly", "quarterly", "annually"].includes(
    period
  );
}

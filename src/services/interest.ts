import { getAccount, createTransaction, updateLastInterestDate } from "../db/repository";
import { PERIODS_PER_YEAR } from "../lib/constants";
import type { Account } from "../lib/types";

export interface InterestResult {
  success: boolean;
  message: string;
  amount?: number;
  periods?: number;
}

/**
 * Calculate and apply compound interest for an account.
 *
 * Formula: A = P(1 + r/n)^n
 * Where:
 *   P = principal (current balance)
 *   r = annual interest rate (e.g., 0.05 for 5%)
 *   n = number of compounding periods elapsed
 *   r/n_year = rate per compounding period
 */
export function calculateInterest(accountId: number): InterestResult {
  const account = getAccount(accountId);
  if (!account) return { success: false, message: "Account not found" };
  if (account.balance <= 0)
    return { success: false, message: "No balance for interest" };

  const lastDate = account.last_interest_date || account.created_at;
  const { periodsElapsed, daysUntilNext } = getPeriodsElapsed(
    lastDate,
    account.compounding_period
  );

  if (periodsElapsed === 0) {
    return {
      success: false,
      message: `Not due yet. Next payment in ${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"}.`,
    };
  }

  const periodsPerYear = PERIODS_PER_YEAR[account.compounding_period];
  const ratePerPeriod = account.interest_rate / periodsPerYear;
  const finalAmount =
    account.balance * Math.pow(1 + ratePerPeriod, periodsElapsed);
  const interestEarned = finalAmount - account.balance;

  if (interestEarned < 0.01) {
    return { success: false, message: "Interest negligible (< $0.01)" };
  }

  const roundedInterest = Math.round(interestEarned * 100) / 100;

  createTransaction({
    accountId,
    type: "interest",
    category: "Interest",
    amount: roundedInterest,
    note: `Compound interest for ${periodsElapsed} period(s)`,
  });

  updateLastInterestDate(accountId);

  return {
    success: true,
    message: `Added $${roundedInterest.toFixed(2)} interest!`,
    amount: roundedInterest,
    periods: periodsElapsed,
  };
}

function getPeriodsElapsed(
  lastDateStr: string,
  compoundingPeriod: Account["compounding_period"]
): { periodsElapsed: number; daysUntilNext: number } {
  const last = new Date(lastDateStr);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceLast = Math.floor(
    (now.getTime() - last.getTime()) / msPerDay
  );

  const periodsPerYear = PERIODS_PER_YEAR[compoundingPeriod];
  const daysPerPeriod = Math.floor(365 / periodsPerYear);
  const periodsElapsed = Math.floor(daysSinceLast / daysPerPeriod);
  const daysIntoCurrentPeriod = daysSinceLast % daysPerPeriod;
  const daysUntilNext = daysPerPeriod - daysIntoCurrentPeriod;

  return { periodsElapsed, daysUntilNext };
}

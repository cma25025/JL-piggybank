import type { CompoundingPeriod } from "./types";

export const DEPOSIT_CATEGORIES = [
  "Allowance",
  "Tooth Fairy",
  "Gift",
  "Chore",
  "Other",
] as const;

export const WITHDRAWAL_CATEGORIES = [
  "Toy",
  "Candy",
  "Savings Goal",
  "Other",
] as const;

export const INTEREST_CATEGORIES = ["Interest"] as const;

export const COMPOUNDING_PERIODS: CompoundingPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annually",
];

export const PERIODS_PER_YEAR: Record<CompoundingPeriod, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

export const COLORS = {
  indigo: "#4F46E5",
  indigoLight: "#EEF2FF",
  emerald: "#10B981",
  emeraldLight: "#ECFDF5",
  rose: "#F43F5E",
  roseLight: "#FFF1F2",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  white: "#FFFFFF",
};

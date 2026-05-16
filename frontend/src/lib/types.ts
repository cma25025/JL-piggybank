export type CompoundingPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export type TransactionType = 'deposit' | 'withdrawal' | 'interest';

export interface Account {
  id: number;
  name: string;
  balance: number;
  interest_rate: number;
  compounding_period: CompoundingPeriod;
  last_interest_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: number;
  account_id: number;
  type: TransactionType;
  category: string;
  amount: number;
  balance_after: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AccountStatistics {
  current_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_interest_earned: number;
  account_age_days: number;
  next_interest_date: string;
  next_interest_amount: number;
}

export const DEPOSIT_CATEGORIES = ['Allowance', 'Tooth Fairy', 'Gift', 'Chore', 'Other'] as const;
export const WITHDRAWAL_CATEGORIES = ['Toy', 'Candy', 'Savings Goal', 'Other'] as const;
export const INTEREST_CATEGORIES = ['Interest'] as const;

export const COMPOUNDING_PERIODS: CompoundingPeriod[] = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annually'
];

export const PERIODS_PER_YEAR: Record<CompoundingPeriod, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  annually: 1
};

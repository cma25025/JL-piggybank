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

export type TransactionType = "deposit" | "withdrawal" | "interest";
export type CompoundingPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually";

export interface CreateAccountInput {
  name: string;
  interest_rate: number;
  compounding_period: CompoundingPeriod;
  initial_balance?: number;
}

export interface CreateTransactionInput {
  accountId: number;
  type: TransactionType;
  category: string;
  amount: number;
  note?: string;
}

export interface AccountStatistics {
  current_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_interest_earned: number;
  account_age_days: number;
}

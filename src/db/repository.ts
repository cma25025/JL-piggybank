import { getDatabase } from "./schema";
import type {
  Account,
  Transaction,
  CreateAccountInput,
  CreateTransactionInput,
  AccountStatistics,
} from "../lib/types";

// ─── Accounts ────────────────────────────────────────────────

export function getAllAccounts(): Account[] {
  const db = getDatabase();
  return db.getAllSync<Account>(
    "SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY name"
  );
}

export function getAccount(id: number): Account | null {
  const db = getDatabase();
  return db.getFirstSync<Account>(
    "SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL",
    id
  );
}

export function createAccount(input: CreateAccountInput): Account {
  const db = getDatabase();
  const { name, interest_rate, compounding_period, initial_balance = 0 } = input;

  const existing = db.getFirstSync<{ id: number }>(
    "SELECT id FROM accounts WHERE name = ? AND deleted_at IS NULL",
    name
  );
  if (existing) {
    throw new Error("Account name already exists");
  }

  const result = db.runSync(
    `INSERT INTO accounts (name, balance, interest_rate, compounding_period, last_interest_date)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    name,
    initial_balance,
    interest_rate,
    compounding_period
  );

  return db.getFirstSync<Account>(
    "SELECT * FROM accounts WHERE id = ?",
    result.lastInsertRowId
  )!;
}

export function deleteAccount(id: number): void {
  const db = getDatabase();
  db.runSync(
    "UPDATE accounts SET deleted_at = datetime('now') WHERE id = ?",
    id
  );
}

// ─── Transactions ────────────────────────────────────────────

export function getTransactions(accountId: number): Transaction[] {
  const db = getDatabase();
  return db.getAllSync<Transaction>(
    `SELECT * FROM transactions
     WHERE account_id = ? AND deleted_at IS NULL
     ORDER BY transaction_date DESC, id DESC`,
    accountId
  );
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  const db = getDatabase();
  const { accountId, type, category, amount, note } = input;

  const account = db.getFirstSync<Account>(
    "SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL",
    accountId
  );
  if (!account) throw new Error("Account not found");

  let newBalance: number;
  if (type === "deposit" || type === "interest") {
    newBalance = account.balance + amount;
  } else if (type === "withdrawal") {
    if (account.balance < amount) throw new Error("Insufficient funds");
    newBalance = account.balance - amount;
  } else {
    throw new Error("Invalid transaction type");
  }

  const roundedBalance = Math.round(newBalance * 100) / 100;
  const roundedAmount = Math.round(amount * 100) / 100;

  const result = db.runSync(
    `INSERT INTO transactions
     (account_id, type, category, amount, balance_after, note, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    accountId,
    type,
    category,
    roundedAmount,
    roundedBalance,
    note ?? null
  );

  db.runSync(
    "UPDATE accounts SET balance = ?, updated_at = datetime('now') WHERE id = ?",
    roundedBalance,
    accountId
  );

  return db.getFirstSync<Transaction>(
    "SELECT * FROM transactions WHERE id = ?",
    result.lastInsertRowId
  )!;
}

// ─── Interest ────────────────────────────────────────────────

export function updateLastInterestDate(accountId: number): void {
  const db = getDatabase();
  db.runSync(
    "UPDATE accounts SET last_interest_date = datetime('now') WHERE id = ?",
    accountId
  );
}

// ─── Statistics ──────────────────────────────────────────────

export function getAccountStatistics(accountId: number): AccountStatistics | null {
  const db = getDatabase();
  const account = db.getFirstSync<Account>(
    "SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL",
    accountId
  );
  if (!account) return null;

  const deposits = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE account_id = ? AND type = 'deposit' AND deleted_at IS NULL`,
    accountId
  );

  const withdrawals = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE account_id = ? AND type = 'withdrawal' AND deleted_at IS NULL`,
    accountId
  );

  const interest = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE account_id = ? AND type = 'interest' AND deleted_at IS NULL`,
    accountId
  );

  const createdDate = new Date(account.created_at);
  const now = new Date();
  const ageInDays = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    current_balance: account.balance,
    total_deposits: deposits?.total ?? 0,
    total_withdrawals: withdrawals?.total ?? 0,
    total_interest_earned: interest?.total ?? 0,
    account_age_days: ageInDays,
  };
}

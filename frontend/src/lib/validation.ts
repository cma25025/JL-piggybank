import {
  DEPOSIT_CATEGORIES,
  WITHDRAWAL_CATEGORIES,
  INTEREST_CATEGORIES,
  COMPOUNDING_PERIODS,
  type CompoundingPeriod,
  type TransactionType
} from './types';

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const ALL_CATEGORIES = new Set<string>([
  ...DEPOSIT_CATEGORIES,
  ...WITHDRAWAL_CATEGORIES,
  ...INTEREST_CATEGORIES
]);

export interface AccountInput {
  name: string;
  interest_rate?: number;
  compounding_period?: CompoundingPeriod;
  initial_balance?: number;
}

export function validateAccount(body: any): AccountInput {
  const name = body?.name;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Account name is required');
  }
  if (name.length > 50) {
    throw new ValidationError('Account name must not exceed 50 characters');
  }

  let interest_rate: number | undefined;
  if (body.interest_rate !== undefined) {
    const rate = parseFloat(body.interest_rate);
    if (isNaN(rate)) throw new ValidationError('Interest rate must be a valid number');
    if (rate < 0 || rate > 1) {
      throw new ValidationError('Interest rate must be between 0 and 1 (0% to 100%)');
    }
    interest_rate = rate;
  }

  let initial_balance: number | undefined;
  if (body.initial_balance !== undefined) {
    const balance = parseFloat(body.initial_balance);
    if (isNaN(balance)) throw new ValidationError('Initial balance must be a valid number');
    if (balance < 0) {
      throw new ValidationError('Initial balance must be greater than or equal to $0.00');
    }
    initial_balance = balance;
  }

  let compounding_period: CompoundingPeriod | undefined;
  if (body.compounding_period !== undefined) {
    if (!COMPOUNDING_PERIODS.includes(body.compounding_period)) {
      throw new ValidationError(
        'Compounding period must be one of: daily, weekly, monthly, quarterly, annually'
      );
    }
    compounding_period = body.compounding_period;
  }

  return { name: name.trim(), interest_rate, compounding_period, initial_balance };
}

export interface TransactionInput {
  type: TransactionType;
  category: string;
  amount: number;
  note?: string | null;
  transaction_date?: string;
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return !isNaN(new Date(value).getTime());
}

export function validateTransaction(body: any): TransactionInput {
  const { type, category, amount, note, transaction_date } = body ?? {};

  if (!type || typeof type !== 'string') {
    throw new ValidationError('Transaction type is required');
  }
  const validTypes: TransactionType[] = ['deposit', 'withdrawal', 'interest'];
  if (!validTypes.includes(type)) {
    throw new ValidationError('Transaction type must be one of: deposit, withdrawal, interest');
  }

  if (!category || typeof category !== 'string') {
    throw new ValidationError('Transaction category is required');
  }

  const validCategories =
    type === 'deposit'
      ? DEPOSIT_CATEGORIES
      : type === 'withdrawal'
        ? WITHDRAWAL_CATEGORIES
        : INTEREST_CATEGORIES;

  if (!(validCategories as readonly string[]).includes(category)) {
    throw new ValidationError(
      `Invalid category for ${type}. Valid categories: ${validCategories.join(', ')}`
    );
  }

  if (amount === undefined || amount === null) {
    throw new ValidationError('Transaction amount is required');
  }
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum)) throw new ValidationError('Amount must be a valid number');
  if (amountNum <= 0) throw new ValidationError('Amount must be greater than $0.00');
  if (amountNum > 999999.99) throw new ValidationError('Amount must not exceed $999,999.99');

  if (note !== undefined && note !== null) {
    if (typeof note !== 'string') throw new ValidationError('Note must be a string');
    if (note.length > 200) throw new ValidationError('Note must not exceed 200 characters');
  }

  if (transaction_date !== undefined && !isValidDate(transaction_date)) {
    throw new ValidationError('Transaction date must be a valid ISO 8601 date string');
  }

  return {
    type: type as TransactionType,
    category,
    amount: amountNum,
    note: note ?? null,
    transaction_date
  };
}

export interface TransactionUpdateInput {
  amount?: number;
  category?: string;
  note?: string | null;
  transaction_date?: string;
}

export function validateTransactionUpdate(body: any): TransactionUpdateInput {
  const out: TransactionUpdateInput = {};
  const { amount, category, note, transaction_date } = body ?? {};

  if (amount !== undefined) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) throw new ValidationError('Amount must be a valid number');
    if (amountNum <= 0) throw new ValidationError('Amount must be greater than $0.00');
    if (amountNum > 999999.99) throw new ValidationError('Amount must not exceed $999,999.99');
    out.amount = amountNum;
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim() === '') {
      throw new ValidationError('Category must be a non-empty string');
    }
    if (!ALL_CATEGORIES.has(category)) {
      throw new ValidationError('Invalid category. Must be one of the predefined categories.');
    }
    out.category = category;
  }

  if (note !== undefined && note !== null) {
    if (typeof note !== 'string') throw new ValidationError('Note must be a string');
    if (note.length > 200) throw new ValidationError('Note must not exceed 200 characters');
    out.note = note;
  } else if (note === null) {
    out.note = null;
  }

  if (transaction_date !== undefined) {
    if (!isValidDate(transaction_date)) {
      throw new ValidationError('Transaction date must be a valid ISO 8601 date string');
    }
    out.transaction_date = transaction_date;
  }

  return out;
}

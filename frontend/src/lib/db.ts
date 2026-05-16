import { getSupabase } from './supabase';
import { ValidationError } from './validation';
import type {
  Account,
  Transaction,
  AccountStatistics,
  TransactionType,
  CompoundingPeriod
} from './types';
import { PERIODS_PER_YEAR } from './types';

function num(x: any): number {
  return typeof x === 'string' ? parseFloat(x) : Number(x);
}

function normalizeAccount(row: any): Account {
  return {
    ...row,
    balance: num(row.balance),
    interest_rate: num(row.interest_rate)
  };
}

function normalizeTransaction(row: any): Transaction {
  return {
    ...row,
    amount: num(row.amount),
    balance_after: num(row.balance_after)
  };
}

export async function listAccounts(): Promise<Account[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeAccount);
}

export async function getAccount(id: number | string): Promise<Account | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeAccount(data) : null;
}

export interface CreateAccountArgs {
  name: string;
  interest_rate?: number;
  compounding_period?: CompoundingPeriod;
  initial_balance?: number;
}

export async function createAccount(args: CreateAccountArgs): Promise<Account> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('name', args.name)
    .is('deleted_at', null)
    .maybeSingle();
  if (existing) throw new ValidationError('Account name already exists');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name: args.name,
      balance: args.initial_balance ?? 0,
      interest_rate: args.interest_rate ?? 0,
      compounding_period: args.compounding_period ?? 'monthly',
      last_interest_date: new Date().toISOString()
    })
    .select('*')
    .single();
  if (error) throw error;
  return normalizeAccount(data);
}

export interface UpdateAccountArgs {
  name: string;
  interest_rate?: number;
  compounding_period?: CompoundingPeriod;
}

export async function updateAccount(
  id: number | string,
  args: UpdateAccountArgs
): Promise<Account> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('accounts')
    .update({
      name: args.name,
      interest_rate: args.interest_rate,
      compounding_period: args.compounding_period,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();
  if (error) throw error;
  return normalizeAccount(data);
}

export async function softDeleteAccount(id: number | string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function listTransactions(accountId: number | string): Promise<Transaction[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeTransaction);
}

export interface CreateTransactionArgs {
  accountId: number | string;
  type: TransactionType;
  category: string;
  amount: number;
  note?: string | null;
  transaction_date?: string;
}

export async function createTransaction(args: CreateTransactionArgs): Promise<Transaction> {
  const supabase = getSupabase();

  const account = await getAccount(args.accountId);
  if (!account) throw new ValidationError('Account not found', 404);

  let newBalance: number;
  if (args.type === 'deposit' || args.type === 'interest') {
    newBalance = account.balance + args.amount;
  } else if (args.type === 'withdrawal') {
    if (account.balance < args.amount) {
      throw new ValidationError('Insufficient funds');
    }
    newBalance = account.balance - args.amount;
  } else {
    throw new ValidationError('Invalid transaction type');
  }

  const balanceAfter = Number(newBalance.toFixed(2));

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      account_id: args.accountId,
      type: args.type,
      category: args.category,
      amount: args.amount,
      balance_after: balanceAfter,
      note: args.note ?? null,
      transaction_date: args.transaction_date ?? new Date().toISOString()
    })
    .select('*')
    .single();
  if (error) throw error;

  const { error: updateErr } = await supabase
    .from('accounts')
    .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', args.accountId);
  if (updateErr) throw updateErr;

  return normalizeTransaction(data);
}

async function recalculateBalances(accountId: number | string): Promise<number> {
  const supabase = getSupabase();
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;

  let running = 0;
  for (const tx of txs ?? []) {
    const amount = num(tx.amount);
    if (tx.type === 'deposit' || tx.type === 'interest') running += amount;
    else if (tx.type === 'withdrawal') running -= amount;

    const balanceAfter = Number(running.toFixed(2));
    const { error: upErr } = await supabase
      .from('transactions')
      .update({ balance_after: balanceAfter })
      .eq('id', tx.id);
    if (upErr) throw upErr;
  }

  const finalBalance = Number(running.toFixed(2));
  const { error: accErr } = await supabase
    .from('accounts')
    .update({ balance: finalBalance, updated_at: new Date().toISOString() })
    .eq('id', accountId);
  if (accErr) throw accErr;

  return finalBalance;
}

export interface UpdateTransactionArgs {
  amount?: number;
  category?: string;
  note?: string | null;
  transaction_date?: string;
}

export async function updateTransaction(
  transactionId: number | string,
  args: UpdateTransactionArgs
): Promise<Transaction> {
  const supabase = getSupabase();

  const { data: oldTx, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .is('deleted_at', null)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!oldTx) throw new ValidationError('Transaction not found', 404);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.amount !== undefined) update.amount = args.amount;
  if (args.category !== undefined) update.category = args.category;
  if (args.note !== undefined) update.note = args.note;
  if (args.transaction_date !== undefined) update.transaction_date = args.transaction_date;

  const { error: upErr } = await supabase
    .from('transactions')
    .update(update)
    .eq('id', transactionId);
  if (upErr) throw upErr;

  await recalculateBalances(oldTx.account_id);

  const { data: minRow, error: minErr } = await supabase
    .from('transactions')
    .select('balance_after')
    .eq('account_id', oldTx.account_id)
    .is('deleted_at', null)
    .order('balance_after', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (minErr) throw minErr;

  if (minRow && num(minRow.balance_after) < 0) {
    await supabase
      .from('transactions')
      .update({
        amount: oldTx.amount,
        category: oldTx.category,
        note: oldTx.note,
        transaction_date: oldTx.transaction_date
      })
      .eq('id', transactionId);
    await recalculateBalances(oldTx.account_id);
    throw new ValidationError('Transaction edit would create negative balance in history');
  }

  const { data: updated, error: getErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();
  if (getErr) throw getErr;
  return normalizeTransaction(updated);
}

export async function softDeleteTransaction(transactionId: number | string): Promise<void> {
  const supabase = getSupabase();
  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('account_id')
    .eq('id', transactionId)
    .is('deleted_at', null)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!tx) throw new ValidationError('Transaction not found', 404);

  const { error: delErr } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', transactionId);
  if (delErr) throw delErr;

  await recalculateBalances(tx.account_id);
}

export async function getAccountStatistics(
  id: number | string
): Promise<AccountStatistics | null> {
  const supabase = getSupabase();
  const account = await getAccount(id);
  if (!account) return null;

  const sumByType = async (type: TransactionType) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('account_id', id)
      .eq('type', type)
      .is('deleted_at', null);
    if (error) throw error;
    return (data ?? []).reduce((total, row) => total + num(row.amount), 0);
  };

  const [totalDeposits, totalWithdrawals, totalInterest] = await Promise.all([
    sumByType('deposit'),
    sumByType('withdrawal'),
    sumByType('interest')
  ]);

  const createdDate = new Date(account.created_at);
  const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  const lastInterestDate = new Date(account.last_interest_date ?? account.created_at);
  const daysPerPeriod = 365 / PERIODS_PER_YEAR[account.compounding_period];
  const nextInterestDate = new Date(lastInterestDate);
  nextInterestDate.setDate(nextInterestDate.getDate() + daysPerPeriod);

  let nextInterestAmount = 0;
  if (account.balance > 0 && account.interest_rate > 0) {
    nextInterestAmount = account.balance * account.interest_rate;
  }

  return {
    current_balance: account.balance,
    total_deposits: totalDeposits,
    total_withdrawals: totalWithdrawals,
    total_interest_earned: totalInterest,
    account_age_days: ageInDays,
    next_interest_date: nextInterestDate.toISOString(),
    next_interest_amount: Number(nextInterestAmount.toFixed(2))
  };
}

export async function calculateInterest(accountId: number | string): Promise<number | null> {
  const supabase = getSupabase();
  const account = await getAccount(accountId);
  if (!account || account.balance <= 0) return null;

  const lastDate = new Date(account.last_interest_date ?? account.created_at);
  const periodsPerYear = PERIODS_PER_YEAR[account.compounding_period];
  const daysPerPeriod = 365 / periodsPerYear;
  const daysSinceLast = Math.floor(
    (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const periods = Math.floor(daysSinceLast / daysPerPeriod);
  if (periods === 0) return null;

  const ratePerPeriod = account.interest_rate / periodsPerYear;
  const finalAmount = account.balance * Math.pow(1 + ratePerPeriod, periods);
  const interestEarned = finalAmount - account.balance;
  if (interestEarned <= 0.005) return null;

  await createTransaction({
    accountId,
    type: 'interest',
    category: 'Interest',
    amount: Number(interestEarned.toFixed(2)),
    note: `Interest for ${periods} ${account.compounding_period} period(s)`
  });

  const { error } = await supabase
    .from('accounts')
    .update({ last_interest_date: new Date().toISOString() })
    .eq('id', accountId);
  if (error) throw error;

  return interestEarned;
}

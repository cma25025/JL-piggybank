-- Piggybank initial schema for Supabase / Postgres.
-- Run this in the Supabase SQL editor (Project > SQL > New query) once after
-- creating the project. Idempotent: safe to re-run.

create table if not exists accounts (
  id bigserial primary key,
  name text not null,
  balance numeric(10, 2) not null default 0.00,
  interest_rate numeric(5, 4) not null default 0.0000,
  compounding_period text not null default 'monthly',
  last_interest_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists accounts_name_unique_active
  on accounts (name)
  where deleted_at is null;

create table if not exists transactions (
  id bigserial primary key,
  account_id bigint not null references accounts(id),
  type text not null check (type in ('deposit', 'withdrawal', 'interest')),
  category text not null,
  amount numeric(10, 2) not null,
  balance_after numeric(10, 2) not null,
  note text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_transactions_account_id on transactions(account_id);
create index if not exists idx_transactions_date on transactions(transaction_date);

-- Enable Row Level Security. We deliberately add no policies: only the
-- service role key (used from server-side Astro API routes on Vercel) bypasses
-- RLS, so the anon key cannot read or write directly. When the Expo client
-- is ready to talk to Supabase, add policies before exposing the anon key.
alter table accounts enable row level security;
alter table transactions enable row level security;

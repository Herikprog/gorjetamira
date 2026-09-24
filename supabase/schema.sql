-- ============================================================
-- Gorjeta Mira — Schema SQL para Supabase PostgreSQL
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensão para UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- Tabela: employees
-- ============================================================
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger employees_updated_at
  before update on employees
  for each row execute function update_updated_at_column();

-- ============================================================
-- Tabela: settlements (Fechamentos / Zerar Gorjetas)
-- ============================================================
create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  payment_date date not null,
  period_start date not null,
  period_end date not null,
  total_days integer not null check (total_days >= 0),
  total_tips_cents integer not null check (total_tips_cents >= 0),
  total_vales_cents integer not null check (total_vales_cents >= 0),
  total_paid_cents integer not null check (total_paid_cents >= 0),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tabela: settlement_employees (Detalhamento por funcionário)
-- ============================================================
create table if not exists settlement_employees (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references settlements(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete restrict,
  gross_tips_cents integer not null check (gross_tips_cents >= 0),
  vales_cents integer not null check (vales_cents >= 0),
  net_paid_cents integer not null check (net_paid_cents >= 0),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tabela: tips
-- ============================================================
create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  amount numeric(10, 2) not null check (amount >= 0),
  settlement_id uuid references settlements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tips_updated_at
  before update on tips
  for each row execute function update_updated_at_column();

-- ============================================================
-- Tabela: absences
-- ============================================================
do $$ begin
  create type absence_period as enum ('MORNING', 'NIGHT', 'FULL_DAY');
exception
  when duplicate_object then null;
end $$;

create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  employee_id uuid not null references employees(id) on delete restrict,
  period absence_period not null,
  created_at timestamptz not null default now(),
  unique(date, employee_id)
);

-- ============================================================
-- Tabela: vales (Vales de Gorjeta)
-- ============================================================
create table if not exists vales (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  date date not null,
  notes text,
  settlement_id uuid references settlements(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Índices
-- ============================================================
create index if not exists absences_date_idx on absences(date);
create index if not exists absences_employee_id_idx on absences(employee_id);
create index if not exists tips_date_idx on tips(date);
create index if not exists tips_settlement_id_idx on tips(settlement_id);
create index if not exists employees_active_idx on employees(active);
create index if not exists vales_employee_id_idx on vales(employee_id);
create index if not exists vales_settlement_id_idx on vales(settlement_id);
create index if not exists settlement_employees_settlement_id_idx on settlement_employees(settlement_id);

-- ============================================================
-- Desativar RLS (Row Level Security) para MVP sem autenticação
-- ============================================================
alter table employees disable row level security;
alter table tips disable row level security;
alter table absences disable row level security;
alter table settlements disable row level security;
alter table settlement_employees disable row level security;
alter table vales disable row level security;

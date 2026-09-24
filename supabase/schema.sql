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
-- Tabela: tips
-- ============================================================
create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  amount numeric(10, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tips_updated_at
  before update on tips
  for each row execute function update_updated_at_column();

-- ============================================================
-- Tabela: absences
-- ============================================================
create type absence_period as enum ('MORNING', 'NIGHT', 'FULL_DAY');

create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  employee_id uuid not null references employees(id) on delete restrict,
  period absence_period not null,
  created_at timestamptz not null default now(),
  -- Um funcionário só pode ter uma ausência por dia
  unique(date, employee_id)
);

-- ============================================================
-- Índices
-- ============================================================
create index if not exists absences_date_idx on absences(date);
create index if not exists absences_employee_id_idx on absences(employee_id);
create index if not exists tips_date_idx on tips(date);
create index if not exists employees_active_idx on employees(active);

-- ============================================================
-- Row Level Security (RLS) — Desativado para MVP
-- Ativar e configurar conforme necessário para produção
-- ============================================================
-- alter table employees enable row level security;
-- alter table tips enable row level security;
-- alter table absences enable row level security;

-- ──────────────────────────────────────────────────────────────
-- Payments App — esquema de base de datos (Supabase / PostgreSQL)
-- Correr en: Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────

create table if not exists orders (
  order_id                   uuid primary key,
  buyer_id                   text          not null,
  store_id                   uuid          not null,
  status                     text          not null
                               check (status in
                                 ('payment_pending','paid','failed','cancelled','closed')),
  total_amount               numeric(10,2) not null,
  delivery_cost              numeric(10,2) not null,
  mp_preference_id           text,
  mp_payment_id              bigint,
  items_snapshot             jsonb         not null,
  delivery_address_snapshot  jsonb         not null,
  delivery_quote_snapshot    jsonb         not null,
  created_at                 timestamptz   not null default now(),
  updated_at                 timestamptz   not null default now()
);

create index if not exists orders_buyer_id_idx on orders (buyer_id);
create index if not exists orders_status_idx   on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);

-- Si la tabla ya existía con un check constraint viejo (sin 'closed'),
-- `create table if not exists` no lo actualiza. Forzar el constraint correcto:
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('payment_pending','paid','failed','cancelled','closed'));

-- Trigger: mantener updated_at en cada UPDATE
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

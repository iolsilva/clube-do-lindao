create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  min_points numeric(12, 2) not null default 0 check (min_points >= 0),
  benefit_description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document_type text not null default 'cpf' check (document_type in ('cpf', 'cnpj')),
  document text not null unique,
  phone text,
  email text,
  level_id uuid references public.levels(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  points numeric(12, 2) generated always as ((amount_cents::numeric / 1000)) stored,
  purchased_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_required numeric(12, 2) not null check (points_required >= 0),
  image_url text,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  points_spent numeric(12, 2) not null check (points_spent >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'delivered', 'cancelled')
  ),
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_level_id_idx on public.customers(level_id);
create index if not exists purchases_customer_id_idx on public.purchases(customer_id);
create index if not exists purchases_purchased_at_idx on public.purchases(purchased_at);
create index if not exists rewards_active_idx on public.rewards(active);
create index if not exists reward_redemptions_customer_id_idx
  on public.reward_redemptions(customer_id);
create index if not exists reward_redemptions_reward_id_idx
  on public.reward_redemptions(reward_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_levels_updated_at on public.levels;
create trigger set_levels_updated_at
before update on public.levels
for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_purchases_updated_at on public.purchases;
create trigger set_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

drop trigger if exists set_rewards_updated_at on public.rewards;
create trigger set_rewards_updated_at
before update on public.rewards
for each row execute function public.set_updated_at();

drop trigger if exists set_reward_redemptions_updated_at on public.reward_redemptions;
create trigger set_reward_redemptions_updated_at
before update on public.reward_redemptions
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace view public.customer_points_view
with (security_invoker = true) as
with purchase_totals as (
  select
    customer_id,
    coalesce(sum(amount_cents), 0)::integer as total_purchase_amount_cents,
    coalesce(sum(points), 0)::numeric(12, 2) as total_points
  from public.purchases
  group by customer_id
),
redemption_totals as (
  select
    customer_id,
    coalesce(sum(points_spent), 0)::numeric(12, 2) as redeemed_points
  from public.reward_redemptions
  where status <> 'cancelled'
  group by customer_id
)
select
  customers.id as customer_id,
  customers.name as customer_name,
  customers.document_type,
  customers.document,
  customers.phone,
  customers.email,
  customers.active,
  levels.id as level_id,
  levels.name as level_name,
  coalesce(purchase_totals.total_purchase_amount_cents, 0) as total_purchase_amount_cents,
  coalesce(purchase_totals.total_points, 0)::numeric(12, 2) as total_points,
  coalesce(redemption_totals.redeemed_points, 0)::numeric(12, 2) as redeemed_points,
  greatest(
    coalesce(purchase_totals.total_points, 0) - coalesce(redemption_totals.redeemed_points, 0),
    0
  )::numeric(12, 2) as available_points
from public.customers
left join public.levels on levels.id = customers.level_id
left join purchase_totals on purchase_totals.customer_id = customers.id
left join redemption_totals on redemption_totals.customer_id = customers.id;

create or replace view public.public_ranking_view
with (security_barrier = true) as
with purchase_totals as (
  select
    customer_id,
    coalesce(sum(points), 0)::numeric(12, 2) as total_points
  from public.purchases
  group by customer_id
),
ranking_source as (
  select
    customers.id as customer_id,
    customers.name as customer_name,
    levels.name as level_name,
    coalesce(purchase_totals.total_points, 0)::numeric(12, 2) as total_points
  from public.customers
  left join public.levels on levels.id = customers.level_id
  left join purchase_totals on purchase_totals.customer_id = customers.id
  where customers.active = true
)
select
  dense_rank() over (order by total_points desc) as position,
  customer_id,
  customer_name,
  level_name,
  total_points
from ranking_source
order by position, customer_name;

alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.customers enable row level security;
alter table public.purchases enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage levels" on public.levels;
create policy "Admins can manage levels"
on public.levels
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage customers" on public.customers;
create policy "Admins can manage customers"
on public.customers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage purchases" on public.purchases;
create policy "Admins can manage purchases"
on public.purchases
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active rewards" on public.rewards;
create policy "Public can read active rewards"
on public.rewards
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage rewards" on public.rewards;
create policy "Admins can manage rewards"
on public.rewards
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage reward redemptions" on public.reward_redemptions;
create policy "Admins can manage reward redemptions"
on public.reward_redemptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.levels from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.purchases from anon, authenticated;
revoke all on table public.rewards from anon, authenticated;
revoke all on table public.reward_redemptions from anon, authenticated;
revoke all on table public.customer_points_view from anon, authenticated;
revoke all on table public.public_ranking_view from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant all on table public.profiles to authenticated;
grant all on table public.levels to authenticated;
grant all on table public.customers to authenticated;
grant all on table public.purchases to authenticated;
grant all on table public.rewards to authenticated;
grant all on table public.reward_redemptions to authenticated;
grant select on table public.customer_points_view to authenticated;

grant select on table public.rewards to anon;
grant select on table public.public_ranking_view to anon, authenticated;

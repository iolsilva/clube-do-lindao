begin;

alter table public.reward_redemptions
  alter column reward_id drop not null;

alter table public.reward_redemptions
  add column if not exists points_used numeric(12, 2);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reward_redemptions'
      and column_name = 'points_spent'
  ) then
    execute 'update public.reward_redemptions set points_used = points_spent where points_used is null';
  end if;
end;
$$;

update public.reward_redemptions
set points_used = 0
where points_used is null;

alter table public.reward_redemptions
  alter column points_used set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reward_redemptions_points_used_check'
      and conrelid = 'public.reward_redemptions'::regclass
  ) then
    alter table public.reward_redemptions
      add constraint reward_redemptions_points_used_check
      check (points_used >= 0);
  end if;
end;
$$;

alter table public.reward_redemptions
  add column if not exists redemption_date timestamptz default now(),
  add column if not exists notes text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reward_redemptions'
      and column_name = 'redeemed_at'
  ) then
    execute 'update public.reward_redemptions set redemption_date = coalesce(redemption_date, redeemed_at, created_at, now()) where redemption_date is null';
  else
    update public.reward_redemptions
    set redemption_date = coalesce(redemption_date, created_at, now())
    where redemption_date is null;
  end if;
end;
$$;

alter table public.reward_redemptions
  alter column redemption_date set default now(),
  alter column redemption_date set not null,
  alter column status set default 'completed';

drop view if exists public.customer_points_view;

create view public.customer_points_view
with (security_invoker = true) as
with purchase_totals as (
  select
    customer_id,
    count(id)::integer as total_purchases,
    coalesce(sum(amount_cents), 0)::integer as total_purchase_amount_cents,
    (coalesce(sum(amount_cents), 0)::numeric / 100)::numeric(12, 2) as total_spent,
    coalesce(sum(points), 0)::numeric(12, 2) as earned_points
  from public.purchases
  group by customer_id
),
redemption_totals as (
  select
    customer_id,
    coalesce(sum(points_used), 0)::numeric(12, 2) as total_redeemed
  from public.reward_redemptions
  where status <> 'cancelled'
  group by customer_id
),
ranking_source as (
  select
    customers.id as customer_id,
    customers.name as full_name,
    customers.name as customer_name,
    customers.code as customer_code,
    customers.document_type,
    customers.document,
    customers.phone,
    customers.email,
    customers.active as is_active,
    customers.active,
    levels.id as level_id,
    levels.name as level_name,
    coalesce(purchase_totals.total_purchases, 0) as total_purchases,
    coalesce(purchase_totals.total_purchase_amount_cents, 0) as total_purchase_amount_cents,
    coalesce(purchase_totals.total_spent, 0)::numeric(12, 2) as total_spent,
    coalesce(purchase_totals.earned_points, 0)::numeric(12, 2) as earned_points,
    coalesce(redemption_totals.total_redeemed, 0)::numeric(12, 2) as total_redeemed,
    greatest(
      coalesce(purchase_totals.earned_points, 0) - coalesce(redemption_totals.total_redeemed, 0),
      0
    )::numeric(12, 2) as available_points
  from public.customers
  left join public.levels on levels.id = customers.level_id
  left join purchase_totals on purchase_totals.customer_id = customers.id
  left join redemption_totals on redemption_totals.customer_id = customers.id
)
select
  dense_rank() over (order by available_points desc) as ranking_position,
  customer_id,
  full_name,
  customer_name,
  customer_code,
  document_type,
  document,
  phone,
  email,
  is_active,
  active,
  level_id,
  level_name,
  available_points as total_points,
  earned_points,
  earned_points as accumulated_points,
  total_spent,
  total_purchase_amount_cents,
  total_purchases,
  total_redeemed,
  total_redeemed as redeemed_points,
  available_points
from ranking_source;

drop view if exists public.public_ranking_view;

create view public.public_ranking_view
with (security_barrier = true) as
with purchase_totals as (
  select
    customer_id,
    coalesce(sum(points), 0)::numeric(12, 2) as earned_points
  from public.purchases
  group by customer_id
),
redemption_totals as (
  select
    customer_id,
    coalesce(sum(points_used), 0)::numeric(12, 2) as total_redeemed
  from public.reward_redemptions
  where status <> 'cancelled'
  group by customer_id
),
ranking_source as (
  select
    customers.id as customer_id,
    customers.code as customer_code,
    customers.name as customer_name,
    levels.name as level_name,
    greatest(
      coalesce(purchase_totals.earned_points, 0) - coalesce(redemption_totals.total_redeemed, 0),
      0
    )::numeric(12, 2) as total_points
  from public.customers
  left join public.levels on levels.id = customers.level_id
  left join purchase_totals on purchase_totals.customer_id = customers.id
  left join redemption_totals on redemption_totals.customer_id = customers.id
  where customers.active = true
)
select
  dense_rank() over (order by total_points desc) as position,
  customer_id,
  customer_code,
  customer_name,
  level_name,
  total_points
from ranking_source
order by position, customer_name;

drop function if exists public.search_public_ranking(text);

create function public.search_public_ranking(search_text text default null)
returns table (
  rank_position integer,
  full_name text,
  customer_code text,
  level_name text,
  total_points numeric(12, 2)
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select
      nullif(trim(coalesce(search_text, '')), '') as raw_term,
      regexp_replace(coalesce(search_text, ''), '\D', '', 'g') as digit_term
  ),
  purchase_totals as (
    select
      customer_id,
      coalesce(sum(points), 0)::numeric(12, 2) as earned_points
    from public.purchases
    group by customer_id
  ),
  redemption_totals as (
    select
      customer_id,
      coalesce(sum(points_used), 0)::numeric(12, 2) as total_redeemed
    from public.reward_redemptions
    where status <> 'cancelled'
    group by customer_id
  ),
  ranking_source as (
    select
      customers.code as customer_code,
      customers.name as full_name,
      customers.phone,
      levels.name as level_name,
      greatest(
        coalesce(purchase_totals.earned_points, 0) - coalesce(redemption_totals.total_redeemed, 0),
        0
      )::numeric(12, 2) as total_points
    from public.customers
    left join public.levels on levels.id = customers.level_id
    left join purchase_totals on purchase_totals.customer_id = customers.id
    left join redemption_totals on redemption_totals.customer_id = customers.id
    where customers.active = true
  ),
  ranked as (
    select
      dense_rank() over (order by ranking_source.total_points desc) as rank_position,
      ranking_source.customer_code,
      ranking_source.full_name,
      ranking_source.phone,
      ranking_source.level_name,
      ranking_source.total_points
    from ranking_source
  )
  select
    ranked.rank_position::integer,
    ranked.full_name,
    ranked.customer_code,
    ranked.level_name,
    ranked.total_points
  from ranked
  cross join normalized
  where normalized.raw_term is null
    or ranked.full_name ilike '%' || normalized.raw_term || '%'
    or coalesce(ranked.customer_code, '') ilike '%' || normalized.raw_term || '%'
    or (
      normalized.digit_term <> ''
      and (
        regexp_replace(coalesce(ranked.phone, ''), '\D', '', 'g') like '%' || normalized.digit_term || '%'
        or regexp_replace(coalesce(ranked.customer_code, ''), '\D', '', 'g') like '%' || normalized.digit_term || '%'
      )
    )
  order by ranked.rank_position, ranked.full_name;
$$;

alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.customers enable row level security;
alter table public.purchases enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'levels',
        'customers',
        'purchases',
        'rewards',
        'reward_redemptions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy "Authenticated can select profiles"
on public.profiles for select to authenticated
using (auth.uid() is not null);

create policy "Authenticated can insert profiles"
on public.profiles for insert to authenticated
with check (auth.uid() is not null);

create policy "Authenticated can update profiles"
on public.profiles for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated can delete profiles"
on public.profiles for delete to authenticated
using (auth.uid() is not null);

create policy "Authenticated can select levels"
on public.levels for select to authenticated
using (auth.uid() is not null);

create policy "Authenticated can insert levels"
on public.levels for insert to authenticated
with check (auth.uid() is not null);

create policy "Authenticated can update levels"
on public.levels for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated can delete levels"
on public.levels for delete to authenticated
using (auth.uid() is not null);

create policy "Authenticated can select customers"
on public.customers for select to authenticated
using (auth.uid() is not null);

create policy "Authenticated can insert customers"
on public.customers for insert to authenticated
with check (auth.uid() is not null);

create policy "Authenticated can update customers"
on public.customers for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated can delete customers"
on public.customers for delete to authenticated
using (auth.uid() is not null);

create policy "Authenticated can select purchases"
on public.purchases for select to authenticated
using (auth.uid() is not null);

create policy "Authenticated can insert purchases"
on public.purchases for insert to authenticated
with check (auth.uid() is not null);

create policy "Authenticated can update purchases"
on public.purchases for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated can delete purchases"
on public.purchases for delete to authenticated
using (auth.uid() is not null);

create policy "Authenticated can select rewards"
on public.rewards for select to authenticated
using (auth.uid() is not null);

create policy "Authenticated can insert rewards"
on public.rewards for insert to authenticated
with check (auth.uid() is not null);

create policy "Authenticated can update rewards"
on public.rewards for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated can delete rewards"
on public.rewards for delete to authenticated
using (auth.uid() is not null);

create policy "Public can read active rewards"
on public.rewards for select to anon
using (active = true);

create policy "Authenticated can select reward redemptions"
on public.reward_redemptions for select to authenticated
using (auth.uid() is not null);

create policy "Authenticated can insert reward redemptions"
on public.reward_redemptions for insert to authenticated
with check (auth.uid() is not null);

create policy "Authenticated can update reward redemptions"
on public.reward_redemptions for update to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated can delete reward redemptions"
on public.reward_redemptions for delete to authenticated
using (auth.uid() is not null);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.levels from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.purchases from anon, authenticated;
revoke all on table public.rewards from anon, authenticated;
revoke all on table public.reward_redemptions from anon, authenticated;
revoke all on table public.customer_points_view from anon, authenticated;
revoke all on table public.public_ranking_view from anon, authenticated;
revoke all on function public.search_public_ranking(text) from public;

grant usage on schema public to anon, authenticated;
grant all on table public.profiles to authenticated;
grant all on table public.levels to authenticated;
grant all on table public.customers to authenticated;
grant all on table public.purchases to authenticated;
grant all on table public.rewards to authenticated;
grant all on table public.reward_redemptions to authenticated;
grant select on table public.customer_points_view to authenticated;
grant usage, select, update on sequence public.customer_code_number_seq to authenticated;
grant select on table public.rewards to anon;
grant select on table public.public_ranking_view to anon, authenticated;
grant execute on function public.search_public_ranking(text) to anon, authenticated;

commit;

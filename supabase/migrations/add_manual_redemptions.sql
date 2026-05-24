begin;

alter table public.reward_redemptions
  alter column reward_id drop not null;

alter table public.reward_redemptions
  add column if not exists points_used numeric(12, 2);

update public.reward_redemptions
set points_used = points_spent
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
  add column if not exists redemption_date timestamptz;

update public.reward_redemptions
set redemption_date = redeemed_at
where redemption_date is null;

alter table public.reward_redemptions
  alter column redemption_date set default now(),
  alter column redemption_date set not null;

alter table public.reward_redemptions
  add column if not exists notes text;

alter table public.reward_redemptions
  alter column status set default 'completed';

alter table public.reward_redemptions
  drop constraint if exists reward_redemptions_status_check;

alter table public.reward_redemptions
  add constraint reward_redemptions_status_check
  check (status in ('completed', 'pending', 'approved', 'delivered', 'cancelled'));

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
    coalesce(sum(coalesce(points_used, points_spent)), 0)::numeric(12, 2) as total_redeemed
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
  total_points,
  earned_points,
  earned_points as accumulated_points,
  total_spent,
  total_purchase_amount_cents,
  total_purchases,
  total_redeemed,
  total_redeemed as redeemed_points,
  available_points
from (
  select
    ranking_source.*,
    available_points as total_points
  from ranking_source
) as ranked_source;

alter table public.reward_redemptions enable row level security;

drop policy if exists "Admins can manage reward redemptions" on public.reward_redemptions;
create policy "Admins can manage reward redemptions"
on public.reward_redemptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on table public.reward_redemptions from anon, authenticated;
revoke all on table public.customer_points_view from anon, authenticated;

grant all on table public.reward_redemptions to authenticated;
grant select on table public.customer_points_view to authenticated;

commit;

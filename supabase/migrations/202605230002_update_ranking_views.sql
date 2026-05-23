drop view if exists public.customer_points_view;

create view public.customer_points_view
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
),
ranking_source as (
  select
    customers.id as customer_id,
    customers.code as customer_code,
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
  left join redemption_totals on redemption_totals.customer_id = customers.id
)
select
  dense_rank() over (order by total_points desc) as ranking_position,
  customer_id,
  customer_code,
  customer_name,
  document_type,
  document,
  phone,
  email,
  active,
  level_id,
  level_name,
  total_purchase_amount_cents,
  total_points,
  redeemed_points,
  available_points
from ranking_source;

drop view if exists public.public_ranking_view;

create view public.public_ranking_view
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
    customers.code as customer_code,
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
  customer_code,
  customer_name,
  level_name,
  total_points
from ranking_source
order by position, customer_name;

grant select on table public.customer_points_view to authenticated;
grant select on table public.public_ranking_view to anon, authenticated;

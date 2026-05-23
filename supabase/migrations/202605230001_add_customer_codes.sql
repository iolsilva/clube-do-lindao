create sequence if not exists public.customer_code_number_seq;

alter table public.customers
  add column if not exists code_number integer;

alter table public.customers
  add column if not exists code text;

create unique index if not exists customers_code_number_key
  on public.customers(code_number);

create unique index if not exists customers_code_key
  on public.customers(code);

create or replace function public.format_customer_code(
  customer_name text,
  customer_number integer
)
returns text
language sql
stable
as $$
  select concat(
    coalesce(nullif(split_part(btrim(customer_name), ' ', 1), ''), 'Cliente'),
    ' - #',
    lpad(customer_number::text, 3, '0')
  );
$$;

create or replace function public.set_customer_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.code_number is null then
    new.code_number = nextval('public.customer_code_number_seq');
  end if;

  if tg_op = 'INSERT' then
    new.code = public.format_customer_code(new.name, new.code_number);
  elsif new.name is distinct from old.name
    or new.code_number is distinct from old.code_number
    or new.code is null
  then
    new.code = public.format_customer_code(new.name, new.code_number);
  end if;

  return new;
end;
$$;

with numbered_customers as (
  select
    id,
    row_number() over (order by created_at, id) as generated_number
  from public.customers
  where code_number is null
)
update public.customers
set code_number = numbered_customers.generated_number
from numbered_customers
where customers.id = numbered_customers.id;

update public.customers
set code = public.format_customer_code(name, code_number)
where code is null
  and code_number is not null;

select setval(
  'public.customer_code_number_seq',
  greatest(coalesce((select max(code_number) from public.customers), 0), 1),
  coalesce((select max(code_number) from public.customers), 0) > 0
);

alter table public.customers
  alter column code_number set not null,
  alter column code set not null;

drop trigger if exists set_customers_code on public.customers;
create trigger set_customers_code
before insert or update of name, code_number on public.customers
for each row execute function public.set_customer_code();

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
left join redemption_totals on redemption_totals.customer_id = customers.id;

grant usage, select, update on sequence public.customer_code_number_seq
  to authenticated;

-- Clube do Lindao - limpeza manual dos 2 clientes de teste
-- Execute no Supabase Dashboard > SQL Editor > New Query > Run.
--
-- Este SQL apaga tudo vinculado aos clientes atualmente cadastrados:
-- 1. resgates vinculados aos clientes;
-- 2. compras vinculadas aos clientes;
-- 3. clientes.
--
-- Mantem intactos:
-- - profiles/admin;
-- - niveis;
-- - premios;
-- - schema;
-- - policies/RLS.

begin;

with target_customers as (
  select id
  from public.customers
)
delete from public.reward_redemptions
where customer_id in (select id from target_customers);

with target_customers as (
  select id
  from public.customers
)
delete from public.purchases
where customer_id in (select id from target_customers);

with target_customers as (
  select id
  from public.customers
)
delete from public.customers
where id in (select id from target_customers);

commit;

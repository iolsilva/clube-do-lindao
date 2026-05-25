-- Clube do Lindao - limpeza manual de dados de teste
-- Execute no Supabase Dashboard > SQL Editor > New Query > Run.
-- Primeiro execute apenas a secao 1 para conferir os registros.
-- Depois execute a secao 2 somente se os IDs retornados forem dos testes.

-- ============================================================
-- 1) SELECT PARA CONFERENCIA
-- ============================================================

with test_customers as (
  select
    id,
    code,
    name,
    document_type,
    document,
    phone,
    active,
    created_at
  from public.customers
  where
    (code = 'Iago - #001' and name = 'Iago Oliveira Lopes da Silva')
    or (code = 'Iago - #002' and name = 'Iago Oliveira teste 2')
)
select
  'clientes_encontrados' as tipo,
  id as customer_id,
  code,
  name,
  document_type,
  document,
  phone,
  active,
  created_at
from test_customers
order by code;

with test_customers as (
  select id, code, name
  from public.customers
  where
    (code = 'Iago - #001' and name = 'Iago Oliveira Lopes da Silva')
    or (code = 'Iago - #002' and name = 'Iago Oliveira teste 2')
)
select
  'compras_vinculadas' as tipo,
  purchases.id as purchase_id,
  purchases.customer_id,
  test_customers.code,
  test_customers.name,
  purchases.amount_cents,
  purchases.points,
  purchases.purchased_at,
  purchases.notes,
  purchases.created_at
from public.purchases
join test_customers on test_customers.id = purchases.customer_id
order by purchases.purchased_at desc;

with test_customers as (
  select id, code, name
  from public.customers
  where
    (code = 'Iago - #001' and name = 'Iago Oliveira Lopes da Silva')
    or (code = 'Iago - #002' and name = 'Iago Oliveira teste 2')
)
select
  'resgates_vinculados' as tipo,
  reward_redemptions.id as redemption_id,
  reward_redemptions.customer_id,
  test_customers.code,
  test_customers.name,
  reward_redemptions.reward_id,
  reward_redemptions.points_spent,
  reward_redemptions.status,
  reward_redemptions.redemption_date,
  reward_redemptions.notes,
  reward_redemptions.created_at
from public.reward_redemptions
join test_customers on test_customers.id = reward_redemptions.customer_id
order by reward_redemptions.created_at desc;

with test_customers as (
  select id
  from public.customers
  where
    (code = 'Iago - #001' and name = 'Iago Oliveira Lopes da Silva')
    or (code = 'Iago - #002' and name = 'Iago Oliveira teste 2')
)
select
  (select count(*) from test_customers) as clientes_encontrados,
  (
    select count(*)
    from public.purchases
    where customer_id in (select id from test_customers)
  ) as compras_vinculadas,
  (
    select count(*)
    from public.reward_redemptions
    where customer_id in (select id from test_customers)
  ) as resgates_vinculados;

-- ============================================================
-- 2) DELETE SEGURO
-- ============================================================
-- Execute somente depois de conferir que:
-- - clientes_encontrados = 2;
-- - os IDs pertencem aos dois clientes de teste;
-- - as compras e resgates listados sao realmente de teste.
--
-- O guard abaixo aborta a transacao se nao encontrar exatamente 2 clientes.

begin;

with test_customers as (
  select id
  from public.customers
  where
    (code = 'Iago - #001' and name = 'Iago Oliveira Lopes da Silva')
    or (code = 'Iago - #002' and name = 'Iago Oliveira teste 2')
),
guard as (
  select (1 / case when count(*) = 2 then 1 else 0 end) as ok
  from test_customers
),
deleted_redemptions as (
  delete from public.reward_redemptions
  using test_customers, guard
  where reward_redemptions.customer_id = test_customers.id
  returning reward_redemptions.id, reward_redemptions.customer_id
),
deleted_purchases as (
  delete from public.purchases
  using test_customers, guard
  where purchases.customer_id = test_customers.id
  returning purchases.id, purchases.customer_id
),
deleted_customers as (
  delete from public.customers
  using test_customers, guard
  where customers.id = test_customers.id
  returning customers.id, customers.code, customers.name
)
select
  (select count(*) from deleted_redemptions) as resgates_apagados,
  (select count(*) from deleted_purchases) as compras_apagadas,
  (select count(*) from deleted_customers) as clientes_apagados;

commit;

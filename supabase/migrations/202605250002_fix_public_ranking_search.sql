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
      coalesce(sum(points), 0)::numeric(12, 2) as total_points
    from public.purchases
    group by customer_id
  ),
  ranking_source as (
    select
      customers.code as customer_code,
      customers.name as full_name,
      customers.phone,
      levels.name as level_name,
      coalesce(purchase_totals.total_points, 0)::numeric(12, 2) as total_points
    from public.customers
    left join public.levels on levels.id = customers.level_id
    left join purchase_totals on purchase_totals.customer_id = customers.id
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

revoke all on function public.search_public_ranking(text) from public;
grant execute on function public.search_public_ranking(text) to anon, authenticated;

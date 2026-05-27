begin;

alter table public.reward_redemptions
  alter column reward_id drop not null;

alter table public.reward_redemptions
  add column if not exists points_used numeric(12, 2),
  add column if not exists redemption_date timestamptz default now(),
  add column if not exists notes text;

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
    execute 'alter table public.reward_redemptions alter column points_spent drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reward_redemptions'
      and column_name = 'redeemed_at'
  ) then
    execute 'update public.reward_redemptions set redemption_date = coalesce(redemption_date, redeemed_at, created_at, now()) where redemption_date is null';
    execute 'alter table public.reward_redemptions alter column redeemed_at drop not null';
  end if;
end;
$$;

update public.reward_redemptions
set points_used = 0
where points_used is null;

update public.reward_redemptions
set redemption_date = coalesce(redemption_date, created_at, now())
where redemption_date is null;

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
  alter column points_used set not null,
  alter column redemption_date set default now(),
  alter column redemption_date set not null,
  alter column status set default 'delivered';

commit;

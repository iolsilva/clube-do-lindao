begin;

alter table public.reward_redemptions
  alter column status set default 'delivered';

commit;

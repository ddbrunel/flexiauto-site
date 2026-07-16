alter table public.partner_applications
  add column if not exists subscription_id text,
  add column if not exists partner_since timestamptz,
  add column if not exists engagement_end_date timestamptz,
  add column if not exists subscription_status text;

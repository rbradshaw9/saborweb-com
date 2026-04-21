create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  site_id uuid references public.restaurant_sites(id) on delete set null,
  request_id uuid references public.preview_requests(id) on delete set null,
  intake_id uuid references public.restaurant_intake(id) on delete set null,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('system', 'visitor', 'owner', 'admin', 'stripe', 'cron')),
  actor_id text,
  message text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.site_events enable row level security;

create index if not exists site_events_site_id_created_at_idx on public.site_events(site_id, created_at desc);
create index if not exists site_events_request_id_created_at_idx on public.site_events(request_id, created_at desc);
create index if not exists site_events_event_type_created_at_idx on public.site_events(event_type, created_at desc);

comment on table public.site_events is 'Append-only operational timeline for preview, intake, claim, payment, automation, and admin activity.';
comment on column public.site_events.actor_type is 'Source of the event: system, visitor, owner, admin, stripe, or cron.';

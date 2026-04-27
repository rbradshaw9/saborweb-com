create table if not exists public.admin_build_packets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  request_id uuid references public.preview_requests(id) on delete cascade,
  site_id uuid references public.restaurant_sites(id) on delete set null,
  intake_id uuid references public.restaurant_intake(id) on delete set null,
  status text not null default 'ready' check (status in ('ready', 'failed')),
  source_hash text not null,
  model text not null,
  analysis_json jsonb not null default '{}'::jsonb,
  packet_markdown text not null default '',
  error_message text,
  generated_by text,
  generated_by_email text
);

drop trigger if exists set_admin_build_packets_updated_at on public.admin_build_packets;
create trigger set_admin_build_packets_updated_at
before update on public.admin_build_packets
for each row execute function public.set_updated_at();

alter table public.admin_build_packets enable row level security;

create index if not exists admin_build_packets_request_created_idx
  on public.admin_build_packets(request_id, created_at desc);

create index if not exists admin_build_packets_site_created_idx
  on public.admin_build_packets(site_id, created_at desc);

comment on table public.admin_build_packets is 'Admin-generated AI interpretation and copyable build handoff packets for restaurant preview builds.';
comment on column public.admin_build_packets.source_hash is 'Hash of the request, site, intake, file, and source-link data used to detect stale generated packets.';
comment on column public.admin_build_packets.analysis_json is 'Structured AI output: missing inputs, scrape plan, asset plan, build tasks, and acceptance criteria.';
comment on column public.admin_build_packets.packet_markdown is 'Copyable Markdown packet for an IDE/build agent.';

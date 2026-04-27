alter table public.agent_runs
  drop constraint if exists agent_runs_task_type_check;

alter table public.agent_runs
  add constraint agent_runs_task_type_check check (
    task_type in (
      'research',
      'research_collect',
      'ai_review',
      'extraction',
      'strategy',
      'build_brief',
      'build_packet',
      'code_build',
      'deploy',
      'qa',
      'sales_followup',
      'support',
      'moderation'
    )
  );

alter table public.restaurant_sites
  add column if not exists build_strategy text not null default 'generated_site'
    check (build_strategy in ('generated_site', 'renderer_fallback', 'custom_code')),
  add column if not exists generated_site_manifest jsonb not null default '{}'::jsonb,
  add column if not exists generated_file_manifest jsonb not null default '[]'::jsonb,
  add column if not exists deployment_status text not null default 'not_started'
    check (deployment_status in ('not_started', 'queued', 'deploying', 'preview_ready', 'failed', 'live')),
  add column if not exists subdomain_status jsonb not null default '{}'::jsonb;

create table if not exists public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  domain text not null unique,
  status text not null default 'requested'
    check (status in ('requested', 'pending', 'verified', 'active', 'verification_failed', 'removed')),
  verification jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  activated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_custom_domains_updated_at on public.custom_domains;
create trigger set_custom_domains_updated_at
before update on public.custom_domains
for each row execute function public.set_updated_at();

create index if not exists custom_domains_site_idx on public.custom_domains(site_id);
create index if not exists custom_domains_status_idx on public.custom_domains(status);
create index if not exists restaurant_sites_build_strategy_idx on public.restaurant_sites(build_strategy);
create index if not exists restaurant_sites_deployment_status_idx on public.restaurant_sites(deployment_status);

alter table public.custom_domains enable row level security;

comment on table public.custom_domains is 'Customer-owned domains attached to generated SaborWeb restaurant sites and verified through Vercel.';
comment on column public.restaurant_sites.generated_site_manifest is 'Latest generated restaurant site artifact persisted for routing and recovery.';

alter table public.preview_requests
  add column if not exists email_verified_at timestamptz,
  add column if not exists email_verification_sent_at timestamptz;

comment on column public.preview_requests.email_verified_at is 'Owner email verification timestamp required before public intake can queue autopilot research.';

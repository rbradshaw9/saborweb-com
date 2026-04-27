create table if not exists public.site_prompt_revisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  source_site_spec_id uuid references public.site_specs(id) on delete set null,
  source_site_version_id uuid references public.site_versions(id) on delete set null,
  resulting_site_spec_id uuid references public.site_specs(id) on delete set null,
  resulting_site_version_id uuid references public.site_versions(id) on delete set null,
  prompt_text text not null,
  attached_links jsonb not null default '[]'::jsonb,
  output_summary text,
  model text,
  status text not null default 'draft_preview'
    check (status in ('draft_preview', 'approved', 'published', 'discarded', 'failed')),
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_site_prompt_revisions_updated_at on public.site_prompt_revisions;
create trigger set_site_prompt_revisions_updated_at
before update on public.site_prompt_revisions
for each row execute function public.set_updated_at();

create index if not exists site_prompt_revisions_site_created_idx
  on public.site_prompt_revisions(site_id, created_at desc);

create index if not exists site_prompt_revisions_status_idx
  on public.site_prompt_revisions(status);

alter table public.site_prompt_revisions enable row level security;

comment on table public.site_prompt_revisions is 'Operator prompt revisions used to generate staged preview updates for restaurant sites.';

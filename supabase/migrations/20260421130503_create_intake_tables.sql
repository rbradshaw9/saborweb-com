create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.preview_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_name text not null,
  email text,
  phone text not null,
  restaurant_name text not null,
  city text not null,
  preferred_language text not null default 'es' check (preferred_language in ('en', 'es')),
  source text not null default 'website',
  status text not null default 'new' check (
    status in ('new', 'intake_started', 'intake_complete', 'brief_ready', 'preview_building', 'preview_sent', 'won', 'lost')
  ),
  notes text,
  instagram_url text,
  google_url text,
  website_url text,
  client_slug text not null unique,
  intake_token_hash text not null unique,
  intake_started_at timestamptz,
  intake_submitted_at timestamptz,
  generated_brief text,
  brief_json jsonb not null default '{}'::jsonb
);

create trigger set_preview_requests_updated_at
before update on public.preview_requests
for each row execute function public.set_updated_at();

create table public.restaurant_intake (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.preview_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  address text,
  neighborhood text,
  cuisine text,
  current_website text,
  google_business_url text,
  instagram_url text,
  facebook_url text,
  menu_url text,
  ordering_url text,
  reservations_url text,
  domain_status text,
  launch_urgency text,
  brand_style text,
  brand_notes text,
  ideal_guest text,
  differentiators text,
  owner_goals text,
  hours jsonb not null default '[]'::jsonb,
  menu_notes jsonb not null default '{}'::jsonb,
  feature_requests jsonb not null default '[]'::jsonb,
  asset_links jsonb not null default '[]'::jsonb,
  generated_brief text,
  brief_json jsonb not null default '{}'::jsonb
);

create trigger set_restaurant_intake_updated_at
before update on public.restaurant_intake
for each row execute function public.set_updated_at();

create table public.intake_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.preview_requests(id) on delete cascade,
  intake_id uuid references public.restaurant_intake(id) on delete cascade,
  created_at timestamptz not null default now(),
  file_role text not null default 'asset',
  storage_bucket text not null default 'intake-assets',
  storage_path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  unique (storage_bucket, storage_path)
);

alter table public.preview_requests enable row level security;
alter table public.restaurant_intake enable row level security;
alter table public.intake_files enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'intake-assets',
  'intake-assets',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

comment on table public.preview_requests is 'Public preview requests submitted through SaborWeb server routes. RLS is enabled; writes use backend service role only.';
comment on table public.restaurant_intake is 'Structured restaurant intake details used to produce build-ready preview briefs.';
comment on table public.intake_files is 'Private Supabase Storage references for logos, menus, and restaurant assets.';

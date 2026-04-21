create table if not exists public.restaurant_sites (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.preview_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  restaurant_name text not null,
  city text,
  preview_type text not null default 'native' check (preview_type in ('native', 'external')),
  preview_url text not null,
  external_preview_url text,
  claim_url text not null,
  status text not null default 'draft' check (
    status in ('draft', 'preview_building', 'preview_ready', 'claim_started', 'claimed', 'paid', 'live', 'archived')
  ),
  owner_name text,
  owner_email text,
  owner_phone text,
  owner_status text not null default 'unclaimed' check (owner_status in ('unclaimed', 'claim_started', 'claimed')),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'checkout_started', 'paid', 'failed', 'refunded', 'cancelled')
  ),
  selected_package text check (selected_package is null or selected_package in ('presencia', 'visibilidad', 'crecimiento')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  claimed_at timestamptz,
  paid_at timestamptz,
  launched_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_restaurant_sites_updated_at on public.restaurant_sites;
create trigger set_restaurant_sites_updated_at
before update on public.restaurant_sites
for each row execute function public.set_updated_at();

alter table public.restaurant_sites enable row level security;

create index if not exists restaurant_sites_request_id_idx on public.restaurant_sites(request_id);
create index if not exists restaurant_sites_status_idx on public.restaurant_sites(status);
create index if not exists restaurant_sites_preview_type_idx on public.restaurant_sites(preview_type);
create index if not exists restaurant_sites_payment_status_idx on public.restaurant_sites(payment_status);

comment on table public.restaurant_sites is 'Source of truth for SaborWeb preview ownership, claim, payment, and launch state.';
comment on column public.restaurant_sites.preview_type is 'native previews render inside SaborWeb; external previews live in a separate repo/deployment.';
comment on column public.restaurant_sites.preview_url is 'Path or absolute URL where the preview can be viewed.';
comment on column public.restaurant_sites.claim_url is 'Path or absolute URL where the restaurant owner can claim this preview.';

insert into public.restaurant_sites (
  slug,
  restaurant_name,
  city,
  preview_type,
  preview_url,
  external_preview_url,
  claim_url,
  status,
  owner_status,
  payment_status,
  metadata
)
values
  (
    'cinco-de-maya',
    'Cinco de Maya',
    'Aguadilla',
    'native',
    '/preview/cinco-de-maya',
    null,
    '/claim/cinco-de-maya',
    'preview_ready',
    'unclaimed',
    'unpaid',
    '{"seeded": true, "native_example": true}'::jsonb
  ),
  (
    'rebar',
    'Rebar Gastronomia & Cocteles',
    'Aguadilla',
    'external',
    'https://rebar.saborweb.com',
    'https://rebar.saborweb.com',
    '/claim/rebar',
    'preview_ready',
    'unclaimed',
    'unpaid',
    '{"seeded": true, "external_repo": "/Users/ryanbradshaw/AntiGravity/rebar"}'::jsonb
  )
on conflict (slug) do update
set
  restaurant_name = excluded.restaurant_name,
  city = excluded.city,
  preview_type = excluded.preview_type,
  preview_url = excluded.preview_url,
  external_preview_url = excluded.external_preview_url,
  claim_url = excluded.claim_url,
  status = excluded.status,
  metadata = public.restaurant_sites.metadata || excluded.metadata;

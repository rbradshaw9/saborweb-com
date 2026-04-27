alter table public.preview_requests
  drop constraint if exists preview_requests_status_check;

alter table public.preview_requests
  add constraint preview_requests_status_check check (
    status in (
      'new',
      'intake_started',
      'intake_complete',
      'brief_ready',
      'needs_review',
      'researching',
      'preview_building',
      'preview_sent',
      'won',
      'lost',
      'archived'
    )
  );

alter table public.restaurant_sites
  add column if not exists project_stage text not null default 'request_received' check (
    project_stage in (
      'request_received',
      'researching',
      'needs_info',
      'build_packet_ready',
      'building',
      'qa_failed',
      'ready_for_admin_review',
      'preview_sent',
      'viewed',
      'claim_started',
      'paid_live',
      'reclaim_cancelled',
      'archived'
    )
  ),
  add column if not exists automation_mode text not null default 'admin_gate' check (
    automation_mode in ('paused', 'admin_approval_required', 'research_only', 'packet_only', 'admin_gate', 'trusted_full_auto')
  ),
  add column if not exists release_channel text not null default 'preview' check (
    release_channel in ('development', 'preview', 'staging', 'production')
  ),
  add column if not exists staging_url text,
  add column if not exists live_url text,
  add column if not exists risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  add column if not exists latest_agent_cost_cents integer not null default 0 check (latest_agent_cost_cents >= 0),
  add column if not exists owner_viewed_at timestamptz,
  add column if not exists preview_released_at timestamptz;

create index if not exists restaurant_sites_project_stage_idx on public.restaurant_sites(project_stage);
create index if not exists restaurant_sites_automation_mode_idx on public.restaurant_sites(automation_mode);

update public.restaurant_sites
set project_stage = case
  when status in ('live', 'paid') or payment_status = 'paid' then 'paid_live'
  when status = 'claim_started' or owner_status = 'claim_started' or payment_status = 'checkout_started' then 'claim_started'
  when status = 'preview_ready' then 'ready_for_admin_review'
  when status = 'preview_building' then 'building'
  when status = 'archived' or payment_status in ('cancelled', 'refunded') then 'archived'
  else project_stage
end
where project_stage = 'request_received';

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  name text,
  phone text,
  status text not null default 'active' check (status in ('active', 'limited', 'disabled')),
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_customer_accounts_updated_at on public.customer_accounts;
create trigger set_customer_accounts_updated_at
before update on public.customer_accounts
for each row execute function public.set_updated_at();

create table if not exists public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'removed')),
  unique (site_id, customer_account_id)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid references public.restaurant_sites(id) on delete cascade,
  request_id uuid references public.preview_requests(id) on delete set null,
  task_type text not null check (
    task_type in ('research', 'extraction', 'strategy', 'build_packet', 'code_build', 'qa', 'sales_followup', 'support', 'moderation')
  ),
  provider text not null,
  model text,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'blocked')),
  input_hash text,
  started_at timestamptz,
  finished_at timestamptz,
  cost_cents integer not null default 0 check (cost_cents >= 0),
  logs text,
  error_message text,
  artifacts jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_agent_runs_updated_at on public.agent_runs;
create trigger set_agent_runs_updated_at
before update on public.agent_runs
for each row execute function public.set_updated_at();

create index if not exists agent_runs_site_created_idx on public.agent_runs(site_id, created_at desc);
create index if not exists agent_runs_request_created_idx on public.agent_runs(request_id, created_at desc);
create index if not exists agent_runs_status_idx on public.agent_runs(status);

create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid references public.restaurant_sites(id) on delete cascade,
  request_id uuid references public.preview_requests(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  source_type text not null default 'web' check (source_type in ('website', 'google_business', 'instagram', 'facebook', 'menu', 'ordering', 'reservations', 'directory', 'web', 'upload', 'manual')),
  url text,
  title text,
  extracted_facts jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) not null default 0.000 check (confidence >= 0 and confidence <= 1),
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_research_sources_updated_at on public.research_sources;
create trigger set_research_sources_updated_at
before update on public.research_sources
for each row execute function public.set_updated_at();

create index if not exists research_sources_site_idx on public.research_sources(site_id, captured_at desc);
create index if not exists research_sources_request_idx on public.research_sources(request_id, captured_at desc);

create table if not exists public.site_specs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  version_label text not null default 'draft',
  status text not null default 'draft' check (status in ('draft', 'staged', 'approved', 'published', 'archived')),
  source_hash text,
  spec_json jsonb not null default '{}'::jsonb,
  seo_json jsonb not null default '{}'::jsonb,
  generated_by_agent_run_id uuid references public.agent_runs(id) on delete set null
);

drop trigger if exists set_site_specs_updated_at on public.site_specs;
create trigger set_site_specs_updated_at
before update on public.site_specs
for each row execute function public.set_updated_at();

create index if not exists site_specs_site_status_idx on public.site_specs(site_id, status);

create table if not exists public.site_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  site_spec_id uuid references public.site_specs(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'staged', 'qa_failed', 'approved', 'published', 'rolled_back', 'archived')),
  release_channel text not null default 'preview' check (release_channel in ('development', 'preview', 'staging', 'production')),
  source_branch text,
  deployment_url text,
  qa_result jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  published_by uuid,
  rollback_of_version_id uuid references public.site_versions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_site_versions_updated_at on public.site_versions;
create trigger set_site_versions_updated_at
before update on public.site_versions
for each row execute function public.set_updated_at();

create index if not exists site_versions_site_status_idx on public.site_versions(site_id, status);
create index if not exists site_versions_channel_idx on public.site_versions(release_channel);

create table if not exists public.site_assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  asset_type text not null check (asset_type in ('logo', 'photo', 'menu', 'document', 'video', 'font', 'other')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'quarantined', 'rejected', 'archived')),
  storage_bucket text,
  storage_path text,
  source_url text,
  source_label text,
  rights_notes text,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_site_assets_updated_at on public.site_assets;
create trigger set_site_assets_updated_at
before update on public.site_assets
for each row execute function public.set_updated_at();

create index if not exists site_assets_site_type_idx on public.site_assets(site_id, asset_type);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  name text not null default 'Main menu',
  language text not null default 'both' check (language in ('en', 'es', 'both')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  source_notes text,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_menus_updated_at on public.menus;
create trigger set_menus_updated_at
before update on public.menus
for each row execute function public.set_updated_at();

create index if not exists menus_site_status_idx on public.menus(site_id, status);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  sort_order integer not null default 0,
  name_en text,
  name_es text,
  description_en text,
  description_es text,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_menu_categories_updated_at on public.menu_categories;
create trigger set_menu_categories_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

create index if not exists menu_categories_menu_sort_idx on public.menu_categories(menu_id, sort_order);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  sort_order integer not null default 0,
  name_en text,
  name_es text,
  description_en text,
  description_es text,
  price_text text,
  badges jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create index if not exists menu_items_category_sort_idx on public.menu_items(category_id, sort_order);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  day_of_week integer check (day_of_week >= 0 and day_of_week <= 6),
  exception_date date,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  label text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  check (day_of_week is not null or exception_date is not null)
);

drop trigger if exists set_business_hours_updated_at on public.business_hours;
create trigger set_business_hours_updated_at
before update on public.business_hours
for each row execute function public.set_updated_at();

create index if not exists business_hours_site_day_idx on public.business_hours(site_id, day_of_week);
create index if not exists business_hours_site_exception_idx on public.business_hours(site_id, exception_date);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  request_type text not null check (request_type in ('pre_purchase_revision', 'menu_hours', 'copy', 'photo', 'layout', 'seo', 'integration', 'support')),
  status text not null default 'submitted' check (status in ('submitted', 'triage', 'agent_drafting', 'staged', 'admin_approved', 'published', 'rejected', 'cancelled')),
  title text not null,
  description text,
  submitted_payload jsonb not null default '{}'::jsonb,
  staged_site_version_id uuid references public.site_versions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_change_requests_updated_at on public.change_requests;
create trigger set_change_requests_updated_at
before update on public.change_requests
for each row execute function public.set_updated_at();

create index if not exists change_requests_site_status_idx on public.change_requests(site_id, status);

create table if not exists public.addon_purchases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  add_on_key text not null check (
    add_on_key in (
      'custom_domain_setup',
      'blog_cms',
      'lead_concierge',
      'online_ordering_integration',
      'reservation_integration',
      'gbp_posts',
      'citation_setup',
      'review_support'
    )
  ),
  bundle_key text check (bundle_key is null or bundle_key in ('growth_pack', 'conversion_pack')),
  status text not null default 'needs_access' check (status in ('needs_access', 'in_setup', 'active', 'blocked', 'cancelling', 'cancelled')),
  setup_price_cents integer not null default 0 check (setup_price_cents >= 0),
  monthly_price_cents integer not null default 0 check (monthly_price_cents >= 0),
  stripe_subscription_item_id text,
  stripe_invoice_id text,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (site_id, add_on_key)
);

drop trigger if exists set_addon_purchases_updated_at on public.addon_purchases;
create trigger set_addon_purchases_updated_at
before update on public.addon_purchases
for each row execute function public.set_updated_at();

create index if not exists addon_purchases_site_status_idx on public.addon_purchases(site_id, status);

create table if not exists public.addon_setup_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  addon_purchase_id uuid references public.addon_purchases(id) on delete cascade,
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open', 'waiting_on_owner', 'waiting_on_admin', 'blocked', 'done', 'cancelled')),
  owner_instructions text,
  admin_notes text,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_addon_setup_tasks_updated_at on public.addon_setup_tasks;
create trigger set_addon_setup_tasks_updated_at
before update on public.addon_setup_tasks
for each row execute function public.set_updated_at();

create index if not exists addon_setup_tasks_site_status_idx on public.addon_setup_tasks(site_id, status);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid references public.restaurant_sites(id) on delete cascade,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  provider_key text not null,
  connection_type text not null check (connection_type in ('oauth', 'delegated_access', 'link_embed', 'api_key')),
  status text not null default 'not_connected' check (
    status in ('not_connected', 'needs_owner_action', 'pending_admin', 'connected', 'expired', 'blocked', 'disconnected')
  ),
  external_account_id text,
  external_location_id text,
  scopes jsonb not null default '[]'::jsonb,
  setup_checklist jsonb not null default '[]'::jsonb,
  public_config jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_integration_connections_updated_at on public.integration_connections;
create trigger set_integration_connections_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();

create index if not exists integration_connections_site_provider_idx on public.integration_connections(site_id, provider_key);
create index if not exists integration_connections_status_idx on public.integration_connections(status);

create table if not exists public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  integration_connection_id uuid references public.integration_connections(id) on delete cascade,
  provider_key text not null,
  credential_kind text not null check (credential_kind in ('oauth_token', 'refresh_token', 'api_key', 'webhook_secret', 'other')),
  secret_ciphertext text not null,
  expires_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_integration_credentials_updated_at on public.integration_credentials;
create trigger set_integration_credentials_updated_at
before update on public.integration_credentials
for each row execute function public.set_updated_at();

create index if not exists integration_credentials_connection_idx on public.integration_credentials(integration_connection_id);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  site_id uuid references public.restaurant_sites(id) on delete cascade,
  request_id uuid references public.preview_requests(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('system', 'visitor', 'owner', 'admin', 'agent')),
  surface text not null check (surface in ('wizard', 'upload', 'owner_edit', 'change_request', 'generated_copy', 'chatbot', 'pre_publish')),
  status text not null check (status in ('allowed', 'blocked', 'held', 'overridden')),
  reason text,
  input_excerpt text,
  result_json jsonb not null default '{}'::jsonb,
  override_reason text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists moderation_events_site_created_idx on public.moderation_events(site_id, created_at desc);
create index if not exists moderation_events_status_idx on public.moderation_events(status);

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  request_id uuid references public.preview_requests(id) on delete set null,
  site_id uuid references public.restaurant_sites(id) on delete cascade,
  terms_key text not null,
  terms_version text not null,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists terms_acceptances_customer_idx on public.terms_acceptances(customer_account_id, created_at desc);
create index if not exists terms_acceptances_site_idx on public.terms_acceptances(site_id, created_at desc);

create table if not exists public.site_exports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id uuid not null references public.restaurant_sites(id) on delete cascade,
  requested_by_customer_account_id uuid references public.customer_accounts(id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'paid', 'generating', 'ready', 'failed', 'expired', 'cancelled')),
  stripe_checkout_session_id text,
  price_cents integer not null default 0 check (price_cents >= 0),
  storage_bucket text,
  storage_path text,
  rights_notes text,
  error_message text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists set_site_exports_updated_at on public.site_exports;
create trigger set_site_exports_updated_at
before update on public.site_exports
for each row execute function public.set_updated_at();

create index if not exists site_exports_site_status_idx on public.site_exports(site_id, status);

alter table public.customer_accounts enable row level security;
alter table public.project_memberships enable row level security;
alter table public.agent_runs enable row level security;
alter table public.research_sources enable row level security;
alter table public.site_specs enable row level security;
alter table public.site_versions enable row level security;
alter table public.site_assets enable row level security;
alter table public.menus enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.business_hours enable row level security;
alter table public.change_requests enable row level security;
alter table public.addon_purchases enable row level security;
alter table public.addon_setup_tasks enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.moderation_events enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.site_exports enable row level security;

comment on table public.agent_runs is 'Operational log for research, extraction, build packet, code build, QA, follow-up, support, and moderation agent work.';
comment on table public.research_sources is 'Source URLs, extracted facts, confidence, and timestamps gathered during restaurant research.';
comment on table public.site_specs is 'Canonical bilingual source of truth for generated restaurant websites.';
comment on table public.site_versions is 'Staged/live restaurant site versions with QA, deployment, publish, and rollback metadata.';
comment on table public.addon_purchases is 'Plan-gated restaurant add-ons purchased from the customer portal.';
comment on table public.integration_connections is 'OAuth, delegated access, API key, and link/embed integration status for sites and customers.';
comment on table public.integration_credentials is 'Encrypted integration credentials. Secret values must never be exposed to browser clients.';
comment on table public.moderation_events is 'Audit log for blocked, held, allowed, and admin-overridden user or generated content.';

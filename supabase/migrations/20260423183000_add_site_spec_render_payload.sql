alter table public.site_specs
  add column if not exists render_json jsonb not null default '{}'::jsonb;

comment on column public.site_specs.render_json is 'Runtime restaurant render payload consumed by the dynamic preview/live renderer.';

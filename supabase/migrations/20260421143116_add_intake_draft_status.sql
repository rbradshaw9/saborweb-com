alter table public.restaurant_intake
  add column if not exists status text default 'draft';

alter table public.restaurant_intake
  add column if not exists last_step integer default 0;

comment on column public.restaurant_intake.status is 'Draft lifecycle state for progressive wizard saves. complete means final intake was submitted.';
comment on column public.restaurant_intake.last_step is 'Last brief-builder wizard step saved for resume links.';

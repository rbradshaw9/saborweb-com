alter table public.customer_accounts
  add column if not exists preferred_language text not null default 'en' check (preferred_language in ('en', 'es'));

comment on column public.customer_accounts.preferred_language is 'Persistent customer portal language preference for owner-facing UI and notifications.';

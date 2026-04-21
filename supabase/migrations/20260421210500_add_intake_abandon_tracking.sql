alter table public.preview_requests
  add column if not exists intake_resume_token text,
  add column if not exists abandon_first_sent_at timestamptz,
  add column if not exists abandon_second_sent_at timestamptz,
  add column if not exists abandon_opted_out_at timestamptz;

create index if not exists preview_requests_abandon_due_idx
  on public.preview_requests (created_at, status)
  where email is not null
    and intake_submitted_at is null
    and abandon_opted_out_at is null;

comment on column public.preview_requests.intake_resume_token is 'Bearer resume token used only by server-side abandon reminder emails.';
comment on column public.preview_requests.abandon_first_sent_at is 'Timestamp for the first unfinished-intake reminder.';
comment on column public.preview_requests.abandon_second_sent_at is 'Timestamp for the second unfinished-intake reminder.';
comment on column public.preview_requests.abandon_opted_out_at is 'Suppresses future abandon reminders for this preview request only.';

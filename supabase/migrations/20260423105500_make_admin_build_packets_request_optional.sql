alter table if exists public.admin_build_packets
  alter column request_id drop not null;

comment on column public.admin_build_packets.request_id is 'Optional preview request. Admin-created manual projects can generate build packets before a public request exists.';

alter table public.restaurant_sites
  drop constraint if exists restaurant_sites_project_stage_check;

alter table public.restaurant_sites
  add constraint restaurant_sites_project_stage_check check (
    project_stage in (
      'request_received',
      'collecting_evidence',
      'ai_audit',
      'resolved_profile_ready',
      'admin_review_required',
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
  );

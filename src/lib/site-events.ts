import { getSupabaseAdmin } from '@/lib/supabase/admin';

type ActorType = 'system' | 'visitor' | 'owner' | 'admin' | 'stripe' | 'cron';

type SiteEventInput = {
  eventType: string;
  siteId?: string | null;
  requestId?: string | null;
  intakeId?: string | null;
  actorType?: ActorType;
  actorId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logSiteEvent({
  eventType,
  siteId = null,
  requestId = null,
  intakeId = null,
  actorType = 'system',
  actorId = null,
  message = null,
  metadata = {},
}: SiteEventInput) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('site_events').insert({
      event_type: eventType,
      site_id: siteId,
      request_id: requestId,
      intake_id: intakeId,
      actor_type: actorType,
      actor_id: actorId,
      message,
      metadata,
    });

    if (error) {
      console.error('[Site Events] Insert failed:', error);
    }
  } catch (error) {
    console.error('[Site Events] Unexpected failure:', error);
  }
}

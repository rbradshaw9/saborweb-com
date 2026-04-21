import 'server-only';

import { buildRestaurantBrief, type IntakeRecord as SharedIntakeRecord, type PreviewRequestRecord } from '@/lib/intake/shared';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type SiteRecord = {
  id: string;
  request_id: string | null;
  created_at: string;
  updated_at: string;
  slug: string;
  restaurant_name: string;
  city: string | null;
  preview_type: 'native' | 'external';
  preview_url: string;
  claim_url: string;
  status: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_status: string;
  payment_status: string;
  selected_package: string | null;
  claimed_at: string | null;
  paid_at: string | null;
};

type RequestRecord = {
  id: string;
  created_at: string;
  status: string;
  source: string;
  preferred_language: 'en' | 'es';
  intake_started_at: string | null;
  intake_submitted_at: string | null;
};

type IntakeSummaryRecord = {
  request_id: string;
  status: string;
  last_step: number;
  updated_at: string;
};

type EventRecord = {
  id?: string;
  site_id: string | null;
  request_id: string | null;
  event_type: string;
  actor_type?: string;
  message: string | null;
  created_at: string;
};

type IntakeDetailRecord = SharedIntakeRecord & {
  id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  last_step: number;
  generated_brief: string | null;
};

type FileRecord = {
  id: string;
  created_at: string;
  file_role: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
};

export type AdminLeadRow = SiteRecord & {
  request: RequestRecord | null;
  intake: IntakeSummaryRecord | null;
  latestEvent: EventRecord | null;
};

export type AdminLeadSummary = {
  total: number;
  unpaid: number;
  paid: number;
  drafts: number;
  activeIntakes: number;
};

export type AdminSiteDetail = {
  site: SiteRecord;
  request: PreviewRequestRecord | null;
  intake: IntakeDetailRecord | null;
  files: FileRecord[];
  events: EventRecord[];
  buildBrief: string | null;
};

function byId<T extends { id: string }>(records: T[] | null) {
  return new Map((records ?? []).map((record) => [record.id, record]));
}

function byRequestId<T extends { request_id: string | null }>(records: T[] | null) {
  const map = new Map<string, T>();
  for (const record of records ?? []) {
    if (record.request_id) map.set(record.request_id, record);
  }
  return map;
}

function latestEventBySite(events: EventRecord[] | null) {
  const map = new Map<string, EventRecord>();

  for (const event of events ?? []) {
    const key = event.site_id ?? event.request_id;
    if (!key || map.has(key)) continue;
    map.set(key, event);
  }

  return map;
}

export async function getAdminLeadRows() {
  const supabase = getSupabaseAdmin();

  const { data: sites, error: sitesError } = await supabase
    .from('restaurant_sites')
    .select(
      [
        'id',
        'request_id',
        'created_at',
        'updated_at',
        'slug',
        'restaurant_name',
        'city',
        'preview_type',
        'preview_url',
        'claim_url',
        'status',
        'owner_name',
        'owner_email',
        'owner_phone',
        'owner_status',
        'payment_status',
        'selected_package',
        'claimed_at',
        'paid_at',
      ].join(', ')
    )
    .order('updated_at', { ascending: false })
    .limit(200);

  if (sitesError) {
    console.error('[Admin Dashboard] Site lookup failed:', sitesError);
    throw new Error('Could not load admin lead rows.');
  }

  const siteRows = (sites ?? []) as unknown as SiteRecord[];
  const requestIds = siteRows.map((site) => site.request_id).filter((id): id is string => Boolean(id));
  const siteIds = siteRows.map((site) => site.id);
  const eventFilters = [
    siteIds.length ? `site_id.in.(${siteIds.join(',')})` : null,
    requestIds.length ? `request_id.in.(${requestIds.join(',')})` : null,
  ].filter((filter): filter is string => Boolean(filter));

  const [requestsResult, intakeResult, eventsResult] = await Promise.all([
    requestIds.length
      ? supabase
          .from('preview_requests')
          .select('id, created_at, status, source, preferred_language, intake_started_at, intake_submitted_at')
          .in('id', requestIds)
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? supabase.from('restaurant_intake').select('request_id, status, last_step, updated_at').in('request_id', requestIds)
      : Promise.resolve({ data: [], error: null }),
    siteIds.length
      ? supabase
          .from('site_events')
          .select('site_id, request_id, event_type, message, created_at')
          .or(eventFilters.join(','))
          .order('created_at', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (requestsResult.error) console.error('[Admin Dashboard] Request lookup failed:', requestsResult.error);
  if (intakeResult.error) console.error('[Admin Dashboard] Intake lookup failed:', intakeResult.error);
  if (eventsResult.error) console.error('[Admin Dashboard] Event lookup failed:', eventsResult.error);

  const requests = byId((requestsResult.data ?? []) as unknown as RequestRecord[]);
  const intakes = byRequestId((intakeResult.data ?? []) as unknown as IntakeSummaryRecord[]);
  const events = latestEventBySite((eventsResult.data ?? []) as unknown as EventRecord[]);

  const rows: AdminLeadRow[] = siteRows.map((site) => ({
    ...site,
    request: site.request_id ? requests.get(site.request_id) ?? null : null,
    intake: site.request_id ? intakes.get(site.request_id) ?? null : null,
    latestEvent: events.get(site.id) ?? (site.request_id ? events.get(site.request_id) ?? null : null),
  }));

  const summary: AdminLeadSummary = {
    total: rows.length,
    unpaid: rows.filter((row) => row.payment_status === 'unpaid').length,
    paid: rows.filter((row) => row.payment_status === 'paid').length,
    drafts: rows.filter((row) => row.status === 'draft').length,
    activeIntakes: rows.filter((row) => row.intake?.status === 'draft').length,
  };

  return { rows, summary };
}

export async function getAdminSiteDetail(slug: string): Promise<AdminSiteDetail | null> {
  const supabase = getSupabaseAdmin();

  const { data: site, error: siteError } = await supabase
    .from('restaurant_sites')
    .select(
      [
        'id',
        'request_id',
        'created_at',
        'updated_at',
        'slug',
        'restaurant_name',
        'city',
        'preview_type',
        'preview_url',
        'claim_url',
        'status',
        'owner_name',
        'owner_email',
        'owner_phone',
        'owner_status',
        'payment_status',
        'selected_package',
        'claimed_at',
        'paid_at',
      ].join(', ')
    )
    .eq('slug', slug)
    .maybeSingle();

  if (siteError) {
    console.error('[Admin Dashboard] Site detail lookup failed:', siteError);
    throw new Error('Could not load admin site detail.');
  }

  if (!site) return null;

  const siteRecord = site as unknown as SiteRecord;
  const requestId = siteRecord.request_id;

  const [requestResult, intakeResult, filesResult, eventsResult] = await Promise.all([
    requestId
      ? supabase
          .from('preview_requests')
          .select(
            'id, owner_name, email, phone, restaurant_name, city, preferred_language, source, status, notes, instagram_url, google_url, website_url, client_slug'
          )
          .eq('id', requestId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestId
      ? supabase
          .from('restaurant_intake')
          .select(
            [
              'id',
              'request_id',
              'created_at',
              'updated_at',
              'address',
              'neighborhood',
              'cuisine',
              'current_website',
              'google_business_url',
              'instagram_url',
              'facebook_url',
              'menu_url',
              'ordering_url',
              'reservations_url',
              'domain_status',
              'launch_urgency',
              'brand_style',
              'brand_notes',
              'ideal_guest',
              'differentiators',
              'owner_goals',
              'hours',
              'menu_notes',
              'feature_requests',
              'asset_links',
              'generated_brief',
              'status',
              'last_step',
            ].join(', ')
          )
          .eq('request_id', requestId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestId
      ? supabase
          .from('intake_files')
          .select('id, created_at, file_role, storage_bucket, storage_path, file_name, content_type, size_bytes')
          .eq('request_id', requestId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('site_events')
      .select('id, site_id, request_id, event_type, actor_type, message, created_at')
      .or(requestId ? `site_id.eq.${siteRecord.id},request_id.eq.${requestId}` : `site_id.eq.${siteRecord.id}`)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (requestResult.error) console.error('[Admin Dashboard] Request detail lookup failed:', requestResult.error);
  if (intakeResult.error) console.error('[Admin Dashboard] Intake detail lookup failed:', intakeResult.error);
  if (filesResult.error) console.error('[Admin Dashboard] File lookup failed:', filesResult.error);
  if (eventsResult.error) console.error('[Admin Dashboard] Event detail lookup failed:', eventsResult.error);

  const request = (requestResult.data ?? null) as unknown as PreviewRequestRecord | null;
  const intake = (intakeResult.data ?? null) as unknown as IntakeDetailRecord | null;
  const files = (filesResult.data ?? []) as unknown as FileRecord[];
  const fileNames = files.map((file) => file.file_name);
  const buildBrief =
    intake?.generated_brief ??
    (request && intake ? buildRestaurantBrief(request, intake, fileNames) : null);

  return {
    site: siteRecord,
    request,
    intake,
    files,
    events: (eventsResult.data ?? []) as unknown as EventRecord[],
    buildBrief,
  };
}

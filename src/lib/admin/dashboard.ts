import 'server-only';

import { createHash } from 'crypto';
import { buildRestaurantBrief, type IntakeRecord as SharedIntakeRecord, type PreviewRequestRecord } from '@/lib/intake/shared';
import {
  extractAssetCandidatesFromSources,
  reviewedAssetFromRecord,
  summarizeResearchReview,
  type ResearchReviewSummary,
  type ReviewedResearchAsset,
} from '@/lib/admin/research-review';
import {
  readResearchAudit,
  readResolvedProfile,
  readStrategicProfile,
  type ResearchAuditRecord,
  type ResolvedRestaurantProfile,
  type StrategicRestaurantProfile,
} from '@/lib/admin/research-audit';
import { readResolvedMenu, type ResolvedMenu } from '@/lib/admin/menu-research';
import { readResolvedSiteBrief, type ResolvedSiteBrief } from '@/lib/admin/site-brief';
import { withMonitoringSpan } from '@/lib/monitoring/sentry';
import { type AddOnKey, type AddOnStatus } from '@/lib/platform/catalog';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type SiteRecord = {
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
  project_stage?: string | null;
  automation_mode?: string | null;
  release_channel?: string | null;
  staging_url?: string | null;
  live_url?: string | null;
  risk_score?: number | null;
  latest_agent_cost_cents?: number | null;
  owner_viewed_at?: string | null;
  preview_released_at?: string | null;
  build_strategy?: string | null;
  generated_file_manifest?: unknown;
  deployment_status?: string | null;
  subdomain_status?: unknown;
  metadata?: Record<string, unknown> | null;
};

export type RequestRecord = PreviewRequestRecord & {
  created_at: string;
  updated_at?: string;
  intake_started_at: string | null;
  intake_submitted_at: string | null;
  generated_brief?: string | null;
  brief_json?: Record<string, unknown> | null;
  email_verified_at?: string | null;
  email_verification_sent_at?: string | null;
};

export type IntakeDetailRecord = SharedIntakeRecord & {
  id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  last_step: number;
  generated_brief: string | null;
  brief_json?: Record<string, unknown> | null;
};

export type EventRecord = {
  id?: string;
  site_id: string | null;
  request_id: string | null;
  event_type: string;
  actor_type?: string;
  message: string | null;
  created_at: string;
};

export type FileRecord = {
  id: string;
  request_id?: string;
  created_at: string;
  file_role: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  signed_url?: string | null;
};

export type SiteAssetRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  site_id: string;
  asset_type: 'logo' | 'photo' | 'menu' | 'document' | 'video' | 'font' | 'other';
  status: 'draft' | 'approved' | 'quarantined' | 'rejected' | 'archived';
  storage_bucket: string | null;
  storage_path: string | null;
  source_url: string | null;
  source_label: string | null;
  rights_notes: string | null;
  metadata: Record<string, unknown>;
};

export type BuildPacketRecord = {
  id: string;
  created_at: string;
  request_id: string | null;
  site_id: string | null;
  intake_id: string | null;
  status: 'ready' | 'failed';
  source_hash: string;
  model: string;
  analysis_json: AdminBuildAnalysis | Record<string, unknown>;
  packet_markdown: string;
  error_message: string | null;
  generated_by_email: string | null;
};

export type AddOnPurchaseRecord = {
  id: string;
  site_id: string;
  add_on_key: AddOnKey;
  status: AddOnStatus;
  setup_price_cents: number;
  monthly_price_cents: number;
  current_period_end: string | null;
};

export type AgentRunRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  site_id: string | null;
  request_id: string | null;
  task_type: string;
  provider: string;
  model: string | null;
  status: string;
  cost_cents: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

export type ResearchSourceRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  site_id: string | null;
  request_id: string | null;
  agent_run_id: string | null;
  source_type: 'website' | 'google_business' | 'instagram' | 'facebook' | 'menu' | 'ordering' | 'reservations' | 'directory' | 'web' | 'upload' | 'manual';
  url: string | null;
  title: string | null;
  extracted_facts: Record<string, unknown>;
  confidence: number;
  captured_at: string;
  metadata: Record<string, unknown>;
};

export type MissingInput = {
  label: string;
  severity: 'critical' | 'helpful' | 'optional';
  guidance: string;
};

export type AdminBuildAnalysis = {
  briefHealth: {
    score: number;
    confidence: string;
    readinessLabel: string;
    summary: string;
  };
  missingInputs: {
    critical: MissingInput[];
    helpful: MissingInput[];
    optional: MissingInput[];
  };
  scrapePlan: string[];
  assetPlan: string[];
  contentPlan: string[];
  designDirection: string[];
  buildTasks: string[];
  acceptanceCriteria: string[];
  siteBrief?: ResolvedSiteBrief;
  handoffMarkdown: string;
};

export type OperatorStage =
  | 'research_collection'
  | 'researching'
  | 'ai_reviewing'
  | 'build_brief'
  | 'code_build'
  | 'deploy'
  | 'qa'
  | 'building_preview'
  | 'preview_ready'
  | 'published'
  | 'needs_help';

export type PipelineStage =
  | 'Request received'
  | 'Collecting evidence'
  | 'AI audit'
  | 'AI finished research'
  | 'Needs your help'
  | 'Generating packet'
  | 'Packet ready'
  | 'Build queued'
  | 'Researching'
  | 'Research review'
  | 'Needs info'
  | 'Build packet ready'
  | 'Building'
  | 'QA failed'
  | 'Ready for admin review'
  | 'Preview sent'
  | 'Viewed'
  | 'Claim started'
  | 'Paid/live'
  | 'Reclaim/cancelled'
  | 'New request'
  | 'Waiting on owner'
  | 'Intake incomplete'
  | 'Ready for build'
  | 'Preview ready'
  | 'Claim/payment active'
  | 'Live/complete'
  | 'Archived/lost';

export type AdminWorkItem = {
  id: string;
  requestId: string;
  siteId: string | null;
  slug: string;
  restaurantName: string;
  city: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  previewUrl: string;
  claimUrl: string;
  previewType: 'native' | 'external';
  createdAt: string;
  updatedAt: string;
  requestStatus: string;
  siteStatus: string;
  ownerStatus: string;
  paymentStatus: string;
  selectedPackage: string | null;
  projectStage: string;
  automationMode: string;
  releaseChannel: string;
  stagingUrl: string | null;
  liveUrl: string | null;
  riskScore: number;
  agentCostCents: number;
  currentOperationLabel: string | null;
  currentOperationPercent: number;
  currentOperationState: 'idle' | 'queued' | 'running' | 'blocked' | 'failed' | 'succeeded';
  currentOperationUpdatedAt: string | null;
  activeAddOns: AddOnPurchaseRecord[];
  blockedAddOns: AddOnPurchaseRecord[];
  latestAgentRun: AgentRunRecord | null;
  intakeStatus: string;
  intakeStep: number;
  fileCount: number;
  pipelineStage: PipelineStage;
  nextAction: string;
  urgency: 'high' | 'medium' | 'low';
  completenessScore: number;
  outstandingItems: MissingInput[];
  latestEvent: EventRecord | null;
  buildPacket: BuildPacketRecord | null;
  packetSourceHash: string;
  packetState: 'none' | 'ready' | 'stale' | 'failed';
  isOrphanRequest: boolean;
  operatorStage: OperatorStage;
  operatorStageLabel: string;
  operatorStatusLine: string;
  primaryActionLabel: string;
  primaryActionHref: string;
};

export type AdminOpsSummary = {
  total: number;
  needsAttention: number;
  readyForBuild: number;
  waitingOnOwner: number;
  previewReady: number;
  claimPaymentActive: number;
};

export type AdminOpsData = {
  items: AdminWorkItem[];
  summary: AdminOpsSummary;
  packetsAvailable: boolean;
};

export type AdminSiteDetail = {
  slug: string;
  site: SiteRecord | null;
  request: RequestRecord | null;
  intake: IntakeDetailRecord | null;
  files: FileRecord[];
  siteAssets: SiteAssetRecord[];
  researchSources: ResearchSourceRecord[];
  events: EventRecord[];
  buildBrief: string | null;
  buildPacket: BuildPacketRecord | null;
  packetSourceHash: string;
  packetState: AdminWorkItem['packetState'];
  workItem: AdminWorkItem | null;
  researchAudit: ResearchAuditRecord | null;
  resolvedMenu: ResolvedMenu | null;
  resolvedProfile: ResolvedRestaurantProfile | null;
  strategicProfile: StrategicRestaurantProfile | null;
  siteBrief: ResolvedSiteBrief;
  researchReview: ResearchReviewSummary;
  readiness: {
    score: number;
    missing: MissingInput[];
    scrapeTargets: string[];
    assetNotes: string[];
  };
};

export type ResearchSummary = {
  address: string | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  rating: number | null;
  hours: string[];
  cuisine: string | null;
  menuLinks: string[];
  orderingLinks: string[];
  reservationLinks: string[];
  socialLinks: string[];
  imageCandidates: string[];
  logoCandidates: string[];
};

export type AssetDisplayRecord = ReviewedResearchAsset;

const SITE_SELECT = [
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
  'project_stage',
  'automation_mode',
  'release_channel',
  'staging_url',
  'live_url',
  'risk_score',
  'latest_agent_cost_cents',
  'owner_viewed_at',
  'preview_released_at',
  'build_strategy',
  'generated_file_manifest',
  'deployment_status',
  'subdomain_status',
  'metadata',
].join(', ');

const REQUEST_SELECT = [
  'id',
  'created_at',
  'updated_at',
  'owner_name',
  'email',
  'phone',
  'restaurant_name',
  'city',
  'preferred_language',
  'source',
  'status',
  'notes',
  'instagram_url',
  'google_url',
  'website_url',
  'client_slug',
  'intake_started_at',
  'intake_submitted_at',
  'generated_brief',
  'brief_json',
  'email_verified_at',
  'email_verification_sent_at',
].join(', ');

const INTAKE_SELECT = [
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
  'brief_json',
  'status',
  'last_step',
].join(', ');

const PACKET_SELECT = [
  'id',
  'created_at',
  'request_id',
  'site_id',
  'intake_id',
  'status',
  'source_hash',
  'model',
  'analysis_json',
  'packet_markdown',
  'error_message',
  'generated_by_email',
].join(', ');

const SITE_ASSET_SELECT = [
  'id',
  'created_at',
  'updated_at',
  'site_id',
  'asset_type',
  'status',
  'storage_bucket',
  'storage_path',
  'source_url',
  'source_label',
  'rights_notes',
  'metadata',
].join(', ');

const RESEARCH_SOURCE_SELECT = [
  'id',
  'created_at',
  'updated_at',
  'site_id',
  'request_id',
  'agent_run_id',
  'source_type',
  'url',
  'title',
  'extracted_facts',
  'confidence',
  'captured_at',
  'metadata',
].join(', ');

function byRequestId<T extends { request_id: string | null }>(records: T[] | null) {
  const map = new Map<string, T>();
  for (const record of records ?? []) {
    if (record.request_id) map.set(record.request_id, record);
  }
  return map;
}

function latestEventByKey(events: EventRecord[] | null) {
  const map = new Map<string, EventRecord>();

  for (const event of events ?? []) {
    for (const key of [event.site_id, event.request_id]) {
      if (key && !map.has(key)) map.set(key, event);
    }
  }

  return map;
}

function packetsByKey(packets: BuildPacketRecord[] | null) {
  const map = new Map<string, BuildPacketRecord>();

  for (const packet of packets ?? []) {
    for (const key of [packet.request_id, packet.site_id]) {
      if (key && !map.has(key)) map.set(key, packet);
    }
  }

  return map;
}

function addOnsBySiteId(addOns: AddOnPurchaseRecord[] | null) {
  const map = new Map<string, AddOnPurchaseRecord[]>();

  for (const addOn of addOns ?? []) {
    map.set(addOn.site_id, [...(map.get(addOn.site_id) ?? []), addOn]);
  }

  return map;
}

function latestAgentRunByKey(agentRuns: AgentRunRecord[] | null) {
  const map = new Map<string, AgentRunRecord>();

  for (const run of agentRuns ?? []) {
    for (const key of [run.site_id, run.request_id]) {
      if (key && !map.has(key)) map.set(key, run);
    }
  }

  return map;
}

function fallbackPacketFromRequest(request: RequestRecord | null): BuildPacketRecord | null {
  const packet = plainRecord(plainRecord(request?.brief_json).adminBuildPacket);
  if (!request || !packet.id || !packet.created_at || !packet.source_hash) return null;

  return {
    id: String(packet.id),
    created_at: String(packet.created_at),
    request_id: request.id,
    site_id: typeof packet.site_id === 'string' ? packet.site_id : null,
    intake_id: typeof packet.intake_id === 'string' ? packet.intake_id : null,
    status: packet.status === 'failed' ? 'failed' : 'ready',
    source_hash: String(packet.source_hash),
    model: typeof packet.model === 'string' ? packet.model : 'unknown',
    analysis_json: plainRecord(packet.analysis_json),
    packet_markdown: typeof packet.packet_markdown === 'string' ? packet.packet_markdown : '',
    error_message: typeof packet.error_message === 'string' ? packet.error_message : null,
    generated_by_email: typeof packet.generated_by_email === 'string' ? packet.generated_by_email : null,
  };
}

function isMissingPacketTable(error: { message?: string; code?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === '42P01' ||
        error.message?.includes('admin_build_packets') ||
        error.message?.includes('relation') ||
        error.message?.includes('schema cache'))
  );
}

function isMissingOptionalTable(error: { message?: string; code?: string } | null | undefined, tableName: string) {
  return Boolean(
    error &&
      (error.code === '42P01' ||
        error.message?.includes(tableName) ||
        error.message?.includes('relation') ||
        error.message?.includes('schema cache'))
  );
}

export function cleanAdminValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (
    [
      'none',
      'none yet',
      'non yet',
      'no',
      'nope',
      'n/a',
      'na',
      'not provided',
      'not yet',
      'unknown',
      'null',
      'undefined',
    ].includes(lower)
  ) {
    return null;
  }
  return trimmed;
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
}

function plainRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nestedString(record: unknown, path: string[]) {
  let current: unknown = record;
  for (const key of path) current = plainRecord(current)[key];
  return typeof current === 'string' ? cleanAdminValue(current) : null;
}

function recordNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => cleanAdminValue(value ?? null)).filter((value): value is string => Boolean(value)))];
}

export function summarizeResearchSources(researchSources: ResearchSourceRecord[], siteAssets: SiteAssetRecord[] = []): ResearchSummary {
  const readFirst = (keys: string[]) => {
    for (const source of researchSources) {
      const facts = plainRecord(source.extracted_facts);
      for (const key of keys) {
        const value = cleanAdminValue(typeof facts[key] === 'string' ? String(facts[key]) : null);
        if (value) return value;
      }
    }
    return null;
  };

  const hours = uniqueStrings(
    researchSources.flatMap((source) => {
      const facts = plainRecord(source.extracted_facts);
      if (Array.isArray(facts.hours_weekday_text)) {
        return facts.hours_weekday_text.map((item) => (typeof item === 'string' ? item : null));
      }
      const summary = cleanAdminValue(typeof facts.hours_summary === 'string' ? facts.hours_summary : null);
      return summary ? summary.split('|').map((item) => item.trim()) : [];
    })
  );

  const collectLinks = (types: ResearchSourceRecord['source_type'][]) =>
    uniqueStrings(
      researchSources
        .filter((source) => types.includes(source.source_type))
        .map((source) => source.url)
    );

  const assetCandidates = extractAssetCandidatesFromSources(researchSources);
  const storedAssetCandidates = siteAssets
    .map((asset) => reviewedAssetFromRecord(asset))
    .filter((asset): asset is ReviewedResearchAsset => Boolean(asset));
  const allAssetCandidates = [...assetCandidates, ...storedAssetCandidates];
  const imageCandidates = uniqueStrings(
    allAssetCandidates
      .filter((candidate) => candidate.assetType !== 'logo' && candidate.assetType !== 'screenshot_capture')
      .map((candidate) => candidate.thumbnailUrl || candidate.assetUrl)
  );
  const logoCandidates = uniqueStrings(
    allAssetCandidates
      .filter((candidate) =>
        candidate.assetType === 'logo' ||
        candidate.assetType === 'social_profile_asset'
      )
      .map((candidate) => candidate.thumbnailUrl || candidate.assetUrl)
  );

  let rating: number | null = null;
  for (const source of researchSources) {
    const value = recordNumber(plainRecord(source.extracted_facts).rating);
    if (value !== null) {
      rating = value;
      break;
    }
  }

  return {
    address: readFirst(['address', 'formatted_address']),
    phone: readFirst(['formatted_phone_number', 'international_phone_number', 'phone']),
    website: readFirst(['website']),
    mapsUrl: readFirst(['maps_url']),
    rating,
    hours,
    cuisine: readFirst(['primary_type', 'cuisine']),
    menuLinks: collectLinks(['menu']),
    orderingLinks: collectLinks(['ordering']),
    reservationLinks: collectLinks(['reservations']),
    socialLinks: collectLinks(['instagram', 'facebook']),
    imageCandidates,
    logoCandidates,
  };
}

function deriveResolvedProfile({
  site,
  request,
  intake,
  researchSources,
  siteAssets,
  researchReview,
}: {
  site: SiteRecord | null;
  request: RequestRecord | null;
  intake: IntakeDetailRecord | null;
  researchSources: ResearchSourceRecord[];
  siteAssets: SiteAssetRecord[];
  researchReview: ResearchReviewSummary;
}) {
  const researchSummary = summarizeResearchSources(researchSources, siteAssets);
  const audit = readResearchAudit(site?.metadata);
  const stored = readResolvedProfile(site?.metadata);
  const base = stored ?? audit?.resolvedProfile ?? null;
  const reviewedAssets = siteAssets
    .map((asset) => reviewedAssetFromRecord(asset))
    .filter((asset): asset is ReviewedResearchAsset => Boolean(asset));
  const assetsByKey = new Map(reviewedAssets.map((asset) => [asset.assetKey, asset]));
  const preferredLogoKey =
    researchReview.state.assetDecisions.canonicalLogoAssetKey ??
    audit?.canonicalAssets.logoAssetKey ??
    base?.logo.assetKey ??
    null;
  const canonicalLogoKey =
    preferredLogoKey &&
    (() => {
      const asset = assetsByKey.get(preferredLogoKey);
      return asset && (asset.assetType === 'logo' || asset.assetType === 'social_profile_asset') ? preferredLogoKey : null;
    })();
  const approvedPhotoKeys =
    (
      researchReview.state.assetDecisions.approvedPhotoAssetKeys.length
        ? researchReview.state.assetDecisions.approvedPhotoAssetKeys
        : audit?.canonicalAssets.approvedPhotoAssetKeys ??
          base?.photos.assetKeys ??
          []
    ).filter((assetKey) => {
      const asset = assetsByKey.get(assetKey);
      return Boolean(asset && ['cover_photo', 'food_photo', 'interior_photo', 'social_profile_asset'].includes(asset.assetType));
    });
  const selectedRestaurantName = researchReview.state.factDecisions.restaurantName;
  const selectedAddress = researchReview.state.factDecisions.address;
  const selectedPhone = researchReview.state.factDecisions.phone;
  const selectedHours = researchReview.state.factDecisions.hoursSummary
    ? researchReview.state.factDecisions.hoursSummary.split('|').map((item) => item.trim()).filter(Boolean)
    : [];
  const effectiveDecisions = researchReview.effectiveDecisions;

  return {
    restaurantName:
      selectedRestaurantName ??
      base?.restaurantName ??
      site?.restaurant_name ??
      request?.restaurant_name ??
      'Unknown restaurant',
    cuisine: base?.cuisine ?? cleanAdminValue(intake?.cuisine) ?? researchSummary.cuisine,
    address: selectedAddress ?? base?.address ?? cleanAdminValue(intake?.address) ?? researchSummary.address,
    phone: selectedPhone ?? base?.phone ?? researchSummary.phone ?? cleanAdminValue(request?.phone),
    hours: selectedHours.length ? selectedHours : base?.hours?.length ? base.hours : researchSummary.hours,
    mapsUrl: base?.mapsUrl ?? researchSummary.mapsUrl,
    rating: base?.rating ?? researchSummary.rating,
    neighborhood: base?.neighborhood ?? cleanAdminValue(intake?.neighborhood),
    city: base?.city ?? site?.city ?? request?.city ?? null,
    officialSiteUrl:
      effectiveDecisions.officialSiteUrl ??
      audit?.canonicalSources.officialSiteUrl ??
      base?.officialSiteUrl ??
      researchSummary.website ??
      cleanAdminValue(intake?.current_website ?? request?.website_url),
    primaryWebPresenceUrl:
      effectiveDecisions.primaryWebPresenceUrl ??
      audit?.canonicalSources.primaryWebPresenceUrl ??
      base?.primaryWebPresenceUrl ??
      researchReview.state.sourceDecisions.primaryWebPresenceUrl ??
      researchReview.state.sourceDecisions.confirmedSocialUrls[0] ??
      researchSummary.socialLinks[0] ??
      researchSummary.website ??
      null,
    noOfficialWebsite:
      effectiveDecisions.noOfficialSite ||
      audit?.canonicalSources.noOfficialWebsite ||
      base?.noOfficialWebsite ||
      false,
    menuSourceUrl:
      effectiveDecisions.menuSourceUrl ??
      audit?.canonicalSources.menuSourceUrl ??
      base?.menuSourceUrl ??
      cleanAdminValue(intake?.menu_url) ??
      researchSummary.menuLinks[0] ??
      null,
    menuEvidence: [
      ...new Set([
        ...(audit?.canonicalSources.menuEvidence ?? []),
        ...(base?.menuEvidence ?? []),
        ...researchSummary.menuLinks,
      ]),
    ],
    noStructuredMenu:
      effectiveDecisions.noMenuSource ||
      audit?.canonicalSources.noStructuredMenu ||
      base?.noStructuredMenu ||
      false,
    orderingUrls:
      audit?.canonicalSources.orderingUrls?.length
        ? audit.canonicalSources.orderingUrls
        : base?.orderingUrls?.length
          ? base.orderingUrls
          : researchSummary.orderingLinks,
    reservationUrls:
      audit?.canonicalSources.reservationUrls?.length
        ? audit.canonicalSources.reservationUrls
        : base?.reservationUrls?.length
          ? base.reservationUrls
          : researchSummary.reservationLinks,
    confirmedSocialUrls:
      effectiveDecisions.confirmedSocialUrls.length
        ? effectiveDecisions.confirmedSocialUrls
        : audit?.canonicalSources.confirmedSocialUrls?.length
          ? audit.canonicalSources.confirmedSocialUrls
          : base?.confirmedSocialUrls?.length
            ? base.confirmedSocialUrls
            : researchSummary.socialLinks,
    brandDirection: base?.brandDirection ?? [],
    logo: {
      assetKey: canonicalLogoKey,
      strategy:
        researchReview.state.assetDecisions.logoStrategy ??
        audit?.canonicalAssets.logoStrategy ??
        base?.logo.strategy ??
        null,
    },
    photos: {
      assetKeys: approvedPhotoKeys,
      strategy:
        researchReview.state.assetDecisions.photoStrategy ??
        audit?.canonicalAssets.photoStrategy ??
        base?.photos.strategy ??
        null,
    },
    missingItems: base?.missingItems ?? [],
    uncertainItems: base?.uncertainItems ?? [],
    evidenceNotes: [
      ...(base?.evidenceNotes ?? []),
      ...(audit?.summary?.rationale ? [audit.summary.rationale] : []),
      ...(canonicalLogoKey && assetsByKey.get(canonicalLogoKey)?.title ? [`Logo candidate: ${assetsByKey.get(canonicalLogoKey)?.title}`] : []),
    ],
  } satisfies ResolvedRestaurantProfile;
}

function hasUsefulJson(value: unknown) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

function addMissing(
  missing: MissingInput[],
  condition: boolean,
  label: string,
  severity: MissingInput['severity'],
  guidance: string
) {
  if (!condition) missing.push({ label, severity, guidance });
}

function buildReadiness({
  site,
  request,
  intake,
  files,
  siteAssets,
  researchSources,
}: {
  site: SiteRecord | null;
  request: RequestRecord;
  intake: IntakeDetailRecord | null;
  files: FileRecord[];
  siteAssets: SiteAssetRecord[];
  researchSources: ResearchSourceRecord[];
}) {
  const menuNotes = plainRecord(intake?.menu_notes);
  const pagePlan = plainRecord(menuNotes.pagePlan);
  const research = plainRecord(menuNotes.researchInputs);
  const researchSummary = summarizeResearchSources(researchSources, siteAssets);
  const reviewSummary = summarizeResearchReview({
    siteMetadata: site?.metadata,
    siteName: site?.restaurant_name ?? request.restaurant_name,
    researchSources,
    siteAssets,
  });
  const resolvedProfile = deriveResolvedProfile({
    site,
    request,
    intake,
    researchSources,
    siteAssets,
    researchReview: reviewSummary,
  });
  const resolvedMenu = reviewSummary.resolvedMenu;
  const strategicProfile = readStrategicProfile(site?.metadata);
  const features = stringArray(intake?.feature_requests);
  const assetLinks = stringArray(intake?.asset_links);
  const links = [
    intake?.current_website ?? request.website_url,
    intake?.instagram_url ?? request.instagram_url,
    intake?.google_business_url ?? request.google_url,
    intake?.facebook_url,
    intake?.menu_url,
    researchSummary.website,
    researchSummary.mapsUrl,
    ...researchSummary.socialLinks,
    ...researchSummary.menuLinks,
    ...researchSummary.orderingLinks,
    ...researchSummary.reservationLinks,
    ...assetLinks,
    nestedString(research, ['otherSocialLinks']),
  ].filter((value): value is string => Boolean(cleanAdminValue(value)));

  const missing: MissingInput[] = [];
  addMissing(missing, Boolean(cleanAdminValue(request.restaurant_name)), 'Restaurant name', 'critical', 'Confirm the restaurant name that should appear in the hero and metadata.');
  addMissing(missing, Boolean(cleanAdminValue(request.phone) || cleanAdminValue(request.email)), 'Owner contact', 'critical', 'Capture at least one reliable owner contact for follow-up.');
  addMissing(missing, Boolean(cleanAdminValue(intake?.cuisine) || resolvedProfile.cuisine), 'Cuisine', 'critical', 'Needed for copy, imagery, menu structure, and local SEO.');
  addMissing(
    missing,
    Boolean(
      resolvedMenu?.status === 'structured_menu' ||
      resolvedMenu?.status === 'partial_menu' ||
      resolvedMenu?.status === 'menu_evidence_only' ||
      resolvedProfile.menuSourceUrl ||
      cleanAdminValue(menuNotes.source as string) ||
      cleanAdminValue(menuNotes.notes as string) ||
      researchSummary.menuLinks.length ||
      resolvedProfile.noStructuredMenu
    ),
    'Menu source',
    'critical',
    'Provide a menu URL, uploaded menu, or notes that identify dishes and prices.'
  );
  addMissing(missing, hasUsefulJson(intake?.hours) || resolvedProfile.hours.length > 0, 'Hours', 'critical', 'Needed for footer, contact section, and Google-friendly restaurant details.');
  addMissing(missing, Boolean(nestedString(pagePlan, ['primaryAction']) || features.length || resolvedProfile.orderingUrls.length || resolvedProfile.reservationUrls.length || resolvedProfile.phone || resolvedProfile.mapsUrl || resolvedProfile.menuSourceUrl), 'Primary conversion action', 'critical', 'Choose the main action: call, WhatsApp, ordering, reservations, directions, or menu browsing.');
  addMissing(
    missing,
    Boolean(
      cleanAdminValue(intake?.brand_style) ||
      cleanAdminValue(intake?.brand_notes) ||
      strategicProfile?.visualDirection.length ||
      strategicProfile?.businessType ||
      resolvedProfile.brandDirection.length
    ),
    'Brand/style direction',
    'helpful',
    'Needed to avoid a generic restaurant template.'
  );
  addMissing(missing, Boolean(nestedString(research, ['logoStatus']) || files.some((file) => file.file_role.includes('logo')) || reviewSummary.canonicalLogo || reviewSummary.state.assetDecisions.logoStrategy || researchSummary.logoCandidates.length || resolvedProfile.logo.assetKey), 'Logo status', 'helpful', 'State whether to use an approved logo asset, a text mark, or a generated placeholder.');
  addMissing(missing, Boolean(nestedString(research, ['photoStatus']) || files.length || reviewSummary.approvedPhotos.length || reviewSummary.state.assetDecisions.photoStrategy || links.length || researchSummary.imageCandidates.length || resolvedProfile.photos.assetKeys.length), 'Photo source', 'helpful', 'Tell the build agent where usable restaurant photos should come from.');
  addMissing(missing, Boolean(cleanAdminValue(intake?.address) || cleanAdminValue(intake?.neighborhood) || resolvedProfile.address), 'Address/neighborhood', 'helpful', 'Improves directions, local SEO, and footer trust.');
  addMissing(
    missing,
    Boolean(cleanAdminValue(intake?.differentiators) || strategicProfile?.uniqueSellingProposition || strategicProfile?.siteRecommendations.length),
    'Differentiators',
    'optional',
    'Helps the preview feel specific instead of merely polished.'
  );
  addMissing(missing, reviewSummary.blockers.length === 0, 'Hard blockers cleared', 'critical', 'We still need the minimum viable facts and CTA path before autopilot can keep moving.');

  const criticalMissing = missing.filter((item) => item.severity === 'critical').length;
  const helpfulMissing = missing.filter((item) => item.severity === 'helpful').length;
  const optionalMissing = missing.filter((item) => item.severity === 'optional').length;
  const reviewPenalty = reviewSummary.overrideStatus === 'required' ? 10 : 0;
  const score = Math.max(0, Math.min(100, 100 - criticalMissing * 16 - helpfulMissing * 8 - optionalMissing * 4 - reviewPenalty));

  const scrapeTargets = uniqueStrings([
    intake?.current_website ?? request.website_url,
    intake?.google_business_url ?? request.google_url,
    intake?.instagram_url ?? request.instagram_url,
    intake?.facebook_url,
    intake?.menu_url,
    intake?.ordering_url,
    intake?.reservations_url,
    researchSummary.website,
    researchSummary.mapsUrl,
    ...researchSummary.socialLinks,
    ...researchSummary.menuLinks,
    ...researchSummary.orderingLinks,
    ...researchSummary.reservationLinks,
    ...assetLinks,
    nestedString(research, ['otherSocialLinks']),
  ]);

  const assetNotes = [
    nestedString(research, ['logoStatus'])
      ? `Logo: ${nestedString(research, ['logoStatus'])}`
      : reviewSummary.canonicalLogo
        ? `Canonical logo approved from ${reviewSummary.canonicalLogo.sourceType.replaceAll('_', ' ')}.`
        : resolvedProfile.logo.strategy === 'text_mark'
          ? 'Logo strategy set to text mark.'
          : resolvedProfile.logo.strategy === 'generated_placeholder'
            ? 'Logo strategy set to generated placeholder.'
        : researchSummary.logoCandidates.length
          ? 'Logo candidates found; review and choose one before packet/build.'
          : 'Logo status unknown; decide whether to use a public logo, text mark, or generated placeholder.',
    nestedString(research, ['photoStatus'])
      ? `Photos: ${nestedString(research, ['photoStatus'])}`
      : reviewSummary.approvedPhotos.length || resolvedProfile.photos.assetKeys.length
        ? `${reviewSummary.approvedPhotos.length} approved photo candidate${reviewSummary.approvedPhotos.length === 1 ? '' : 's'} ready.`
        : resolvedProfile.photos.strategy === 'tasteful_placeholders'
          ? 'Photo strategy set to tasteful placeholders.'
        : researchSummary.imageCandidates.length
          ? 'Photo/image candidates found; review and approve a usable set.'
          : 'Photo source unknown; inspect public links or use tasteful placeholders until real assets arrive.',
    files.length ? `${files.length} uploaded file${files.length === 1 ? '' : 's'} available.` : 'No uploaded files yet.',
    ...reviewSummary.blockers.slice(0, 2),
  ];

  return { score, missing, scrapeTargets, assetNotes, reviewSummary };
}

function makeFallbackUrls(slug: string) {
  return {
    previewUrl: `/preview/${slug}`,
    claimUrl: `/claim/${slug}`,
  };
}

function operatorStageInfo(params: {
  slug: string;
  siteStatus: string;
  paymentStatus: string;
  pipelineStage: PipelineStage;
  currentOperationState: AdminWorkItem['currentOperationState'];
  currentOperationLabel: string | null;
  currentOperationPercent: number;
  currentOperationTaskType: string | null;
  reviewSummary: ResearchReviewSummary;
  stagingUrl: string | null;
  liveUrl: string | null;
}) {
  const currentTask = params.currentOperationTaskType;
  const active = params.currentOperationState === 'queued' || params.currentOperationState === 'running';
  const stageLabel = (stage: OperatorStage) => {
    switch (stage) {
      case 'researching':
        return 'Researching';
      case 'research_collection':
        return 'Research collection';
      case 'ai_reviewing':
        return 'AI reviewing';
      case 'build_brief':
        return 'Build brief';
      case 'code_build':
        return 'Code build';
      case 'deploy':
        return 'Deploying';
      case 'qa':
        return 'QA';
      case 'building_preview':
        return 'Building preview';
      case 'preview_ready':
        return 'Preview ready';
      case 'published':
        return 'Published';
      case 'needs_help':
        return 'Needs help';
    }
  };

  let stage: OperatorStage;
  let statusLine: string;
  let primaryActionLabel: string;
  let primaryActionHref: string;

  if (params.liveUrl || params.siteStatus === 'live' || params.paymentStatus === 'paid' || params.pipelineStage === 'Paid/live' || params.pipelineStage === 'Live/complete') {
    stage = 'published';
    statusLine = 'The site is live. Use Prompt Studio for updates or roll back if needed.';
    primaryActionLabel = 'Open Prompt Studio';
    primaryActionHref = `/admin/sites/${params.slug}/studio`;
  } else if (
    params.pipelineStage === 'Needs your help' ||
    params.pipelineStage === 'Needs info' ||
    params.pipelineStage === 'QA failed' ||
    params.reviewSummary.overrideStatus === 'required'
  ) {
    stage = 'needs_help';
    statusLine =
      params.reviewSummary.blockers[0] ??
      (params.pipelineStage === 'QA failed'
        ? 'The latest preview did not pass QA and needs a human fix.'
        : 'We need one more human decision before the system can keep moving.');
    primaryActionLabel = 'Fix blocker';
    primaryActionHref = `/admin/sites/${params.slug}/review`;
  } else if (currentTask === 'research_collect' && active) {
    stage = 'research_collection';
    statusLine = params.currentOperationLabel ?? 'Research is gathering facts, menu clues, screenshots, and assets.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (
    (currentTask === 'research' && active) ||
    ['Request received', 'Collecting evidence', 'Researching', 'Waiting on owner', 'Intake incomplete'].includes(params.pipelineStage)
  ) {
    stage = 'researching';
    statusLine = params.currentOperationLabel ?? 'We are gathering facts, menu clues, and assets.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (currentTask === 'ai_review' && active) {
    stage = 'ai_reviewing';
    statusLine = params.currentOperationLabel ?? 'AI Review is verifying evidence and filling project gaps.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (
    ['AI audit', 'AI finished research', 'Research review'].includes(params.pipelineStage)
  ) {
    stage = 'ai_reviewing';
    statusLine = params.currentOperationLabel ?? 'AI is resolving the best available truth and preparing the build brief.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (
    ((currentTask === 'build_brief' || currentTask === 'build_packet') && active) ||
    ['Generating packet', 'Packet ready', 'Build packet ready', 'Ready for build'].includes(params.pipelineStage)
  ) {
    stage = 'build_brief';
    statusLine = params.currentOperationLabel ?? 'The AI project manager is writing the final build brief.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (currentTask === 'code_build' && active) {
    stage = 'code_build';
    statusLine = params.currentOperationLabel ?? 'The build agent is generating and committing site code.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (currentTask === 'deploy' && active) {
    stage = 'deploy';
    statusLine = params.currentOperationLabel ?? 'Vercel deployment and subdomain setup are in progress.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (currentTask === 'qa' && active) {
    stage = 'qa';
    statusLine = params.currentOperationLabel ?? 'QA is checking the generated preview before release.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (
    ((currentTask === 'code_build' || currentTask === 'deploy' || currentTask === 'qa') && active) ||
    ['Build queued', 'Building', 'Claim/payment active'].includes(params.pipelineStage)
  ) {
    stage = 'building_preview';
    statusLine = params.currentOperationLabel ?? 'We are building the preview and running QA.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  } else if (
    params.stagingUrl ||
    ['Ready for admin review', 'Preview ready', 'Preview sent', 'Viewed'].includes(params.pipelineStage)
  ) {
    stage = 'preview_ready';
    statusLine = 'The preview is ready to review, refine, and publish.';
    primaryActionLabel = 'Open Prompt Studio';
    primaryActionHref = `/admin/sites/${params.slug}/studio`;
  } else {
    stage = 'researching';
    statusLine = params.currentOperationLabel ?? 'We are moving this restaurant through the pipeline.';
    primaryActionLabel = 'Open project';
    primaryActionHref = `/admin/sites/${params.slug}`;
  }

  return {
    stage,
    label: stageLabel(stage),
    statusLine,
    primaryActionLabel,
    primaryActionHref,
  };
}

function stageLabel(projectStage: string | null | undefined): PipelineStage | null {
  switch (projectStage) {
    case 'request_received':
      return 'Request received';
    case 'collecting_evidence':
      return 'Collecting evidence';
    case 'ai_audit':
      return 'AI audit';
    case 'resolved_profile_ready':
      return 'AI finished research';
    case 'admin_review_required':
      return 'Needs your help';
    case 'researching':
      return 'Researching';
    case 'needs_info':
      return 'Needs info';
    case 'build_packet_ready':
      return 'Packet ready';
    case 'building':
      return 'Build queued';
    case 'qa_failed':
      return 'QA failed';
    case 'ready_for_admin_review':
      return 'Ready for admin review';
    case 'preview_sent':
      return 'Preview sent';
    case 'viewed':
      return 'Viewed';
    case 'claim_started':
      return 'Claim started';
    case 'paid_live':
      return 'Paid/live';
    case 'reclaim_cancelled':
      return 'Reclaim/cancelled';
    case 'archived':
      return 'Archived/lost';
    default:
      return null;
  }
}

function stageLabelFromResearchPhase(siteMetadata: Record<string, unknown> | null | undefined): PipelineStage | null {
  const phase = cleanAdminValue(typeof plainRecord(plainRecord(siteMetadata).research_pipeline).current_phase === 'string'
    ? String(plainRecord(plainRecord(siteMetadata).research_pipeline).current_phase)
    : null);

  switch (phase) {
    case 'collecting_evidence':
      return 'Collecting evidence';
    case 'ai_audit':
      return 'AI audit';
    case 'resolved_profile_ready':
      return 'AI finished research';
    case 'admin_review_required':
      return 'Needs your help';
    case 'needs_info':
      return 'Needs info';
    default:
      return null;
  }
}

export function getPacketSourceHash({
  site,
  request,
  intake,
  files,
  siteAssets = [],
  researchSources = [],
}: {
  site: SiteRecord | null;
  request: RequestRecord | null;
  intake: IntakeDetailRecord | null;
  files: FileRecord[];
  siteAssets?: SiteAssetRecord[];
  researchSources?: ResearchSourceRecord[];
}) {
  const requestForHash = request
    ? Object.fromEntries(Object.entries(request).filter(([key]) => key !== 'brief_json'))
    : null;

  return createHash('sha256')
    .update(
      JSON.stringify({
        site: site
          ? {
              slug: site.slug,
              preview_url: site.preview_url,
              claim_url: site.claim_url,
              metadata: site.metadata ?? null,
            }
          : null,
        request: requestForHash,
        intake,
        files: files.map((file) => ({
          file_role: file.file_role,
          file_name: file.file_name,
          content_type: file.content_type,
          size_bytes: file.size_bytes,
        })),
        siteAssets: siteAssets.map((asset) => ({
          asset_type: asset.asset_type,
          status: asset.status,
          source_url: asset.source_url,
          source_label: asset.source_label,
          metadata: asset.metadata,
        })),
        researchSources: researchSources.map((source) => ({
          source_type: source.source_type,
          url: source.url,
          title: source.title,
          confidence: source.confidence,
          extracted_facts: source.extracted_facts,
        })),
      })
    )
    .digest('hex');
}

function makeWorkItem({
  site,
  request,
  intake,
  files,
  siteAssets,
  researchSources,
  latestEvent,
  buildPacket,
  addOns,
  latestAgentRun,
}: {
  site: SiteRecord | null;
  request: RequestRecord;
  intake: IntakeDetailRecord | null;
  files: FileRecord[];
  siteAssets: SiteAssetRecord[];
  researchSources: ResearchSourceRecord[];
  latestEvent: EventRecord | null;
  buildPacket: BuildPacketRecord | null;
  addOns: AddOnPurchaseRecord[];
  latestAgentRun: AgentRunRecord | null;
}): AdminWorkItem {
  const slug = site?.slug ?? request.client_slug;
  const urls = makeFallbackUrls(slug);
  const readiness = buildReadiness({ site, request, intake, files, siteAssets, researchSources });
  const packetSourceHash = getPacketSourceHash({ site, request, intake, files, siteAssets, researchSources });
  const packetState =
    buildPacket?.status === 'failed'
      ? 'failed'
      : buildPacket?.status === 'ready'
        ? buildPacket.source_hash === packetSourceHash
          ? 'ready'
          : 'stale'
        : 'none';
  const siteStatus = site?.status ?? 'request_only';
  const ownerStatus = site?.owner_status ?? 'unclaimed';
  const paymentStatus = site?.payment_status ?? 'unpaid';
  const intakeStatus = intake?.status ?? request.status ?? 'new';
  const siteMetadata = plainRecord(site?.metadata);
  const persistedOperation = plainRecord(siteMetadata.current_operation);
  const runMetadata = plainRecord(latestAgentRun?.metadata);
  const runProgress = plainRecord(runMetadata.progress);
  const currentOperationLabel =
    cleanAdminValue(typeof runProgress.label === 'string' ? runProgress.label : null) ??
    cleanAdminValue(typeof persistedOperation.label === 'string' ? persistedOperation.label : null) ??
    (latestAgentRun ? latestAgentRun.task_type.replaceAll('_', ' ') : null);
  const currentOperationPercent =
    typeof runProgress.percent === 'number'
      ? Math.max(0, Math.min(100, Math.round(runProgress.percent)))
      : typeof persistedOperation.percent === 'number'
        ? Math.max(0, Math.min(100, Math.round(persistedOperation.percent)))
      : latestAgentRun?.status === 'succeeded'
        ? 100
        : latestAgentRun?.status === 'queued'
          ? 5
          : latestAgentRun?.status === 'running'
            ? 15
            : 0;
  const currentOperationState =
    latestAgentRun?.status === 'queued' || latestAgentRun?.status === 'running' || latestAgentRun?.status === 'blocked' || latestAgentRun?.status === 'failed' || latestAgentRun?.status === 'succeeded'
      ? latestAgentRun.status
      : typeof persistedOperation.status === 'string' &&
          ['idle', 'queued', 'running', 'blocked', 'failed', 'succeeded'].includes(persistedOperation.status)
        ? persistedOperation.status as AdminWorkItem['currentOperationState']
      : 'idle';
  const currentOperationUpdatedAt =
    cleanAdminValue(typeof persistedOperation.updated_at === 'string' ? persistedOperation.updated_at : null) ??
    latestAgentRun?.updated_at ??
    null;

  const explicitStage = stageLabelFromResearchPhase(siteMetadata) ?? stageLabel(site?.project_stage);
  let pipelineStage: PipelineStage = explicitStage ?? 'New request';
  if (explicitStage) {
    // Keep explicit lifecycle stages authoritative once the autonomous schema is applied.
  } else if (['archived', 'lost', 'cancelled', 'refunded'].includes(siteStatus) || ['lost', 'archived'].includes(request.status)) {
    pipelineStage = 'Archived/lost';
  } else if (['live', 'paid'].includes(siteStatus) || paymentStatus === 'paid') {
    pipelineStage = 'Live/complete';
  } else if (paymentStatus === 'checkout_started' || ownerStatus === 'claim_started' || siteStatus === 'claim_started') {
    pipelineStage = 'Claim/payment active';
  } else if (siteStatus === 'preview_ready') {
    pipelineStage = 'Preview ready';
  } else if (intake?.status === 'complete' || request.status === 'brief_ready') {
    pipelineStage = 'Ready for build';
  } else if (intake?.status === 'draft' || request.status === 'intake_started') {
    pipelineStage = 'Intake incomplete';
  } else if (!intake) {
    pipelineStage = 'Waiting on owner';
  }
  if (!explicitStage && (site?.metadata as Record<string, unknown> | null)?.research_review && !readiness.reviewSummary.readyForPacket && readiness.score > 0) {
    pipelineStage = 'Research review';
  }
  if (latestAgentRun?.task_type === 'research_collect' && ['queued', 'running'].includes(latestAgentRun.status)) {
    pipelineStage = 'Collecting evidence';
  }
  if (latestAgentRun?.task_type === 'ai_review' && ['queued', 'running'].includes(latestAgentRun.status)) {
    pipelineStage = 'AI audit';
  }
  if ((latestAgentRun?.task_type === 'build_brief' || latestAgentRun?.task_type === 'build_packet') && ['queued', 'running'].includes(latestAgentRun.status)) {
    pipelineStage = 'Generating packet';
  }
  if (latestAgentRun?.task_type === 'code_build' && ['queued', 'running'].includes(latestAgentRun.status)) {
    pipelineStage = 'Build queued';
  }
  if (latestAgentRun?.task_type === 'deploy' && ['queued', 'running'].includes(latestAgentRun.status)) {
    pipelineStage = 'Building';
  }
  if (latestAgentRun?.task_type === 'qa' && ['queued', 'running'].includes(latestAgentRun.status)) {
    pipelineStage = 'Building';
  }

  let nextAction = 'Review request';
  if (!site) nextAction = 'Create or repair site record';
  if (pipelineStage === 'Request received') nextAction = 'Start research or request missing intake';
  if (pipelineStage === 'Collecting evidence') nextAction = 'Watch evidence gathering and source capture';
  if (pipelineStage === 'AI audit') nextAction = 'Wait for GPT-5.5 to judge the evidence dossier';
  if (pipelineStage === 'AI finished research') nextAction = 'Open the project and keep an eye on packet generation';
  if (pipelineStage === 'Needs your help') nextAction = 'Review the few low-confidence AI choices';
  if (pipelineStage === 'Generating packet') nextAction = 'Wait for the build packet to finish generating';
  if (pipelineStage === 'Researching') nextAction = 'Watch crawl/research output';
  if (pipelineStage === 'Research review') nextAction = 'Review or override the AI choices';
  if (pipelineStage === 'Needs info') nextAction = 'Request missing owner details';
  if (pipelineStage === 'Build packet ready' || pipelineStage === 'Packet ready') nextAction = 'Start build branch from packet';
  if (pipelineStage === 'Building' || pipelineStage === 'Build queued') nextAction = 'Monitor build agent and preview deployment';
  if (pipelineStage === 'QA failed') nextAction = 'Review QA failure and send agent feedback';
  if (pipelineStage === 'Ready for admin review') nextAction = 'Review staged preview and approve release';
  if (pipelineStage === 'Preview sent') nextAction = 'Watch owner view and follow up';
  if (pipelineStage === 'Viewed') nextAction = 'Follow up while preview is fresh';
  if (pipelineStage === 'Claim started') nextAction = 'Monitor checkout and remove friction';
  if (pipelineStage === 'Paid/live') nextAction = 'Confirm launch and support handoff';
  if (pipelineStage === 'Reclaim/cancelled') nextAction = 'Keep reclaim path available';
  if (pipelineStage === 'Waiting on owner') nextAction = 'Send or resume intake link';
  if (pipelineStage === 'Intake incomplete') nextAction = `Help owner finish intake step ${intake?.last_step ?? 0}`;
  if (pipelineStage === 'Ready for build') {
    nextAction = packetState === 'ready' ? 'Hand off build packet to IDE agent' : 'Generate build packet';
  }
  if (packetState === 'stale') nextAction = 'Regenerate stale build packet';
  if (pipelineStage === 'Preview ready') nextAction = 'Follow up so owner claims preview';
  if (pipelineStage === 'Claim/payment active') nextAction = 'Monitor checkout and remove friction';
  if (pipelineStage === 'Live/complete') nextAction = 'Confirm launch and support handoff';

  const urgency =
    !site ||
    packetState === 'failed' ||
    paymentStatus === 'checkout_started' ||
    pipelineStage === 'QA failed' ||
    pipelineStage === 'Needs info' ||
    pipelineStage === 'Needs your help' ||
    addOns.some((addOn) => addOn.status === 'blocked' || addOn.status === 'needs_access') ||
    readiness.missing.some((item) => item.severity === 'critical')
      ? 'high'
      : ['Ready for build', 'Build packet ready', 'Packet ready', 'Ready for admin review', 'AI finished research', 'Generating packet', 'Build queued'].includes(pipelineStage) || packetState === 'stale'
        ? 'medium'
        : 'low';

  const operator = operatorStageInfo({
    slug,
    siteStatus,
    paymentStatus,
    pipelineStage,
    currentOperationState,
    currentOperationLabel,
    currentOperationPercent,
    currentOperationTaskType: latestAgentRun?.task_type ?? (typeof persistedOperation.task_type === 'string' ? persistedOperation.task_type : null),
    reviewSummary: readiness.reviewSummary,
    stagingUrl: site?.staging_url ?? null,
    liveUrl: site?.live_url ?? null,
  });

  return {
    id: site?.id ?? request.id,
    requestId: request.id,
    siteId: site?.id ?? null,
    slug,
    restaurantName: site?.restaurant_name ?? request.restaurant_name,
    city: site?.city ?? request.city ?? null,
    ownerName: site?.owner_name ?? request.owner_name,
    ownerEmail: site?.owner_email ?? request.email,
    ownerPhone: site?.owner_phone ?? request.phone,
    previewUrl: site?.live_url ?? site?.staging_url ?? site?.preview_url ?? urls.previewUrl,
    claimUrl: site?.claim_url ?? urls.claimUrl,
    previewType: site?.preview_type ?? 'native',
    createdAt: request.created_at ?? site?.created_at,
    updatedAt: site?.updated_at ?? intake?.updated_at ?? request.updated_at ?? request.created_at,
    requestStatus: request.status,
    siteStatus,
    ownerStatus,
    paymentStatus,
    selectedPackage: site?.selected_package ?? null,
    projectStage: site?.project_stage ?? 'request_only',
    automationMode: site?.automation_mode ?? 'admin_gate',
    releaseChannel: site?.release_channel ?? 'preview',
    stagingUrl: site?.staging_url ?? null,
    liveUrl: site?.live_url ?? null,
    riskScore: site?.risk_score ?? 0,
    agentCostCents: site?.latest_agent_cost_cents ?? latestAgentRun?.cost_cents ?? 0,
    currentOperationLabel,
    currentOperationPercent,
    currentOperationState,
    currentOperationUpdatedAt,
    activeAddOns: addOns.filter((addOn) => addOn.status === 'active' || addOn.status === 'in_setup' || addOn.status === 'needs_access'),
    blockedAddOns: addOns.filter((addOn) => addOn.status === 'blocked' || addOn.status === 'needs_access'),
    latestAgentRun,
    intakeStatus,
    intakeStep: intake?.last_step ?? 0,
    fileCount: files.length,
    pipelineStage,
    nextAction,
    urgency,
    completenessScore: readiness.score,
    outstandingItems: readiness.missing,
    latestEvent,
    buildPacket,
    packetSourceHash,
    packetState,
    isOrphanRequest: !site,
    operatorStage: operator.stage,
    operatorStageLabel: operator.label,
    operatorStatusLine: operator.statusLine,
    primaryActionLabel: operator.primaryActionLabel,
    primaryActionHref: operator.primaryActionHref,
  };
}

async function getLatestAgentRuns({ siteIds, requestIds }: { siteIds: string[]; requestIds: string[] }) {
  if (!siteIds.length && !requestIds.length) return [] as AgentRunRecord[];
  const supabase = getSupabaseAdmin();
  const filters = [
    siteIds.length ? `site_id.in.(${siteIds.join(',')})` : null,
    requestIds.length ? `request_id.in.(${requestIds.join(',')})` : null,
  ].filter(Boolean).join(',');
  const { data, error } = await supabase
    .from('agent_runs')
    .select('id, created_at, updated_at, started_at, finished_at, site_id, request_id, task_type, provider, model, status, cost_cents, error_message, metadata')
    .or(filters)
    .order('created_at', { ascending: false })
    .limit(500);

  if (isMissingOptionalTable(error, 'agent_runs')) return [];
  if (error) {
    console.error('[Admin Dashboard] Agent run lookup failed:', error);
    return [];
  }

  return (data ?? []) as unknown as AgentRunRecord[];
}

async function getAddOnPurchases(siteIds: string[]) {
  if (!siteIds.length) return [] as AddOnPurchaseRecord[];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('addon_purchases')
    .select('id, site_id, add_on_key, status, setup_price_cents, monthly_price_cents, current_period_end')
    .in('site_id', siteIds)
    .order('created_at', { ascending: false });

  if (isMissingOptionalTable(error, 'addon_purchases')) return [];
  if (error) {
    console.error('[Admin Dashboard] Add-on lookup failed:', error);
    return [];
  }

  return (data ?? []) as unknown as AddOnPurchaseRecord[];
}

async function getLatestBuildPackets({ requestIds, siteIds }: { requestIds: string[]; siteIds: string[] }) {
  if (!requestIds.length && !siteIds.length) return { packets: [] as BuildPacketRecord[], available: true };

  const supabase = getSupabaseAdmin();
  const filters = [
    requestIds.length ? `request_id.in.(${requestIds.join(',')})` : null,
    siteIds.length ? `site_id.in.(${siteIds.join(',')})` : null,
  ].filter(Boolean).join(',');
  const { data, error } = await supabase
    .from('admin_build_packets')
    .select(PACKET_SELECT)
    .or(filters)
    .order('created_at', { ascending: false });

  if (isMissingPacketTable(error)) return { packets: [] as BuildPacketRecord[], available: false };
  if (error) {
    console.error('[Admin Dashboard] Build packet lookup failed:', error);
    return { packets: [] as BuildPacketRecord[], available: true };
  }

  return { packets: (data ?? []) as unknown as BuildPacketRecord[], available: true };
}

async function withSignedFileUrls(files: FileRecord[]) {
  const supabase = getSupabaseAdmin();

  return Promise.all(
    files.map(async (file) => {
      const { data, error } = await supabase.storage
        .from(file.storage_bucket)
        .createSignedUrl(file.storage_path, 60 * 15);

      if (error) {
        console.error('[Admin Dashboard] Signed file URL failed:', {
          fileId: file.id,
          bucket: file.storage_bucket,
          path: file.storage_path,
          error,
        });
      }

      return { ...file, signed_url: data?.signedUrl ?? null };
    })
  );
}

export function filterAdminWorkItems(items: AdminWorkItem[], queue: string, search: string) {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    const matchesQueue =
      queue === 'all' ||
      (queue === 'needs-action' && (item.urgency === 'high' || item.packetState === 'failed' || item.isOrphanRequest)) ||
      (queue === 'intake-incomplete' && ['Waiting on owner', 'Intake incomplete', 'Needs info'].includes(item.pipelineStage)) ||
      (queue === 'ready-for-build' && ['Ready for build', 'Build packet ready', 'Packet ready', 'Ready for admin review', 'Needs your help', 'AI finished research', 'Generating packet'].includes(item.pipelineStage)) ||
      (queue === 'preview-ready' && ['Preview ready', 'Preview sent', 'Viewed'].includes(item.pipelineStage)) ||
      (queue === 'claim-payment' && ['Claim/payment active', 'Claim started'].includes(item.pipelineStage));

    if (!matchesQueue) return false;
    if (!q) return true;

    return [
      item.restaurantName,
      item.slug,
      item.city,
      item.ownerName,
      item.ownerEmail,
      item.ownerPhone,
      item.pipelineStage,
      item.nextAction,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
}

export async function getAdminOpsData(): Promise<AdminOpsData> {
  return withMonitoringSpan(
    {
      name: 'admin.dashboard.ops-data',
      op: 'admin.load',
      attributes: {
        surface: 'dashboard',
      },
    },
    async () => {
      const supabase = getSupabaseAdmin();
      const [requestsResult, sitesResult, intakeResult, filesResult, eventsResult] = await Promise.all([
        supabase.from('preview_requests').select(REQUEST_SELECT).order('created_at', { ascending: false }).limit(300),
        supabase.from('restaurant_sites').select(SITE_SELECT).order('updated_at', { ascending: false }).limit(300),
        supabase.from('restaurant_intake').select(INTAKE_SELECT).order('updated_at', { ascending: false }).limit(300),
        supabase.from('intake_files').select('id, request_id, created_at, file_role, storage_bucket, storage_path, file_name, content_type, size_bytes').order('created_at', { ascending: false }).limit(500),
        supabase.from('site_events').select('id, site_id, request_id, event_type, actor_type, message, created_at').order('created_at', { ascending: false }).limit(500),
      ]);

  if (requestsResult.error) {
    console.error('[Admin Dashboard] Request lookup failed:', requestsResult.error);
    throw new Error('Could not load admin requests.');
  }
  if (sitesResult.error) console.error('[Admin Dashboard] Site lookup failed:', sitesResult.error);
  if (intakeResult.error) console.error('[Admin Dashboard] Intake lookup failed:', intakeResult.error);
  if (filesResult.error) console.error('[Admin Dashboard] File lookup failed:', filesResult.error);
  if (eventsResult.error) console.error('[Admin Dashboard] Event lookup failed:', eventsResult.error);

  const requests = (requestsResult.data ?? []) as unknown as RequestRecord[];
  const sites = (sitesResult.data ?? []) as unknown as SiteRecord[];
  const intakes = (intakeResult.data ?? []) as unknown as IntakeDetailRecord[];
  const files = (filesResult.data ?? []) as unknown as FileRecord[];
  const events = (eventsResult.data ?? []) as unknown as EventRecord[];
  const siteIds = sites.map((site) => site.id);
  const requestIds = requests.map((request) => request.id);
  const [{ packets, available }, agentRuns, addOnPurchases] = await Promise.all([
    getLatestBuildPackets({ requestIds, siteIds }),
    getLatestAgentRuns({ siteIds, requestIds }),
    getAddOnPurchases(siteIds),
  ]);

  const siteByRequest = byRequestId(sites);
  const intakeByRequest = byRequestId(intakes);
  const latestEvents = latestEventByKey(events);
  const latestPackets = packetsByKey(packets);
  const latestAgentRuns = latestAgentRunByKey(agentRuns);
  const addOnsBySite = addOnsBySiteId(addOnPurchases);
  const filesByRequest = new Map<string, FileRecord[]>();

  for (const file of files) {
    if (!file.request_id) continue;
    filesByRequest.set(file.request_id, [...(filesByRequest.get(file.request_id) ?? []), file]);
  }

  const requestItems = requests.map((request) => {
    const site = siteByRequest.get(request.id) ?? null;
    const latestEvent = (site?.id ? latestEvents.get(site.id) : null) ?? latestEvents.get(request.id) ?? null;
    return makeWorkItem({
      site,
      request,
      intake: intakeByRequest.get(request.id) ?? null,
      files: filesByRequest.get(request.id) ?? [],
      siteAssets: [],
      researchSources: [],
      latestEvent,
      buildPacket: (site?.id ? latestPackets.get(site.id) : null) ?? latestPackets.get(request.id) ?? fallbackPacketFromRequest(request),
      addOns: site?.id ? addOnsBySite.get(site.id) ?? [] : [],
      latestAgentRun: (site?.id ? latestAgentRuns.get(site.id) : null) ?? latestAgentRuns.get(request.id) ?? null,
    });
  });

  const seededSiteItems = sites
    .filter((site) => !site.request_id)
    .map((site) => {
      const siteMetadata = plainRecord(site.metadata);
      const syntheticRequest: RequestRecord = {
        id: site.id,
        created_at: site.created_at,
        updated_at: site.updated_at,
        owner_name: site.owner_name ?? 'Unknown',
        email: site.owner_email,
        phone: site.owner_phone ?? '',
        restaurant_name: site.restaurant_name,
        city: site.city ?? '',
        preferred_language: 'es',
        source: typeof siteMetadata.source === 'string' ? siteMetadata.source : 'seeded',
        status: site.status,
        notes: typeof siteMetadata.notes === 'string' ? siteMetadata.notes : null,
        instagram_url: typeof siteMetadata.instagram_url === 'string' ? siteMetadata.instagram_url : null,
        google_url: typeof siteMetadata.google_url === 'string' ? siteMetadata.google_url : null,
        website_url: typeof siteMetadata.website_url === 'string' ? siteMetadata.website_url : null,
        client_slug: site.slug,
        intake_started_at: null,
        intake_submitted_at: null,
        generated_brief: null,
        brief_json: {
          manualProject: {
            address: siteMetadata.address ?? null,
            facebook_url: siteMetadata.facebook_url ?? null,
            menu_url: siteMetadata.menu_url ?? null,
            research_seed_sources: siteMetadata.research_seed_sources ?? [],
          },
        },
      };

      return makeWorkItem({
        site,
        request: syntheticRequest,
        intake: null,
        files: [],
        siteAssets: [],
        researchSources: [],
        latestEvent: latestEvents.get(site.id) ?? null,
        buildPacket: latestPackets.get(site.id) ?? fallbackPacketFromRequest(syntheticRequest),
        addOns: addOnsBySite.get(site.id) ?? [],
        latestAgentRun: latestAgentRuns.get(site.id) ?? null,
      });
    });

  const items = [...requestItems, ...seededSiteItems].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

      return {
        items,
        summary: {
          total: items.length,
          needsAttention: items.filter((item) => item.urgency === 'high' || item.isOrphanRequest || item.packetState === 'failed').length,
          readyForBuild: items.filter((item) => ['Ready for build', 'Build packet ready', 'Packet ready', 'Ready for admin review', 'Needs your help', 'AI finished research', 'Generating packet'].includes(item.pipelineStage)).length,
          waitingOnOwner: items.filter((item) => ['Waiting on owner', 'Intake incomplete', 'Needs info'].includes(item.pipelineStage)).length,
          previewReady: items.filter((item) => ['Preview ready', 'Preview sent', 'Viewed'].includes(item.pipelineStage)).length,
          claimPaymentActive: items.filter((item) => ['Claim/payment active', 'Claim started'].includes(item.pipelineStage)).length,
        },
        packetsAvailable: available,
      };
    },
  );
}

export async function getAdminSiteDetail(
  slug: string,
  options?: { tab?: string | null }
): Promise<AdminSiteDetail | null> {
  return withMonitoringSpan(
    {
      name: 'admin.dashboard.site-detail',
      op: 'admin.load',
      attributes: {
        surface: 'site_detail',
        site_slug: slug,
      },
    },
    async () => {
      const supabase = getSupabaseAdmin();
      const activeTab = options?.tab ?? 'overview';
      const evidenceHeavyTab = activeTab === 'assets' || activeTab === 'packet' || activeTab === 'review';
      const includeSignedFileUrls = activeTab === 'intake' || activeTab === 'assets' || activeTab === 'review';
      const eventLimit = activeTab === 'timeline' ? 80 : 16;
      const researchLimit = evidenceHeavyTab ? 80 : 24;
      const assetLimit = evidenceHeavyTab ? 80 : 24;

  const { data: siteData, error: siteError } = await supabase
    .from('restaurant_sites')
    .select(SITE_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (siteError) {
    console.error('[Admin Dashboard] Site detail lookup failed:', siteError);
    throw new Error('Could not load admin site detail.');
  }

  const site = (siteData ?? null) as unknown as SiteRecord | null;
  const requestQuery = site?.request_id
    ? supabase.from('preview_requests').select(REQUEST_SELECT).eq('id', site.request_id).maybeSingle()
    : supabase.from('preview_requests').select(REQUEST_SELECT).eq('client_slug', slug).maybeSingle();

  const { data: requestData, error: requestError } = await requestQuery;
  if (requestError) console.error('[Admin Dashboard] Request detail lookup failed:', requestError);

  const request = (requestData ?? null) as unknown as RequestRecord | null;

  if (!site && !request) return null;

  const requestId = request?.id ?? site?.request_id ?? null;
  const siteRecord = site;

  const [intakeResult, filesResult, eventsResult, packetResult, researchResult, siteAssetsResult, agentRuns, addOns] = await Promise.all([
    requestId
      ? supabase.from('restaurant_intake').select(INTAKE_SELECT).eq('request_id', requestId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestId
      ? supabase
          .from('intake_files')
          .select('id, request_id, created_at, file_role, storage_bucket, storage_path, file_name, content_type, size_bytes')
          .eq('request_id', requestId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('site_events')
      .select('id, site_id, request_id, event_type, actor_type, message, created_at')
      .or(requestId && siteRecord ? `site_id.eq.${siteRecord.id},request_id.eq.${requestId}` : siteRecord ? `site_id.eq.${siteRecord.id}` : `request_id.eq.${requestId}`)
      .order('created_at', { ascending: false })
      .limit(eventLimit),
    requestId || siteRecord?.id
      ? supabase
          .from('admin_build_packets')
          .select(PACKET_SELECT)
          .or([
            requestId ? `request_id.eq.${requestId}` : null,
            siteRecord?.id ? `site_id.eq.${siteRecord.id}` : null,
          ].filter(Boolean).join(','))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestId || siteRecord?.id
      ? supabase
          .from('research_sources')
          .select(RESEARCH_SOURCE_SELECT)
          .or([
            requestId ? `request_id.eq.${requestId}` : null,
            siteRecord?.id ? `site_id.eq.${siteRecord.id}` : null,
          ].filter(Boolean).join(','))
          .order('captured_at', { ascending: false })
          .limit(researchLimit)
      : Promise.resolve({ data: [], error: null }),
    siteRecord?.id
      ? supabase
          .from('site_assets')
          .select(SITE_ASSET_SELECT)
          .eq('site_id', siteRecord.id)
          .order('updated_at', { ascending: false })
          .limit(assetLimit)
      : Promise.resolve({ data: [], error: null }),
    getLatestAgentRuns({ siteIds: siteRecord ? [siteRecord.id] : [], requestIds: requestId ? [requestId] : [] }),
    getAddOnPurchases(siteRecord ? [siteRecord.id] : []),
  ]);

  if (intakeResult.error) console.error('[Admin Dashboard] Intake detail lookup failed:', intakeResult.error);
  if (filesResult.error) console.error('[Admin Dashboard] File lookup failed:', filesResult.error);
  if (eventsResult.error) console.error('[Admin Dashboard] Event detail lookup failed:', eventsResult.error);
  if (packetResult.error && !isMissingPacketTable(packetResult.error)) {
    console.error('[Admin Dashboard] Build packet detail lookup failed:', packetResult.error);
  }
  if (researchResult.error) console.error('[Admin Dashboard] Research source detail lookup failed:', researchResult.error);
  if (siteAssetsResult.error) console.error('[Admin Dashboard] Site asset detail lookup failed:', siteAssetsResult.error);

  const intake = (intakeResult.data ?? null) as unknown as IntakeDetailRecord | null;
  const fileRecords = (filesResult.data ?? []) as unknown as FileRecord[];
  const files = includeSignedFileUrls ? await withSignedFileUrls(fileRecords) : fileRecords;
  const researchSources = (researchResult.data ?? []) as unknown as ResearchSourceRecord[];
  const siteAssets = (siteAssetsResult.data ?? []) as unknown as SiteAssetRecord[];
  const events = (eventsResult.data ?? []) as unknown as EventRecord[];
  const syntheticRequest: RequestRecord | null = !request && site
    ? {
        id: site.id,
        created_at: site.created_at,
        updated_at: site.updated_at,
        owner_name: site.owner_name ?? 'Unknown',
        email: site.owner_email,
        phone: site.owner_phone ?? '',
        restaurant_name: site.restaurant_name,
        city: site.city ?? '',
        preferred_language: 'es',
        source: 'admin_manual_project',
        status: site.status,
        notes: typeof site.metadata?.notes === 'string' ? site.metadata.notes : null,
        instagram_url: typeof site.metadata?.instagram_url === 'string' ? site.metadata.instagram_url : null,
        google_url: typeof site.metadata?.google_url === 'string' ? site.metadata.google_url : null,
        website_url: typeof site.metadata?.website_url === 'string' ? site.metadata.website_url : null,
        client_slug: site.slug,
        intake_started_at: null,
        intake_submitted_at: null,
        generated_brief: null,
        brief_json: {
          manualProject: site.metadata ?? {},
        },
      }
    : null;
  const effectiveRequest = request ?? syntheticRequest;
  const buildPacket = packetResult.error
    ? fallbackPacketFromRequest(request)
    : ((packetResult.data ?? null) as unknown as BuildPacketRecord | null) ?? fallbackPacketFromRequest(request);
  const packetSourceHash = getPacketSourceHash({ site, request: effectiveRequest, intake, files, siteAssets, researchSources });
  const packetState =
    buildPacket?.status === 'failed'
      ? 'failed'
      : buildPacket?.status === 'ready'
        ? buildPacket.source_hash === packetSourceHash
          ? 'ready'
          : 'stale'
        : 'none';

  const fileNames = files.map((file) => file.file_name);
  const buildBrief =
    buildPacket?.packet_markdown ||
    intake?.generated_brief ||
    request?.generated_brief ||
    (request && intake ? buildRestaurantBrief(request, intake, fileNames) : null);
  const researchReview = summarizeResearchReview({
    siteMetadata: site?.metadata,
    siteName: site?.restaurant_name ?? effectiveRequest?.restaurant_name ?? slug,
    researchSources,
    siteAssets,
  });
  const researchAudit = readResearchAudit(site?.metadata);
  const resolvedMenu = readResolvedMenu(site?.metadata);
  const strategicProfile = readStrategicProfile(site?.metadata);
  const resolvedProfile = deriveResolvedProfile({
    site,
    request: effectiveRequest,
    intake,
    researchSources,
    siteAssets,
    researchReview,
  });
  const readiness = effectiveRequest
    ? buildReadiness({ site, request: effectiveRequest, intake, files, siteAssets, researchSources })
    : { score: 0, missing: [], scrapeTargets: [], assetNotes: [], reviewSummary: researchReview };
  const siteBrief = readResolvedSiteBrief({
    siteMetadata: site?.metadata,
    buildPacketAnalysis:
      buildPacket?.analysis_json && typeof buildPacket.analysis_json === 'object' && !Array.isArray(buildPacket.analysis_json)
        ? (buildPacket.analysis_json as Record<string, unknown>)
        : null,
    fallback: {
      restaurantName: site?.restaurant_name ?? effectiveRequest?.restaurant_name ?? slug,
      city: site?.city ?? effectiveRequest?.city ?? null,
      summary: researchAudit?.readableProfileSummary ?? null,
      profile: resolvedProfile,
      strategicProfile,
      menu: resolvedMenu,
    },
  });
  const workItem = effectiveRequest
    ? makeWorkItem({
        site,
        request: effectiveRequest,
        intake,
        files,
        siteAssets,
        researchSources,
        latestEvent: (site?.id ? latestEventByKey(events).get(site.id) : null) ?? latestEventByKey(events).get(effectiveRequest.id) ?? null,
        buildPacket,
        addOns,
        latestAgentRun: (site?.id ? latestAgentRunByKey(agentRuns).get(site.id) : null) ?? latestAgentRunByKey(agentRuns).get(effectiveRequest.id) ?? null,
      })
    : null;

      return {
        slug,
        site,
        request,
        intake,
        files,
        siteAssets,
        researchSources,
        events,
        buildBrief,
        buildPacket,
        packetSourceHash,
        packetState,
        workItem,
        researchAudit,
        resolvedMenu,
        resolvedProfile,
        strategicProfile,
        siteBrief,
        researchReview,
        readiness: {
          score: readiness.score,
          missing: readiness.missing,
          scrapeTargets: readiness.scrapeTargets,
          assetNotes: readiness.assetNotes,
        },
      };
    },
  );
}

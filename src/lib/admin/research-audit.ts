import 'server-only';

import {
  collectResearchConflicts,
  reviewedAssetFromRecord,
  type ResearchReviewDecisionState,
} from '@/lib/admin/research-review';
import { type ResolvedMenu, normalizeResolvedMenu } from '@/lib/admin/menu-research';
import { cookieHeaderForUrl, getProviderCredential, readStoredBrowserSession } from '@/lib/admin/credentials';
import { openAiReasoningEffort } from '@/lib/admin/openai-settings';

const DEFAULT_AUDITOR_MODEL = process.env.OPENAI_AUDITOR_MODEL || process.env.OPENAI_MODEL || 'gpt-5.5';

export type ResearchAuditStrength = 'strong' | 'medium' | 'weak';
export type ConflictField = 'restaurantName' | 'address' | 'phone' | 'hours' | 'officialSite' | 'menuSource' | 'socials';

export type ConflictCandidate = {
  value: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  confidence: number;
};

export type ConflictRecord = {
  field: ConflictField;
  candidates: ConflictCandidate[];
  aiRecommendation: string | null;
  rationale: string;
  status: 'unresolved' | 'resolved_by_ai' | 'resolved_by_admin';
  adminChoice: string | null;
};

export type StrategicRestaurantProfile = {
  businessType: string | null;
  targetCustomer: string | null;
  pricePositioning: string | null;
  uniqueSellingProposition: string | null;
  menuStory: string | null;
  locationContext: string | null;
  trafficPattern: string | null;
  reviewSentiment: string | null;
  competitorLandscape: string[];
  businessModelInsights: string[];
  marketingInsights: string[];
  growthOpportunities: string[];
  operationalImprovements: string[];
  visualDirection: string[];
  siteRecommendations: string[];
};

export type ResolvedRestaurantProfile = {
  restaurantName: string;
  cuisine: string | null;
  address: string | null;
  phone: string | null;
  hours: string[];
  mapsUrl: string | null;
  rating: number | null;
  neighborhood: string | null;
  city: string | null;
  officialSiteUrl: string | null;
  primaryWebPresenceUrl: string | null;
  noOfficialWebsite: boolean;
  menuSourceUrl: string | null;
  menuEvidence: string[];
  noStructuredMenu: boolean;
  orderingUrls: string[];
  reservationUrls: string[];
  confirmedSocialUrls: string[];
  brandDirection: string[];
  logo: {
    assetKey: string | null;
    strategy: 'canonical_asset' | 'text_mark' | 'generated_placeholder' | null;
  };
  photos: {
    assetKeys: string[];
    strategy: 'approved_assets' | 'tasteful_placeholders' | 'generated_imagery' | null;
  };
  missingItems: string[];
  uncertainItems: string[];
  evidenceNotes: string[];
};

export type ResearchAuditRecord = {
  summary: {
    buildable: boolean;
    evidenceStrength: ResearchAuditStrength;
    confidence: number;
    rationale: string;
  };
  readableProfileSummary: string;
  canonicalSources: {
    officialSiteUrl: string | null;
    primaryWebPresenceUrl: string | null;
    menuSourceUrl: string | null;
    menuEvidence: string[];
    confirmedSocialUrls: string[];
    orderingUrls: string[];
    reservationUrls: string[];
    noOfficialWebsite: boolean;
    noStructuredMenu: boolean;
  };
  canonicalAssets: {
    logoAssetKey: string | null;
    logoStrategy: 'canonical_asset' | 'text_mark' | 'generated_placeholder' | null;
    approvedPhotoAssetKeys: string[];
    photoStrategy: 'approved_assets' | 'tasteful_placeholders' | 'generated_imagery' | null;
    menuAssetKeys: string[];
  };
  resolvedMenu: ResolvedMenu;
  resolvedProfile: ResolvedRestaurantProfile;
  strategicProfile: StrategicRestaurantProfile;
  conflictRecords: ConflictRecord[];
  blockers: string[];
  conflicts: string[];
  menuFindings: string[];
  menuBlockers: string[];
  menuFallbackRecommendation: 'none' | 'summary_only' | 'aggressive_ai_generated';
  supplementalFindings: string[];
  recommendedNextAction: string;
};

export type ResearchAuditDossier = {
  project: {
    slug: string;
    restaurantName: string | null;
    city: string | null;
    siteStatus: string | null;
  };
  adminContext: {
    notes: string | null;
    logoHints: string[];
    assetHints: string[];
  };
  intakeContext: {
    request: Record<string, unknown> | null;
    intake: Record<string, unknown> | null;
  };
  factualEvidence: {
    address: string | null;
    phone: string | null;
    hours: string[];
    mapsUrl: string | null;
    cuisine: string | null;
    rating: number | null;
  };
  precomputedConflicts: ConflictRecord[];
  candidateSources: {
    officialSiteCandidates: Array<{ url: string; title: string | null; confidence: number; provider: string | null }>;
    socialCandidates: Array<{ url: string; title: string | null; confidence: number; provider: string | null; sourceType: string }>;
    menuCandidates: Array<{ url: string; title: string | null; confidence: number; provider: string | null }>;
    orderingCandidates: Array<{ url: string; title: string | null; confidence: number; provider: string | null }>;
    reservationCandidates: Array<{ url: string; title: string | null; confidence: number; provider: string | null }>;
    referenceCandidates: Array<{ url: string; title: string | null; confidence: number; provider: string | null; sourceType: string }>;
  };
  visualEvidence: {
    logoCandidates: Array<{ assetKey: string; assetUrl: string; thumbnailUrl: string; sourceUrl: string | null; sourceType: string; provider: string; confidence: number; whySelected: string }>;
    photoCandidates: Array<{ assetKey: string; assetUrl: string; thumbnailUrl: string; sourceUrl: string | null; sourceType: string; provider: string; confidence: number; whySelected: string }>;
    menuAssetCandidates: Array<{ assetKey: string; assetUrl: string; thumbnailUrl: string; sourceUrl: string | null; sourceType: string; provider: string; confidence: number; whySelected: string }>;
    screenshots: Array<{ assetKey: string; assetUrl: string; thumbnailUrl: string; sourceUrl: string | null; sourceType: string; provider: string; confidence: number; whySelected: string }>;
  };
  supplementalLiveReview: Array<{
    url: string;
    sourceType: string;
    provider: 'direct_fetch' | 'firecrawl';
    statusCode: number | null;
    blocked: boolean;
    blockedReason: string | null;
    finalUrl: string | null;
    pageTitle: string | null;
    textExcerpt: string | null;
    markdownExcerpt: string | null;
  }>;
  conflicts: string[];
  reviewHints: {
    blockers: string[];
    officialSiteCandidates: string[];
    menuCandidates: string[];
    socialCandidates: string[];
  };
  representativeEvidence: Array<{
    sourceType: string;
    url: string | null;
    title: string | null;
    confidence: number;
    textExcerpt: string | null;
    markdownExcerpt: string | null;
    description: string | null;
    discoveredLinks: string[];
  }>;
  existingResolvedMenu: ResolvedMenu | null;
  existingResolvedProfile: ResolvedRestaurantProfile | null;
};

type SupplementalLiveReviewRecord = ResearchAuditDossier['supplementalLiveReview'][number];

type AuditDetailInput = {
  slug: string;
  site: {
    id: string | null;
    slug: string;
    restaurantName: string;
    city: string | null;
    status: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  request: Record<string, unknown> | null;
  intake: Record<string, unknown> | null;
  researchReview: {
    officialSiteCandidates: string[];
    menuCandidates: string[];
    socialCandidates: string[];
    conflicts: string[];
    blockers: string[];
  };
  researchSources: Array<{
    id?: string;
    source_type: string;
    url: string | null;
    title: string | null;
    confidence: number;
    extracted_facts: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    captured_at?: string;
  }>;
  siteAssets: Array<{
    id: string;
    asset_type: string;
    status: string;
    source_url: string | null;
    source_label: string | null;
    metadata: Record<string, unknown>;
  }>;
  existingResolvedProfile?: ResolvedRestaurantProfile | null;
  existingResolvedMenu?: ResolvedMenu | null;
};

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function plainRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function sentenceHints(value: string | null) {
  if (!value) return [];
  return value
    .split(/[\n.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function distinctStringFacts(
  sources: AuditDetailInput['researchSources'],
  keys: string[],
  mapper?: (source: AuditDetailInput['researchSources'][number], value: string) => ConflictCandidate,
) {
  const values = new Map<string, ConflictCandidate>();
  for (const source of sources) {
    const facts = plainRecord(source.extracted_facts);
    for (const key of keys) {
      const value = cleanString(facts[key]);
      if (!value) continue;
      const existing = values.get(value);
      const candidate = mapper
        ? mapper(source, value)
        : {
            value,
            sourceLabel: cleanString(source.title),
            sourceUrl: cleanString(source.url),
            sourceType: source.source_type,
            confidence: source.confidence,
          };
      if (!existing || existing.confidence < candidate.confidence) values.set(value, candidate);
    }
  }
  return [...values.values()];
}

function hoursCandidates(sources: AuditDetailInput['researchSources']) {
  const candidates = new Map<string, ConflictCandidate>();
  for (const source of sources) {
    const facts = plainRecord(source.extracted_facts);
    const values = [
      ...stringArray(facts.hours_weekday_text),
      ...((cleanString(facts.hours_summary)?.split('|').map((item) => item.trim()).filter(Boolean)) ?? []),
    ];
    if (!values.length) continue;
    const summary = values.join(' | ');
    const existing = candidates.get(summary);
    const candidate: ConflictCandidate = {
      value: summary,
      sourceLabel: cleanString(source.title),
      sourceUrl: cleanString(source.url),
      sourceType: source.source_type,
      confidence: source.confidence,
    };
    if (!existing || existing.confidence < candidate.confidence) candidates.set(summary, candidate);
  }
  return [...candidates.values()];
}

function precomputedConflictRecords(detail: AuditDetailInput): ConflictRecord[] {
  const restaurantNameCandidates = distinctStringFacts(detail.researchSources, ['name']).concat(
    detail.site?.restaurantName
      ? [{
          value: detail.site.restaurantName,
          sourceLabel: 'Project name',
          sourceUrl: null,
          sourceType: 'manual',
          confidence: 0.9,
        }]
      : [],
  );
  const addressCandidates = distinctStringFacts(detail.researchSources, ['address', 'formatted_address']).concat(
    cleanString(detail.site?.metadata && typeof detail.site.metadata === 'object' ? (detail.site.metadata as Record<string, unknown>).address as string : null)
      ? [{
          value: cleanString((detail.site?.metadata as Record<string, unknown>).address)!,
          sourceLabel: 'Admin input',
          sourceUrl: null,
          sourceType: 'manual',
          confidence: 0.72,
        }]
      : [],
  );
  const phoneCandidates = distinctStringFacts(detail.researchSources, ['formatted_phone_number', 'international_phone_number', 'phone']).concat(
    cleanString(detail.request?.phone)
      ? [{
          value: cleanString(detail.request?.phone)!,
          sourceLabel: 'Request phone',
          sourceUrl: null,
          sourceType: 'manual',
          confidence: 0.68,
        }]
      : [],
  );
  const officialSiteCandidates = detail.researchReview.officialSiteCandidates.map((value) => ({
    value,
    sourceLabel: 'Discovered website',
    sourceUrl: value,
    sourceType: 'website',
    confidence: 0.6,
  }));
  const menuCandidates = detail.researchReview.menuCandidates.map((value) => ({
    value,
    sourceLabel: 'Discovered menu',
    sourceUrl: value,
    sourceType: 'menu',
    confidence: 0.58,
  }));
  const socialCandidates = detail.researchReview.socialCandidates.map((value) => ({
    value,
    sourceLabel: /instagram/i.test(value) ? 'Instagram' : /facebook|fb\.com/i.test(value) ? 'Facebook' : 'Social',
    sourceUrl: value,
    sourceType: /instagram/i.test(value) ? 'instagram' : /facebook|fb\.com/i.test(value) ? 'facebook' : 'social',
    confidence: 0.64,
  }));
  const records: ConflictRecord[] = [];
  if (new Set(restaurantNameCandidates.map((candidate) => candidate.value)).size > 1) {
    records.push({ field: 'restaurantName', candidates: restaurantNameCandidates, aiRecommendation: null, rationale: 'Multiple public-facing name variants were found.', status: 'unresolved', adminChoice: null });
  }
  if (new Set(addressCandidates.map((candidate) => candidate.value)).size > 1) {
    records.push({ field: 'address', candidates: addressCandidates, aiRecommendation: null, rationale: 'Address values differ across sources.', status: 'unresolved', adminChoice: null });
  }
  if (new Set(phoneCandidates.map((candidate) => candidate.value)).size > 1) {
    records.push({ field: 'phone', candidates: phoneCandidates, aiRecommendation: null, rationale: 'Phone numbers differ across sources.', status: 'unresolved', adminChoice: null });
  }
  const hourChoices = hoursCandidates(detail.researchSources);
  if (new Set(hourChoices.map((candidate) => candidate.value)).size > 1) {
    records.push({ field: 'hours', candidates: hourChoices, aiRecommendation: null, rationale: 'Hours differ across sources.', status: 'unresolved', adminChoice: null });
  }
  if (new Set(officialSiteCandidates.map((candidate) => candidate.value)).size > 1) {
    records.push({ field: 'officialSite', candidates: officialSiteCandidates, aiRecommendation: null, rationale: 'Multiple website candidates were found.', status: 'unresolved', adminChoice: null });
  }
  if (new Set(menuCandidates.map((candidate) => candidate.value)).size > 1) {
    records.push({ field: 'menuSource', candidates: menuCandidates, aiRecommendation: null, rationale: 'Multiple menu candidates were found.', status: 'unresolved', adminChoice: null });
  }
  if (socialCandidates.length > 2) {
    records.push({ field: 'socials', candidates: socialCandidates, aiRecommendation: null, rationale: 'Multiple social profile candidates were found.', status: 'unresolved', adminChoice: null });
  }
  return records;
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function clipText(value: string | null, length = 1200) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > length ? `${trimmed.slice(0, length)}...` : trimmed;
}

function isGoogleSearchLikeUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  return /(google\.com\/search|google\.com\/sorry|support\.google\.com\/websearch|google\.com\/webhp|google\.com\/imgres)/.test(value);
}

function isGoogleMenuViewerUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  return /google\.com\/search/.test(value) && /vssid=menu-viewer-entrypoint/.test(value);
}

function blockedReasonForContent(url: string, text: string | null | undefined) {
  const value = (text ?? '').toLowerCase();
  if (!isGoogleMenuViewerUrl(url) && isGoogleSearchLikeUrl(url)) return 'google_search_result';
  if (!value) return null;
  if (value.includes("if you're having trouble accessing google search")) return 'google_search_help';
  if (value.includes('recaptcha requires verification') || value.includes('our systems have detected unusual traffic')) return 'captcha_or_rate_limited';
  if (value.includes('log into facebook') || value.includes('you must log in to continue')) return 'facebook_login_wall';
  if (value.includes('login') && value.includes('instagram')) return 'instagram_login_wall';
  return null;
}

function extractTitleFromHtml(html: string | null) {
  if (!html) return null;
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || null;
}

function stripHtmlText(html: string | null) {
  if (!html) return null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

async function fetchAuditUrlReview(url: string, sourceType: string, cookieHeader?: string | null): Promise<SupplementalLiveReviewRecord> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SaborWebResearchAudit/1.0; +https://saborweb.com)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null);

  if (!response) {
    return {
      url,
      sourceType,
      provider: 'direct_fetch' as const,
      statusCode: null,
      blocked: true,
      blockedReason: 'fetch_failed',
      finalUrl: null,
      pageTitle: null,
      textExcerpt: null,
      markdownExcerpt: null,
    };
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);
  const body = clipText(await response.text().catch(() => null), 20_000);
  const title = isHtml ? extractTitleFromHtml(body) : null;
  const textExcerpt = clipText(isHtml ? stripHtmlText(body) : body, 900);
  const blockedReason = blockedReasonForContent(url, `${title ?? ''}\n${textExcerpt ?? ''}`);

  return {
    url,
    sourceType,
    provider: 'direct_fetch' as const,
    statusCode: response.status,
    blocked: !response.ok || Boolean(blockedReason),
    blockedReason: !response.ok ? `http_${response.status}` : blockedReason,
    finalUrl: response.url || url,
    pageTitle: title,
    textExcerpt,
    markdownExcerpt: null,
  };
}

async function firecrawlAuditReview(url: string, sourceType: string, cookieHeader?: string | null): Promise<SupplementalLiveReviewRecord | null> {
  const credential = await getProviderCredential('firecrawl');
  if (!credential.secret) return null;

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credential.secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      ...(cookieHeader ? { headers: { Cookie: cookieHeader } } : {}),
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);

  if (!response) {
    return {
      url,
      sourceType,
      provider: 'firecrawl' as const,
      statusCode: null,
      blocked: true,
      blockedReason: 'firecrawl_failed',
      finalUrl: null,
      pageTitle: null,
      textExcerpt: null,
      markdownExcerpt: null,
    };
  }

  const json = plainRecord(await response.json().catch(() => ({})));
  const data = plainRecord(json.data);
  const metadata = plainRecord(data.metadata);
  const markdown = clipText(cleanString(data.markdown), 1600);
  const pageTitle = cleanString(metadata.title) ?? cleanString(metadata.ogTitle);
  const textExcerpt = clipText(markdown?.replace(/[#>*_`~-]/g, ' ').replace(/\s+/g, ' ') ?? null, 900);
  const blockedReason = blockedReasonForContent(url, `${pageTitle ?? ''}\n${markdown ?? ''}`);

  return {
    url,
    sourceType,
    provider: 'firecrawl' as const,
    statusCode: typeof metadata.statusCode === 'number' ? metadata.statusCode : response.status,
    blocked: !response.ok || Boolean(blockedReason),
    blockedReason: !response.ok ? `http_${response.status}` : blockedReason,
    finalUrl: cleanString(metadata.url) ?? url,
    pageTitle,
    textExcerpt,
    markdownExcerpt: markdown,
  };
}

async function buildSupplementalLiveReview(detail: AuditDetailInput) {
  const metaSessionCredential = await getProviderCredential('meta_research_session');
  const metaSession = readStoredBrowserSession(metaSessionCredential.secret);
  const candidates = [
    ...detail.researchReview.officialSiteCandidates.map((url) => ({ url, sourceType: 'website' })),
    ...detail.researchReview.menuCandidates.map((url) => ({ url, sourceType: 'menu' })),
    ...detail.researchReview.socialCandidates.map((url) => ({
      url,
      sourceType: /instagram/i.test(url) ? 'instagram' : /facebook|fb\.com/i.test(url) ? 'facebook' : 'social',
    })),
    ...detail.researchSources
      .filter((source) => Boolean(normalizeUrl(source.url)))
      .slice(0, 12)
      .map((source) => ({ url: source.url as string, sourceType: source.source_type })),
  ];

  const unique = new Map<string, { url: string; sourceType: string }>();
  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate.url);
    if (!normalized) continue;
    if (!unique.has(normalized)) unique.set(normalized, { url: normalized, sourceType: candidate.sourceType });
  }

  const selected = [...unique.values()].slice(0, 8);
  const direct = await Promise.all(
    selected.map((candidate) =>
      fetchAuditUrlReview(
        candidate.url,
        candidate.sourceType,
        /instagram|facebook|fb\.com/i.test(candidate.url) ? cookieHeaderForUrl(metaSession, candidate.url) : null,
      )
    )
  );
  const firecrawlTargets = selected.filter((candidate) => !isGoogleSearchLikeUrl(candidate.url) || isGoogleMenuViewerUrl(candidate.url)).slice(0, 4);
  const firecrawl = await Promise.all(
    firecrawlTargets.map((candidate) =>
      firecrawlAuditReview(
        candidate.url,
        candidate.sourceType,
        /instagram|facebook|fb\.com/i.test(candidate.url) ? cookieHeaderForUrl(metaSession, candidate.url) : null,
      )
    )
  );
  return [...direct, ...firecrawl.filter((value): value is SupplementalLiveReviewRecord => Boolean(value))];
}

const resolvedMenuSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status',
    'canonicalSourceUrl',
    'sourceType',
    'confidence',
    'provenanceMode',
    'menuName',
    'categories',
    'featuredItems',
    'summaryLines',
    'missingFields',
    'fallbackMode',
    'evidenceSources',
    'extractionNotes',
    'pricesComplete',
    'descriptionsSourceBacked',
  ],
  properties: {
    status: { type: 'string', enum: ['structured_menu', 'partial_menu', 'menu_evidence_only', 'no_menu_found'] },
    canonicalSourceUrl: { type: ['string', 'null'] },
    sourceType: { type: ['string', 'null'], enum: ['html', 'pdf', 'image', 'social', 'third_party', 'uploaded_file', 'unknown', null] },
    confidence: { type: 'integer', minimum: 0, maximum: 100 },
    provenanceMode: { type: 'string', enum: ['source_backed', 'hybrid_generated', 'fully_generated'] },
    menuName: { type: ['string', 'null'] },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'items'],
        properties: {
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'description', 'priceText', 'badges', 'sourceBacked', 'inferred', 'provenance'],
              properties: {
                name: { type: 'string' },
                description: { type: ['string', 'null'] },
                priceText: { type: ['string', 'null'] },
                badges: { type: 'array', items: { type: 'string' } },
                sourceBacked: { type: 'boolean' },
                inferred: { type: 'boolean' },
                provenance: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    featuredItems: { type: 'array', items: { type: 'string' } },
    summaryLines: { type: 'array', items: { type: 'string' } },
    missingFields: { type: 'array', items: { type: 'string' } },
    fallbackMode: { type: 'string', enum: ['none', 'summary_only', 'aggressive_ai_generated'] },
    evidenceSources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'url', 'sourceType', 'candidateType', 'confidence', 'extractionQuality', 'notes'],
        properties: {
          label: { type: 'string' },
          url: { type: ['string', 'null'] },
          sourceType: { type: 'string', enum: ['html', 'pdf', 'image', 'social', 'third_party', 'uploaded_file', 'unknown'] },
          candidateType: { type: 'string' },
          confidence: { type: 'number' },
          extractionQuality: { type: 'string', enum: ['strong', 'medium', 'weak'] },
          notes: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    extractionNotes: { type: 'array', items: { type: 'string' } },
    pricesComplete: { type: 'boolean' },
    descriptionsSourceBacked: { type: 'boolean' },
  },
};

const auditSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'readableProfileSummary', 'canonicalSources', 'canonicalAssets', 'resolvedMenu', 'resolvedProfile', 'strategicProfile', 'conflictRecords', 'blockers', 'conflicts', 'menuFindings', 'menuBlockers', 'menuFallbackRecommendation', 'supplementalFindings', 'recommendedNextAction'],
  properties: {
    summary: {
      type: 'object',
      additionalProperties: false,
      required: ['buildable', 'evidenceStrength', 'confidence', 'rationale'],
      properties: {
        buildable: { type: 'boolean' },
        evidenceStrength: { type: 'string', enum: ['strong', 'medium', 'weak'] },
        confidence: { type: 'integer', minimum: 0, maximum: 100 },
        rationale: { type: 'string' },
      },
    },
    readableProfileSummary: { type: 'string' },
    canonicalSources: {
      type: 'object',
      additionalProperties: false,
      required: ['officialSiteUrl', 'primaryWebPresenceUrl', 'menuSourceUrl', 'menuEvidence', 'confirmedSocialUrls', 'orderingUrls', 'reservationUrls', 'noOfficialWebsite', 'noStructuredMenu'],
      properties: {
        officialSiteUrl: { type: ['string', 'null'] },
        primaryWebPresenceUrl: { type: ['string', 'null'] },
        menuSourceUrl: { type: ['string', 'null'] },
        menuEvidence: { type: 'array', items: { type: 'string' } },
        confirmedSocialUrls: { type: 'array', items: { type: 'string' } },
        orderingUrls: { type: 'array', items: { type: 'string' } },
        reservationUrls: { type: 'array', items: { type: 'string' } },
        noOfficialWebsite: { type: 'boolean' },
        noStructuredMenu: { type: 'boolean' },
      },
    },
    canonicalAssets: {
      type: 'object',
      additionalProperties: false,
      required: ['logoAssetKey', 'logoStrategy', 'approvedPhotoAssetKeys', 'photoStrategy', 'menuAssetKeys'],
      properties: {
        logoAssetKey: { type: ['string', 'null'] },
        logoStrategy: { type: ['string', 'null'], enum: ['canonical_asset', 'text_mark', 'generated_placeholder', null] },
        approvedPhotoAssetKeys: { type: 'array', items: { type: 'string' } },
        photoStrategy: { type: ['string', 'null'], enum: ['approved_assets', 'tasteful_placeholders', 'generated_imagery', null] },
        menuAssetKeys: { type: 'array', items: { type: 'string' } },
      },
    },
    resolvedMenu: resolvedMenuSchema,
    resolvedProfile: {
      type: 'object',
      additionalProperties: false,
      required: [
        'restaurantName',
        'cuisine',
        'address',
        'phone',
        'hours',
        'mapsUrl',
        'rating',
        'neighborhood',
        'city',
        'officialSiteUrl',
        'primaryWebPresenceUrl',
        'noOfficialWebsite',
        'menuSourceUrl',
        'menuEvidence',
        'noStructuredMenu',
        'orderingUrls',
        'reservationUrls',
        'confirmedSocialUrls',
        'brandDirection',
        'logo',
        'photos',
        'missingItems',
        'uncertainItems',
        'evidenceNotes',
      ],
      properties: {
        restaurantName: { type: 'string' },
        cuisine: { type: ['string', 'null'] },
        address: { type: ['string', 'null'] },
        phone: { type: ['string', 'null'] },
        hours: { type: 'array', items: { type: 'string' } },
        mapsUrl: { type: ['string', 'null'] },
        rating: { type: ['number', 'null'] },
        neighborhood: { type: ['string', 'null'] },
        city: { type: ['string', 'null'] },
        officialSiteUrl: { type: ['string', 'null'] },
        primaryWebPresenceUrl: { type: ['string', 'null'] },
        noOfficialWebsite: { type: 'boolean' },
        menuSourceUrl: { type: ['string', 'null'] },
        menuEvidence: { type: 'array', items: { type: 'string' } },
        noStructuredMenu: { type: 'boolean' },
        orderingUrls: { type: 'array', items: { type: 'string' } },
        reservationUrls: { type: 'array', items: { type: 'string' } },
        confirmedSocialUrls: { type: 'array', items: { type: 'string' } },
        brandDirection: { type: 'array', items: { type: 'string' } },
        logo: {
          type: 'object',
          additionalProperties: false,
          required: ['assetKey', 'strategy'],
          properties: {
            assetKey: { type: ['string', 'null'] },
            strategy: { type: ['string', 'null'], enum: ['canonical_asset', 'text_mark', 'generated_placeholder', null] },
          },
        },
        photos: {
          type: 'object',
          additionalProperties: false,
          required: ['assetKeys', 'strategy'],
          properties: {
            assetKeys: { type: 'array', items: { type: 'string' } },
            strategy: { type: ['string', 'null'], enum: ['approved_assets', 'tasteful_placeholders', 'generated_imagery', null] },
          },
        },
        missingItems: { type: 'array', items: { type: 'string' } },
        uncertainItems: { type: 'array', items: { type: 'string' } },
        evidenceNotes: { type: 'array', items: { type: 'string' } },
      },
    },
    strategicProfile: {
      type: 'object',
      additionalProperties: false,
      required: [
        'businessType',
        'targetCustomer',
        'pricePositioning',
        'uniqueSellingProposition',
        'menuStory',
        'locationContext',
        'trafficPattern',
        'reviewSentiment',
        'competitorLandscape',
        'businessModelInsights',
        'marketingInsights',
        'growthOpportunities',
        'operationalImprovements',
        'visualDirection',
        'siteRecommendations',
      ],
      properties: {
        businessType: { type: ['string', 'null'] },
        targetCustomer: { type: ['string', 'null'] },
        pricePositioning: { type: ['string', 'null'] },
        uniqueSellingProposition: { type: ['string', 'null'] },
        menuStory: { type: ['string', 'null'] },
        locationContext: { type: ['string', 'null'] },
        trafficPattern: { type: ['string', 'null'] },
        reviewSentiment: { type: ['string', 'null'] },
        competitorLandscape: { type: 'array', items: { type: 'string' } },
        businessModelInsights: { type: 'array', items: { type: 'string' } },
        marketingInsights: { type: 'array', items: { type: 'string' } },
        growthOpportunities: { type: 'array', items: { type: 'string' } },
        operationalImprovements: { type: 'array', items: { type: 'string' } },
        visualDirection: { type: 'array', items: { type: 'string' } },
        siteRecommendations: { type: 'array', items: { type: 'string' } },
      },
    },
    conflictRecords: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['field', 'candidates', 'aiRecommendation', 'rationale', 'status', 'adminChoice'],
        properties: {
          field: { type: 'string', enum: ['restaurantName', 'address', 'phone', 'hours', 'officialSite', 'menuSource', 'socials'] },
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['value', 'sourceLabel', 'sourceUrl', 'sourceType', 'confidence'],
              properties: {
                value: { type: 'string' },
                sourceLabel: { type: ['string', 'null'] },
                sourceUrl: { type: ['string', 'null'] },
                sourceType: { type: ['string', 'null'] },
                confidence: { type: 'number' },
              },
            },
          },
          aiRecommendation: { type: ['string', 'null'] },
          rationale: { type: 'string' },
          status: { type: 'string', enum: ['unresolved', 'resolved_by_ai', 'resolved_by_admin'] },
          adminChoice: { type: ['string', 'null'] },
        },
      },
    },
    blockers: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' } },
    menuFindings: { type: 'array', items: { type: 'string' } },
    menuBlockers: { type: 'array', items: { type: 'string' } },
    menuFallbackRecommendation: { type: 'string', enum: ['none', 'summary_only', 'aggressive_ai_generated'] },
    supplementalFindings: { type: 'array', items: { type: 'string' } },
    recommendedNextAction: { type: 'string' },
  },
};

function outputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];

  for (const item of output) {
    const content = typeof item === 'object' && item !== null && 'content' in item ? (item as { content?: unknown }).content : null;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part === 'object' && part !== null && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
        return (part as { text: string }).text;
      }
    }
  }

  return '';
}

function validateAudit(value: unknown): ResearchAuditRecord {
  if (typeof value !== 'object' || value === null) throw new Error('OpenAI returned an invalid research audit object.');
  const audit = value as Partial<ResearchAuditRecord> & Record<string, unknown>;
  if (!audit.summary || !audit.canonicalSources || !audit.canonicalAssets || !audit.resolvedProfile) {
    throw new Error('OpenAI returned an incomplete research audit.');
  }
  const resolvedProfile = plainRecord(audit.resolvedProfile);
  const canonicalSources = plainRecord(audit.canonicalSources);
  const canonicalAssets = plainRecord(audit.canonicalAssets);
  const strategicProfile = plainRecord(audit.strategicProfile);

  return {
    summary: {
      buildable: Boolean(plainRecord(audit.summary).buildable),
      evidenceStrength: ['strong', 'medium', 'weak'].includes(String(plainRecord(audit.summary).evidenceStrength))
        ? (plainRecord(audit.summary).evidenceStrength as ResearchAuditStrength)
        : 'weak',
      confidence: Math.max(0, Math.min(100, numberValue(plainRecord(audit.summary).confidence) ?? 0)),
      rationale: cleanString(plainRecord(audit.summary).rationale) ?? 'No rationale provided.',
    },
    readableProfileSummary:
      cleanString(audit.readableProfileSummary) ??
      cleanString(plainRecord(audit.summary).rationale) ??
      'No readable restaurant summary was returned.',
    canonicalSources: {
      officialSiteUrl: cleanString(canonicalSources.officialSiteUrl),
      primaryWebPresenceUrl: cleanString(canonicalSources.primaryWebPresenceUrl),
      menuSourceUrl: cleanString(canonicalSources.menuSourceUrl),
      menuEvidence: stringArray(canonicalSources.menuEvidence),
      confirmedSocialUrls: stringArray(canonicalSources.confirmedSocialUrls),
      orderingUrls: stringArray(canonicalSources.orderingUrls),
      reservationUrls: stringArray(canonicalSources.reservationUrls),
      noOfficialWebsite: Boolean(canonicalSources.noOfficialWebsite),
      noStructuredMenu: Boolean(canonicalSources.noStructuredMenu),
    },
    canonicalAssets: {
      logoAssetKey: cleanString(canonicalAssets.logoAssetKey),
      logoStrategy: ['canonical_asset', 'text_mark', 'generated_placeholder'].includes(String(canonicalAssets.logoStrategy))
        ? (canonicalAssets.logoStrategy as ResearchAuditRecord['canonicalAssets']['logoStrategy'])
        : null,
      approvedPhotoAssetKeys: stringArray(canonicalAssets.approvedPhotoAssetKeys),
      photoStrategy: ['approved_assets', 'tasteful_placeholders', 'generated_imagery'].includes(String(canonicalAssets.photoStrategy))
        ? (canonicalAssets.photoStrategy as ResearchAuditRecord['canonicalAssets']['photoStrategy'])
        : null,
      menuAssetKeys: stringArray(canonicalAssets.menuAssetKeys),
    },
    resolvedMenu: audit.resolvedMenu ? normalizeResolvedMenu(audit.resolvedMenu) : {
      status: 'no_menu_found',
      canonicalSourceUrl: cleanString(canonicalSources.menuSourceUrl),
      sourceType: null,
      confidence: 0,
      provenanceMode: 'source_backed',
      menuName: null,
      categories: [],
      featuredItems: [],
      summaryLines: stringArray(canonicalSources.menuEvidence),
      missingFields: ['menu'],
      fallbackMode: 'none',
      evidenceSources: [],
      extractionNotes: [],
      pricesComplete: false,
      descriptionsSourceBacked: false,
    },
    resolvedProfile: {
      restaurantName: cleanString(resolvedProfile.restaurantName) ?? 'Unknown restaurant',
      cuisine: cleanString(resolvedProfile.cuisine),
      address: cleanString(resolvedProfile.address),
      phone: cleanString(resolvedProfile.phone),
      hours: stringArray(resolvedProfile.hours),
      mapsUrl: cleanString(resolvedProfile.mapsUrl),
      rating: numberValue(resolvedProfile.rating),
      neighborhood: cleanString(resolvedProfile.neighborhood),
      city: cleanString(resolvedProfile.city),
      officialSiteUrl: cleanString(resolvedProfile.officialSiteUrl),
      primaryWebPresenceUrl: cleanString(resolvedProfile.primaryWebPresenceUrl),
      noOfficialWebsite: Boolean(resolvedProfile.noOfficialWebsite),
      menuSourceUrl: cleanString(resolvedProfile.menuSourceUrl),
      menuEvidence: stringArray(resolvedProfile.menuEvidence),
      noStructuredMenu: Boolean(resolvedProfile.noStructuredMenu),
      orderingUrls: stringArray(resolvedProfile.orderingUrls),
      reservationUrls: stringArray(resolvedProfile.reservationUrls),
      confirmedSocialUrls: stringArray(resolvedProfile.confirmedSocialUrls),
      brandDirection: stringArray(resolvedProfile.brandDirection),
      logo: {
        assetKey: cleanString(plainRecord(resolvedProfile.logo).assetKey),
        strategy: ['canonical_asset', 'text_mark', 'generated_placeholder'].includes(String(plainRecord(resolvedProfile.logo).strategy))
          ? (plainRecord(resolvedProfile.logo).strategy as ResolvedRestaurantProfile['logo']['strategy'])
          : null,
      },
      photos: {
        assetKeys: stringArray(plainRecord(resolvedProfile.photos).assetKeys),
        strategy: ['approved_assets', 'tasteful_placeholders', 'generated_imagery'].includes(String(plainRecord(resolvedProfile.photos).strategy))
          ? (plainRecord(resolvedProfile.photos).strategy as ResolvedRestaurantProfile['photos']['strategy'])
          : null,
      },
      missingItems: stringArray(resolvedProfile.missingItems),
      uncertainItems: stringArray(resolvedProfile.uncertainItems),
      evidenceNotes: stringArray(resolvedProfile.evidenceNotes),
    },
    strategicProfile: {
      businessType: cleanString(strategicProfile.businessType),
      targetCustomer: cleanString(strategicProfile.targetCustomer),
      pricePositioning: cleanString(strategicProfile.pricePositioning),
      uniqueSellingProposition: cleanString(strategicProfile.uniqueSellingProposition),
      menuStory: cleanString(strategicProfile.menuStory),
      locationContext: cleanString(strategicProfile.locationContext),
      trafficPattern: cleanString(strategicProfile.trafficPattern),
      reviewSentiment: cleanString(strategicProfile.reviewSentiment),
      competitorLandscape: stringArray(strategicProfile.competitorLandscape),
      businessModelInsights: stringArray(strategicProfile.businessModelInsights),
      marketingInsights: stringArray(strategicProfile.marketingInsights),
      growthOpportunities: stringArray(strategicProfile.growthOpportunities),
      operationalImprovements: stringArray(strategicProfile.operationalImprovements),
      visualDirection: stringArray(strategicProfile.visualDirection),
      siteRecommendations: stringArray(strategicProfile.siteRecommendations),
    },
    conflictRecords: Array.isArray(audit.conflictRecords)
      ? (audit.conflictRecords as unknown[])
          .filter((record): record is Record<string, unknown> => typeof record === 'object' && record !== null && !Array.isArray(record))
          .map((record) => ({
            field: ['restaurantName', 'address', 'phone', 'hours', 'officialSite', 'menuSource', 'socials'].includes(String(record.field))
              ? (record.field as ConflictField)
              : 'address',
            candidates: Array.isArray(record.candidates)
              ? record.candidates
                  .filter((candidate): candidate is Record<string, unknown> => typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate))
                  .map((candidate) => ({
                    value: cleanString(candidate.value) ?? '',
                    sourceLabel: cleanString(candidate.sourceLabel),
                    sourceUrl: cleanString(candidate.sourceUrl),
                    sourceType: cleanString(candidate.sourceType),
                    confidence: numberValue(candidate.confidence) ?? 0,
                  }))
                  .filter((candidate) => candidate.value.length > 0)
              : [],
            aiRecommendation: cleanString(record.aiRecommendation),
            rationale: cleanString(record.rationale) ?? 'No rationale provided.',
            status: ['unresolved', 'resolved_by_ai', 'resolved_by_admin'].includes(String(record.status))
              ? (record.status as ConflictRecord['status'])
              : 'unresolved',
            adminChoice: cleanString(record.adminChoice),
          }))
      : [],
    blockers: stringArray(audit.blockers),
    conflicts: stringArray(audit.conflicts),
    menuFindings: stringArray(audit.menuFindings),
    menuBlockers: stringArray(audit.menuBlockers),
    menuFallbackRecommendation: ['none', 'summary_only', 'aggressive_ai_generated'].includes(String(audit.menuFallbackRecommendation))
      ? (audit.menuFallbackRecommendation as ResearchAuditRecord['menuFallbackRecommendation'])
      : 'none',
    supplementalFindings: stringArray(audit.supplementalFindings),
    recommendedNextAction: cleanString(audit.recommendedNextAction) ?? 'Review the research operator output before proceeding.',
  };
}

function firstStringFact(sources: AuditDetailInput['researchSources'], keys: string[]) {
  for (const source of sources) {
    const facts = plainRecord(source.extracted_facts);
    for (const key of keys) {
      const value = cleanString(facts[key]);
      if (value) return value;
    }
  }
  return null;
}

function collectHours(sources: AuditDetailInput['researchSources']) {
  const values = new Set<string>();
  for (const source of sources) {
    const facts = plainRecord(source.extracted_facts);
    const weekday = facts.hours_weekday_text;
    if (Array.isArray(weekday)) {
      for (const item of weekday) {
        const value = cleanString(item);
        if (value) values.add(value);
      }
    }
    const summary = cleanString(facts.hours_summary);
    if (summary) {
      for (const part of summary.split('|').map((item) => item.trim()).filter(Boolean)) values.add(part);
    }
  }
  return [...values];
}

function collectFirstNumber(sources: AuditDetailInput['researchSources'], keys: string[]) {
  for (const source of sources) {
    const facts = plainRecord(source.extracted_facts);
    for (const key of keys) {
      const value = numberValue(facts[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

function sourceProvider(source: AuditDetailInput['researchSources'][number]) {
  return cleanString(plainRecord(source.metadata).provider);
}

function sourceCandidateRow(source: AuditDetailInput['researchSources'][number]) {
  return {
    url: cleanString(source.url) ?? '',
    title: cleanString(source.title),
    confidence: source.confidence,
    provider: sourceProvider(source),
  };
}

function representativeEvidence(sources: AuditDetailInput['researchSources']) {
  return sources
    .filter((source) => {
      const facts = plainRecord(source.extracted_facts);
      return Boolean(
        cleanString(facts.text_excerpt) ||
          cleanString(facts.markdown_excerpt) ||
          cleanString(facts.description) ||
          stringArray(facts.discovered_links).length,
      );
    })
    .slice(0, 16)
    .map((source) => {
      const facts = plainRecord(source.extracted_facts);
      return {
        sourceType: source.source_type,
        url: cleanString(source.url),
        title: cleanString(source.title),
        confidence: source.confidence,
        textExcerpt: cleanString(facts.text_excerpt),
        markdownExcerpt: cleanString(facts.markdown_excerpt),
        description: cleanString(facts.description),
        discoveredLinks: stringArray(facts.discovered_links).slice(0, 8),
      };
    });
}

export async function createResearchAuditDossier(detail: AuditDetailInput): Promise<ResearchAuditDossier> {
  const siteMetadata = plainRecord(detail.site?.metadata);
  const adminNotes = cleanString(siteMetadata.notes);
  const adminNoteHints = sentenceHints(adminNotes);
  const logoHints = adminNoteHints.filter((hint) => /logo|wordmark|word mark|profile image|avatar|instagram|facebook/i.test(hint));
  const assetHints = adminNoteHints.filter((hint) => /photo|image|menu|pdf|asset|brand/i.test(hint));
  const supplementalLiveReview = await buildSupplementalLiveReview(detail);
  const candidateAssets = detail.siteAssets
    .map((asset) => reviewedAssetFromRecord(asset))
    .filter((asset): asset is NonNullable<ReturnType<typeof reviewedAssetFromRecord>> => Boolean(asset))
    .map((asset) => ({
      assetKey: asset.assetKey,
      assetType: asset.assetType,
      assetUrl: asset.assetUrl,
      thumbnailUrl: asset.thumbnailUrl,
      sourceUrl: asset.sourceUrl,
      sourceType: asset.sourceType,
      captureMethod: asset.captureMethod,
      provider: asset.provider,
      confidence: asset.confidence,
      title: asset.title,
      whySelected: asset.whySelected,
    }));

  const officialSiteCandidates = detail.researchSources
    .filter((source) => source.source_type === 'website' && cleanString(source.url))
    .map(sourceCandidateRow);
  const socialCandidates = detail.researchSources
    .filter((source) => source.source_type === 'instagram' || source.source_type === 'facebook')
    .map((source) => ({ ...sourceCandidateRow(source), sourceType: source.source_type }));
  const menuCandidates = detail.researchSources
    .filter((source) => source.source_type === 'menu')
    .map(sourceCandidateRow);
  const orderingCandidates = detail.researchSources
    .filter((source) => source.source_type === 'ordering')
    .map(sourceCandidateRow);
  const reservationCandidates = detail.researchSources
    .filter((source) => source.source_type === 'reservations')
    .map(sourceCandidateRow);
  const referenceCandidates = detail.researchSources
    .filter((source) => ['google_business', 'directory', 'web', 'manual'].includes(source.source_type))
    .map((source) => ({ ...sourceCandidateRow(source), sourceType: source.source_type }));

  return {
    project: {
      slug: detail.slug,
      restaurantName: detail.site?.restaurantName ?? null,
      city: detail.site?.city ?? null,
      siteStatus: cleanString(detail.site?.status),
    },
    adminContext: {
      notes: adminNotes,
      logoHints,
      assetHints,
    },
    intakeContext: {
      request: detail.request,
      intake: detail.intake,
    },
    factualEvidence: {
      address: firstStringFact(detail.researchSources, ['address', 'formatted_address']),
      phone: firstStringFact(detail.researchSources, ['formatted_phone_number', 'international_phone_number', 'phone']),
      hours: collectHours(detail.researchSources),
      mapsUrl: firstStringFact(detail.researchSources, ['maps_url']),
      cuisine: firstStringFact(detail.researchSources, ['primary_type', 'cuisine']),
      rating: collectFirstNumber(detail.researchSources, ['rating']),
    },
    precomputedConflicts: precomputedConflictRecords(detail),
    candidateSources: {
      officialSiteCandidates,
      socialCandidates,
      menuCandidates,
      orderingCandidates,
      reservationCandidates,
      referenceCandidates,
    },
    visualEvidence: {
      logoCandidates: candidateAssets.filter((asset) => asset.assetType === 'logo' || asset.assetType === 'social_profile_asset'),
      photoCandidates: candidateAssets.filter((asset) => ['cover_photo', 'food_photo', 'interior_photo', 'social_profile_asset'].includes(asset.assetType)),
      menuAssetCandidates: candidateAssets.filter((asset) => asset.assetType === 'menu_asset'),
      screenshots: candidateAssets.filter((asset) => asset.assetType === 'screenshot_capture'),
    },
    supplementalLiveReview,
    conflicts: [...new Set([...detail.researchReview.conflicts, ...collectResearchConflicts(detail.researchSources)])],
    reviewHints: {
      blockers: detail.researchReview.blockers,
      officialSiteCandidates: detail.researchReview.officialSiteCandidates,
      menuCandidates: detail.researchReview.menuCandidates,
      socialCandidates: detail.researchReview.socialCandidates,
    },
    representativeEvidence: representativeEvidence(detail.researchSources),
    existingResolvedMenu: detail.existingResolvedMenu ?? null,
    existingResolvedProfile: detail.existingResolvedProfile ?? null,
  };
}

async function requestOpenAiAudit(detail: AuditDetailInput): Promise<ResearchAuditRecord> {
  const credential = await getProviderCredential('openai');
  const apiKey = credential.secret;
  if (!apiKey) {
    throw new Error('Missing OpenAI credentials. Connect OpenAI in admin integrations or add OPENAI_API_KEY server-side before running the research auditor.');
  }

  const dossier = await createResearchAuditDossier(detail);
  const imageInputs = [
    ...dossier.visualEvidence.logoCandidates.slice(0, 2),
    ...dossier.visualEvidence.menuAssetCandidates.slice(0, 2),
    ...dossier.visualEvidence.photoCandidates.slice(0, 2),
    ...dossier.visualEvidence.screenshots.slice(0, 2),
  ]
    .map((asset) => cleanString(asset.assetUrl ?? asset.thumbnailUrl))
    .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)
    .slice(0, 6)
    .map((imageUrl) => ({
      type: 'input_image' as const,
      image_url: imageUrl,
      detail: 'high' as const,
    }));
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_AUDITOR_MODEL,
      reasoning: {
        effort: openAiReasoningEffort('high'),
      },
      tools: [
        {
          type: 'web_search',
          user_location: {
            type: 'approximate',
            country: 'PR',
            city: detail.site?.city ?? 'San Juan',
            region: 'Puerto Rico',
            timezone: 'America/Puerto_Rico',
          },
        },
      ],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources'],
      input: [
        {
          role: 'system',
          content:
            'You are the SaborWeb research operator and AI project manager. Your main job is to turn the submitted owner/admin information plus lightweight verification into the best possible build-agent prompt for a beautiful restaurant website. Review the evidence like a sharp operations admin, brand strategist, local SEO specialist, and web design PM. Decide which facts are canonical, which details are assumptions, and what the build agent needs to create a high-converting first-party restaurant website. Do not hallucinate operational facts. Keep verified truth separate from assumptions and owner-confirmation items. Social profiles are research/public-presence evidence only; the final product is still a first-party restaurant website, not a social-first site. When there is no official website, treat social and Google as the strongest public evidence and outbound CTA sources, but do not downgrade or block the website plan. When there is no source-backed menu, produce a buildable menu strategy: placeholders or an inferred starter menu may be used only when clearly marked as editable/needs owner confirmation, and prices must never be invented. Treat adminContext notes and submitted intake details as high-priority guidance; crawled/source rows supplement them and should not override clearly supplied facts unless there is a strong conflict. Reject Google Search/result/captcha noise as website truth, but allow manually supplied Google menu/profile links to count as evidence when they clearly point to the restaurant. A rendered Google menu viewer that visibly shows sections, item names, descriptions, or prices is valid menu evidence even if the URL lives under google.com/search. Use supplementalLiveReview carefully: if it shows a URL is blocked, a captcha page, a search result page, or irrelevant page, do not promote it to canonical truth. Use precomputedConflicts to reason about mismatched facts and return structured conflictRecords with clear AI recommendations. You may use web search as a focused supplement when key facts or creative direction are missing or uncertain, especially public-facing name, official/social presence, menu clues, photos, competitors, local context, and positioning. Use search to fill gaps carefully, not to overwrite stronger submitted or verified evidence with weaker noise. You will also receive image inputs for likely logos, menus, photos, and screenshots; inspect them directly when judging whether an asset is useful, whether a menu is legible, and whether a social avatar is preview-grade. Screenshots are style/reference evidence only unless they are directly captured social/profile assets. Preserve source-backed menu structure when the existingResolvedMenu is strong, and if existingResolvedMenu is hybrid_generated or fully_generated and still fits the evidence and concept, preserve that site-ready menu instead of downgrading it. Direct the builder toward real restaurant-specific React code in src/generated-sites/[slug]/ registered through src/generated-sites/components.tsx; renderer payloads are fallback artifacts, not the target website experience. The final strategicProfile and siteRecommendations should read like direction for an expert web designer, not like a crawl audit.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(dossier, null, 2),
            },
            ...imageInputs,
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'saborweb_research_audit',
          strict: true,
          schema: auditSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof json.error === 'object' && json.error !== null && 'message' in json.error
        ? String((json.error as { message?: unknown }).message)
        : `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const text = outputText(json);
  if (!text) throw new Error('OpenAI returned no structured research-audit output.');
  return validateAudit(JSON.parse(text));
}

export function readResearchAudit(siteMetadata: Record<string, unknown> | null | undefined) {
  const record = plainRecord(plainRecord(siteMetadata).research_audit);
  if (!record.summary || !record.resolvedProfile) return null;
  try {
    return validateAudit(record);
  } catch (error) {
    console.warn('[Research Audit] Stored research audit could not be parsed; treating as missing.', error);
    return null;
  }
}

export function readResolvedProfile(siteMetadata: Record<string, unknown> | null | undefined) {
  const record = plainRecord(plainRecord(siteMetadata).resolved_profile);
  if (!record.restaurantName) return null;
  return {
    restaurantName: cleanString(record.restaurantName) ?? 'Unknown restaurant',
    cuisine: cleanString(record.cuisine),
    address: cleanString(record.address),
    phone: cleanString(record.phone),
    hours: stringArray(record.hours),
    mapsUrl: cleanString(record.mapsUrl),
    rating: numberValue(record.rating),
    neighborhood: cleanString(record.neighborhood),
    city: cleanString(record.city),
    officialSiteUrl: cleanString(record.officialSiteUrl),
    primaryWebPresenceUrl: cleanString(record.primaryWebPresenceUrl),
    noOfficialWebsite: Boolean(record.noOfficialWebsite),
    menuSourceUrl: cleanString(record.menuSourceUrl),
    menuEvidence: stringArray(record.menuEvidence),
    noStructuredMenu: Boolean(record.noStructuredMenu),
    orderingUrls: stringArray(record.orderingUrls),
    reservationUrls: stringArray(record.reservationUrls),
    confirmedSocialUrls: stringArray(record.confirmedSocialUrls),
    brandDirection: stringArray(record.brandDirection),
    logo: {
      assetKey: cleanString(plainRecord(record.logo).assetKey),
      strategy: ['canonical_asset', 'text_mark', 'generated_placeholder'].includes(String(plainRecord(record.logo).strategy))
        ? (plainRecord(record.logo).strategy as ResolvedRestaurantProfile['logo']['strategy'])
        : null,
    },
    photos: {
      assetKeys: stringArray(plainRecord(record.photos).assetKeys),
        strategy: ['approved_assets', 'tasteful_placeholders', 'generated_imagery'].includes(String(plainRecord(record.photos).strategy))
          ? (plainRecord(record.photos).strategy as ResolvedRestaurantProfile['photos']['strategy'])
          : null,
    },
    missingItems: stringArray(record.missingItems),
    uncertainItems: stringArray(record.uncertainItems),
    evidenceNotes: stringArray(record.evidenceNotes),
  } satisfies ResolvedRestaurantProfile;
}

export function readStrategicProfile(siteMetadata: Record<string, unknown> | null | undefined) {
  const record = plainRecord(plainRecord(siteMetadata).strategic_profile);
  if (!Object.keys(record).length) {
    const audit = readResearchAudit(siteMetadata);
    return audit?.strategicProfile ?? null;
  }

  return {
    businessType: cleanString(record.businessType),
    targetCustomer: cleanString(record.targetCustomer),
    pricePositioning: cleanString(record.pricePositioning),
    uniqueSellingProposition: cleanString(record.uniqueSellingProposition),
    menuStory: cleanString(record.menuStory),
    locationContext: cleanString(record.locationContext),
    trafficPattern: cleanString(record.trafficPattern),
    reviewSentiment: cleanString(record.reviewSentiment),
    competitorLandscape: stringArray(record.competitorLandscape),
    businessModelInsights: stringArray(record.businessModelInsights),
    marketingInsights: stringArray(record.marketingInsights),
    growthOpportunities: stringArray(record.growthOpportunities),
    operationalImprovements: stringArray(record.operationalImprovements),
    visualDirection: stringArray(record.visualDirection),
    siteRecommendations: stringArray(record.siteRecommendations),
  } satisfies StrategicRestaurantProfile;
}

export function applyAuditSuggestionsToReviewState(
  state: ResearchReviewDecisionState,
  audit: ResearchAuditRecord,
): ResearchReviewDecisionState {
  return {
    ...state,
    menuDecisions: {
      approvedStatus: audit.resolvedMenu.status,
      approvedFallbackMode: audit.menuFallbackRecommendation,
      displayMode:
        audit.resolvedMenu.status === 'structured_menu'
          ? 'full_menu'
          : audit.resolvedMenu.status === 'partial_menu'
            ? 'partial_menu'
            : audit.resolvedMenu.status === 'menu_evidence_only'
              ? 'summary_only'
              : state.menuDecisions.displayMode,
    },
    sourceDecisions: {
      ...state.sourceDecisions,
      approvedUrls: [
        ...new Set([
          ...state.sourceDecisions.approvedUrls,
          ...audit.canonicalSources.confirmedSocialUrls,
          ...audit.canonicalSources.orderingUrls,
          ...audit.canonicalSources.reservationUrls,
          audit.canonicalSources.officialSiteUrl,
          audit.canonicalSources.menuSourceUrl,
        ].filter((value): value is string => Boolean(value))),
      ],
      officialSiteUrl: audit.canonicalSources.officialSiteUrl,
      menuSourceUrl: audit.canonicalSources.menuSourceUrl,
      primaryWebPresenceUrl: audit.canonicalSources.primaryWebPresenceUrl,
      confirmedSocialUrls: audit.canonicalSources.confirmedSocialUrls,
      noOfficialSite: audit.canonicalSources.noOfficialWebsite,
      noMenuSource: audit.canonicalSources.noStructuredMenu,
      rejectedUrls: state.sourceDecisions.rejectedUrls,
    },
    assetDecisions: {
      ...state.assetDecisions,
      approvedAssetKeys: [
        ...new Set([
          ...state.assetDecisions.approvedAssetKeys,
          ...audit.canonicalAssets.menuAssetKeys,
        ]),
      ],
      rejectedAssetKeys: state.assetDecisions.rejectedAssetKeys,
      approvedPhotoAssetKeys: [
        ...new Set([
          ...audit.canonicalAssets.approvedPhotoAssetKeys,
          ...state.assetDecisions.approvedPhotoAssetKeys,
        ]),
      ],
      canonicalLogoAssetKey: audit.canonicalAssets.logoAssetKey,
      logoStrategy: audit.canonicalAssets.logoStrategy,
      photoStrategy: audit.canonicalAssets.photoStrategy,
    },
    overrideStatus: audit.summary.buildable ? 'available' : 'required',
    currentQuestionId: state.currentQuestionId,
    completedQuestionIds: state.completedQuestionIds,
    overrideNotesByField: state.overrideNotesByField,
    status: audit.summary.buildable ? 'approved' : 'needs_more_research',
  };
}

export async function generateResearchAudit(detail: AuditDetailInput) {
  return requestOpenAiAudit(detail);
}

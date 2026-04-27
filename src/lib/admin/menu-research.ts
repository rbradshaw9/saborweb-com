import 'server-only';

import { cookieHeaderForUrl, getProviderCredential, readStoredBrowserSession } from '@/lib/admin/credentials';
import { uploadImageToCloudinary } from '@/lib/admin/cloudinary';
import { captureMenuPageEvidence } from '@/lib/admin/qa-runner';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_MENU_MODEL = process.env.OPENAI_MENU_MODEL || process.env.OPENAI_AUDITOR_MODEL || process.env.OPENAI_MODEL || 'gpt-5.5';

export type ResolvedMenuStatus = 'structured_menu' | 'partial_menu' | 'menu_evidence_only' | 'no_menu_found';
export type ResolvedMenuFallbackMode = 'none' | 'summary_only' | 'aggressive_ai_generated';
export type ResolvedMenuProvenanceMode = 'source_backed' | 'hybrid_generated' | 'fully_generated';
export type MenuSourceKind = 'html' | 'pdf' | 'image' | 'social' | 'third_party' | 'uploaded_file' | 'unknown';

export type ResolvedMenuItem = {
  name: string;
  description: string | null;
  priceText: string | null;
  badges: string[];
  sourceBacked: boolean;
  inferred: boolean;
  provenance: string[];
};

export type ResolvedMenuCategory = {
  name: string;
  description: string | null;
  items: ResolvedMenuItem[];
};

export type MenuEvidenceSource = {
  label: string;
  url: string | null;
  sourceType: MenuSourceKind;
  candidateType: string;
  confidence: number;
  extractionQuality: 'strong' | 'medium' | 'weak';
  notes: string[];
};

export type ResolvedMenu = {
  status: ResolvedMenuStatus;
  canonicalSourceUrl: string | null;
  sourceType: MenuSourceKind | null;
  confidence: number;
  provenanceMode: ResolvedMenuProvenanceMode;
  menuName: string | null;
  categories: ResolvedMenuCategory[];
  featuredItems: string[];
  summaryLines: string[];
  missingFields: string[];
  fallbackMode: ResolvedMenuFallbackMode;
  evidenceSources: MenuEvidenceSource[];
  extractionNotes: string[];
  pricesComplete: boolean;
  descriptionsSourceBacked: boolean;
};

type ResearchSourceInput = {
  source_type: string;
  url: string | null;
  title: string | null;
  confidence: number;
  extracted_facts: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type SiteAssetInput = {
  id: string;
  asset_type: string;
  status: string;
  source_url: string | null;
  source_label: string | null;
  metadata: Record<string, unknown>;
};

type MenuCandidate = {
  label: string;
  url: string;
  sourceType: MenuSourceKind;
  candidateType: string;
  confidence: number;
  sourceLabel: string | null;
  notes: string[];
  imageUrl: string | null;
};

type MenuSourceEvidence = {
  label: string;
  url: string;
  sourceType: MenuSourceKind;
  candidateType: string;
  confidence: number;
  contentType: string | null;
  statusCode: number | null;
  blocked: boolean;
  blockedReason: string | null;
  finalUrl: string | null;
  title: string | null;
  textExcerpt: string | null;
  markdownExcerpt: string | null;
  notes: string[];
  imageUrl: string | null;
};

type MenuRecoveryMode = 'standard' | 'vision_recovery' | 'site_ready_fallback';

type GenerateResolvedMenuInput = {
  site: {
    id: string;
    requestId: string | null;
    slug: string;
    restaurantName: string;
    city: string | null;
  };
  researchSources: ResearchSourceInput[];
  siteAssets?: SiteAssetInput[];
};

type MenuRow = {
  id: string;
  site_id: string;
  name: string;
  source_notes: string | null;
  metadata: Record<string, unknown>;
};

type MenuCategoryRow = {
  id: string;
  menu_id: string;
  sort_order: number;
  name_en: string | null;
  name_es: string | null;
  description_en: string | null;
  description_es: string | null;
  metadata: Record<string, unknown>;
};

type MenuItemRow = {
  id: string;
  category_id: string;
  sort_order: number;
  name_en: string | null;
  name_es: string | null;
  description_en: string | null;
  description_es: string | null;
  price_text: string | null;
  badges: unknown;
  metadata: Record<string, unknown>;
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function cleanNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function clipText(value: string | null, length = 8000) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > length ? `${trimmed.slice(0, length)}...` : trimmed;
}

function assetKey(input: { assetType: string; assetUrl: string; sourceUrl?: string | null }) {
  return `${input.assetType}:${[input.assetUrl, input.sourceUrl ?? ''].join('|')}`
    .toLowerCase()
    .replace(/[^a-z0-9:/|_-]+/g, '-')
    .slice(0, 180);
}

function emptyResolvedMenu(): ResolvedMenu {
  return {
    status: 'no_menu_found',
    canonicalSourceUrl: null,
    sourceType: null,
    confidence: 0,
    provenanceMode: 'source_backed',
    menuName: null,
    categories: [],
    featuredItems: [],
    summaryLines: [],
    missingFields: ['menu'],
    fallbackMode: 'none',
    evidenceSources: [],
    extractionNotes: [],
    pricesComplete: false,
    descriptionsSourceBacked: false,
  };
}

function classifyMenuSource(params: {
  url: string;
  sourceType?: string | null;
  contentType?: string | null;
  fileName?: string | null;
}) : MenuSourceKind {
  const joined = [params.url, params.sourceType ?? '', params.contentType ?? '', params.fileName ?? ''].join(' ').toLowerCase();
  if (/instagram|facebook|fb\.com/.test(joined)) return 'social';
  if (/allmenus|menupix|singleplatform|doordash|ubereats|grubhub|seamless|toasttab|chownow|square\.site|clover|opentable|resy|tock|sevenrooms/.test(joined)) return 'third_party';
  if (/application\/pdf|\.pdf(\?|$)/.test(joined)) return 'pdf';
  if (/image\/|\.png(\?|$)|\.jpe?g(\?|$)|\.webp(\?|$)|\.gif(\?|$)/.test(joined)) return 'image';
  if (/uploaded|intake_file/.test(joined)) return 'uploaded_file';
  if (/html|text\/html|website|menu/.test(joined)) return 'html';
  return 'unknown';
}

function likelyMenuUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  if (!value) return false;
  return /menu|allmenus|menupix|singleplatform|toasttab|doordash|ubereats|grubhub|seamless|chownow|square\.site|clover|\.pdf(\?|$)|menu-viewer-entrypoint/.test(value);
}

function isGoogleMenuViewerUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  return /google\.com\/search/.test(value) && /vssid=menu-viewer-entrypoint/.test(value);
}

function menuContextText(source: ResearchSourceInput, metadata: Record<string, unknown>, facts: Record<string, unknown>) {
  return [
    source.source_type,
    source.title ?? '',
    source.url ?? '',
    cleanString(facts.text_excerpt),
    cleanString(facts.markdown_excerpt),
    cleanString(facts.description),
    cleanString(facts.website),
    cleanString(metadata.title),
    cleanString(metadata.description),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function imageUrlsFromValue(value: unknown, depth = 0): string[] {
  if (depth > 3) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((item) => imageUrlsFromValue(item, depth + 1));
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((item) => imageUrlsFromValue(item, depth + 1));
  }
  return [];
}

function likelyMenuImageCandidate(params: {
  source: ResearchSourceInput;
  url: string;
  contextText: string;
}) {
  const lowerUrl = params.url.toLowerCase();
  if (isGoogleMenuViewerUrl(params.source.url)) return true;
  if (/menu|food-menu|breakfast-menu|brunch-menu|menuviewer/.test(lowerUrl)) return true;
  if (params.source.source_type === 'menu') return true;
  if (params.source.source_type === 'social') {
    return /menu|breakfast burrito|\$|breakfast|coffee|smoothie|acai|açaí|cocktail|juice/.test(params.contextText);
  }
  return /menu|\$\d|breakfast burrito|breakfast sliders|beverages|smoothies|bowls|cocktails/.test(params.contextText);
}

function blockedReasonForMenu(url: string, text: string | null | undefined) {
  const lowerUrl = url.toLowerCase();
  const value = (text ?? '').toLowerCase();
  if (!isGoogleMenuViewerUrl(url) && /google\.com\/search|google\.com\/sorry|support\.google\.com\/websearch|google\.com\/webhp|google\.com\/imgres/.test(lowerUrl)) {
    return 'google_search_result';
  }
  if (!value) return null;
  if (value.includes('our systems have detected unusual traffic') || value.includes('recaptcha')) return 'captcha_or_rate_limited';
  if (value.includes('log into facebook') || value.includes('you must log in to continue')) return 'facebook_login_wall';
  if (value.includes('instagram') && value.includes('login')) return 'instagram_login_wall';
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

export function normalizeResolvedMenu(value: unknown): ResolvedMenu {
  const record = asRecord(value);
  const categories = Array.isArray(record.categories)
    ? record.categories
        .filter((category): category is Record<string, unknown> => typeof category === 'object' && category !== null && !Array.isArray(category))
        .map((category) => ({
          name: cleanString(category.name) ?? 'Menu section',
          description: cleanString(category.description),
          items: Array.isArray(category.items)
            ? category.items
                .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
                .map((item) => ({
                  name: cleanString(item.name) ?? 'Menu item',
                  description: cleanString(item.description),
                  priceText: cleanString(item.priceText),
                  badges: stringArray(item.badges),
                  sourceBacked: Boolean(item.sourceBacked),
                  inferred: Boolean(item.inferred),
                  provenance: stringArray(item.provenance),
                }))
            : [],
        }))
    : [];

  const evidenceSources = Array.isArray(record.evidenceSources)
    ? record.evidenceSources
        .filter((source): source is Record<string, unknown> => typeof source === 'object' && source !== null && !Array.isArray(source))
        .map((source) => ({
          label: cleanString(source.label) ?? 'Menu evidence',
          url: cleanString(source.url),
          sourceType: ['html', 'pdf', 'image', 'social', 'third_party', 'uploaded_file', 'unknown'].includes(String(source.sourceType))
            ? (source.sourceType as MenuSourceKind)
            : 'unknown',
          candidateType: cleanString(source.candidateType) ?? 'candidate',
          confidence: Math.max(0, Math.min(1, cleanNumber(source.confidence) ?? 0)),
          extractionQuality: ['strong', 'medium', 'weak'].includes(String(source.extractionQuality))
            ? (source.extractionQuality as MenuEvidenceSource['extractionQuality'])
            : 'weak',
          notes: stringArray(source.notes),
        }))
    : [];

  return {
    status: ['structured_menu', 'partial_menu', 'menu_evidence_only', 'no_menu_found'].includes(String(record.status))
      ? (record.status as ResolvedMenuStatus)
      : 'no_menu_found',
    canonicalSourceUrl: cleanString(record.canonicalSourceUrl),
    sourceType: ['html', 'pdf', 'image', 'social', 'third_party', 'uploaded_file', 'unknown'].includes(String(record.sourceType))
      ? (record.sourceType as MenuSourceKind)
      : null,
    confidence: Math.max(0, Math.min(100, cleanNumber(record.confidence) ?? 0)),
    provenanceMode: ['source_backed', 'hybrid_generated', 'fully_generated'].includes(String(record.provenanceMode))
      ? (record.provenanceMode as ResolvedMenuProvenanceMode)
      : 'source_backed',
    menuName: cleanString(record.menuName),
    categories,
    featuredItems: stringArray(record.featuredItems),
    summaryLines: stringArray(record.summaryLines),
    missingFields: stringArray(record.missingFields),
    fallbackMode: ['none', 'summary_only', 'aggressive_ai_generated'].includes(String(record.fallbackMode))
      ? (record.fallbackMode as ResolvedMenuFallbackMode)
      : 'none',
    evidenceSources,
    extractionNotes: stringArray(record.extractionNotes),
    pricesComplete: Boolean(record.pricesComplete),
    descriptionsSourceBacked: Boolean(record.descriptionsSourceBacked),
  };
}

export function readResolvedMenu(siteMetadata: Record<string, unknown> | null | undefined) {
  const record = asRecord(asRecord(siteMetadata).resolved_menu);
  if (!Object.keys(record).length) return null;
  return normalizeResolvedMenu(record);
}

async function menuFileCandidates(requestId: string | null) {
  if (!requestId) return [] as MenuCandidate[];
  const supabase = getSupabaseAdmin();
  const { data: files } = await supabase
    .from('intake_files')
    .select('id, file_role, file_name, content_type, storage_bucket, storage_path')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .limit(12);

  if (!files?.length) return [];

  const candidates: MenuCandidate[] = [];
  for (const file of files) {
    const role = cleanString(file.file_role)?.toLowerCase() ?? '';
    const contentType = cleanString(file.content_type)?.toLowerCase() ?? '';
    const fileName = cleanString(file.file_name);
    const probablyMenu = role.includes('menu') || contentType.includes('pdf') || contentType.startsWith('image/');
    if (!probablyMenu) continue;

    const bucket = cleanString(file.storage_bucket);
    const storagePath = cleanString(file.storage_path);
    if (!bucket || !storagePath) continue;

    const { data } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 30);
    const signedUrl = cleanString(data?.signedUrl);
    if (!signedUrl) continue;

    candidates.push({
      label: fileName ?? 'Uploaded menu file',
      url: signedUrl,
      sourceType: classifyMenuSource({ url: signedUrl, contentType, fileName, sourceType: 'uploaded_file' }),
      candidateType: 'uploaded_file',
      confidence: 0.94,
      sourceLabel: fileName,
      notes: ['Uploaded by the restaurant or admin.'],
      imageUrl: contentType.startsWith('image/') ? signedUrl : null,
    });
  }

  return candidates;
}

function menuAssetCandidates(siteAssets: SiteAssetInput[]) {
  return siteAssets
    .map((asset) => {
      const metadata = asRecord(asset.metadata);
      const assetUrl = normalizeUrl(cleanString(metadata.asset_url) ?? cleanString(metadata.secure_url) ?? cleanString(asset.source_url));
      if (!assetUrl) return null;
      const candidateType = cleanString(metadata.candidate_type) ?? asset.asset_type;
      if (!(candidateType.includes('menu') || asset.asset_type === 'menu' || asset.asset_type === 'document')) return null;
      const sourceType = classifyMenuSource({
        url: assetUrl,
        sourceType: candidateType,
      });

      return {
        label: cleanString(metadata.title) ?? asset.source_label ?? 'Menu asset',
        url: assetUrl,
        sourceType,
        candidateType: 'site_asset',
        confidence: Math.max(0.55, Math.min(0.98, cleanNumber(metadata.confidence) ?? 0.72)),
        sourceLabel: cleanString(asset.source_label),
        notes: ['Captured by the research asset pipeline.'],
        imageUrl: sourceType === 'image' ? assetUrl : null,
      } satisfies MenuCandidate;
    })
    .filter((candidate): candidate is MenuCandidate => Boolean(candidate));
}

function researchSourceCandidates(sources: ResearchSourceInput[]) {
  const candidates: MenuCandidate[] = [];

  for (const source of sources) {
    const metadata = asRecord(source.metadata);
    const facts = asRecord(source.extracted_facts);
    const contextText = menuContextText(source, metadata, facts);
    const directUrl = normalizeUrl(source.url);

    if (source.source_type === 'menu' && directUrl) {
      candidates.push({
        label: cleanString(source.title) ?? 'Menu source',
        url: directUrl,
        sourceType: classifyMenuSource({ url: directUrl, sourceType: source.source_type }),
        candidateType: 'research_source',
        confidence: Math.max(0.4, source.confidence),
        sourceLabel: cleanString(source.title),
        notes: ['Discovered during evidence collection.'],
        imageUrl: classifyMenuSource({ url: directUrl, sourceType: source.source_type }) === 'image' ? directUrl : null,
      });
    }

    if ((source.source_type === 'social' || source.source_type === 'menu') && directUrl) {
      candidates.push({
        label: cleanString(source.title) ?? 'Social menu probe',
        url: directUrl,
        sourceType: classifyMenuSource({ url: directUrl, sourceType: source.source_type }),
        candidateType: 'social_page_menu_probe',
        confidence: Math.max(0.38, source.confidence - 0.04),
        sourceLabel: cleanString(source.title),
        notes: ['Probe the social/menu page directly for rendered menu evidence.'],
        imageUrl: null,
      });
    }

    const discoveredLinks = stringArray(facts.discovered_links);
    for (const discoveredLink of discoveredLinks) {
      const normalized = normalizeUrl(discoveredLink);
      if (!normalized || !likelyMenuUrl(normalized)) continue;
      candidates.push({
        label: cleanString(source.title) ?? 'Discovered menu link',
        url: normalized,
        sourceType: classifyMenuSource({ url: normalized, sourceType: source.source_type }),
        candidateType: 'discovered_link',
        confidence: Math.max(0.32, source.confidence - 0.08),
        sourceLabel: cleanString(source.title),
        notes: ['Discovered from extracted page links.'],
        imageUrl: classifyMenuSource({ url: normalized, sourceType: source.source_type }) === 'image' ? normalized : null,
      });
    }

    const website = normalizeUrl(cleanString(facts.website));
    if (website && likelyMenuUrl(website)) {
      candidates.push({
        label: cleanString(source.title) ?? 'Website menu',
        url: website,
        sourceType: classifyMenuSource({ url: website, sourceType: source.source_type }),
        candidateType: 'fact_website',
        confidence: Math.max(0.35, source.confidence - 0.1),
        sourceLabel: cleanString(source.title),
        notes: ['Menu-like website discovered in extracted facts.'],
        imageUrl: classifyMenuSource({ url: website, sourceType: source.source_type }) === 'image' ? website : null,
      });
    }

    const menuImage = normalizeUrl(cleanString(metadata.menu_image_url));
    if (menuImage) {
      candidates.push({
        label: cleanString(source.title) ?? 'Menu image',
        url: menuImage,
        sourceType: 'image',
        candidateType: 'metadata_image',
        confidence: Math.max(0.35, source.confidence),
        sourceLabel: cleanString(source.title),
        notes: ['Menu image found in source metadata.'],
        imageUrl: menuImage,
      });
    }

    const inlineImageCandidates = [...new Set(
      [
        ...stringArray(facts.images),
        ...stringArray(facts.image_urls),
        ...stringArray(facts.menu_images),
        ...stringArray(metadata.images),
        ...stringArray(metadata.imageUrls),
        ...stringArray(metadata.menuImages),
        ...imageUrlsFromValue(metadata.screenshot),
      ]
        .map((value) => normalizeUrl(value))
        .filter((value): value is string => Boolean(value))
    )];

    for (const imageUrl of inlineImageCandidates) {
      if (!likelyMenuImageCandidate({ source, url: imageUrl, contextText })) continue;
      candidates.push({
        label: cleanString(source.title) ?? 'Menu image evidence',
        url: imageUrl,
        sourceType: 'image',
        candidateType: 'source_image',
        confidence: Math.max(0.34, source.confidence - 0.06),
        sourceLabel: cleanString(source.title),
        notes: ['Image candidate attached to a menu/social source and worth OCR/vision review.'],
        imageUrl,
      });
    }
  }

  const deduped = new Map<string, MenuCandidate>();
  for (const candidate of candidates) {
    const existing = deduped.get(candidate.url);
    if (!existing || existing.confidence < candidate.confidence) deduped.set(candidate.url, candidate);
  }
  return [...deduped.values()]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 8);
}

async function firecrawlMenuSource(url: string) {
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
      formats: ['markdown', 'images', { type: 'screenshot', fullPage: true, quality: 70 }],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);

  if (!response) return null;

  const json = asRecord(await response.json().catch(() => ({})));
  const data = asRecord(json.data);
  const metadata = asRecord(data.metadata);
  const images = Array.isArray(data.images) ? data.images.map((value) => cleanString(value)).filter((value): value is string => Boolean(value)) : [];
  const screenshot = cleanString(asRecord(data.screenshot).url) ?? cleanString(data.screenshot);
  return {
    markdown: clipText(cleanString(data.markdown), 10000),
    title: cleanString(metadata.title) ?? cleanString(metadata.ogTitle),
    url: cleanString(metadata.url) ?? url,
    statusCode: typeof metadata.statusCode === 'number' ? metadata.statusCode : response.status,
    images,
    screenshot,
  };
}

async function fetchMenuSource(candidate: MenuCandidate): Promise<MenuSourceEvidence> {
  const metaSessionCredential = await getProviderCredential('meta_research_session');
  const metaSession = readStoredBrowserSession(metaSessionCredential.secret);
  const cookieHeader = cookieHeaderForUrl(metaSession, candidate.url);
  const response = await fetch(candidate.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SaborWebMenuResearch/1.0; +https://saborweb.com)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/pdf;q=0.7,*/*;q=0.5',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  const contentType = response?.headers.get('content-type') ?? null;
  const body = response ? clipText(await response.text().catch(() => null), 14000) : null;
  const firecrawl = candidate.sourceType === 'image' ? null : await firecrawlMenuSource(candidate.url).catch(() => null);
  const title = firecrawl?.title ?? (contentType && /html/i.test(contentType) ? extractTitleFromHtml(body) : null);
  const textExcerpt = clipText(
    firecrawl?.markdown?.replace(/[#>*_`~-]/g, ' ').replace(/\s+/g, ' ') ??
      (contentType && /html/i.test(contentType) ? stripHtmlText(body) : body),
    2200,
  );
  const blockedReason =
    blockedReasonForMenu(candidate.url, `${title ?? ''}\n${textExcerpt ?? ''}`) ??
    (!response ? 'fetch_failed' : null);

  return {
    label: candidate.label,
    url: candidate.url,
    sourceType: classifyMenuSource({
      url: firecrawl?.url ?? candidate.url,
      sourceType: candidate.sourceType,
      contentType,
    }),
    candidateType: candidate.candidateType,
    confidence: candidate.confidence,
    contentType,
    statusCode: firecrawl?.statusCode ?? response?.status ?? null,
    blocked: !response || !response.ok || Boolean(blockedReason),
    blockedReason: !response
      ? 'fetch_failed'
      : !response.ok
        ? `http_${response.status}`
        : blockedReason,
    finalUrl: firecrawl?.url ?? response?.url ?? candidate.url,
    title,
    textExcerpt,
    markdownExcerpt: firecrawl?.markdown ?? null,
    notes: candidate.notes,
    imageUrl: candidate.imageUrl ?? firecrawl?.screenshot ?? firecrawl?.images?.[0] ?? null,
  };
}

async function browserMenuEvidence(site: GenerateResolvedMenuInput['site'], candidates: MenuCandidate[]) {
  const browserTargets = candidates
    .filter((candidate) => isGoogleMenuViewerUrl(candidate.url) || candidate.sourceType === 'social' || candidate.sourceType === 'image')
    .slice(0, 4);

  if (!browserTargets.length) return [] as MenuSourceEvidence[];

  const metaSessionCredential = await getProviderCredential('meta_research_session');
  const metaSession = readStoredBrowserSession(metaSessionCredential.secret);
  const captures = await captureMenuPageEvidence(
    browserTargets.map((candidate) => candidate.url),
    { storageState: metaSession?.storageState ?? null },
  ).catch(() => []);

  const evidence: MenuSourceEvidence[] = [];
  for (const capture of captures) {
    const candidate = browserTargets.find((item) => item.url === capture.url);
    if (!candidate) continue;

    for (let index = 0; index < capture.visualCaptures.length; index += 1) {
      const visualCapture = capture.visualCaptures[index];
      const blob = new Blob([new Uint8Array(visualCapture.screenshot)], { type: 'image/png' });
      const upload = await uploadImageToCloudinary({
        file: blob,
        folder: 'saborweb/research-assets',
        publicId: `${site.slug}-menu-capture-${assetKey({
          assetType: 'menu_capture',
          assetUrl: `${capture.url}#${index}`,
          sourceUrl: capture.url,
        })}`,
        tags: ['saborweb', 'menu-capture', site.slug],
        context: {
          source_url: capture.url,
          source_type: candidate.sourceType,
        },
      }).catch(() => null);

      evidence.push({
        label: `${candidate.label} - ${visualCapture.label}`,
        url: capture.url,
        sourceType: candidate.sourceType,
        candidateType: isGoogleMenuViewerUrl(capture.url) ? 'google_menu_viewer_capture' : 'browser_menu_capture',
        confidence: Math.min(0.98, candidate.confidence + (isGoogleMenuViewerUrl(capture.url) ? 0.22 : 0.12)),
        contentType: 'image/png',
        statusCode: 200,
        blocked: false,
        blockedReason: null,
        finalUrl: capture.url,
        title: capture.title,
        textExcerpt: visualCapture.textExcerpt ?? capture.textExcerpt,
        markdownExcerpt: null,
        notes: [
          ...candidate.notes,
          isGoogleMenuViewerUrl(capture.url)
            ? 'Captured directly from the rendered Google menu viewer.'
            : 'Captured directly from a rendered page to recover menu visuals.',
        ],
        imageUrl: upload?.secureUrl ?? null,
      });
    }
  }

  return evidence;
}

const menuResolutionSchema = {
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

async function requestResolvedMenu(params: {
  site: GenerateResolvedMenuInput['site'];
  evidence: MenuSourceEvidence[];
  mode?: MenuRecoveryMode;
}) {
  const credential = await getProviderCredential('openai');
  const apiKey = credential.secret;
  if (!apiKey) {
    throw new Error('Missing OpenAI credentials. Connect OpenAI before running menu extraction.');
  }

  const prioritizedEvidence = [...params.evidence].sort((left, right) => {
    const score = (evidence: MenuSourceEvidence) => {
      let value = evidence.confidence;
      if (/google_menu_viewer_capture|browser_menu_capture/.test(evidence.candidateType)) value += 0.4;
      if (evidence.imageUrl) value += 0.2;
      if (evidence.textExcerpt && /\$\d|mains|smoothies|bowls|beverages|menu/i.test(evidence.textExcerpt)) value += 0.15;
      return value;
    };
    return score(right) - score(left);
  });

  const imageInputs = prioritizedEvidence
    .filter((evidence) => evidence.imageUrl && !evidence.blocked)
    .slice(0, 4)
    .map((evidence) => ({
      type: 'input_image',
      image_url: evidence.imageUrl!,
      detail: 'high',
    }));

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MENU_MODEL,
      reasoning: { effort: params.evidence.length >= 3 ? 'medium' : 'low' },
      input: [
        {
          role: 'system',
          content:
            params.mode === 'vision_recovery'
              ? 'You are the SaborWeb menu extraction operator running a recovery pass. Focus on the attached rendered menu screenshots and browser-captured menu evidence. If the images clearly show menu sections, item names, descriptions, or prices, recover every source-backed item you can. A rendered Google menu viewer counts as valid menu evidence when the content is visible. If the evidence is partial, you may complete the menu into a full site-ready menu by generating clearly inferred sections or items, but mark those items as inferred and set provenanceMode to hybrid_generated. If there is truly no usable source-backed menu detail at all, you may generate a full concept-matched fallback menu, mark every generated item as inferred, and set provenanceMode to fully_generated with fallbackMode aggressive_ai_generated.'
              : params.mode === 'site_ready_fallback'
                ? 'You are the SaborWeb menu extraction operator producing a production-ready owned-website menu. The site must have a full editable restaurant menu even when source evidence is weak. Use every source-backed detail you can recover, then complete the rest with plausible inferred sections and items that fit the restaurant concept. Never return no_menu_found or menu_evidence_only in this mode. Return a full structured menu whenever possible. If you have some real clues, use provenanceMode hybrid_generated. If you have almost no usable item-level truth, use provenanceMode fully_generated and fallbackMode aggressive_ai_generated. Mark inferred items as inferred, keep provenance strings useful, and favor realistic cafe structure over vague summaries.'
                : 'You are the SaborWeb menu extraction operator. Turn menu source evidence into the best restaurant menu the site can use right now. Prefer source-backed menu facts. Use HTML/PDF/text evidence first, and use image inputs to read menu images when present. If the evidence gives you a real but incomplete menu, complete it into a full site-ready menu while clearly marking inferred items as inferred and setting provenanceMode to hybrid_generated. If there is truly no usable menu source at all, generate a full site-ready menu that matches the restaurant concept, mark generated items as inferred, set provenanceMode to fully_generated, and use fallbackMode aggressive_ai_generated. If a rendered Google menu viewer or social/menu image clearly shows item names, descriptions, or prices, treat that as valid structured menu evidence and return structured_menu whenever you can assemble a complete site-ready menu. Preserve provenance per item/category at a high level through provenance strings.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({
                restaurant: {
                  name: params.site.restaurantName,
                  city: params.site.city,
                  slug: params.site.slug,
                },
                websiteGoal: {
                  product: 'owned_restaurant_website',
                  requirement: 'Return a full editable restaurant menu for the site whenever possible.',
                  socialRole: 'research_only',
                },
                recoveryMode: params.mode ?? 'standard',
                menuSources: prioritizedEvidence.map((evidence) => ({
                  label: evidence.label,
                  url: evidence.url,
                  sourceType: evidence.sourceType,
                  candidateType: evidence.candidateType,
                  confidence: evidence.confidence,
                  blocked: evidence.blocked,
                  blockedReason: evidence.blockedReason,
                  contentType: evidence.contentType,
                  title: evidence.title,
                  textExcerpt: evidence.textExcerpt,
                  markdownExcerpt: evidence.markdownExcerpt,
                  notes: evidence.notes,
                })),
              }, null, 2),
            },
            ...imageInputs,
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'saborweb_resolved_menu',
          strict: true,
          schema: menuResolutionSchema,
        },
      },
    }),
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
  if (!text) throw new Error('OpenAI returned no structured menu output.');
  return normalizeResolvedMenu(JSON.parse(text));
}

export async function generateResolvedMenu(input: GenerateResolvedMenuInput): Promise<ResolvedMenu> {
  let siteAssets = input.siteAssets ?? [];
  if (!siteAssets.length) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('site_assets')
      .select('id, asset_type, status, source_url, source_label, metadata')
      .eq('site_id', input.site.id)
      .order('updated_at', { ascending: false })
      .limit(40);
    siteAssets = (data ?? []) as SiteAssetInput[];
  }

  const candidates = [
    ...researchSourceCandidates(input.researchSources),
    ...menuAssetCandidates(siteAssets),
    ...(await menuFileCandidates(input.site.requestId)),
  ];

  const deduped = new Map<string, MenuCandidate>();
  for (const candidate of candidates) {
    const existing = deduped.get(candidate.url);
    if (!existing || existing.confidence < candidate.confidence) deduped.set(candidate.url, candidate);
  }

  const selected = [...deduped.values()]
    .sort((left, right) => {
      const score = (candidate: MenuCandidate) => {
        let value = candidate.confidence;
        if (isGoogleMenuViewerUrl(candidate.url)) value += 0.45;
        if (candidate.sourceType === 'image') value += 0.22;
        if (candidate.sourceType === 'social') value += 0.14;
        if (/source_image|metadata_image|social_page_menu_probe/.test(candidate.candidateType)) value += 0.12;
        return value;
      };
      return score(right) - score(left);
    })
    .slice(0, 8);

  if (!selected.length) {
    try {
      return await requestResolvedMenu({
        site: input.site,
        evidence: [],
        mode: 'site_ready_fallback',
      });
    } catch (error) {
      console.error('[Menu Research] Generated fallback menu failed:', error);
      return {
        ...emptyResolvedMenu(),
        provenanceMode: 'fully_generated',
        fallbackMode: 'aggressive_ai_generated',
        extractionNotes: ['No direct menu evidence was found, and fallback generation failed.'],
      };
    }
  }

  const fetchedEvidence = (await Promise.all(selected.map((candidate) => fetchMenuSource(candidate).catch(() => null))))
    .filter((value): value is MenuSourceEvidence => Boolean(value));
  const capturedEvidence = await browserMenuEvidence(input.site, selected).catch(() => []);
  const evidence = [...fetchedEvidence, ...capturedEvidence];

  const usefulEvidence = evidence.filter((item) =>
    !item.blocked && Boolean(item.markdownExcerpt || item.textExcerpt || item.imageUrl)
  );

  if (!usefulEvidence.length) {
    try {
      return await requestResolvedMenu({
        site: input.site,
        evidence,
        mode: 'site_ready_fallback',
      });
    } catch (error) {
      console.error('[Menu Research] Generated fallback from weak evidence failed:', error);
      return {
        ...emptyResolvedMenu(),
        provenanceMode: 'fully_generated',
        fallbackMode: 'aggressive_ai_generated',
        evidenceSources: evidence.map((item) => ({
          label: item.label,
          url: item.finalUrl ?? item.url,
          sourceType: item.sourceType,
          candidateType: item.candidateType,
          confidence: item.confidence,
          extractionQuality: 'weak',
          notes: [...item.notes, item.blockedReason ?? 'No readable menu content recovered.'].filter(Boolean),
        })),
        extractionNotes: ['No usable menu content could be recovered from the discovered sources, and fallback generation failed.'],
      };
    }
  }

  try {
    const resolvedMenu = await requestResolvedMenu({
      site: input.site,
      evidence: usefulEvidence,
      mode: 'standard',
    });
    if (
      ['no_menu_found', 'menu_evidence_only'].includes(resolvedMenu.status) &&
      usefulEvidence.some((item) => /google_menu_viewer_capture|browser_menu_capture/.test(item.candidateType) && item.imageUrl)
    ) {
      const recoveryMenu = await requestResolvedMenu({
        site: input.site,
        evidence: usefulEvidence,
        mode: 'vision_recovery',
      });
      if (
        (recoveryMenu.status === 'partial_menu' || recoveryMenu.status === 'structured_menu') &&
        recoveryMenu.categories.length
      ) {
        return {
          ...recoveryMenu,
          fallbackMode: 'none',
        };
      }
    }

    if (
      ['menu_evidence_only', 'no_menu_found'].includes(resolvedMenu.status) ||
      !resolvedMenu.categories.length ||
      resolvedMenu.fallbackMode === 'summary_only'
    ) {
      const siteReadyFallback = await requestResolvedMenu({
        site: input.site,
        evidence: usefulEvidence,
        mode: 'site_ready_fallback',
      });
      if (siteReadyFallback.categories.length) {
        return siteReadyFallback;
      }
    }

    return {
      ...resolvedMenu,
      fallbackMode: 'none',
    };
  } catch (error) {
    console.error('[Menu Research] Menu extraction failed:', error);
    return {
      ...emptyResolvedMenu(),
      evidenceSources: usefulEvidence.map((item) => ({
        label: item.label,
        url: item.finalUrl ?? item.url,
        sourceType: item.sourceType,
        candidateType: item.candidateType,
        confidence: item.confidence,
        extractionQuality: item.markdownExcerpt || item.textExcerpt ? 'medium' : 'weak',
        notes: item.notes,
      })),
      extractionNotes: ['Menu extraction failed before a structured menu could be produced.'],
    };
  }
}

export async function persistResolvedMenu(siteId: string, menu: ResolvedMenu) {
  const supabase = getSupabaseAdmin();
  const { data: existingMenus } = await supabase
    .from('menus')
    .select('id')
    .eq('site_id', siteId)
    .contains('metadata', { managed_by: 'research_menu_pipeline' });

  if (existingMenus?.length) {
    const { error: deleteError } = await supabase.from('menus').delete().in('id', existingMenus.map((row) => row.id));
    if (deleteError) console.error('[Menu Research] Existing research menus cleanup failed:', deleteError);
  }

  const menuRow = await supabase
    .from('menus')
    .insert({
      site_id: siteId,
      name: menu.menuName ?? 'Main menu',
      language: 'both',
      status: 'draft',
      source_notes: menu.canonicalSourceUrl,
      metadata: {
        managed_by: 'research_menu_pipeline',
        status: menu.status,
        confidence: menu.confidence,
        provenanceMode: menu.provenanceMode,
        canonicalSourceUrl: menu.canonicalSourceUrl,
        sourceType: menu.sourceType,
        fallbackMode: menu.fallbackMode,
        summaryLines: menu.summaryLines,
        featuredItems: menu.featuredItems,
        missingFields: menu.missingFields,
        evidenceSources: menu.evidenceSources,
        extractionNotes: menu.extractionNotes,
        pricesComplete: menu.pricesComplete,
        descriptionsSourceBacked: menu.descriptionsSourceBacked,
      },
    })
    .select('id, site_id, name, source_notes, metadata')
    .single();

  if (menuRow.error || !menuRow.data) {
    console.error('[Menu Research] Could not save resolved menu:', menuRow.error);
    return;
  }

  const insertedMenu = menuRow.data as unknown as MenuRow;
  for (let categoryIndex = 0; categoryIndex < menu.categories.length; categoryIndex += 1) {
    const category = menu.categories[categoryIndex];
    const categoryInsert = await supabase
      .from('menu_categories')
      .insert({
        menu_id: insertedMenu.id,
        sort_order: categoryIndex,
        name_en: category.name,
        name_es: category.name,
        description_en: category.description,
        description_es: category.description,
        metadata: {
          managed_by: 'research_menu_pipeline',
        },
      })
      .select('id')
      .single();

    if (categoryInsert.error || !categoryInsert.data) {
      console.error('[Menu Research] Could not save menu category:', categoryInsert.error);
      continue;
    }

    const categoryId = String(categoryInsert.data.id);
    const rows = category.items.map((item, itemIndex) => ({
      category_id: categoryId,
      sort_order: itemIndex,
      name_en: item.name,
      name_es: item.name,
      description_en: item.description,
      description_es: item.description,
      price_text: item.priceText,
      badges: item.badges,
      metadata: {
        managed_by: 'research_menu_pipeline',
        sourceBacked: item.sourceBacked,
        inferred: item.inferred,
        provenance: item.provenance,
      },
    }));

    if (rows.length) {
      const { error: itemError } = await supabase.from('menu_items').insert(rows);
      if (itemError) console.error('[Menu Research] Could not save menu items:', itemError);
    }
  }
}

export function resolvedMenuFromRows(menu: MenuRow | null, categories: MenuCategoryRow[], items: MenuItemRow[]) {
  if (!menu) return null;
  const metadata = asRecord(menu.metadata);
  const itemsByCategory = new Map<string, MenuItemRow[]>();
  for (const item of items) {
    const current = itemsByCategory.get(item.category_id) ?? [];
    current.push(item);
    itemsByCategory.set(item.category_id, current);
  }

  return normalizeResolvedMenu({
    status: metadata.status,
    canonicalSourceUrl: metadata.canonicalSourceUrl ?? menu.source_notes,
    sourceType: metadata.sourceType,
    confidence: metadata.confidence,
    provenanceMode: metadata.provenanceMode,
    menuName: menu.name,
    categories: categories
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((category) => ({
        name: cleanString(category.name_en) ?? cleanString(category.name_es) ?? 'Menu section',
        description: cleanString(category.description_en) ?? cleanString(category.description_es),
        items: (itemsByCategory.get(category.id) ?? [])
          .sort((left, right) => left.sort_order - right.sort_order)
          .map((item) => ({
            name: cleanString(item.name_en) ?? cleanString(item.name_es) ?? 'Menu item',
            description: cleanString(item.description_en) ?? cleanString(item.description_es),
            priceText: cleanString(item.price_text),
            badges: stringArray(item.badges),
            sourceBacked: Boolean(asRecord(item.metadata).sourceBacked),
            inferred: Boolean(asRecord(item.metadata).inferred),
            provenance: stringArray(asRecord(item.metadata).provenance),
          })),
      })),
    featuredItems: stringArray(metadata.featuredItems),
    summaryLines: stringArray(metadata.summaryLines),
    missingFields: stringArray(metadata.missingFields),
    fallbackMode: metadata.fallbackMode,
    evidenceSources: metadata.evidenceSources,
    extractionNotes: stringArray(metadata.extractionNotes),
    pricesComplete: Boolean(metadata.pricesComplete),
    descriptionsSourceBacked: Boolean(metadata.descriptionsSourceBacked),
  });
}

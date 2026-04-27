import { createHash } from 'crypto';
import { readResolvedMenu, type ResolvedMenu, type ResolvedMenuFallbackMode, type ResolvedMenuStatus } from '@/lib/admin/menu-research';

type SourceLike = {
  source_type: string;
  url: string | null;
  title: string | null;
  confidence: number;
  extracted_facts: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type SiteAssetLike = {
  id: string;
  asset_type: string;
  status: string;
  source_url: string | null;
  source_label: string | null;
  metadata: Record<string, unknown>;
};

type SiteMetadata = Record<string, unknown> | null | undefined;

export type ResearchAssetCandidateType =
  | 'logo'
  | 'cover_photo'
  | 'food_photo'
  | 'interior_photo'
  | 'menu_asset'
  | 'social_profile_asset'
  | 'screenshot_capture';

export type ReviewWizardStep = 'snapshot' | 'facts' | 'web_menu' | 'brand_assets' | 'ready';
export type ReviewSectionStatus = 'auto_resolved' | 'needs_review' | 'overridden';
export type MenuDisplayMode = 'full_menu' | 'partial_menu' | 'summary_only' | 'hide_menu';

export type ReviewQuestionChoice = {
  value: string;
  label: string;
  description: string;
};

export type ReviewQuestionCard = {
  id: string;
  field: string;
  step: Exclude<ReviewWizardStep, 'snapshot' | 'ready'>;
  groupLabel: string;
  order: number;
  title: string;
  explanation: string;
  evidenceSummary: string;
  sourcePills: string[];
  recommendation: string | null;
  choices: ReviewQuestionChoice[];
  selectedChoice: string | null;
  status: ReviewSectionStatus;
  note: string | null;
};

export type ResearchReviewDecisionState = {
  factDecisions: {
    restaurantName: string | null;
    address: string | null;
    phone: string | null;
    hoursSummary: string | null;
  };
  menuDecisions: {
    approvedStatus: ResolvedMenuStatus | null;
    approvedFallbackMode: ResolvedMenuFallbackMode | null;
    displayMode: MenuDisplayMode | null;
  };
  sourceDecisions: {
    approvedUrls: string[];
    rejectedUrls: string[];
    officialSiteUrl: string | null;
    menuSourceUrl: string | null;
    primaryWebPresenceUrl: string | null;
    confirmedSocialUrls: string[];
    noOfficialSite: boolean;
    noMenuSource: boolean;
  };
  assetDecisions: {
    approvedAssetKeys: string[];
    rejectedAssetKeys: string[];
    approvedPhotoAssetKeys: string[];
    canonicalLogoAssetKey: string | null;
    logoStrategy: 'canonical_asset' | 'text_mark' | 'generated_placeholder' | null;
    photoStrategy: 'approved_assets' | 'tasteful_placeholders' | 'generated_imagery' | null;
  };
  wizard: {
    currentStep: ReviewWizardStep;
    completedSteps: ReviewWizardStep[];
    decisionStatus: {
      facts: ReviewSectionStatus;
      webMenu: ReviewSectionStatus;
      brandAssets: ReviewSectionStatus;
    };
  };
  stepNotes: {
    facts: string | null;
    webMenu: string | null;
    brandAssets: string | null;
  };
  finalBuildNote: string | null;
  overrideStatus: 'not_needed' | 'available' | 'required';
  overrideNotesByField: Record<string, string | null>;
  currentQuestionId: string | null;
  completedQuestionIds: string[];
  status: 'idle' | 'needs_review' | 'approved' | 'needs_more_research';
  reviewedAt: string | null;
};

export type ResearchAssetCandidate = {
  assetKey: string;
  assetType: ResearchAssetCandidateType;
  assetUrl: string;
  thumbnailUrl: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceType: string;
  captureMethod: 'remote_url' | 'screenshot';
  provider: string;
  confidence: number;
  whySelected: string;
  title: string | null;
};

export type ReviewedResearchAsset = ResearchAssetCandidate & {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  isCanonical: boolean;
};

export type ResearchReviewSummary = {
  state: ResearchReviewDecisionState;
  overrideStatus: ResearchReviewDecisionState['overrideStatus'];
  resolvedMenu: ResolvedMenu | null;
  officialSiteCandidates: string[];
  menuCandidates: string[];
  socialCandidates: string[];
  confirmedSocialUrls: string[];
  canonicalLogo: ReviewedResearchAsset | null;
  approvedPhotos: ReviewedResearchAsset[];
  pendingAssets: ReviewedResearchAsset[];
  reviewedAssets: ReviewedResearchAsset[];
  questionCards: ReviewQuestionCard[];
  questionCardsByStep: Record<Exclude<ReviewWizardStep, 'snapshot' | 'ready'>, ReviewQuestionCard[]>;
  reviewQueue: ReviewQuestionCard[];
  currentQuestionId: string | null;
  currentQuestion: ReviewQuestionCard | null;
  completedQuestionIds: string[];
  wizardStep: ReviewWizardStep;
  effectiveDecisions: {
    officialSiteUrl: string | null;
    noOfficialSite: boolean;
    menuSourceUrl: string | null;
    noMenuSource: boolean;
    primaryWebPresenceUrl: string | null;
    confirmedSocialUrls: string[];
    menuDisplayMode: MenuDisplayMode | null;
    canonicalLogoAssetKey: string | null;
    logoStrategy: ResearchReviewDecisionState['assetDecisions']['logoStrategy'];
    photoStrategy: ResearchReviewDecisionState['assetDecisions']['photoStrategy'];
    approvedPhotoAssetKeys: string[];
  };
  blockers: string[];
  conflicts: string[];
  readyForPacket: boolean;
  approvedSourceUrls: string[];
};

type RawConflictRecord = {
  field: string;
  status: string;
  adminChoice: string | null;
  aiRecommendation: string | null;
  rationale: string | null;
  candidates: Array<{
    value: string;
    sourceLabel: string | null;
    confidence: number | null;
  }>;
};

const REVIEW_WIZARD_STEPS: ReviewWizardStep[] = ['snapshot', 'facts', 'web_menu', 'brand_assets', 'ready'];
const REVIEW_SECTION_STATUSES: ReviewSectionStatus[] = ['auto_resolved', 'needs_review', 'overridden'];
const MENU_DISPLAY_MODES: MenuDisplayMode[] = ['full_menu', 'partial_menu', 'summary_only', 'hide_menu'];
const OVERRIDE_STATUSES = ['not_needed', 'available', 'required'] as const;

function validWizardStep(value: unknown): ReviewWizardStep | null {
  return REVIEW_WIZARD_STEPS.includes(String(value) as ReviewWizardStep) ? (value as ReviewWizardStep) : null;
}

function validSectionStatus(value: unknown): ReviewSectionStatus | null {
  return REVIEW_SECTION_STATUSES.includes(String(value) as ReviewSectionStatus) ? (value as ReviewSectionStatus) : null;
}

function validMenuDisplayMode(value: unknown): MenuDisplayMode | null {
  return MENU_DISPLAY_MODES.includes(String(value) as MenuDisplayMode) ? (value as MenuDisplayMode) : null;
}

function validOverrideStatus(value: unknown): ResearchReviewDecisionState['overrideStatus'] | null {
  return OVERRIDE_STATUSES.includes(String(value) as ResearchReviewDecisionState['overrideStatus'])
    ? (value as ResearchReviewDecisionState['overrideStatus'])
    : null;
}

function humanConflictLabel(field: string) {
  switch (field) {
    case 'restaurantName':
      return 'Restaurant name';
    case 'address':
      return 'Address';
    case 'phone':
      return 'Phone';
    case 'hours':
      return 'Hours';
    default:
      return field.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`);
  }
}

function summarizeUrlForChoice(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
    return `${host}${path}`;
  } catch {
    return value;
  }
}

function menuDisplayModeFromResolvedMenu(resolvedMenu: ResolvedMenu | null): MenuDisplayMode {
  if (!resolvedMenu) return 'hide_menu';
  if (resolvedMenu.status === 'structured_menu') return 'full_menu';
  if (resolvedMenu.status === 'partial_menu') {
    return resolvedMenu.fallbackMode === 'aggressive_ai_generated' ? 'full_menu' : 'partial_menu';
  }
  if (resolvedMenu.fallbackMode === 'aggressive_ai_generated' && resolvedMenu.categories.length) return 'full_menu';
  if (resolvedMenu.status === 'menu_evidence_only' || resolvedMenu.fallbackMode === 'summary_only') return 'summary_only';
  return 'hide_menu';
}

function joinedText(values: Array<string | null | undefined>) {
  return values.map((value) => cleanText(value)).filter((value): value is string => Boolean(value)).join(' | ');
}

function plainRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function cleanText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function cleanUrl(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function normalizedUrl(value: string | null | undefined) {
  try {
    const normalized = cleanUrl(value);
    if (!normalized) return null;
    const url = new URL(normalized);
    url.hash = '';
    const search = new URLSearchParams(url.search);
    for (const key of [...search.keys()]) {
      if (/^(utm_|fbclid|gclid|igshid|si|ref|source|authuser|hl|gl|ved|cid)$/i.test(key)) {
        search.delete(key);
      }
    }
    url.search = search.toString() ? `?${search.toString()}` : '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return cleanUrl(value);
  }
}

function hostname(value: string | null | undefined) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, '').toLowerCase() : null;
  } catch {
    return null;
  }
}

const BLOCKED_ASSET_PATTERNS = [
  /google\.com\/images\/branding/i,
  /maps\.gstatic\.com/i,
  /maps\.googleapis\.com/i,
  /streetviewpixels-pa\.googleapis\.com/i,
  /web-assets\.waze\.com/i,
  /dynamic-media-cdn\.tripadvisor\.com\/media\/photo-o\/1a\/f6\/f2\/11\/default-avatar/i,
  /\/social\/og\.png$/i,
  /\/social\/twitter\.png$/i,
  /favicon/i,
  /loader/i,
  /sprite/i,
  /staticmapservice\.getmapimage/i,
];

const DIRECTORY_HOST_PATTERNS = [
  /tripadvisor\.com/i,
  /yelp\.com/i,
  /waze\.com/i,
  /google\.com$/i,
  /googleapis\.com$/i,
  /gstatic\.com$/i,
  /restaurantji\.com/i,
  /todosbiz\.com/i,
];

function isBlockedAssetUrl(value: string) {
  const lower = value.toLowerCase();
  return BLOCKED_ASSET_PATTERNS.some((pattern) => pattern.test(lower));
}

function isDirectoryHost(value: string | null | undefined) {
  const lower = (value ?? '').toLowerCase();
  return DIRECTORY_HOST_PATTERNS.some((pattern) => pattern.test(lower));
}

function isImageUrl(value: string) {
  return /\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(value);
}

function isPdfUrl(value: string) {
  return /\.pdf(\?|$)/i.test(value);
}

const IMAGE_HOST_HINT_PATTERNS = [
  /fbcdn\.net/i,
  /cdninstagram\.com/i,
  /instagram\.com/i,
  /scontent\./i,
  /cloudinary\.com/i,
  /googleusercontent\.com/i,
  /ggpht\.com/i,
];

function looksLikeImageAssetUrl(value: string, context: string) {
  if (isImageUrl(value)) return true;
  const combined = `${value} ${context}`.toLowerCase();
  if (/(?:[?&](?:format|fm|ext|mime|content_type)=)(?:png|jpe?g|webp|gif|svg)/i.test(combined)) return true;
  return IMAGE_HOST_HINT_PATTERNS.some((pattern) => pattern.test(combined)) && /(image|photo|cover|logo|avatar|profile|menu|media|cdn|upload|screenshot)/i.test(combined);
}

function looksLikeRestaurantBrandAsset(url: string, source: SourceLike, keyHint: string) {
  const combined = `${url} ${source.url ?? ''} ${source.title ?? ''} ${keyHint}`.toLowerCase();
  if (isBlockedAssetUrl(url)) return false;
  if (isDirectoryHost(hostname(url))) return false;
  if (/(google|waze|tripadvisor|todosbiz|yelp)/i.test(combined)) return false;
  return looksLikeImageAssetUrl(url, combined) || isPdfUrl(url);
}

function collectUrlStrings(value: unknown, depth = 0): string[] {
  if (depth > 3) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((item) => collectUrlStrings(item, depth + 1));
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((item) => collectUrlStrings(item, depth + 1));
  }
  return [];
}

function collectMetadataUrls(metadata: Record<string, unknown>) {
  const values = [
    metadata.ogImage,
    metadata['og:image'],
    metadata['og:image:secure_url'],
    metadata.twitterImage,
    metadata['twitter:image'],
    metadata.image,
    metadata.imageUrl,
    metadata.logo,
    metadata.logo_url,
    metadata.icon,
    metadata.favicon,
    metadata.images,
    metadata.imageUrls,
    metadata.logoCandidates,
    metadata.screenshot,
    metadata.screenshots,
    metadata.menu_image_url,
    metadata.menuImages,
  ];
  return [...new Set([
    ...values.flatMap((value) => stringArray(value).length ? stringArray(value) : typeof value === 'string' ? [value] : []),
    ...collectUrlStrings(metadata),
  ])];
}

function inferAssetType(source: SourceLike, assetUrl: string, keyHint: string): ResearchAssetCandidateType {
  const combined = `${assetUrl} ${source.url ?? ''} ${source.title ?? ''} ${keyHint}`.toLowerCase();

  if (source.source_type === 'menu' || /menu|pdf/.test(combined)) return 'menu_asset';
  if (/logo|brand|wordmark|word-mark|avatar|profile_pic|profilepic|profile-picture|profilepicture/.test(combined)) {
    return source.source_type === 'instagram' || source.source_type === 'facebook' ? 'social_profile_asset' : 'logo';
  }
  if (source.source_type === 'instagram' || source.source_type === 'facebook') {
    return /cover|header|banner/.test(combined) ? 'cover_photo' : 'social_profile_asset';
  }
  if (/interior|inside|dining|bar-area|restaurant-inside/.test(combined)) return 'interior_photo';
  if (/food|dish|burger|pizza|taco|plate|menu-item/.test(combined)) return 'food_photo';
  return 'cover_photo';
}

function reasonForAsset(source: SourceLike, assetUrl: string, keyHint: string, assetType: ResearchAssetCandidateType) {
  const sourceLabel = source.source_type.replaceAll('_', ' ');
  if (assetType === 'logo') return `Likely brand asset discovered in ${sourceLabel} metadata (${keyHint || 'image metadata'}).`;
  if (assetType === 'social_profile_asset') return `Likely profile/avatar asset discovered on the restaurant's ${sourceLabel} page.`;
  if (assetType === 'menu_asset') return `Menu file or menu image discovered from ${sourceLabel}.`;
  if (assetType === 'cover_photo') return `Likely hero/cover image discovered from ${sourceLabel}.`;
  if (assetType === 'food_photo') return `Likely food imagery discovered from ${sourceLabel}.`;
  if (assetType === 'interior_photo') return `Likely interior/environment photo discovered from ${sourceLabel}.`;
  return `Captured visual reference for ${source.title ?? source.url ?? assetUrl}.`;
}

export function assetKey(input: { assetType: string; assetUrl: string; sourceUrl?: string | null }) {
  return createHash('sha256')
    .update([input.assetType, normalizedUrl(input.assetUrl), normalizedUrl(input.sourceUrl ?? null)].join('|'))
    .digest('hex')
    .slice(0, 20);
}

export function extractAssetCandidatesFromSources(sources: SourceLike[]): ResearchAssetCandidate[] {
  const candidates = new Map<string, ResearchAssetCandidate>();

  for (const source of sources) {
    const facts = plainRecord(source.extracted_facts);
    const metadata = plainRecord(facts.metadata);
    const sourceMetadata = plainRecord(source.metadata);
    const urls = new Set<string>();
    const imageLikeFacts = [
      ...stringArray(facts.images),
      ...stringArray(facts.image_urls),
      ...stringArray(facts.menu_images),
      ...stringArray(sourceMetadata.images),
      ...stringArray(sourceMetadata.imageUrls),
      ...stringArray(sourceMetadata.menuImages),
      ...stringArray(sourceMetadata.galleryImages),
      ...stringArray(sourceMetadata.logoCandidates),
    ];

    for (const url of collectMetadataUrls(metadata)) {
      const normalized = normalizedUrl(url);
      if (normalized) urls.add(normalized);
    }

    for (const url of collectMetadataUrls(sourceMetadata)) {
      const normalized = normalizedUrl(url);
      if (normalized) urls.add(normalized);
    }

    for (const url of imageLikeFacts) {
      const normalized = normalizedUrl(url);
      if (normalized) urls.add(normalized);
    }

    for (const url of stringArray(facts.discovered_links).map((value) => normalizedUrl(value)).filter((value): value is string => Boolean(value))) {
      if (isImageUrl(url) || isPdfUrl(url)) urls.add(url);
    }

    if (source.url && (isImageUrl(source.url) || isPdfUrl(source.url))) {
      const normalized = normalizedUrl(source.url);
      if (normalized) urls.add(normalized);
    }

    for (const url of urls) {
      const keyHint = Object.entries(metadata).find(([, value]) => value === url)?.[0] ?? '';
      if (!looksLikeRestaurantBrandAsset(url, source, keyHint)) continue;
      const candidateType = inferAssetType(source, url, keyHint);
      const key = assetKey({ assetType: candidateType, assetUrl: url, sourceUrl: source.url });
      const existing = candidates.get(key);
      const next: ResearchAssetCandidate = {
        assetKey: key,
        assetType: candidateType,
        assetUrl: url,
        thumbnailUrl: url,
        sourceUrl: normalizedUrl(source.url),
        sourceTitle: source.title,
        sourceType: source.source_type,
        captureMethod: 'remote_url',
        provider: cleanText(source.metadata?.provider) ?? source.source_type,
        confidence: Math.min(0.98, source.confidence + 0.08),
        whySelected: reasonForAsset(source, url, keyHint, candidateType),
        title: source.title,
      };
      if (!existing || existing.confidence < next.confidence) candidates.set(key, next);
    }
  }

  return [...candidates.values()];
}

export function suggestedSourceDecisions(siteName: string, sources: SourceLike[]) {
  const lowerName = siteName.toLowerCase();
  const siteTokens = lowerName.split(/[^a-z0-9]+/).filter((token) => token.length >= 4);

  const scoreSource = (source: SourceLike, role: 'official_site' | 'menu_source' | 'social') => {
    const url = normalizedUrl(source.url);
    if (!url) return 0;
    const host = hostname(url);
    const facts = plainRecord(source.extracted_facts);
    const text = [
      source.title ?? '',
      cleanText(facts.text_excerpt) ?? '',
      cleanText(facts.markdown_excerpt) ?? '',
      cleanText(facts.description) ?? '',
      cleanText(facts.address) ?? '',
      cleanText(facts.formatted_phone_number) ?? '',
    ].join(' ').toLowerCase();

    let score = source.confidence;
    if (siteTokens.some((token) => text.includes(token) || (host ?? '').includes(token))) score += 0.25;
    if (role === 'official_site' && !isDirectoryHost(host)) score += 0.3;
    if (role === 'official_site' && source.source_type === 'website') score += 0.2;
    if (role === 'menu_source' && source.source_type === 'menu') score += 0.35;
    if (role === 'social' && (source.source_type === 'instagram' || source.source_type === 'facebook')) score += 0.35;
    if (role === 'social' && /facebook|instagram/.test(host ?? '')) score += 0.15;
    return score;
  };

  const officialSiteCandidates = [...new Set(
    sources
      .filter((source) => source.source_type === 'website' && !isDirectoryHost(hostname(source.url)))
      .sort((a, b) => scoreSource(b, 'official_site') - scoreSource(a, 'official_site'))
      .map((source) => normalizedUrl(source.url))
      .filter((value): value is string => Boolean(value))
  )];
  const menuCandidates = [...new Set(
    sources
      .filter((source) => source.source_type === 'menu')
      .sort((a, b) => scoreSource(b, 'menu_source') - scoreSource(a, 'menu_source'))
      .map((source) => normalizedUrl(source.url))
      .filter((value): value is string => Boolean(value))
  )];
  const socialCandidates = [...new Set(
    sources
      .filter((source) => source.source_type === 'instagram' || source.source_type === 'facebook')
      .sort((a, b) => scoreSource(b, 'social') - scoreSource(a, 'social'))
      .map((source) => normalizedUrl(source.url))
      .filter((value): value is string => Boolean(value))
  )];

  return { officialSiteCandidates, menuCandidates, socialCandidates };
}

function collectDistinctFactValues(sources: SourceLike[], keys: string[]) {
  return [...new Set(
    sources
      .flatMap((source) => keys.map((key) => cleanText(plainRecord(source.extracted_facts)[key])))
      .filter((value): value is string => Boolean(value))
  )];
}

export function collectResearchConflicts(sources: SourceLike[]) {
  const conflicts: string[] = [];
  const addresses = collectDistinctFactValues(sources, ['address', 'formatted_address']);
  const phones = collectDistinctFactValues(sources, ['formatted_phone_number', 'international_phone_number', 'phone']);
  const websites = collectDistinctFactValues(sources, ['website']);
  if (addresses.length > 1) conflicts.push(`Conflicting addresses found (${addresses.length}).`);
  if (phones.length > 1) conflicts.push(`Conflicting phone numbers found (${phones.length}).`);
  if (websites.length > 1) conflicts.push(`Conflicting website candidates found (${websites.length}).`);
  return conflicts;
}

export function readResearchReviewState(siteMetadata: SiteMetadata): ResearchReviewDecisionState {
  const review = plainRecord(plainRecord(siteMetadata).research_review);
  const factDecisions = plainRecord(review.factDecisions);
  const menuDecisions = plainRecord(review.menuDecisions);
  const sourceDecisions = plainRecord(review.sourceDecisions);
  const assetDecisions = plainRecord(review.assetDecisions);
  const wizard = plainRecord(review.wizard);
  const decisionStatus = plainRecord(wizard.decisionStatus);
  const stepNotes = plainRecord(review.stepNotes);

  return {
    factDecisions: {
      restaurantName: cleanText(factDecisions.restaurantName),
      address: cleanText(factDecisions.address),
      phone: cleanText(factDecisions.phone),
      hoursSummary: cleanText(factDecisions.hoursSummary),
    },
    menuDecisions: {
      approvedStatus: ['structured_menu', 'partial_menu', 'menu_evidence_only', 'no_menu_found'].includes(String(menuDecisions.approvedStatus))
        ? (menuDecisions.approvedStatus as ResolvedMenuStatus)
        : null,
      approvedFallbackMode: ['none', 'summary_only', 'aggressive_ai_generated'].includes(String(menuDecisions.approvedFallbackMode))
        ? (menuDecisions.approvedFallbackMode as ResolvedMenuFallbackMode)
        : null,
      displayMode: validMenuDisplayMode(menuDecisions.displayMode),
    },
    sourceDecisions: {
      approvedUrls: stringArray(sourceDecisions.approvedUrls).map((value) => normalizedUrl(value) ?? value),
      rejectedUrls: stringArray(sourceDecisions.rejectedUrls).map((value) => normalizedUrl(value) ?? value),
      officialSiteUrl: normalizedUrl(cleanText(sourceDecisions.officialSiteUrl)),
      menuSourceUrl: normalizedUrl(cleanText(sourceDecisions.menuSourceUrl)),
      primaryWebPresenceUrl: normalizedUrl(cleanText(sourceDecisions.primaryWebPresenceUrl)),
      confirmedSocialUrls: stringArray(sourceDecisions.confirmedSocialUrls).map((value) => normalizedUrl(value) ?? value),
      noOfficialSite: Boolean(sourceDecisions.noOfficialSite),
      noMenuSource: Boolean(sourceDecisions.noMenuSource),
    },
    assetDecisions: {
      approvedAssetKeys: stringArray(assetDecisions.approvedAssetKeys),
      rejectedAssetKeys: stringArray(assetDecisions.rejectedAssetKeys),
      approvedPhotoAssetKeys: stringArray(assetDecisions.approvedPhotoAssetKeys),
      canonicalLogoAssetKey: cleanText(assetDecisions.canonicalLogoAssetKey),
      logoStrategy: ['canonical_asset', 'text_mark', 'generated_placeholder'].includes(String(assetDecisions.logoStrategy))
        ? (assetDecisions.logoStrategy as ResearchReviewDecisionState['assetDecisions']['logoStrategy'])
        : null,
      photoStrategy: ['approved_assets', 'tasteful_placeholders', 'generated_imagery'].includes(String(assetDecisions.photoStrategy))
        ? (assetDecisions.photoStrategy as ResearchReviewDecisionState['assetDecisions']['photoStrategy'])
        : null,
    },
    wizard: {
      currentStep: validWizardStep(wizard.currentStep) ?? 'snapshot',
      completedSteps: stringArray(wizard.completedSteps)
        .map((value) => validWizardStep(value))
        .filter((value): value is ReviewWizardStep => Boolean(value)),
      decisionStatus: {
        facts: validSectionStatus(decisionStatus.facts) ?? 'needs_review',
        webMenu: validSectionStatus(decisionStatus.webMenu) ?? 'needs_review',
        brandAssets: validSectionStatus(decisionStatus.brandAssets) ?? 'needs_review',
      },
    },
    stepNotes: {
      facts: cleanText(stepNotes.facts),
      webMenu: cleanText(stepNotes.webMenu),
      brandAssets: cleanText(stepNotes.brandAssets),
    },
    finalBuildNote: cleanText(review.finalBuildNote),
    overrideStatus: validOverrideStatus(review.overrideStatus) ?? 'available',
    overrideNotesByField: Object.fromEntries(
      Object.entries(plainRecord(review.overrideNotesByField)).map(([key, value]) => [key, cleanText(value)]),
    ),
    currentQuestionId: cleanText(review.currentQuestionId),
    completedQuestionIds: stringArray(review.completedQuestionIds),
    status: ['idle', 'needs_review', 'approved', 'needs_more_research'].includes(String(review.status))
      ? (review.status as ResearchReviewDecisionState['status'])
      : 'idle',
    reviewedAt: cleanText(review.reviewedAt),
  };
}

function auditConflictRecords(siteMetadata: SiteMetadata): RawConflictRecord[] {
  const records = plainRecord(plainRecord(siteMetadata).research_audit).conflictRecords;
  if (!Array.isArray(records)) return [];
  return records
    .filter((value): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value))
    .map((value) => ({
      field: cleanText(value.field) ?? '',
      status: cleanText(value.status) ?? 'unresolved',
      adminChoice: cleanText(value.adminChoice),
      aiRecommendation: cleanText(value.aiRecommendation),
      rationale: cleanText(value.rationale),
      candidates: Array.isArray(value.candidates)
        ? value.candidates
            .filter((candidate): candidate is Record<string, unknown> => typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate))
            .map((candidate) => ({
              value: cleanText(candidate.value) ?? '',
              sourceLabel: cleanText(candidate.sourceLabel),
              confidence: typeof candidate.confidence === 'number' ? candidate.confidence : null,
            }))
            .filter((candidate) => Boolean(candidate.value))
        : [],
    }));
}

export function reviewedAssetFromRecord(asset: SiteAssetLike): ReviewedResearchAsset | null {
  const metadata = plainRecord(asset.metadata);
  const assetUrl = cleanText(metadata.asset_url) ?? cleanText(metadata.secure_url) ?? cleanText(asset.source_url);
  const thumbnailUrl = cleanText(metadata.thumbnail_url) ?? assetUrl;
  const assetKeyValue = cleanText(metadata.asset_key);
  const candidateType = cleanText(metadata.candidate_type) as ResearchAssetCandidateType | null;
  if (!assetUrl || !thumbnailUrl || !assetKeyValue || !candidateType) return null;
  return {
    id: asset.id,
    assetKey: assetKeyValue,
    assetType: candidateType,
    assetUrl,
    thumbnailUrl,
    sourceUrl: normalizedUrl(cleanText(metadata.source_page_url) ?? cleanText(asset.source_url)),
    sourceTitle: cleanText(metadata.source_title) ?? asset.source_label,
    sourceType: cleanText(metadata.source_type) ?? asset.asset_type,
    captureMethod: cleanText(metadata.capture_method) === 'screenshot' ? 'screenshot' : 'remote_url',
    provider: cleanText(metadata.provider) ?? 'unknown',
    confidence: typeof metadata.confidence === 'number' ? metadata.confidence : 0.5,
    whySelected: cleanText(metadata.why_selected) ?? 'Research asset candidate.',
    title: cleanText(metadata.title),
    status: asset.status === 'approved' ? 'approved' : asset.status === 'rejected' ? 'rejected' : 'pending',
    isCanonical: Boolean(metadata.is_canonical),
  };
}

export function summarizeResearchReview(params: {
  siteMetadata: SiteMetadata;
  siteName: string;
  researchSources: SourceLike[];
  siteAssets: SiteAssetLike[];
}) : ResearchReviewSummary {
  const state = readResearchReviewState(params.siteMetadata);
  const resolvedMenu = readResolvedMenu(params.siteMetadata);
  const auditRecord = plainRecord(plainRecord(params.siteMetadata).research_audit);
  const auditCanonicalSources = plainRecord(auditRecord.canonicalSources);
  const auditCanonicalAssets = plainRecord(auditRecord.canonicalAssets);
  const storedProfile = plainRecord(auditRecord.resolvedProfile);
  const suggestions = suggestedSourceDecisions(params.siteName, params.researchSources);
  const conflicts = collectResearchConflicts(params.researchSources);
  const auditConflicts = auditConflictRecords(params.siteMetadata);
  const assets = params.siteAssets
    .map(reviewedAssetFromRecord)
    .filter((value): value is ReviewedResearchAsset => Boolean(value))
    .sort((a, b) => b.confidence - a.confidence);

  const byKey = new Map(assets.map((asset) => [asset.assetKey, asset]));
  const logoAssetCandidates = assets.filter((asset) => asset.assetType === 'logo' || asset.assetType === 'social_profile_asset');
  const photoAssetCandidates = assets.filter((asset) =>
    ['cover_photo', 'food_photo', 'interior_photo', 'social_profile_asset'].includes(asset.assetType)
  );
  const candidateLogoKey =
    state.assetDecisions.canonicalLogoAssetKey ??
    cleanText(auditCanonicalAssets.logoAssetKey) ??
    logoAssetCandidates.find((asset) => asset.isCanonical || asset.status === 'approved')?.assetKey ??
    logoAssetCandidates[0]?.assetKey ??
    null;
  const canonicalLogo =
    candidateLogoKey && byKey.has(candidateLogoKey) ? byKey.get(candidateLogoKey) ?? null : null;
  const approvedPhotoAssetKeys = [
    ...(state.assetDecisions.approvedPhotoAssetKeys.length
      ? state.assetDecisions.approvedPhotoAssetKeys
      : stringArray(auditCanonicalAssets.approvedPhotoAssetKeys).length
        ? stringArray(auditCanonicalAssets.approvedPhotoAssetKeys)
        : photoAssetCandidates.filter((asset) => asset.isCanonical || asset.status === 'approved').map((asset) => asset.assetKey)),
  ].filter((assetKey, index, array) => array.indexOf(assetKey) === index);
  const approvedPhotos = photoAssetCandidates.filter((asset) => approvedPhotoAssetKeys.includes(asset.assetKey));

  const effectiveOfficialSiteUrl =
    state.sourceDecisions.officialSiteUrl ??
    cleanText(auditCanonicalSources.officialSiteUrl) ??
    cleanText(storedProfile.officialSiteUrl) ??
    suggestions.officialSiteCandidates[0] ??
    null;
  const effectiveNoOfficialSite =
    state.sourceDecisions.noOfficialSite ||
    Boolean(auditCanonicalSources.noOfficialWebsite) ||
    Boolean(storedProfile.noOfficialWebsite) ||
    false;
  const effectivePrimaryWebPresenceUrl =
    state.sourceDecisions.primaryWebPresenceUrl ??
    cleanText(auditCanonicalSources.primaryWebPresenceUrl) ??
    cleanText(storedProfile.primaryWebPresenceUrl) ??
    state.sourceDecisions.confirmedSocialUrls[0] ??
    stringArray(auditCanonicalSources.confirmedSocialUrls)[0] ??
    stringArray(storedProfile.confirmedSocialUrls)[0] ??
    suggestions.socialCandidates[0] ??
    effectiveOfficialSiteUrl;
  const effectiveConfirmedSocialUrls = (
    state.sourceDecisions.confirmedSocialUrls.length
      ? state.sourceDecisions.confirmedSocialUrls
      : stringArray(auditCanonicalSources.confirmedSocialUrls).length
        ? stringArray(auditCanonicalSources.confirmedSocialUrls)
        : stringArray(storedProfile.confirmedSocialUrls).length
          ? stringArray(storedProfile.confirmedSocialUrls)
          : suggestions.socialCandidates
  ).filter((value, index, array) => array.indexOf(value) === index);
  const effectiveMenuSourceUrl =
    state.sourceDecisions.menuSourceUrl ??
    resolvedMenu?.canonicalSourceUrl ??
    cleanText(auditCanonicalSources.menuSourceUrl) ??
    cleanText(storedProfile.menuSourceUrl) ??
    suggestions.menuCandidates[0] ??
    null;
  const effectiveNoMenuSource =
    state.sourceDecisions.noMenuSource ||
    Boolean(auditCanonicalSources.noStructuredMenu) ||
    Boolean(storedProfile.noStructuredMenu) ||
    false;
  const effectiveMenuDisplayMode =
    state.menuDecisions.displayMode ??
    menuDisplayModeFromResolvedMenu(resolvedMenu);
  const effectiveLogoStrategy =
    state.assetDecisions.logoStrategy ??
    (candidateLogoKey
      ? 'canonical_asset'
      : ['canonical_asset', 'text_mark', 'generated_placeholder'].includes(String(auditCanonicalAssets.logoStrategy))
        ? (auditCanonicalAssets.logoStrategy as ResearchReviewDecisionState['assetDecisions']['logoStrategy'])
        : 'text_mark');
  const effectivePhotoStrategy =
    state.assetDecisions.photoStrategy ??
    (approvedPhotos.length
      ? 'approved_assets'
      : ['approved_assets', 'tasteful_placeholders', 'generated_imagery'].includes(String(auditCanonicalAssets.photoStrategy))
        ? (auditCanonicalAssets.photoStrategy as ResearchReviewDecisionState['assetDecisions']['photoStrategy'])
        : 'generated_imagery');
  const approvedSourceUrls = [...new Set([
    ...state.sourceDecisions.approvedUrls,
    effectiveOfficialSiteUrl,
    effectiveMenuSourceUrl,
    effectivePrimaryWebPresenceUrl,
    ...effectiveConfirmedSocialUrls,
  ].filter((value): value is string => Boolean(value)))];
  const effectiveRestaurantName =
    state.factDecisions.restaurantName ??
    cleanText(storedProfile.restaurantName) ??
    params.siteName;
  const effectiveAddress =
    state.factDecisions.address ??
    cleanText(storedProfile.address) ??
    collectDistinctFactValues(params.researchSources, ['address', 'formatted_address'])[0] ??
    null;
  const effectivePhone =
    state.factDecisions.phone ??
    cleanText(storedProfile.phone) ??
    collectDistinctFactValues(params.researchSources, ['formatted_phone_number', 'international_phone_number', 'phone'])[0] ??
    null;
  const effectiveMapsUrl = cleanText(storedProfile.mapsUrl) ?? collectDistinctFactValues(params.researchSources, ['google_maps_url', 'maps_url'])[0] ?? null;
  const effectiveCity = cleanText(storedProfile.city) ?? collectDistinctFactValues(params.researchSources, ['city', 'locality'])[0] ?? null;

  const blockers: string[] = [];
  if (!effectiveRestaurantName) {
    blockers.push('We still need a usable restaurant name before the packet can be generated.');
  }
  if (!effectiveAddress && !effectiveMapsUrl && !effectiveCity) {
    blockers.push('We still need a usable location signal like an address, maps link, or city.');
  }
  if (!effectivePrimaryWebPresenceUrl && !effectivePhone && !effectiveMapsUrl && !effectiveMenuSourceUrl) {
    blockers.push('We still need one clear visitor action like call, directions, menu, or social.');
  }
  if (state.status === 'needs_more_research') {
    blockers.push('The latest review was marked as needing more research before the packet should be generated.');
  }

  const status =
    blockers.length > 0
      ? (state.status === 'needs_more_research' ? 'needs_more_research' : 'needs_review')
      : 'approved';

  const questionCardsByStep: ResearchReviewSummary['questionCardsByStep'] = {
    facts: [],
    web_menu: [],
    brand_assets: [],
  };

  const factualConflictOrder = ['restaurantName', 'address', 'phone', 'hours'];
  for (const conflict of auditConflicts.sort((left, right) => factualConflictOrder.indexOf(left.field) - factualConflictOrder.indexOf(right.field))) {
    const isFactual = ['restaurantName', 'address', 'phone', 'hours'].includes(conflict.field);
    if (!isFactual || conflict.candidates.length < 2) continue;
    const selectedChoice =
      conflict.field === 'restaurantName'
        ? state.factDecisions.restaurantName
        : conflict.field === 'address'
          ? state.factDecisions.address
          : conflict.field === 'phone'
            ? state.factDecisions.phone
            : state.factDecisions.hoursSummary;
    questionCardsByStep.facts.push({
      id: `fact-${conflict.field}`,
      field: conflict.field,
      step: 'facts',
      groupLabel: 'Facts',
      order: factualConflictOrder.indexOf(conflict.field),
      title: `Confirm ${humanConflictLabel(conflict.field)}`,
      explanation:
        conflict.rationale ??
        `We found multiple candidate values for ${humanConflictLabel(conflict.field).toLowerCase()}. Pick the one the site should use.`,
      evidenceSummary: joinedText(conflict.candidates.map((candidate) =>
        candidate.sourceLabel
          ? `${candidate.sourceLabel}: ${candidate.value}`
          : candidate.value,
      )) || `Multiple sources disagree on the ${humanConflictLabel(conflict.field).toLowerCase()}.`,
      sourcePills: [...new Set(conflict.candidates.map((candidate) => candidate.sourceLabel).filter((value): value is string => Boolean(value)))],
      recommendation: conflict.aiRecommendation,
      choices: conflict.candidates.map((candidate) => ({
        value: candidate.value,
        label: candidate.value,
        description: candidate.sourceLabel
          ? candidate.confidence !== null
            ? `${candidate.sourceLabel} · ${Math.round(candidate.confidence * 100)}% confidence`
            : candidate.sourceLabel
          : 'Source-backed candidate',
      })),
      selectedChoice: selectedChoice ?? conflict.aiRecommendation ?? conflict.candidates[0]?.value ?? null,
      status: selectedChoice || state.overrideNotesByField[`fact-${conflict.field}`] ? 'overridden' : 'needs_review',
      note: state.overrideNotesByField[`fact-${conflict.field}`] ?? state.overrideNotesByField[conflict.field] ?? null,
    });
  }

  const shouldAskOfficialWebsite =
    suggestions.officialSiteCandidates.length > 1 ||
    (suggestions.officialSiteCandidates.length === 1 && !effectiveNoOfficialSite && !cleanText(auditCanonicalSources.officialSiteUrl));
  if (shouldAskOfficialWebsite) {
    questionCardsByStep.web_menu.push({
      id: 'official-site',
      field: 'officialSite',
      step: 'web_menu',
      groupLabel: 'Web Presence',
      order: 20,
      title: 'Official website',
      explanation:
        'Tell the builder whether this restaurant has a true standalone website or whether we should use social links as the strongest current public references.',
      evidenceSummary: effectiveNoOfficialSite
        ? 'AI could not confirm a standalone website, so the project is currently using social links as the strongest public references.'
        : joinedText(suggestions.officialSiteCandidates.map((url) => summarizeUrlForChoice(url))) || 'AI found multiple possible website candidates.',
      sourcePills: [...new Set(suggestions.officialSiteCandidates.map((url) => hostname(url)).filter((value): value is string => Boolean(value)))],
      recommendation: effectiveNoOfficialSite ? 'none' : effectiveOfficialSiteUrl,
      choices: [
        { value: 'none', label: 'No official website', description: 'Use social channels as the main off-site presence.' },
        ...suggestions.officialSiteCandidates.map((url) => ({
          value: url,
          label: summarizeUrlForChoice(url),
          description: 'Use this as the official website.',
        })),
      ],
      selectedChoice: effectiveNoOfficialSite ? 'none' : effectiveOfficialSiteUrl,
      status: state.sourceDecisions.officialSiteUrl || state.sourceDecisions.noOfficialSite ? 'overridden' : 'needs_review',
      note: state.overrideNotesByField['official-site'] ?? state.overrideNotesByField.officialSite ?? null,
    });
  }

  if ([...new Set([...suggestions.socialCandidates, effectiveOfficialSiteUrl].filter(Boolean) as string[])].length > 1) {
    const primaryChoices = [...new Set([...suggestions.socialCandidates, effectiveOfficialSiteUrl].filter(Boolean) as string[])];
    questionCardsByStep.web_menu.push({
      id: 'primary-web-presence',
      field: 'primaryWebPresence',
      step: 'web_menu',
      groupLabel: 'Web Presence',
      order: 21,
      title: 'Main off-site link',
      explanation: 'Choose the one link visitors should see first when we send them off the site.',
      evidenceSummary: joinedText(primaryChoices.map((url) => summarizeUrlForChoice(url))) || 'AI found multiple off-site choices that could act as the main CTA.',
      sourcePills: [...new Set(primaryChoices.map((url) => hostname(url)).filter((value): value is string => Boolean(value)))],
      recommendation: effectivePrimaryWebPresenceUrl,
      choices: primaryChoices.map((url) => ({
        value: url,
        label: summarizeUrlForChoice(url),
        description: url === effectiveOfficialSiteUrl ? 'Use the website as the main CTA.' : 'Use this social profile as the main CTA.',
      })),
      selectedChoice: effectivePrimaryWebPresenceUrl,
      status: state.sourceDecisions.primaryWebPresenceUrl ? 'overridden' : 'needs_review',
      note: state.overrideNotesByField['primary-web-presence'] ?? state.overrideNotesByField.primaryWebPresence ?? null,
    });
  }

  const questionCards = [...questionCardsByStep.facts, ...questionCardsByStep.web_menu, ...questionCardsByStep.brand_assets];
  const reviewQueue = [...questionCards].sort((left, right) => left.order - right.order);
  const completedQuestionIds = state.completedQuestionIds.filter((id) => reviewQueue.some((card) => card.id === id));
  const remainingQuestions = reviewQueue.filter((card) => !completedQuestionIds.includes(card.id));
  const currentQuestionId =
    state.currentQuestionId && remainingQuestions.some((card) => card.id === state.currentQuestionId)
      ? state.currentQuestionId
      : remainingQuestions[0]?.id ?? null;
  const currentQuestion = currentQuestionId
    ? reviewQueue.find((card) => card.id === currentQuestionId) ?? null
    : null;
  const overrideStatus: ResearchReviewDecisionState['overrideStatus'] =
    blockers.length > 0
      ? 'required'
      : reviewQueue.length > 0
        ? 'available'
        : 'not_needed';
  const sectionStatus = {
    facts: questionCardsByStep.facts.length
      ? (state.stepNotes.facts || state.factDecisions.restaurantName || state.factDecisions.address || state.factDecisions.phone || state.factDecisions.hoursSummary
          ? 'overridden'
          : 'needs_review')
      : 'auto_resolved',
    webMenu: questionCardsByStep.web_menu.length
      ? (state.stepNotes.webMenu || state.sourceDecisions.primaryWebPresenceUrl || state.menuDecisions.displayMode || state.sourceDecisions.officialSiteUrl || state.sourceDecisions.noOfficialSite
          ? 'overridden'
          : 'needs_review')
      : 'auto_resolved',
    brandAssets: 'auto_resolved',
  } satisfies ResearchReviewDecisionState['wizard']['decisionStatus'];

  const preferredWizardStep = state.wizard.currentStep;
  let wizardStep: ReviewWizardStep = preferredWizardStep;
  if (overrideStatus === 'not_needed') {
    wizardStep = 'ready';
  } else if (preferredWizardStep === 'snapshot') {
    wizardStep = questionCardsByStep.facts.length
      ? 'facts'
      : questionCardsByStep.web_menu.length
        ? 'web_menu'
        : 'ready';
  } else if (preferredWizardStep === 'ready' && blockers.length) {
    wizardStep = questionCardsByStep.facts.length
      ? 'facts'
      : questionCardsByStep.web_menu.length
        ? 'web_menu'
        : 'snapshot';
  } else if (preferredWizardStep !== 'ready') {
    const hasCards = questionCardsByStep[preferredWizardStep].length > 0;
    if (!hasCards) {
      wizardStep = questionCardsByStep.facts.length
        ? 'facts'
        : questionCardsByStep.web_menu.length
          ? 'web_menu'
          : blockers.length
            ? 'snapshot'
            : 'ready';
    }
  }

  return {
    state: {
      ...state,
      overrideStatus,
      currentQuestionId,
      wizard: {
        currentStep: wizardStep,
        completedSteps: state.wizard.completedSteps,
        decisionStatus: sectionStatus,
      },
      status,
    },
    overrideStatus,
    resolvedMenu,
    officialSiteCandidates: suggestions.officialSiteCandidates,
    menuCandidates: suggestions.menuCandidates,
    socialCandidates: suggestions.socialCandidates,
    confirmedSocialUrls: effectiveConfirmedSocialUrls,
    canonicalLogo,
    approvedPhotos,
    pendingAssets: assets.filter((asset) => asset.status === 'pending'),
    reviewedAssets: assets,
    questionCards,
    questionCardsByStep,
    reviewQueue,
    currentQuestionId,
    currentQuestion,
    completedQuestionIds,
    wizardStep,
    effectiveDecisions: {
      officialSiteUrl: effectiveOfficialSiteUrl,
      noOfficialSite: effectiveNoOfficialSite,
      menuSourceUrl: effectiveMenuSourceUrl,
      noMenuSource: effectiveNoMenuSource,
      primaryWebPresenceUrl: effectivePrimaryWebPresenceUrl,
      confirmedSocialUrls: effectiveConfirmedSocialUrls,
      menuDisplayMode: effectiveMenuDisplayMode,
      canonicalLogoAssetKey: candidateLogoKey,
      logoStrategy: effectiveLogoStrategy,
      photoStrategy: effectivePhotoStrategy,
      approvedPhotoAssetKeys,
    },
    blockers,
    conflicts,
    readyForPacket: blockers.length === 0,
    approvedSourceUrls,
  };
}

import 'server-only';

import { createHash } from 'crypto';
import { reviewedAssetFromRecord } from '@/lib/admin/research-review';
import type { AdminBuildAnalysis, AdminSiteDetail, SiteAssetRecord, SiteRecord } from '@/lib/admin/dashboard';
import { type ResolvedRestaurantProfile, readResolvedProfile } from '@/lib/admin/research-audit';
import { type ResolvedMenu } from '@/lib/admin/menu-research';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type RenderLanguage = 'en' | 'es';
export type RenderViewMode = 'preview' | 'live';

export type SiteRenderPayload = {
  version: 1;
  slug: string;
  localeDefault: RenderLanguage;
  restaurant: {
    name: string;
    city: string | null;
    cuisine: string | null;
    neighborhood: string | null;
    address: string | null;
    phone: string | null;
    mapsUrl: string | null;
    hours: string[];
    rating: number | null;
  };
  brand: {
    logoUrl: string | null;
    logoText: string;
    headline: string;
    eyebrow: string | null;
    summary: string;
    themePreset: 'coastal_bright' | 'sunny_editorial' | 'tropical_modern' | 'classic_neutral';
    fontPreset: 'clean_sans' | 'editorial_serif' | 'friendly_modern' | 'coastal_mix';
    designDirection: string[];
    notes: string[];
  };
  media: {
    heroImageUrl: string | null;
    galleryImageUrls: string[];
    photoStrategy: 'approved_assets' | 'tasteful_placeholders' | 'generated_imagery' | null;
  };
  menu: {
    status: ResolvedMenu['status'];
    provenanceMode: ResolvedMenu['provenanceMode'];
    sourceUrl: string | null;
    fallbackMode: ResolvedMenu['fallbackMode'];
    summaryLines: string[];
    categories: Array<{
      name: string;
      description: string | null;
      items: Array<{
        name: string;
        description: string | null;
        priceText: string | null;
      }>;
    }>;
  };
  actions: {
    primaryLabel: string | null;
    primaryHref: string | null;
    secondaryLabel: string | null;
    secondaryHref: string | null;
    menuHref: string | null;
    orderingHref: string | null;
    reservationHref: string | null;
    socialLinks: Array<{ label: string; href: string }>;
    claimHref: string | null;
  };
  sections: {
    aboutTitle: string | null;
    aboutBullets: string[];
    visitTitle: string | null;
    experienceBullets: string[];
    extraSections: Array<{
      id: string;
      title: string;
      body: string[];
    }>;
    acceptanceCriteria: string[];
    menuNote: string | null;
  };
  metadata: {
    sourceHash: string;
    generatedAt: string;
  };
};

type SiteVersionRecord = {
  id: string;
  site_id: string;
  site_spec_id: string | null;
  status: 'draft' | 'staged' | 'qa_failed' | 'approved' | 'published' | 'rolled_back' | 'archived';
  release_channel: 'development' | 'preview' | 'staging' | 'production';
  deployment_url: string | null;
  updated_at: string;
  published_at: string | null;
  metadata: Record<string, unknown>;
};

type SiteSpecRecord = {
  id: string;
  site_id: string;
  status: 'draft' | 'staged' | 'approved' | 'published' | 'archived';
  source_hash: string | null;
  spec_json: Record<string, unknown>;
  seo_json: Record<string, unknown>;
  render_json: Record<string, unknown>;
  updated_at: string;
};

function isMissingRenderJsonColumnError(error: { message?: string; details?: string; hint?: string } | null | undefined) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase();
  return text.includes('render_json') && (text.includes('column') || text.includes('schema cache'));
}

export type SiteRenderContext = {
  site: SiteRecord;
  version: SiteVersionRecord | null;
  spec: SiteSpecRecord | null;
  renderPayload: SiteRenderPayload | null;
  mode: RenderViewMode;
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function cleanNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function siteRootHost() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://saborweb.com';
  try {
    const url = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'localhost' || host.endsWith('.localhost')) return null;
    return { protocol: url.protocol, host };
  } catch {
    return { protocol: 'https:', host: 'saborweb.com' };
  }
}

export function restaurantSubdomainUrl(slug: string) {
  const root = siteRootHost();
  if (!root) return null;
  return `${root.protocol}//${slug}.${root.host}`;
}

export function absoluteSiteUrl(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://saborweb.com';
  const origin = configured.startsWith('http://') || configured.startsWith('https://') ? configured : `https://${configured}`;
  return `${origin.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}

function phoneHref(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

function actionPair(profile: ResolvedRestaurantProfile, claimHref: string | null) {
  const orderingHref = profile.orderingUrls[0] ?? null;
  const reservationHref = profile.reservationUrls[0] ?? null;
  const menuHref = profile.menuSourceUrl;
  const mapsHref = profile.mapsUrl;
  const callHref = phoneHref(profile.phone);

  const primary =
    orderingHref
      ? { label: 'Order online', href: orderingHref }
      : reservationHref
        ? { label: 'Book a table', href: reservationHref }
        : menuHref
          ? { label: 'View menu', href: menuHref }
          : mapsHref
            ? { label: 'Get directions', href: mapsHref }
            : callHref
              ? { label: 'Call now', href: callHref }
              : claimHref
                ? { label: 'Claim this site', href: claimHref }
                : { label: null, href: null };

  const secondary =
    (mapsHref && mapsHref !== primary.href)
      ? { label: 'Directions', href: mapsHref }
      : (callHref && callHref !== primary.href)
        ? { label: 'Call', href: callHref }
        : (menuHref && menuHref !== primary.href)
          ? { label: 'Menu', href: menuHref }
          : claimHref && claimHref !== primary.href
            ? { label: 'Claim preview', href: claimHref }
            : { label: null, href: null };

  return {
    primaryLabel: primary.label,
    primaryHref: primary.href,
    secondaryLabel: secondary.label,
    secondaryHref: secondary.href,
    menuHref,
    orderingHref,
    reservationHref,
  };
}

function socialLabel(url: string) {
  if (/instagram/i.test(url)) return 'Instagram';
  if (/facebook/i.test(url)) return 'Facebook';
  if (/tiktok/i.test(url)) return 'TikTok';
  return 'Social';
}

function reviewedAssets(siteAssets: SiteAssetRecord[]) {
  return siteAssets
    .map((asset) => reviewedAssetFromRecord(asset))
    .filter((asset): asset is NonNullable<ReturnType<typeof reviewedAssetFromRecord>> => Boolean(asset));
}

function buildSummary(detail: AdminSiteDetail, profile: ResolvedRestaurantProfile) {
  const buildPacketAnalysis = asRecord(detail.buildPacket?.analysis_json) as unknown as AdminBuildAnalysis;
  const packetSummary = cleanString(buildPacketAnalysis?.briefHealth?.summary);
  if (packetSummary) return packetSummary;
  if (profile.evidenceNotes.length) return profile.evidenceNotes[0];
  return [profile.cuisine, profile.city].filter(Boolean).join(' in ') || `${profile.restaurantName} online`;
}

function buildMenuNote(profile: ResolvedRestaurantProfile, menu: ResolvedMenu | null) {
  if (menu?.provenanceMode === 'fully_generated') return 'This menu was generated to match the restaurant concept while we wait for a verified source.';
  if (menu?.provenanceMode === 'hybrid_generated') return 'This menu combines verified items with carefully filled gaps so the site can launch cleanly now.';
  if (menu?.status === 'structured_menu') return 'A structured menu is ready for guests to browse on this site.';
  if (menu?.status === 'partial_menu') return 'A partial menu is available now, with the approved source linked for the latest details.';
  if (menu?.status === 'menu_evidence_only') return 'Menu highlights are available now, with the approved source linked for full details.';
  if (profile.menuSourceUrl) return 'Menu details are available from the restaurant’s approved source.';
  if (profile.noStructuredMenu) return 'Menu details are still being finalized with the restaurant.';
  return null;
}

export function buildSiteRenderPayload(detail: AdminSiteDetail): SiteRenderPayload {
  if (!detail.site || !detail.resolvedProfile) {
    throw new Error('A site row and resolved profile are required before building a render payload.');
  }

  const site = detail.site;
  const profile = detail.resolvedProfile;
  const resolvedMenu = detail.resolvedMenu;
  const approvedAssets = reviewedAssets(detail.siteAssets);
  const fallbackLogo = approvedAssets.find((asset) => asset.assetType === 'logo' || asset.assetType === 'social_profile_asset') ?? null;
  const canonicalLogo = approvedAssets.find((asset) => asset.assetKey === detail.researchReview.canonicalLogo?.assetKey)
    ?? detail.researchReview.canonicalLogo
    ?? fallbackLogo;
  const fallbackPhotos = approvedAssets.filter((asset) =>
    ['cover_photo', 'food_photo', 'interior_photo', 'social_profile_asset'].includes(asset.assetType),
  );
  const approvedPhotos = detail.researchReview.approvedPhotos.length
    ? detail.researchReview.approvedPhotos
    : fallbackPhotos;
  const heroImageUrl = approvedPhotos[0]?.assetUrl ?? null;
  const galleryImageUrls = approvedPhotos.map((asset) => asset.assetUrl).filter(Boolean).slice(0, 6);
  const claimHref = absoluteSiteUrl(site.claim_url);
  const actionChoices = actionPair(profile, claimHref);
  const buildPacketAnalysis = asRecord(detail.buildPacket?.analysis_json) as unknown as AdminBuildAnalysis;
  const contentPlan = Array.isArray(buildPacketAnalysis?.contentPlan) ? buildPacketAnalysis.contentPlan : [];
  const designDirection = Array.isArray(buildPacketAnalysis?.designDirection) ? buildPacketAnalysis.designDirection : [];
  const acceptanceCriteria = Array.isArray(buildPacketAnalysis?.acceptanceCriteria) ? buildPacketAnalysis.acceptanceCriteria : [];
  const localeDefault = detail.request?.preferred_language === 'es' ? 'es' : 'en';
  const siteBrief = detail.siteBrief;
  const aboutSection = siteBrief.sections.find((section) => section.id === 'about') ?? null;
  const visitSection = siteBrief.sections.find((section) => section.id === 'visit') ?? null;
  const extraSections = siteBrief.sections.filter((section) => !['about', 'menu', 'visit', 'gallery', 'contact'].includes(section.id));

  return {
    version: 1,
    slug: site.slug,
    localeDefault,
    restaurant: {
      name: profile.restaurantName,
      city: profile.city,
      cuisine: profile.cuisine,
      neighborhood: profile.neighborhood,
      address: profile.address,
      phone: profile.phone,
      mapsUrl: profile.mapsUrl,
      hours: profile.hours,
      rating: profile.rating,
    },
    brand: {
      logoUrl: canonicalLogo?.assetUrl ?? null,
      logoText: profile.restaurantName,
      headline: siteBrief.hero.headline,
      eyebrow: siteBrief.hero.eyebrow ?? ([profile.cuisine, profile.city].filter(Boolean).join(' · ') || null),
      summary: siteBrief.hero.subheadline || buildSummary(detail, profile),
      themePreset: siteBrief.visualDirection.themePreset,
      fontPreset: siteBrief.visualDirection.fontPreset,
      designDirection: [...siteBrief.visualDirection.moodWords, ...designDirection].slice(0, 5),
      notes: [siteBrief.positioning, ...profile.evidenceNotes, ...siteBrief.operatorNotes].slice(0, 5),
    },
    media: {
      heroImageUrl,
      galleryImageUrls,
      photoStrategy: profile.photos.strategy,
    },
    menu: {
      status: resolvedMenu?.status ?? 'no_menu_found',
      provenanceMode: resolvedMenu?.provenanceMode ?? 'source_backed',
      sourceUrl: resolvedMenu?.canonicalSourceUrl ?? profile.menuSourceUrl,
      fallbackMode: resolvedMenu?.fallbackMode ?? 'none',
      summaryLines: resolvedMenu?.summaryLines ?? [],
      categories: (resolvedMenu?.categories ?? []).map((category) => ({
        name: category.name,
        description: category.description,
        items: category.items.map((item) => ({
          name: item.name,
          description: item.description,
          priceText: item.priceText,
        })),
      })),
    },
    actions: {
      ...actionChoices,
      primaryLabel: siteBrief.hero.primaryCtaLabel || actionChoices.primaryLabel,
      secondaryLabel: siteBrief.hero.secondaryCtaLabel || actionChoices.secondaryLabel,
      socialLinks: profile.confirmedSocialUrls.slice(0, 4).map((url) => ({ label: socialLabel(url), href: url })),
      claimHref,
    },
    sections: {
      aboutTitle: aboutSection?.title ?? 'About',
      aboutBullets: aboutSection?.body.length ? aboutSection.body.slice(0, 4) : contentPlan.slice(0, 4),
      visitTitle: visitSection?.title ?? 'Visit Us',
      experienceBullets: [...profile.brandDirection, ...siteBrief.visualDirection.moodWords, ...designDirection].slice(0, 6),
      extraSections: extraSections.map((section) => ({
        id: section.id,
        title: section.title,
        body: section.body.slice(0, 4),
      })),
      acceptanceCriteria: acceptanceCriteria.slice(0, 6),
      menuNote: buildMenuNote(profile, resolvedMenu),
    },
    metadata: {
      sourceHash: detail.packetSourceHash,
      generatedAt: new Date().toISOString(),
    },
  };
}

function sortVersions(versions: SiteVersionRecord[], mode: 'preview' | 'public') {
  const priority = mode === 'public'
    ? { published: 5, approved: 4, staged: 3, qa_failed: 2, draft: 0, rolled_back: -1, archived: -1 }
    : { approved: 5, staged: 4, published: 3, qa_failed: 2, draft: 0, rolled_back: -1, archived: -1 };

  return [...versions].sort((left, right) => {
    const leftPriority = priority[left.status] ?? -1;
    const rightPriority = priority[right.status] ?? -1;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    return String(right.updated_at ?? '').localeCompare(String(left.updated_at ?? ''));
  });
}

export function validateRenderPayload(value: unknown): SiteRenderPayload | null {
  const record = asRecord(value);
  if (!record.version || !asRecord(record.restaurant).name || !asRecord(record.actions)) return null;
  return {
    version: 1,
    slug: cleanString(record.slug) ?? '',
    localeDefault: cleanString(record.localeDefault) === 'es' ? 'es' : 'en',
    restaurant: {
      name: cleanString(asRecord(record.restaurant).name) ?? 'Restaurant',
      city: cleanString(asRecord(record.restaurant).city),
      cuisine: cleanString(asRecord(record.restaurant).cuisine),
      neighborhood: cleanString(asRecord(record.restaurant).neighborhood),
      address: cleanString(asRecord(record.restaurant).address),
      phone: cleanString(asRecord(record.restaurant).phone),
      mapsUrl: cleanString(asRecord(record.restaurant).mapsUrl),
      hours: stringArray(asRecord(record.restaurant).hours),
      rating: cleanNumber(asRecord(record.restaurant).rating),
    },
    brand: {
      logoUrl: cleanString(asRecord(record.brand).logoUrl),
      logoText: cleanString(asRecord(record.brand).logoText) ?? 'Restaurant',
      headline: cleanString(asRecord(record.brand).headline) ?? cleanString(asRecord(record.restaurant).name) ?? 'Restaurant',
      eyebrow: cleanString(asRecord(record.brand).eyebrow),
      summary: cleanString(asRecord(record.brand).summary) ?? '',
      themePreset:
        cleanString(asRecord(record.brand).themePreset) === 'coastal_bright' ||
        cleanString(asRecord(record.brand).themePreset) === 'sunny_editorial' ||
        cleanString(asRecord(record.brand).themePreset) === 'tropical_modern'
          ? (cleanString(asRecord(record.brand).themePreset) as SiteRenderPayload['brand']['themePreset'])
          : 'classic_neutral',
      fontPreset:
        cleanString(asRecord(record.brand).fontPreset) === 'editorial_serif' ||
        cleanString(asRecord(record.brand).fontPreset) === 'friendly_modern' ||
        cleanString(asRecord(record.brand).fontPreset) === 'coastal_mix'
          ? (cleanString(asRecord(record.brand).fontPreset) as SiteRenderPayload['brand']['fontPreset'])
          : 'clean_sans',
      designDirection: stringArray(asRecord(record.brand).designDirection),
      notes: stringArray(asRecord(record.brand).notes),
    },
    media: {
      heroImageUrl: cleanString(asRecord(record.media).heroImageUrl),
      galleryImageUrls: stringArray(asRecord(record.media).galleryImageUrls),
      photoStrategy:
        cleanString(asRecord(record.media).photoStrategy) === 'approved_assets'
          ? 'approved_assets'
          : cleanString(asRecord(record.media).photoStrategy) === 'tasteful_placeholders'
            ? 'tasteful_placeholders'
            : cleanString(asRecord(record.media).photoStrategy) === 'generated_imagery'
              ? 'generated_imagery'
              : null,
    },
    menu: {
      status: ['structured_menu', 'partial_menu', 'menu_evidence_only', 'no_menu_found'].includes(String(asRecord(record.menu).status))
        ? (asRecord(record.menu).status as SiteRenderPayload['menu']['status'])
        : 'no_menu_found',
      provenanceMode: ['source_backed', 'hybrid_generated', 'fully_generated'].includes(String(asRecord(record.menu).provenanceMode))
        ? (asRecord(record.menu).provenanceMode as SiteRenderPayload['menu']['provenanceMode'])
        : 'source_backed',
      sourceUrl: cleanString(asRecord(record.menu).sourceUrl),
      fallbackMode: ['none', 'summary_only', 'aggressive_ai_generated'].includes(String(asRecord(record.menu).fallbackMode))
        ? (asRecord(record.menu).fallbackMode as SiteRenderPayload['menu']['fallbackMode'])
        : 'none',
      summaryLines: stringArray(asRecord(record.menu).summaryLines),
      categories: Array.isArray(asRecord(record.menu).categories)
        ? (asRecord(record.menu).categories as unknown[])
            .filter((category): category is Record<string, unknown> => typeof category === 'object' && category !== null && !Array.isArray(category))
            .map((category) => ({
              name: cleanString(asRecord(category).name) ?? 'Menu section',
              description: cleanString(asRecord(category).description),
              items: Array.isArray(asRecord(category).items)
                ? (asRecord(category).items as unknown[])
                    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
                    .map((item) => ({
                      name: cleanString(asRecord(item).name) ?? 'Menu item',
                      description: cleanString(asRecord(item).description),
                      priceText: cleanString(asRecord(item).priceText),
                    }))
                : [],
            }))
        : [],
    },
    actions: {
      primaryLabel: cleanString(asRecord(record.actions).primaryLabel),
      primaryHref: cleanString(asRecord(record.actions).primaryHref),
      secondaryLabel: cleanString(asRecord(record.actions).secondaryLabel),
      secondaryHref: cleanString(asRecord(record.actions).secondaryHref),
      menuHref: cleanString(asRecord(record.actions).menuHref),
      orderingHref: cleanString(asRecord(record.actions).orderingHref),
      reservationHref: cleanString(asRecord(record.actions).reservationHref),
      socialLinks: Array.isArray(asRecord(record.actions).socialLinks)
        ? (asRecord(record.actions).socialLinks as unknown[]).map((item) => ({
            label: cleanString(asRecord(item).label) ?? 'Social',
            href: cleanString(asRecord(item).href) ?? '',
          })).filter((item) => Boolean(item.href))
        : [],
      claimHref: cleanString(asRecord(record.actions).claimHref),
    },
    sections: {
      aboutTitle: cleanString(asRecord(record.sections).aboutTitle),
      aboutBullets: stringArray(asRecord(record.sections).aboutBullets),
      visitTitle: cleanString(asRecord(record.sections).visitTitle),
      experienceBullets: stringArray(asRecord(record.sections).experienceBullets),
      extraSections: Array.isArray(asRecord(record.sections).extraSections)
        ? (asRecord(record.sections).extraSections as unknown[])
            .filter((section): section is Record<string, unknown> => typeof section === 'object' && section !== null && !Array.isArray(section))
            .map((section) => ({
              id: cleanString(section.id) ?? 'section',
              title: cleanString(section.title) ?? 'Section',
              body: stringArray(section.body),
            }))
        : [],
      acceptanceCriteria: stringArray(asRecord(record.sections).acceptanceCriteria),
      menuNote: cleanString(asRecord(record.sections).menuNote),
    },
    metadata: {
      sourceHash: cleanString(asRecord(record.metadata).sourceHash) ?? '',
      generatedAt: cleanString(asRecord(record.metadata).generatedAt) ?? '',
    },
  };
}

export async function loadSiteRenderContext(slug: string, mode: 'preview' | 'public'): Promise<SiteRenderContext | null> {
  const supabase = getSupabaseAdmin();
  const { data: siteRow, error: siteError } = await supabase
    .from('restaurant_sites')
    .select([
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
      'metadata',
    ].join(', '))
    .eq('slug', slug)
    .maybeSingle();

  if (siteError) throw new Error('Could not load restaurant site.');
  if (!siteRow) return null;

  const site = siteRow as unknown as SiteRecord;
  const { data: versionRows, error: versionError } = await supabase
    .from('site_versions')
    .select('id, site_id, site_spec_id, status, release_channel, deployment_url, updated_at, published_at, metadata')
    .eq('site_id', site.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (versionError) throw new Error('Could not load site versions.');
  const selectedVersion = sortVersions((versionRows ?? []) as SiteVersionRecord[], mode)[0] ?? null;

  let spec: SiteSpecRecord | null = null;
  if (selectedVersion?.site_spec_id) {
    let specRow: Record<string, unknown> | null = null;
    const primary = await supabase
      .from('site_specs')
      .select('id, site_id, status, source_hash, spec_json, seo_json, render_json, updated_at')
      .eq('id', selectedVersion.site_spec_id)
      .maybeSingle();
    if (primary.error && isMissingRenderJsonColumnError(primary.error)) {
      const fallback = await supabase
        .from('site_specs')
        .select('id, site_id, status, source_hash, spec_json, seo_json, updated_at')
        .eq('id', selectedVersion.site_spec_id)
        .maybeSingle();
      specRow = fallback.data ? { ...fallback.data, render_json: asRecord(fallback.data?.spec_json).renderPayload ?? {} } : null;
    } else {
      specRow = primary.data;
    }
    if (specRow) spec = specRow as unknown as SiteSpecRecord;
  }

  if (!spec) {
    const primary = await supabase
      .from('site_specs')
      .select('id, site_id, status, source_hash, spec_json, seo_json, render_json, updated_at')
      .eq('site_id', site.id)
      .in('status', ['draft', 'staged', 'approved', 'published'])
      .order('updated_at', { ascending: false })
      .limit(1);
    let fallbackSpecRow: Record<string, unknown> | null = null;
    if (primary.error && isMissingRenderJsonColumnError(primary.error)) {
      const fallback = await supabase
        .from('site_specs')
        .select('id, site_id, status, source_hash, spec_json, seo_json, updated_at')
        .eq('site_id', site.id)
        .in('status', ['draft', 'staged', 'approved', 'published'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      fallbackSpecRow = fallback.data ? { ...fallback.data, render_json: asRecord(fallback.data?.spec_json).renderPayload ?? {} } : null;
    } else {
      fallbackSpecRow = primary.data?.[0] ?? null;
    }
    if (fallbackSpecRow) spec = fallbackSpecRow as unknown as SiteSpecRecord;
  }

  const renderPayload = validateRenderPayload(spec?.render_json ?? asRecord(spec?.spec_json).renderPayload ?? null);
  const hasPublishedVersion = Boolean(selectedVersion?.status === 'published' || (site.status === 'live' && site.live_url));
  return {
    site,
    version: selectedVersion,
    spec,
    renderPayload,
    mode: hasPublishedVersion && mode === 'public' ? 'live' : 'preview',
  };
}

export function routeLanguage(segments?: string[]) {
  const first = segments?.[0];
  return first === 'es' ? 'es' : 'en';
}

export function languagePath(path: string, lang: RenderLanguage) {
  return lang === 'en' ? path : `${path.replace(/\/$/, '')}/es`;
}

export function siteVersionPublicUrl(site: Pick<SiteRecord, 'slug' | 'preview_url' | 'claim_url'>, mode: 'preview' | 'public') {
  if (mode === 'public') return restaurantSubdomainUrl(site.slug) ?? absoluteSiteUrl(site.preview_url);
  return absoluteSiteUrl(site.preview_url);
}

export function renderPayloadHash(payload: SiteRenderPayload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function resolvedProfileFromSite(site: Pick<SiteRecord, 'metadata'>) {
  return readResolvedProfile(site.metadata ?? null);
}

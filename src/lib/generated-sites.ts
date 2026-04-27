import 'server-only';

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { AdminSiteDetail } from '@/lib/admin/dashboard';
import { reviewedAssetFromRecord } from '@/lib/admin/research-review';
import type { RenderLanguage } from '@/lib/site-rendering';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GENERATED_SITE_REGISTRY } from '@/generated-sites/registry';

export type GeneratedSiteManifest = {
  version: 1;
  slug: string;
  generatedAt: string;
  sourceHash: string;
  restaurant: {
    name: string;
    city: string | null;
    cuisine: string | null;
    address: string | null;
    phone: string | null;
    hours: string[];
    mapsUrl: string | null;
  };
  brand: {
    headline: string;
    subheadline: string;
    eyebrow: string | null;
    mood: string[];
    colors: string[];
    logoUrl: string | null;
  };
  assets: {
    heroImageUrl: string | null;
    galleryImageUrls: string[];
  };
  menu: {
    status: string;
    sourceUrl: string | null;
    note: string | null;
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
    claimHref: string;
    primaryLabel: string;
    primaryHref: string | null;
    secondaryLabel: string | null;
    secondaryHref: string | null;
    socialLinks: Array<{ label: string; href: string }>;
  };
  content: {
    summary: string;
    assumptions: string[];
    sections: Array<{ id: string; title: string; body: string[] }>;
    acceptanceCriteria: string[];
  };
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://saborweb.com').replace(/\/$/, '');
}

function absolutePath(value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteOrigin()}${value.startsWith('/') ? value : `/${value}`}`;
}

function socialLabel(url: string) {
  if (/instagram/i.test(url)) return 'Instagram';
  if (/facebook/i.test(url)) return 'Facebook';
  if (/tiktok/i.test(url)) return 'TikTok';
  return 'Social';
}

function generatedSiteDir(slug: string) {
  return path.join(process.cwd(), 'src', 'generated-sites', slug);
}

function generatedSiteFile(slug: string) {
  return path.join(generatedSiteDir(slug), 'site.json');
}

function generatedSiteRegistryFile() {
  return path.join(process.cwd(), 'src', 'generated-sites', 'registry.ts');
}

export function generatedSiteSubdomain(slug: string) {
  const rawOrigin = siteOrigin();
  const origin = new URL(/^https?:\/\//i.test(rawOrigin) ? rawOrigin : `https://${rawOrigin}`);
  const rootHost = origin.hostname.replace(/^www\./, '');
  return `${origin.protocol}//${slug}.${rootHost}`;
}

export function buildGeneratedSiteManifest(detail: AdminSiteDetail): GeneratedSiteManifest {
  if (!detail.site) throw new Error('Generated site build requires a restaurant site.');
  const profile = detail.resolvedProfile;
  const siteBrief = detail.siteBrief;
  const menu = detail.resolvedMenu;
  const reviewedAssets = detail.siteAssets
    .map((asset) => reviewedAssetFromRecord(asset))
    .filter((asset): asset is NonNullable<ReturnType<typeof reviewedAssetFromRecord>> => Boolean(asset));
  const logo =
    detail.researchReview.canonicalLogo ??
    reviewedAssets.find((asset) => asset.assetType === 'logo' || asset.assetType === 'social_profile_asset') ??
    null;
  const photos = detail.researchReview.approvedPhotos.length
    ? detail.researchReview.approvedPhotos
    : reviewedAssets.filter((asset) => ['cover_photo', 'food_photo', 'interior_photo', 'social_profile_asset'].includes(asset.assetType));
  const projectPrompt = cleanString(asRecord(detail.site.metadata).project_prompt);
  const finalBuildNote = detail.researchReview.state.finalBuildNote;
  const assumptions = [
    ...(profile?.missingItems ?? []).map((item) => `Needs confirmation: ${item}`),
    ...(profile?.uncertainItems ?? []).map((item) => `Assumption used: ${item}`),
    ...(finalBuildNote ? [finalBuildNote] : []),
    ...(projectPrompt ? [projectPrompt] : []),
  ].slice(0, 8);
  const claimHref = absolutePath(detail.site.claim_url) ?? `/claim/${detail.site.slug}`;
  const primaryHref =
    profile?.orderingUrls[0] ??
    profile?.reservationUrls[0] ??
    profile?.menuSourceUrl ??
    profile?.mapsUrl ??
    null;
  const primaryLabel =
    siteBrief.hero.primaryCtaLabel ||
    (profile?.orderingUrls[0] ? 'Order Online' : profile?.reservationUrls[0] ? 'Reserve' : 'View Menu');
  const secondaryHref =
    profile?.mapsUrl && profile.mapsUrl !== primaryHref
      ? profile.mapsUrl
      : profile?.phone
        ? `tel:${profile.phone.replace(/[^\d+]/g, '')}`
        : null;

  return {
    version: 1,
    slug: detail.site.slug,
    generatedAt: new Date().toISOString(),
    sourceHash: detail.packetSourceHash,
    restaurant: {
      name: profile?.restaurantName ?? detail.site.restaurant_name,
      city: profile?.city ?? detail.site.city,
      cuisine: profile?.cuisine ?? null,
      address: profile?.address ?? null,
      phone: profile?.phone ?? null,
      hours: profile?.hours ?? [],
      mapsUrl: profile?.mapsUrl ?? null,
    },
    brand: {
      headline: siteBrief.hero.headline,
      subheadline: siteBrief.hero.subheadline || siteBrief.summary,
      eyebrow: siteBrief.hero.eyebrow,
      mood: siteBrief.visualDirection.moodWords,
      colors: siteBrief.visualDirection.colorNotes,
      logoUrl: logo?.assetUrl ?? null,
    },
    assets: {
      heroImageUrl: photos[0]?.assetUrl ?? null,
      galleryImageUrls: photos.map((asset) => asset.assetUrl).filter(Boolean).slice(0, 8),
    },
    menu: {
      status: menu?.status ?? 'no_menu_found',
      sourceUrl: menu?.canonicalSourceUrl ?? profile?.menuSourceUrl ?? null,
      note:
        menu?.provenanceMode === 'fully_generated'
          ? 'Menu copy includes polished assumptions and should be confirmed by the owner.'
          : menu?.provenanceMode === 'hybrid_generated'
            ? 'Menu copy combines verified items with polished assumptions.'
            : null,
      categories: (menu?.categories ?? []).map((category) => ({
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
      claimHref,
      primaryLabel,
      primaryHref,
      secondaryLabel: secondaryHref === profile?.mapsUrl ? 'Directions' : secondaryHref ? 'Call' : null,
      secondaryHref,
      socialLinks: (profile?.confirmedSocialUrls ?? []).slice(0, 4).map((url) => ({ label: socialLabel(url), href: url })),
    },
    content: {
      summary: siteBrief.summary,
      assumptions,
      sections: siteBrief.sections,
      acceptanceCriteria: Array.isArray(asRecord(detail.buildPacket?.analysis_json).acceptanceCriteria)
        ? (asRecord(detail.buildPacket?.analysis_json).acceptanceCriteria as string[]).slice(0, 8)
        : [],
    },
  };
}

export async function writeGeneratedSiteManifest(manifest: GeneratedSiteManifest) {
  await mkdir(generatedSiteDir(manifest.slug), { recursive: true });
  await writeFile(generatedSiteFile(manifest.slug), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(generatedSiteRegistryFile(), generatedSiteRegistrySource({
    ...GENERATED_SITE_REGISTRY,
    [manifest.slug]: manifest,
  }), 'utf8');
  return {
    path: `src/generated-sites/${manifest.slug}/site.json`,
    registryPath: 'src/generated-sites/registry.ts',
  };
}

export function generatedSiteRegistrySource(registry: Record<string, GeneratedSiteManifest>) {
  const ordered = Object.fromEntries(
    Object.entries(registry).sort(([a], [b]) => a.localeCompare(b)),
  );

  return [
    "import type { GeneratedSiteManifest } from '@/lib/generated-sites';",
    '',
    `export const GENERATED_SITE_REGISTRY: Record<string, GeneratedSiteManifest> = ${JSON.stringify(ordered, null, 2)};`,
    '',
  ].join('\n');
}

export function normalizeGeneratedSiteManifest(value: unknown): GeneratedSiteManifest | null {
  const record = asRecord(value);
  const restaurant = asRecord(record.restaurant);
  const brand = asRecord(record.brand);
  const assets = asRecord(record.assets);
  const menu = asRecord(record.menu);
  const actions = asRecord(record.actions);
  const content = asRecord(record.content);
  const slug = cleanString(record.slug);
  const name = cleanString(restaurant.name);
  if (!slug || !name) return null;

  return {
    version: 1,
    slug,
    generatedAt: cleanString(record.generatedAt) ?? '',
    sourceHash: cleanString(record.sourceHash) ?? '',
    restaurant: {
      name,
      city: cleanString(restaurant.city),
      cuisine: cleanString(restaurant.cuisine),
      address: cleanString(restaurant.address),
      phone: cleanString(restaurant.phone),
      hours: Array.isArray(restaurant.hours) ? restaurant.hours.filter((item): item is string => typeof item === 'string') : [],
      mapsUrl: cleanString(restaurant.mapsUrl),
    },
    brand: {
      headline: cleanString(brand.headline) ?? name,
      subheadline: cleanString(brand.subheadline) ?? '',
      eyebrow: cleanString(brand.eyebrow),
      mood: Array.isArray(brand.mood) ? brand.mood.filter((item): item is string => typeof item === 'string') : [],
      colors: Array.isArray(brand.colors) ? brand.colors.filter((item): item is string => typeof item === 'string') : [],
      logoUrl: cleanString(brand.logoUrl),
    },
    assets: {
      heroImageUrl: cleanString(assets.heroImageUrl),
      galleryImageUrls: Array.isArray(assets.galleryImageUrls)
        ? assets.galleryImageUrls.filter((item): item is string => typeof item === 'string')
        : [],
    },
    menu: {
      status: cleanString(menu.status) ?? 'no_menu_found',
      sourceUrl: cleanString(menu.sourceUrl),
      note: cleanString(menu.note),
      categories: Array.isArray(menu.categories)
        ? menu.categories.map((category) => {
            const categoryRecord = asRecord(category);
            return {
              name: cleanString(categoryRecord.name) ?? 'Menu',
              description: cleanString(categoryRecord.description),
              items: Array.isArray(categoryRecord.items)
                ? categoryRecord.items.map((item) => {
                    const itemRecord = asRecord(item);
                    return {
                      name: cleanString(itemRecord.name) ?? 'Menu item',
                      description: cleanString(itemRecord.description),
                      priceText: cleanString(itemRecord.priceText),
                    };
                  })
                : [],
            };
          })
        : [],
    },
    actions: {
      claimHref: cleanString(actions.claimHref) ?? `/claim/${slug}`,
      primaryLabel: cleanString(actions.primaryLabel) ?? 'View Menu',
      primaryHref: cleanString(actions.primaryHref),
      secondaryLabel: cleanString(actions.secondaryLabel),
      secondaryHref: cleanString(actions.secondaryHref),
      socialLinks: Array.isArray(actions.socialLinks)
        ? actions.socialLinks.map((item) => ({
            label: cleanString(asRecord(item).label) ?? 'Social',
            href: cleanString(asRecord(item).href) ?? '',
          })).filter((item) => item.href)
        : [],
    },
    content: {
      summary: cleanString(content.summary) ?? '',
      assumptions: Array.isArray(content.assumptions) ? content.assumptions.filter((item): item is string => typeof item === 'string') : [],
      sections: Array.isArray(content.sections)
        ? content.sections.map((section) => {
            const sectionRecord = asRecord(section);
            return {
              id: cleanString(sectionRecord.id) ?? 'section',
              title: cleanString(sectionRecord.title) ?? 'Section',
              body: Array.isArray(sectionRecord.body) ? sectionRecord.body.filter((item): item is string => typeof item === 'string') : [],
            };
          })
        : [],
      acceptanceCriteria: Array.isArray(content.acceptanceCriteria)
        ? content.acceptanceCriteria.filter((item): item is string => typeof item === 'string')
        : [],
    },
  };
}

export async function loadGeneratedSiteManifest(slug: string): Promise<GeneratedSiteManifest | null> {
  const fromRegistry = normalizeGeneratedSiteManifest(GENERATED_SITE_REGISTRY[slug]);
  if (fromRegistry) return fromRegistry;

  try {
    const raw = await readFile(generatedSiteFile(slug), 'utf8');
    const fromFile = normalizeGeneratedSiteManifest(JSON.parse(raw));
    if (fromFile) return fromFile;
  } catch {
    // The repo registry is the production source of truth. The filesystem read
    // helps local development before a new registry import has been rebuilt.
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('restaurant_sites')
    .select('metadata')
    .eq('slug', slug)
    .maybeSingle();
  const fromMetadata = normalizeGeneratedSiteManifest(asRecord(data?.metadata).generated_site);
  if (fromMetadata) return fromMetadata;
  return null;
}

export function generatedSiteLanguage(segments?: string[]): RenderLanguage {
  return segments?.[0] === 'es' ? 'es' : 'en';
}

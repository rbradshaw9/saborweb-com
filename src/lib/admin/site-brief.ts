import 'server-only';

import type { ResolvedMenu } from '@/lib/admin/menu-research';
import type { ResolvedRestaurantProfile, StrategicRestaurantProfile } from '@/lib/admin/research-audit';

export type SiteBriefThemePreset =
  | 'coastal_bright'
  | 'sunny_editorial'
  | 'tropical_modern'
  | 'classic_neutral';

export type SiteBriefFontPreset =
  | 'clean_sans'
  | 'editorial_serif'
  | 'friendly_modern'
  | 'coastal_mix';

export type SiteBriefSection = {
  id: string;
  title: string;
  body: string[];
};

export type ResolvedSiteBrief = {
  version: 1;
  summary: string;
  siteIntent: string;
  positioning: string;
  hero: {
    eyebrow: string | null;
    headline: string;
    subheadline: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string | null;
  };
  sections: SiteBriefSection[];
  visualDirection: {
    themePreset: SiteBriefThemePreset;
    fontPreset: SiteBriefFontPreset;
    moodWords: string[];
    colorNotes: string[];
    typographyTone: string;
  };
  copyDirection: {
    tone: string;
    seoKeywords: string[];
  };
  moduleUsage: {
    menu: 'customer_portal';
    hours: 'customer_portal';
    gallery: 'operator_managed';
    contact: 'operator_managed';
  };
  editableOwnership: {
    customerManaged: string[];
    operatorManaged: string[];
  };
  operatorNotes: string[];
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function validThemePreset(value: unknown): SiteBriefThemePreset | null {
  switch (value) {
    case 'coastal_bright':
    case 'sunny_editorial':
    case 'tropical_modern':
    case 'classic_neutral':
      return value;
    default:
      return null;
  }
}

function validFontPreset(value: unknown): SiteBriefFontPreset | null {
  switch (value) {
    case 'clean_sans':
    case 'editorial_serif':
    case 'friendly_modern':
    case 'coastal_mix':
      return value;
    default:
      return null;
  }
}

function keywordFallback(profile: ResolvedRestaurantProfile | null) {
  return [
    profile?.cuisine,
    profile?.city ? `${profile.cuisine ?? 'restaurant'} in ${profile.city}` : null,
    profile?.city ? `menu in ${profile.city}` : null,
    profile?.city ? `hours in ${profile.city}` : null,
  ].filter((value): value is string => Boolean(value));
}

function menuLabel(menu: ResolvedMenu | null) {
  if (menu?.categories.length) return 'View Menu';
  return 'Explore Menu';
}

function fallbackPrimaryCta(profile: ResolvedRestaurantProfile | null, menu: ResolvedMenu | null) {
  if (menu?.categories.length || profile?.menuSourceUrl) return menuLabel(menu);
  if (profile?.mapsUrl) return 'Visit Us';
  if (profile?.phone) return 'Call Now';
  if (profile?.primaryWebPresenceUrl) return 'Stay Connected';
  return 'Visit Us';
}

function fallbackSecondaryCta(profile: ResolvedRestaurantProfile | null) {
  if (profile?.mapsUrl) return 'Get Directions';
  if (profile?.phone) return 'Call';
  if (profile?.primaryWebPresenceUrl) return 'Follow Along';
  return null;
}

function themeFromContext(params: {
  profile: ResolvedRestaurantProfile | null;
  strategicProfile: StrategicRestaurantProfile | null;
  summary: string | null;
}): { themePreset: SiteBriefThemePreset; fontPreset: SiteBriefFontPreset } {
  const joined = [
    params.summary ?? '',
    ...(params.strategicProfile?.visualDirection ?? []),
    ...(params.profile?.brandDirection ?? []),
    params.profile?.city ?? '',
    params.profile?.neighborhood ?? '',
  ].join(' ').toLowerCase();

  if (/(coastal|beach|surf|isabela|jobos|ocean|sea)/.test(joined)) {
    return { themePreset: 'coastal_bright', fontPreset: 'coastal_mix' };
  }
  if (/(editorial|premium|elevated|refined|story)/.test(joined)) {
    return { themePreset: 'sunny_editorial', fontPreset: 'editorial_serif' };
  }
  if (/(tropical|fruit|vibrant|juice|acai|smoothie)/.test(joined)) {
    return { themePreset: 'tropical_modern', fontPreset: 'friendly_modern' };
  }
  return { themePreset: 'classic_neutral', fontPreset: 'clean_sans' };
}

function fallbackSections(params: {
  profile: ResolvedRestaurantProfile | null;
  menu: ResolvedMenu | null;
  strategicProfile: StrategicRestaurantProfile | null;
}) {
  const aboutBullets = [
    params.strategicProfile?.menuStory,
    params.strategicProfile?.locationContext,
    ...(params.profile?.brandDirection ?? []),
  ].filter((value): value is string => Boolean(value)).slice(0, 3);

  const visitBullets = [
    params.profile?.address,
    params.profile?.city,
    params.profile?.neighborhood ? `${params.profile.neighborhood} area` : null,
  ].filter((value): value is string => Boolean(value));

  const sections: SiteBriefSection[] = [
    {
      id: 'about',
      title: 'About',
      body: aboutBullets.length ? aboutBullets : ['A welcoming local restaurant experience shaped by the strongest available research.'],
    },
    {
      id: 'menu',
      title: 'Menu',
      body: params.menu?.categories.length
        ? [
            `Use the customer-portal menu module and seed it with ${params.menu.categories.length} menu categor${params.menu.categories.length === 1 ? 'y' : 'ies'}.`,
            'Keep the menu mobile-friendly and easy to scan.',
          ]
        : [
            'Use the customer-portal menu module and create a complete starter menu that fits the concept.',
            'Keep the menu editable and easy for the restaurant team to update later.',
          ],
    },
  ];

  if (params.menu?.featuredItems.length) {
    sections.push({
      id: 'specials',
      title: 'Highlights',
      body: params.menu.featuredItems.slice(0, 3),
    });
  }

  sections.push(
    {
      id: 'visit',
      title: 'Visit Us',
      body: visitBullets.length ? visitBullets : ['Make it easy to find the restaurant and understand when to visit.'],
    },
    {
      id: 'gallery',
      title: 'Gallery',
      body: ['Use strong real restaurant images first, with operator-managed curation.'],
    },
    {
      id: 'contact',
      title: 'Contact',
      body: ['Keep contact details clear and easy to update through operator-managed content and customer-managed hours.'],
    },
  );

  return sections;
}

export function validateResolvedSiteBrief(value: unknown): ResolvedSiteBrief | null {
  const record = asRecord(value);
  const hero = asRecord(record.hero);
  const visualDirection = asRecord(record.visualDirection);
  const copyDirection = asRecord(record.copyDirection);
  if (!cleanString(record.summary) || !cleanString(hero.headline) || !cleanString(hero.subheadline)) {
    return null;
  }

  return {
    version: 1,
    summary: cleanString(record.summary) ?? '',
    siteIntent: cleanString(record.siteIntent) ?? cleanString(record.summary) ?? '',
    positioning: cleanString(record.positioning) ?? cleanString(record.summary) ?? '',
    hero: {
      eyebrow: cleanString(hero.eyebrow),
      headline: cleanString(hero.headline) ?? 'Restaurant',
      subheadline: cleanString(hero.subheadline) ?? '',
      primaryCtaLabel: cleanString(hero.primaryCtaLabel) ?? 'View Menu',
      secondaryCtaLabel: cleanString(hero.secondaryCtaLabel),
    },
    sections: Array.isArray(record.sections)
      ? record.sections
          .filter((section): section is Record<string, unknown> => typeof section === 'object' && section !== null && !Array.isArray(section))
          .map((section) => ({
            id: cleanString(section.id) ?? 'section',
            title: cleanString(section.title) ?? 'Section',
            body: stringArray(section.body),
          }))
          .filter((section) => section.body.length > 0)
      : [],
    visualDirection: {
      themePreset: validThemePreset(visualDirection.themePreset) ?? 'classic_neutral',
      fontPreset: validFontPreset(visualDirection.fontPreset) ?? 'clean_sans',
      moodWords: stringArray(visualDirection.moodWords),
      colorNotes: stringArray(visualDirection.colorNotes),
      typographyTone: cleanString(visualDirection.typographyTone) ?? 'Clean and readable',
    },
    copyDirection: {
      tone: cleanString(copyDirection.tone) ?? 'Warm, confident, and local',
      seoKeywords: stringArray(copyDirection.seoKeywords),
    },
    moduleUsage: {
      menu: 'customer_portal',
      hours: 'customer_portal',
      gallery: 'operator_managed',
      contact: 'operator_managed',
    },
    editableOwnership: {
      customerManaged: ['menu', 'hours'],
      operatorManaged: stringArray(asRecord(record.editableOwnership).operatorManaged).length
        ? stringArray(asRecord(record.editableOwnership).operatorManaged)
        : ['homepage copy', 'about/story', 'layout', 'hero treatment', 'gallery curation', 'visual direction', 'CTA strategy', 'SEO copy', 'brand presentation'],
    },
    operatorNotes: stringArray(record.operatorNotes),
  };
}

export function buildFallbackSiteBrief(params: {
  restaurantName: string;
  city: string | null;
  summary: string | null;
  profile: ResolvedRestaurantProfile | null;
  strategicProfile: StrategicRestaurantProfile | null;
  menu: ResolvedMenu | null;
}): ResolvedSiteBrief {
  const theme = themeFromContext({
    profile: params.profile,
    strategicProfile: params.strategicProfile,
    summary: params.summary,
  });
  const cuisine = params.profile?.cuisine ? `${params.profile.cuisine} restaurant` : 'restaurant';
  const city = params.profile?.city ?? params.city;
  const summary =
    params.summary ??
    `${params.restaurantName} is a welcoming ${cuisine}${city ? ` in ${city}` : ''} built from the best available research.}`;
  const positioning =
    params.strategicProfile?.menuStory ??
    params.strategicProfile?.uniqueSellingProposition ??
    params.profile?.brandDirection[0] ??
    summary;
  const siteIntent =
    params.strategicProfile?.siteRecommendations[0] ??
    `Build a complete first-party restaurant website for ${params.restaurantName}.`;

  return {
    version: 1,
    summary,
    siteIntent,
    positioning,
    hero: {
      eyebrow: [params.profile?.cuisine, city].filter((value): value is string => Boolean(value)).join(' · ') || null,
      headline: params.restaurantName,
      subheadline: summary,
      primaryCtaLabel: fallbackPrimaryCta(params.profile, params.menu),
      secondaryCtaLabel: fallbackSecondaryCta(params.profile),
    },
    sections: fallbackSections({
      profile: params.profile,
      menu: params.menu,
      strategicProfile: params.strategicProfile,
    }),
    visualDirection: {
      themePreset: theme.themePreset,
      fontPreset: theme.fontPreset,
      moodWords: [
        ...(params.strategicProfile?.visualDirection ?? []),
        ...(params.profile?.brandDirection ?? []),
      ].slice(0, 5),
      colorNotes: [
        theme.themePreset === 'coastal_bright' ? 'Airy neutrals with ocean-toned accents' : null,
        theme.themePreset === 'tropical_modern' ? 'Fresh greens and sunny tropical accents' : null,
        theme.themePreset === 'sunny_editorial' ? 'Soft neutrals with richer accent contrast' : null,
      ].filter((value): value is string => Boolean(value)),
      typographyTone:
        theme.fontPreset === 'editorial_serif'
          ? 'Editorial but approachable'
          : theme.fontPreset === 'coastal_mix'
            ? 'Relaxed and polished'
            : 'Modern and friendly',
    },
    copyDirection: {
      tone: params.strategicProfile?.marketingInsights[0] ?? 'Warm, confident, local, and welcoming',
      seoKeywords: keywordFallback(params.profile).slice(0, 6),
    },
    moduleUsage: {
      menu: 'customer_portal',
      hours: 'customer_portal',
      gallery: 'operator_managed',
      contact: 'operator_managed',
    },
    editableOwnership: {
      customerManaged: ['menu', 'hours'],
      operatorManaged: ['homepage copy', 'about/story', 'layout', 'hero treatment', 'gallery curation', 'visual direction', 'CTA strategy', 'SEO copy', 'brand presentation'],
    },
    operatorNotes: [
      'Use real restaurant images first and avoid fabricated restaurant-specific photography.',
      'Keep menu and hours tied to structured customer-portal data.',
    ],
  };
}

export function readResolvedSiteBrief(params: {
  siteMetadata?: Record<string, unknown> | null;
  buildPacketAnalysis?: Record<string, unknown> | null;
  fallback: {
    restaurantName: string;
    city: string | null;
    summary: string | null;
    profile: ResolvedRestaurantProfile | null;
    strategicProfile: StrategicRestaurantProfile | null;
    menu: ResolvedMenu | null;
  };
}) {
  const siteMetadata = asRecord(params.siteMetadata);
  const buildPacketAnalysis = asRecord(params.buildPacketAnalysis);
  return (
    validateResolvedSiteBrief(siteMetadata.resolved_site_brief) ??
    validateResolvedSiteBrief(buildPacketAnalysis.siteBrief) ??
    buildFallbackSiteBrief(params.fallback)
  );
}

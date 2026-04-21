import type { Lang } from '@/lib/packages';

export type PreviewRequestRecord = {
  id: string;
  owner_name: string;
  email: string | null;
  phone: string;
  restaurant_name: string;
  city: string;
  preferred_language: Lang;
  source: string;
  status: string;
  notes: string | null;
  instagram_url: string | null;
  google_url: string | null;
  website_url: string | null;
  client_slug: string;
};

export type IntakeRecord = {
  address?: string | null;
  neighborhood?: string | null;
  cuisine?: string | null;
  current_website?: string | null;
  google_business_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  menu_url?: string | null;
  ordering_url?: string | null;
  reservations_url?: string | null;
  domain_status?: string | null;
  launch_urgency?: string | null;
  brand_style?: string | null;
  brand_notes?: string | null;
  ideal_guest?: string | null;
  differentiators?: string | null;
  owner_goals?: string | null;
  hours?: unknown;
  menu_notes?: unknown;
  feature_requests?: unknown;
  asset_links?: unknown;
};

export const FEATURE_OPTIONS = [
  'Digital menu',
  'WhatsApp contact',
  'Google Maps/directions',
  'Reservations',
  'Online ordering',
  'Catering/private events',
  'Photo gallery',
  'Reviews/social proof',
  'Spanish + English pages',
  'Local SEO',
];

export const STYLE_OPTIONS = [
  'Premium, elegant, date-night',
  'Warm, local, neighborhood favorite',
  'Bold, colorful, energetic',
  'Clean, modern, minimal',
  'Family-friendly and approachable',
  'Nightlife, cocktails, late-night energy',
  'Fast casual, simple, high-conversion',
  'Traditional, heritage, authentic',
];

export const FONT_MOOD_OPTIONS = [
  'Modern and clean',
  'Elegant and editorial',
  'Bold and punchy',
  'Warm and handmade',
  'Classic and traditional',
  'No preference - choose what fits',
];

export const PHOTO_DIRECTION_OPTIONS = [
  'Food should be the hero',
  'Space/interior should be the hero',
  'People and atmosphere should lead',
  'Cocktails/drinks should lead',
  'Use what you can find publicly',
  'We will upload photos',
];

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'es';
}

export function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug || 'restaurant';
}

export function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valueOrFallback(value: unknown, fallback = 'Not provided') {
  if (Array.isArray(value)) {
    const clean = value.map((item) => String(item).trim()).filter(Boolean);
    return clean.length ? clean.join(', ') : fallback;
  }

  if (typeof value === 'string') return value.trim() || fallback;
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function buildRestaurantBrief(
  request: PreviewRequestRecord,
  intake: IntakeRecord,
  fileNames: string[] = []
) {
  const featureRequests = toStringArray(intake.feature_requests);
  const assetLinks = toStringArray(intake.asset_links);
  const menuNotes = isPlainRecord(intake.menu_notes) ? intake.menu_notes : {};
  const creativeDirection = isPlainRecord(menuNotes.creativeDirection) ? menuNotes.creativeDirection : {};
  const pagePlan = isPlainRecord(menuNotes.pagePlan) ? menuNotes.pagePlan : {};
  const researchInputs = isPlainRecord(menuNotes.researchInputs) ? menuNotes.researchInputs : {};
  const lines = [
    '# Restaurant Website Build Brief',
    '',
    '## Project Snapshot',
    `Restaurant: ${request.restaurant_name}`,
    `Client slug: ${request.client_slug}`,
    `Owner/contact: ${request.owner_name} | ${request.phone}${request.email ? ` | ${request.email}` : ''}`,
    `Location: ${[intake.address, intake.neighborhood, request.city].filter(Boolean).join(', ')}`,
    `Cuisine: ${intake.cuisine ?? 'Not provided'}`,
    `Preferred language: ${request.preferred_language}`,
    '',
    '## Current Web Presence',
    `- Website: ${intake.current_website ?? request.website_url ?? 'Not provided'}`,
    `- Instagram: ${intake.instagram_url ?? request.instagram_url ?? 'Not provided'}`,
    `- Google Business: ${intake.google_business_url ?? request.google_url ?? 'Not provided'}`,
    `- Facebook: ${intake.facebook_url ?? 'Not provided'}`,
    `- Other social/research links: ${valueOrFallback(researchInputs.otherSocialLinks)}`,
    '',
    '## Menu and Operations',
    `- Menu source/link: ${intake.menu_url ?? 'Not provided'}`,
    `- Most current menu location: ${valueOrFallback(menuNotes.source)}`,
    `- Menu notes: ${valueOrFallback(menuNotes.notes)}`,
    `- Menu highlights/signature items: ${valueOrFallback(menuNotes.highlights)}`,
    `- Categories to include: ${valueOrFallback(menuNotes.categories)}`,
    `- Price accuracy: ${valueOrFallback(menuNotes.priceAccuracy)}`,
    `- Ordering: ${intake.ordering_url ?? 'Not provided'}`,
    `- Reservations: ${intake.reservations_url ?? 'Not provided'}`,
    `- Hours: ${JSON.stringify(intake.hours ?? {})}`,
    '',
    '## Visual and Brand Direction',
    `- Style: ${intake.brand_style ?? 'Not provided'}`,
    `- Brand notes: ${intake.brand_notes ?? 'Not provided'}`,
    `- Color direction: ${valueOrFallback(creativeDirection.colorNotes)}`,
    `- Font mood: ${valueOrFallback(creativeDirection.fontMood)}`,
    `- Photo direction: ${valueOrFallback(creativeDirection.photoDirection)}`,
    `- Brand voice: ${valueOrFallback(creativeDirection.brandVoice)}`,
    `- Design references: ${valueOrFallback(creativeDirection.visualReferences)}`,
    `- Avoid: ${valueOrFallback(creativeDirection.avoidStyles)}`,
    `- Ideal guest: ${intake.ideal_guest ?? 'Not provided'}`,
    `- Differentiators: ${intake.differentiators ?? 'Not provided'}`,
    '',
    '## Business Goals and Conversion',
    `- Owner goals: ${intake.owner_goals ?? request.notes ?? 'Not provided'}`,
    `- Primary customer action: ${valueOrFallback(pagePlan.primaryAction)}`,
    `- Secondary action: ${valueOrFallback(pagePlan.secondaryAction)}`,
    `- Must-have pages/sections: ${valueOrFallback(pagePlan.mustHavePages)}`,
    `- Launch notes: ${valueOrFallback(pagePlan.launchNotes)}`,
    `- Requested features: ${featureRequests.length ? featureRequests.join(', ') : 'Not provided'}`,
    `- Domain status: ${intake.domain_status ?? 'Not provided'}`,
    `- Launch urgency: ${intake.launch_urgency ?? 'Not provided'}`,
    '',
    '## Assets and Research',
    `- Uploaded files: ${fileNames.length ? fileNames.join(', ') : 'None yet'}`,
    `- Asset links: ${assetLinks.length ? assetLinks.join(', ') : 'None provided'}`,
    `- Logo status: ${valueOrFallback(researchInputs.logoStatus)}`,
    `- Photo status: ${valueOrFallback(researchInputs.photoStatus)}`,
    `- Research permission: ${valueOrFallback(researchInputs.researchPermission)}`,
    '',
    '## Builder Notes',
    '- Build a polished restaurant preview, not a generic agency template.',
    '- Prioritize mobile menu clarity, location, hours, and the primary customer action.',
    '- If assets are weak, use public research links and note any assumptions before launch.',
    '- Choose typography, color, and imagery from the visual direction above, then keep the design coherent and restaurant-specific.',
  ];

  return lines.join('\n');
}

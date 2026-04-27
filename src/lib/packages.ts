export type Lang = 'en' | 'es';

export type PackageKey = 'presencia' | 'visibilidad' | 'crecimiento';

export type ServicePackage = {
  key: PackageKey;
  name: string;
  setup: number;
  monthly: number;
  popular?: boolean;
  summary: Record<Lang, string>;
  features: Record<Lang, string[]>;
};

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    key: 'presencia',
    name: 'Presencia',
    setup: 597,
    monthly: 97,
    summary: {
      en: 'A polished restaurant website with the essentials handled.',
      es: 'Una pagina profesional con lo esencial resuelto.',
    },
    features: {
      en: [
        'Unique bilingual restaurant website',
        'Mobile-first design and hosting care',
        'Menu, hours, location, calls, and WhatsApp',
        'Launch-ready technical and local SEO foundation',
        'Customer portal with managed change requests',
      ],
      es: [
        'Pagina bilingue unica para restaurante',
        'Diseno mobile-first, hosting y mantenimiento',
        'Menu, horario, ubicacion, llamadas y WhatsApp',
        'Base tecnica de SEO local lista para lanzar',
        'Portal de cliente con solicitudes de cambios',
      ],
    },
  },
  {
    key: 'visibilidad',
    name: 'Visibilidad',
    setup: 897,
    monthly: 247,
    popular: true,
    summary: {
      en: 'For restaurants that want the site plus stronger local discovery.',
      es: 'Para restaurantes que quieren pagina y mas visibilidad local.',
    },
    features: {
      en: [
        'Everything in Presencia',
        'Self-service menu and hours editor',
        'Google Business Profile optimization',
        'Local directory citation setup',
        'Custom domain support included',
        'Monthly visibility report',
      ],
      es: [
        'Todo en Presencia',
        'Editor self-service para menu y horarios',
        'Optimizacion de Google Business Profile',
        'Configuracion de citas en directorios locales',
        'Dominio personalizado incluido',
        'Reporte mensual de visibilidad',
      ],
    },
  },
  {
    key: 'crecimiento',
    name: 'Crecimiento',
    setup: 1247,
    monthly: 597,
    summary: {
      en: 'A full-service growth layer for busy restaurant teams.',
      es: 'Servicio completo para equipos que quieren crecer sin manejarlo todo.',
    },
    features: {
      en: [
        'Everything in Visibilidad',
        'Ongoing Google Business posts',
        'Review monitoring and response support',
        'Priority updates',
        'Quarterly site and SEO review',
      ],
      es: [
        'Todo en Visibilidad',
        'Publicaciones continuas en Google Business',
        'Monitoreo y apoyo con resenas',
        'Actualizaciones prioritarias',
        'Revision trimestral de pagina y SEO',
      ],
    },
  },
];

const STRIPE_ENV_KEYS: Record<PackageKey, { setup: string; monthly: string }> = {
  presencia: {
    setup: 'STRIPE_PRICE_PRESENCIA_SETUP',
    monthly: 'STRIPE_PRICE_PRESENCIA_MONTHLY',
  },
  visibilidad: {
    setup: 'STRIPE_PRICE_VISIBILIDAD_SETUP',
    monthly: 'STRIPE_PRICE_VISIBILIDAD_MONTHLY',
  },
  crecimiento: {
    setup: 'STRIPE_PRICE_CRECIMIENTO_SETUP',
    monthly: 'STRIPE_PRICE_CRECIMIENTO_MONTHLY',
  },
};

export function getServicePackage(key: string | null): ServicePackage | null {
  return SERVICE_PACKAGES.find((pkg) => pkg.key === key) ?? null;
}

export function getStripePrices(key: PackageKey) {
  const envKeys = STRIPE_ENV_KEYS[key];
  const setupPrice = process.env[envKeys.setup]?.trim();
  const monthlyPrice = process.env[envKeys.monthly]?.trim();

  if (!setupPrice || !monthlyPrice) {
    throw new Error(`Missing Stripe price env vars: ${envKeys.setup}, ${envKeys.monthly}`);
  }

  return { setupPrice, monthlyPrice };
}

export function getDomainSetupAddonPrice() {
  const price = process.env.STRIPE_PRICE_DOMAIN_SETUP_ADDON?.trim();
  if (!price) {
    throw new Error('Missing Stripe price env var: STRIPE_PRICE_DOMAIN_SETUP_ADDON');
  }

  return price;
}

export type StripeAddOnPriceKey =
  | 'STRIPE_PRICE_BLOG_CMS_SETUP'
  | 'STRIPE_PRICE_BLOG_CMS_MONTHLY'
  | 'STRIPE_PRICE_LEAD_CONCIERGE_SETUP'
  | 'STRIPE_PRICE_LEAD_CONCIERGE_MONTHLY'
  | 'STRIPE_PRICE_ORDERING_INTEGRATION_SETUP'
  | 'STRIPE_PRICE_ORDERING_INTEGRATION_MONTHLY'
  | 'STRIPE_PRICE_RESERVATION_INTEGRATION_SETUP'
  | 'STRIPE_PRICE_RESERVATION_INTEGRATION_MONTHLY'
  | 'STRIPE_PRICE_GBP_POSTS_SETUP'
  | 'STRIPE_PRICE_GBP_POSTS_MONTHLY'
  | 'STRIPE_PRICE_CITATION_SETUP'
  | 'STRIPE_PRICE_REVIEW_SUPPORT_SETUP'
  | 'STRIPE_PRICE_REVIEW_SUPPORT_MONTHLY'
  | 'STRIPE_PRICE_GROWTH_PACK_SETUP'
  | 'STRIPE_PRICE_GROWTH_PACK_MONTHLY'
  | 'STRIPE_PRICE_CONVERSION_PACK_SETUP'
  | 'STRIPE_PRICE_CONVERSION_PACK_MONTHLY'
  | 'STRIPE_PRICE_EXPORT_BUYOUT';

export function getStripeConfiguredPrice(envKey: StripeAddOnPriceKey) {
  const price = process.env[envKey]?.trim();
  if (!price) throw new Error(`Missing Stripe price env var: ${envKey}`);
  return price;
}

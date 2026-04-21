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
        '4-5 page restaurant website',
        'Mobile-first design',
        'Menu, hours, location, and WhatsApp',
        'Basic local SEO and metadata',
        'Vercel hosting, SSL, and care',
      ],
      es: [
        'Pagina web de restaurante de 4-5 secciones',
        'Diseno mobile-first',
        'Menu, horario, ubicacion y WhatsApp',
        'SEO local basico y metadata',
        'Hosting Vercel, SSL y mantenimiento',
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
        'Editable menu/content workflow',
        'Google Business Profile optimization',
        'Local directory citation setup',
        'Monthly content refresh and report',
      ],
      es: [
        'Todo en Presencia',
        'Flujo editable para menu y contenido',
        'Optimizacion de Google Business Profile',
        'Configuracion de citas en directorios locales',
        'Actualizacion mensual y reporte',
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
  const setupPrice = process.env[envKeys.setup];
  const monthlyPrice = process.env[envKeys.monthly];

  if (!setupPrice || !monthlyPrice) {
    throw new Error(`Missing Stripe price env vars: ${envKeys.setup}, ${envKeys.monthly}`);
  }

  return { setupPrice, monthlyPrice };
}

export function getDomainSetupAddonPrice() {
  const price = process.env.STRIPE_PRICE_DOMAIN_SETUP_ADDON;
  if (!price) {
    throw new Error('Missing Stripe price env var: STRIPE_PRICE_DOMAIN_SETUP_ADDON');
  }

  return price;
}

import type { PackageKey } from '@/lib/packages';

export type AddOnKey =
  | 'custom_domain_setup'
  | 'blog_cms'
  | 'lead_concierge'
  | 'online_ordering_integration'
  | 'reservation_integration'
  | 'gbp_posts'
  | 'citation_setup'
  | 'review_support';

export type AddOnStatus =
  | 'needs_access'
  | 'in_setup'
  | 'active'
  | 'blocked'
  | 'cancelling'
  | 'cancelled';

export type IntegrationConnectionType = 'oauth' | 'delegated_access' | 'link_embed' | 'api_key';

export type PlatformProviderCategory =
  | 'llm'
  | 'crawler'
  | 'search'
  | 'agent_runtime'
  | 'code_quality'
  | 'qa_testing'
  | 'deployment'
  | 'analytics'
  | 'messaging'
  | 'cms'
  | 'image'
  | 'business_profile'
  | 'ordering'
  | 'reservations'
  | 'project_management';

export type ProviderSurface = 'admin_platform' | 'customer_project' | 'both_contextual';

export type ProviderOperationalStatus = 'wired' | 'connectable' | 'local_tool' | 'coming_soon' | 'hidden';

export type ProviderTestMode = 'live_api' | 'oauth_api' | 'local_runner' | 'checklist';

export type AddOnCatalogItem = {
  key: AddOnKey;
  name: string;
  setup: number;
  monthly: number;
  category: 'growth' | 'conversion' | 'operations';
  eligibility: PackageKey[];
  includedIn: PackageKey[];
  connectionType: IntegrationConnectionType;
  description: string;
};

export type AddOnBundle = {
  key: 'growth_pack' | 'conversion_pack';
  name: string;
  setup: number;
  monthly: number;
  addOns: AddOnKey[];
  eligibility: PackageKey[];
};

export type PlanCapability =
  | 'bilingual_site'
  | 'technical_local_seo'
  | 'customer_portal'
  | 'analytics_tracking'
  | 'menu_hours_self_edit'
  | 'custom_domain_included'
  | 'google_business_optimization'
  | 'citation_setup_included'
  | 'portal_reports'
  | 'gbp_posts_included'
  | 'review_support_included'
  | 'priority_updates'
  | 'quarterly_review';

export type Entitlement = {
  plan: PackageKey | null;
  capabilities: Record<PlanCapability, boolean>;
  activeAddOns: AddOnKey[];
};

export type ProviderDefinition = {
  key: string;
  name: string;
  category: PlatformProviderCategory;
  connectionType: IntegrationConnectionType;
  preferredConnectionType?: IntegrationConnectionType;
  supportsOAuth?: boolean;
  supportsApiKey?: boolean;
  supportsGuidedSetup?: boolean;
  envKeys?: string[];
  credentialGuide?: string;
  visibility: 'admin' | 'customer' | 'both';
  status: 'active' | 'planned';
  requiredPlan?: PackageKey[];
  signupUrl?: string;
  apiKeyUrl?: string;
  surface?: ProviderSurface;
  operationalStatus?: ProviderOperationalStatus;
  usedBy?: string[];
  requiredConfig?: string[];
  testMode?: ProviderTestMode;
  notes: string;
};

export const ADD_ON_CATALOG: AddOnCatalogItem[] = [
  {
    key: 'custom_domain_setup',
    name: 'Custom Domain Setup',
    setup: 197,
    monthly: 0,
    category: 'operations',
    eligibility: ['presencia'],
    includedIn: ['visibilidad', 'crecimiento'],
    connectionType: 'delegated_access',
    description: 'Connect and verify a restaurant-owned custom domain.',
  },
  {
    key: 'blog_cms',
    name: 'Blog/CMS',
    setup: 397,
    monthly: 49,
    category: 'growth',
    eligibility: ['visibilidad', 'crecimiento'],
    includedIn: [],
    connectionType: 'oauth',
    description: 'Sanity-backed news/blog publishing workflow without included writing services.',
  },
  {
    key: 'lead_concierge',
    name: 'Sabor Lead Concierge',
    setup: 497,
    monthly: 97,
    category: 'conversion',
    eligibility: ['visibilidad', 'crecimiento'],
    includedIn: [],
    connectionType: 'api_key',
    description: 'Scoped restaurant chatbot for FAQs, menu, hours, links, and lead capture.',
  },
  {
    key: 'online_ordering_integration',
    name: 'Online Ordering Integration',
    setup: 297,
    monthly: 39,
    category: 'conversion',
    eligibility: ['visibilidad', 'crecimiento'],
    includedIn: [],
    connectionType: 'link_embed',
    description: 'Polished links or embeds for customer-owned ordering providers.',
  },
  {
    key: 'reservation_integration',
    name: 'Reservation Integration',
    setup: 297,
    monthly: 39,
    category: 'conversion',
    eligibility: ['visibilidad', 'crecimiento'],
    includedIn: [],
    connectionType: 'link_embed',
    description: 'Polished links, embeds, or request forms for reservation workflows.',
  },
  {
    key: 'gbp_posts',
    name: 'Google Business Posts',
    setup: 197,
    monthly: 149,
    category: 'growth',
    eligibility: ['visibilidad'],
    includedIn: ['crecimiento'],
    connectionType: 'oauth',
    description: 'Ongoing Google Business Profile post workflow.',
  },
  {
    key: 'citation_setup',
    name: 'Citation Setup',
    setup: 397,
    monthly: 0,
    category: 'growth',
    eligibility: ['presencia'],
    includedIn: ['visibilidad', 'crecimiento'],
    connectionType: 'delegated_access',
    description: 'One-time local directory citation setup.',
  },
  {
    key: 'review_support',
    name: 'Review Support',
    setup: 197,
    monthly: 197,
    category: 'growth',
    eligibility: ['visibilidad'],
    includedIn: ['crecimiento'],
    connectionType: 'oauth',
    description: 'Review monitoring and response support workflow.',
  },
];

export const ADD_ON_BUNDLES: AddOnBundle[] = [
  {
    key: 'growth_pack',
    name: 'Growth Pack',
    setup: 897,
    monthly: 347,
    addOns: ['blog_cms', 'gbp_posts', 'review_support', 'citation_setup'],
    eligibility: ['visibilidad', 'crecimiento'],
  },
  {
    key: 'conversion_pack',
    name: 'Conversion Pack',
    setup: 897,
    monthly: 149,
    addOns: ['lead_concierge', 'online_ordering_integration', 'reservation_integration'],
    eligibility: ['visibilidad', 'crecimiento'],
  },
];

const BASE_CAPABILITIES: Record<PlanCapability, boolean> = {
  bilingual_site: true,
  technical_local_seo: true,
  customer_portal: true,
  analytics_tracking: true,
  menu_hours_self_edit: false,
  custom_domain_included: false,
  google_business_optimization: false,
  citation_setup_included: false,
  portal_reports: false,
  gbp_posts_included: false,
  review_support_included: false,
  priority_updates: false,
  quarterly_review: false,
};

export const PLAN_CAPABILITIES: Record<PackageKey, Record<PlanCapability, boolean>> = {
  presencia: BASE_CAPABILITIES,
  visibilidad: {
    ...BASE_CAPABILITIES,
    menu_hours_self_edit: true,
    custom_domain_included: true,
    google_business_optimization: true,
    citation_setup_included: true,
    portal_reports: true,
  },
  crecimiento: {
    ...BASE_CAPABILITIES,
    menu_hours_self_edit: true,
    custom_domain_included: true,
    google_business_optimization: true,
    citation_setup_included: true,
    portal_reports: true,
    gbp_posts_included: true,
    review_support_included: true,
    priority_updates: true,
    quarterly_review: true,
  },
};

function provider(definition: ProviderDefinition): ProviderDefinition {
  return {
    ...definition,
    preferredConnectionType: definition.preferredConnectionType ?? definition.connectionType,
    supportsOAuth: definition.supportsOAuth ?? definition.connectionType === 'oauth',
    supportsApiKey: definition.supportsApiKey ?? definition.connectionType === 'api_key',
    supportsGuidedSetup: definition.supportsGuidedSetup ?? ['delegated_access', 'link_embed'].includes(definition.connectionType),
    surface: definition.surface ?? (definition.visibility === 'customer' ? 'customer_project' : definition.visibility === 'both' ? 'both_contextual' : 'admin_platform'),
    operationalStatus: definition.operationalStatus ?? (definition.status === 'active' ? 'connectable' : 'coming_soon'),
    usedBy: definition.usedBy ?? [],
    requiredConfig: definition.requiredConfig ?? definition.envKeys ?? [],
    testMode: definition.testMode ?? (definition.connectionType === 'oauth' ? 'oauth_api' : definition.connectionType === 'api_key' ? 'live_api' : 'checklist'),
  };
}

export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  provider({ key: 'openai', name: 'OpenAI', category: 'llm', connectionType: 'api_key', envKeys: ['OPENAI_API_KEY'], credentialGuide: 'Paste an OpenAI project API key. Env fallback is supported for server bootstrap.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://platform.openai.com/signup', apiKeyUrl: 'https://platform.openai.com/api-keys', usedBy: ['Build packets', 'Site specs', 'QA summaries', 'Moderation assists'], notes: 'Default AI provider for interpretation, build-packet generation, structured site specs, and agent summaries.' }),
  provider({ key: 'anthropic', name: 'Anthropic', category: 'llm', connectionType: 'api_key', envKeys: ['ANTHROPIC_API_KEY'], credentialGuide: 'Paste an Anthropic API key when you are ready to route tasks to Claude models.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'connectable', signupUrl: 'https://console.anthropic.com/', apiKeyUrl: 'https://console.anthropic.com/settings/keys', usedBy: ['Future model routing'], notes: 'Provider-ready fallback for future task-specific Claude routing.' }),
  provider({ key: 'apify', name: 'Apify', category: 'crawler', connectionType: 'api_key', envKeys: ['APIFY_API_TOKEN'], credentialGuide: 'Paste an Apify API token. Env fallback is supported for initial crawler bootstrap.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://console.apify.com/sign-up', apiKeyUrl: 'https://console.apify.com/account/integrations', usedBy: ['Research runs', 'Source discovery', 'Crawl artifacts'], notes: 'Primary crawl and research provider for restaurant source discovery.' }),
  provider({ key: 'firecrawl', name: 'Firecrawl', category: 'crawler', connectionType: 'api_key', envKeys: ['FIRECRAWL_API_KEY'], credentialGuide: 'Paste a Firecrawl API key when you want to enable it as a crawl/markdown extraction provider.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://www.firecrawl.dev/app/sign-up', apiKeyUrl: 'https://www.firecrawl.dev/app/api-keys', usedBy: ['Markdown extraction', 'Seed URL scrape', 'Research fallback'], notes: 'Complementary page extraction and crawl fallback for research runs.' }),
  provider({ key: 'google_maps_places', name: 'Google Maps & Places', category: 'search', connectionType: 'api_key', envKeys: ['GOOGLE_MAPS_API_KEY'], credentialGuide: 'Paste a Google Maps Platform API key with Places API enabled.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://console.cloud.google.com/google/maps-apis/start', apiKeyUrl: 'https://console.cloud.google.com/apis/credentials', usedBy: ['Places enrichment', 'Address/hours candidates', 'Local facts'], notes: 'SaborWeb-owned Google Places enrichment for restaurant research.' }),
  provider({ key: 'meta_research_session', name: 'Meta Research Session', category: 'agent_runtime', connectionType: 'delegated_access', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'connectable', usedBy: ['Facebook/Instagram research', 'Authenticated social screenshots', 'Social asset review'], notes: 'Encrypted session state for a dedicated SaborWeb Facebook/Instagram research account. Use this only for controlled social research support.' }),
  provider({ key: 'browserbase', name: 'Browserbase', category: 'agent_runtime', connectionType: 'api_key', envKeys: ['BROWSERBASE_API_KEY'], credentialGuide: 'Paste a Browserbase API key if hosted browser sessions are needed for agents.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://www.browserbase.com/sign-up', apiKeyUrl: 'https://www.browserbase.com/dashboard/settings', usedBy: ['Hosted browser sessions'], notes: 'Optional hosted browser runtime, hidden until enabled/configured.' }),
  provider({ key: 'stagehand', name: 'Stagehand', category: 'agent_runtime', connectionType: 'api_key', envKeys: ['BROWSERBASE_API_KEY'], visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://www.browserbase.com/sign-up', apiKeyUrl: 'https://www.browserbase.com/dashboard/settings', usedBy: ['Browser automation'], notes: 'Optional browser automation layer, hidden until Browserbase-style workflows are enabled.' }),
  provider({ key: 'playwright', name: 'Playwright', category: 'qa_testing', connectionType: 'delegated_access', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'local_tool', testMode: 'local_runner', signupUrl: 'https://playwright.dev/docs/intro', usedBy: ['Preview smoke tests', 'Screenshot checks'], notes: 'Internal browser QA runner for generated-site smoke checks and screenshots.' }),
  provider({ key: 'lighthouse', name: 'Lighthouse', category: 'qa_testing', connectionType: 'delegated_access', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'local_tool', testMode: 'local_runner', signupUrl: 'https://developer.chrome.com/docs/lighthouse/overview', usedBy: ['SEO checks', 'Performance checks'], notes: 'Internal performance, accessibility, SEO, and best-practice audit signal.' }),
  provider({ key: 'axe', name: 'Axe Accessibility', category: 'qa_testing', connectionType: 'delegated_access', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'local_tool', testMode: 'local_runner', signupUrl: 'https://www.deque.com/axe/', usedBy: ['Accessibility checks', 'Pre-release QA'], notes: 'Internal accessibility checks before preview release and production publish.' }),
  provider({ key: 'screenshotone', name: 'ScreenshotOne', category: 'qa_testing', connectionType: 'api_key', envKeys: ['SCREENSHOTONE_API_KEY'], credentialGuide: 'Paste a ScreenshotOne API key if external screenshot capture is needed.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'connectable', signupUrl: 'https://screenshotone.com/signup/', apiKeyUrl: 'https://screenshotone.com/access/', usedBy: ['External screenshots', 'QA artifacts'], notes: 'Optional fallback screenshot capture service for QA artifacts and customer reports.' }),
  provider({ key: 'github_actions', name: 'GitHub Actions', category: 'code_quality', connectionType: 'delegated_access', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'coming_soon', signupUrl: 'https://github.com/features/actions', usedBy: ['CI status', 'Build validation'], notes: 'GitHub Actions will be read through the main GitHub OAuth connection. No separate OAuth connection is needed for this card.' }),
  provider({ key: 'sentry', name: 'Sentry', category: 'code_quality', connectionType: 'api_key', envKeys: ['SENTRY_AUTH_TOKEN'], credentialGuide: 'Paste a Sentry auth token, then record org/project in notes or setup URL until dedicated fields are added.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://sentry.io/signup/', apiKeyUrl: 'https://sentry.io/settings/account/api/auth-tokens/', usedBy: ['Error monitoring', 'Agent/runtime diagnostics'], notes: 'Error monitoring for platform routes, agents, webhooks, and generated site runtime issues.' }),
  provider({ key: 'vercel', name: 'Vercel', category: 'deployment', connectionType: 'api_key', envKeys: ['VERCEL_API_TOKEN'], credentialGuide: 'Paste a Vercel API token only if replacing env bootstrap. Team/project IDs can live in public config/notes.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://vercel.com/signup', apiKeyUrl: 'https://vercel.com/account/settings/tokens', usedBy: ['Preview deployments', 'Production publishing', 'Env checks'], notes: 'Preview and production deployment orchestration.' }),
  provider({ key: 'github', name: 'GitHub', category: 'deployment', connectionType: 'oauth', envKeys: ['GITHUB_OAUTH_CLIENT_ID', 'GITHUB_OAUTH_CLIENT_SECRET'], credentialGuide: 'Connect GitHub with OAuth. Use an OAuth app for now; migrate to a GitHub App when branch automation needs finer repository permissions.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://github.com/signup', usedBy: ['Branch automation', 'Build handoff PRs'], notes: 'Branch/workspace automation and code review flow.' }),
  provider({ key: 'cloudflare', name: 'Cloudflare for SaaS', category: 'deployment', connectionType: 'api_key', envKeys: ['CLOUDFLARE_API_TOKEN'], credentialGuide: 'Paste a limited-scope Cloudflare API token for custom hostname automation.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'connectable', signupUrl: 'https://dash.cloudflare.com/sign-up', apiKeyUrl: 'https://dash.cloudflare.com/profile/api-tokens', usedBy: ['Custom hostnames', 'SSL/DNS automation'], notes: 'Future custom hostname, SSL, and DNS automation provider.' }),
  provider({ key: 'asana', name: 'Asana', category: 'project_management', connectionType: 'api_key', envKeys: ['ASANA_ACCESS_TOKEN'], credentialGuide: 'Paste an Asana personal access token only if replacing env bootstrap.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://app.asana.com/-/signup', apiKeyUrl: 'https://app.asana.com/0/my-apps', usedBy: ['Milestone tracking', 'Blocker tasks'], notes: 'Internal implementation and milestone tracking.' }),
  provider({ key: 'resend', name: 'Resend', category: 'messaging', connectionType: 'api_key', envKeys: ['RESEND_API_KEY'], credentialGuide: 'Paste a Resend API key only if replacing env bootstrap for transactional email.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://resend.com/signup', apiKeyUrl: 'https://resend.com/api-keys', usedBy: ['Owner emails', 'Admin alerts', 'Preview follow-up'], notes: 'Transactional owner/admin emails.' }),
  provider({ key: 'twilio', name: 'Twilio', category: 'messaging', connectionType: 'api_key', envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], credentialGuide: 'Enter the Twilio account SID, auth token, and sending phone number.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'coming_soon', signupUrl: 'https://www.twilio.com/try-twilio', apiKeyUrl: 'https://console.twilio.com/us1/account/keys-credentials/api-keys', usedBy: ['Future SMS', 'Future WhatsApp'], notes: 'Future SMS and WhatsApp automation.' }),
  provider({ key: 'google_business_profile', name: 'Google Business Profile', category: 'business_profile', connectionType: 'oauth', envKeys: ['GOOGLE_WEB_OAUTH_CLIENT_ID', 'GOOGLE_WEB_OAUTH_CLIENT_SECRET'], visibility: 'both', surface: 'both_contextual', status: 'active', operationalStatus: 'wired', signupUrl: 'https://business.google.com/', usedBy: ['SaborWeb GBP', 'Local SEO workflows', 'Future owner GBP'], notes: 'Admin connection manages SaborWeb-owned local visibility workflows; customer connections happen per project later.' }),
  provider({ key: 'google_search_console', name: 'Google Search Console', category: 'analytics', connectionType: 'oauth', envKeys: ['GOOGLE_WEB_OAUTH_CLIENT_ID', 'GOOGLE_WEB_OAUTH_CLIENT_SECRET'], visibility: 'both', surface: 'both_contextual', status: 'active', operationalStatus: 'wired', signupUrl: 'https://search.google.com/search-console', usedBy: ['SaborWeb search visibility', 'Indexing checks', 'Future owner reports'], notes: 'Admin connection manages platform properties; customer properties connect per project later.' }),
  provider({ key: 'google_analytics', name: 'Google Analytics', category: 'analytics', connectionType: 'oauth', envKeys: ['GOOGLE_WEB_OAUTH_CLIENT_ID', 'GOOGLE_WEB_OAUTH_CLIENT_SECRET'], visibility: 'both', surface: 'both_contextual', status: 'active', operationalStatus: 'wired', signupUrl: 'https://analytics.google.com/analytics/web/', usedBy: ['Platform analytics', 'Funnel metrics', 'Future reports'], notes: 'Admin connection manages SaborWeb analytics; restaurant-owned reporting connects per project later.' }),
  provider({ key: 'google_tag_manager', name: 'Google Tag Manager', category: 'analytics', connectionType: 'oauth', envKeys: ['GOOGLE_WEB_OAUTH_CLIENT_ID', 'GOOGLE_WEB_OAUTH_CLIENT_SECRET'], visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://tagmanager.google.com/', usedBy: ['Platform tracking', 'Conversion instrumentation'], notes: 'Admin-only tracking container and conversion instrumentation. Restaurant owners do not manage GTM.' }),
  provider({ key: 'posthog', name: 'PostHog', category: 'analytics', connectionType: 'api_key', envKeys: ['POSTHOG_API_KEY'], credentialGuide: 'Paste a PostHog project API key if feature flags/session replay become active.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'connectable', signupUrl: 'https://us.posthog.com/signup', apiKeyUrl: 'https://us.posthog.com/project/settings', usedBy: ['Product analytics', 'Feature flags', 'Session diagnostics'], notes: 'Optional product analytics, feature flags, and session replay.' }),
  provider({ key: 'sanity', name: 'Sanity', category: 'cms', connectionType: 'api_key', envKeys: ['SANITY_PROJECT_ID', 'SANITY_API_TOKEN'], credentialGuide: 'Enter the Sanity project ID, dataset, and API token.', visibility: 'both', surface: 'customer_project', status: 'planned', operationalStatus: 'coming_soon', signupUrl: 'https://www.sanity.io/get-started', apiKeyUrl: 'https://www.sanity.io/manage', usedBy: ['Blog/CMS add-on'], notes: 'Blog/CMS add-on content backend managed per customer/project later.' }),
  provider({ key: 'cloudinary', name: 'Cloudinary', category: 'image', connectionType: 'api_key', envKeys: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'], credentialGuide: 'Enter Cloudinary cloud name, API key, and API secret from the Cloudinary API Keys page.', visibility: 'admin', surface: 'admin_platform', status: 'active', operationalStatus: 'wired', signupUrl: 'https://cloudinary.com/users/register_free', apiKeyUrl: 'https://console.cloudinary.com/settings/api-keys', usedBy: ['Asset storage', 'Image transformations', 'Preview media'], notes: 'Approved asset storage, image optimization, transformations, and delivery.' }),
  provider({ key: 'uploadcare', name: 'Uploadcare', category: 'image', connectionType: 'api_key', envKeys: ['UPLOADCARE_PUBLIC_KEY', 'UPLOADCARE_SECRET_KEY'], credentialGuide: 'Enter the Uploadcare public key and secret key.', visibility: 'admin', surface: 'admin_platform', status: 'planned', operationalStatus: 'coming_soon', signupUrl: 'https://app.uploadcare.com/accounts/signup/', apiKeyUrl: 'https://app.uploadcare.com/projects/-/api-keys', usedBy: ['Alternate uploads'], notes: 'Alternate upload, CDN, and image optimization provider.' }),
  provider({ key: 'toast', name: 'Toast', category: 'ordering', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://pos.toasttab.com/request-demo', usedBy: ['Customer ordering links'], notes: 'Customer-owned online ordering integration managed per project.' }),
  provider({ key: 'square', name: 'Square', category: 'ordering', connectionType: 'oauth', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', supportsGuidedSetup: true, signupUrl: 'https://squareup.com/signup', usedBy: ['Customer POS/ordering'], notes: 'Customer-owned ordering or POS integration managed per project.' }),
  provider({ key: 'clover', name: 'Clover', category: 'ordering', connectionType: 'oauth', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', supportsGuidedSetup: true, signupUrl: 'https://www.clover.com/get-started', usedBy: ['Customer POS/ordering'], notes: 'Customer-owned ordering or POS integration managed per project.' }),
  provider({ key: 'chownow', name: 'ChowNow', category: 'ordering', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://get.chownow.com/', usedBy: ['Customer ordering links'], notes: 'Customer-owned direct ordering integration managed per project.' }),
  provider({ key: 'doordash', name: 'DoorDash', category: 'ordering', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://get.doordash.com/en-us/products/marketplace', usedBy: ['Customer ordering links'], notes: 'Marketplace ordering link integration managed per project.' }),
  provider({ key: 'ubereats', name: 'Uber Eats', category: 'ordering', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://merchants.ubereats.com/', usedBy: ['Customer ordering links'], notes: 'Marketplace ordering link integration managed per project.' }),
  provider({ key: 'opentable', name: 'OpenTable', category: 'reservations', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://restaurant.opentable.com/get-started', usedBy: ['Customer reservations'], notes: 'Reservation widget or link integration managed per project.' }),
  provider({ key: 'resy', name: 'Resy', category: 'reservations', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://resyos.com/', usedBy: ['Customer reservations'], notes: 'Reservation link/widget integration managed per project.' }),
  provider({ key: 'tock', name: 'Tock', category: 'reservations', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://www.exploretock.com/join', usedBy: ['Customer reservations'], notes: 'Reservations, ticketing, and experiences integration managed per project.' }),
  provider({ key: 'sevenrooms', name: 'SevenRooms', category: 'reservations', connectionType: 'link_embed', visibility: 'customer', surface: 'customer_project', status: 'planned', operationalStatus: 'hidden', signupUrl: 'https://sevenrooms.com/get-a-demo/', usedBy: ['Customer reservations'], notes: 'Premium reservations/CRM integration managed per project.' }),
];

export function getAdminPlatformProviders() {
  return PROVIDER_REGISTRY.filter((provider) => {
    if (provider.operationalStatus === 'hidden') return false;
    return provider.surface === 'admin_platform' || provider.surface === 'both_contextual';
  });
}

export function getCustomerProjectProviders() {
  return PROVIDER_REGISTRY.filter((provider) => provider.surface === 'customer_project' || provider.surface === 'both_contextual');
}

export function getAddOn(key: string | null | undefined) {
  return ADD_ON_CATALOG.find((addOn) => addOn.key === key) ?? null;
}

export function getBundle(key: string | null | undefined) {
  return ADD_ON_BUNDLES.find((bundle) => bundle.key === key) ?? null;
}

export function addOnIsIncluded(plan: PackageKey | null | undefined, addOnKey: AddOnKey) {
  if (!plan) return false;
  return getAddOn(addOnKey)?.includedIn.includes(plan) ?? false;
}

export function addOnIsEligible(plan: PackageKey | null | undefined, addOnKey: AddOnKey) {
  if (!plan) return false;
  const addOn = getAddOn(addOnKey);
  return Boolean(addOn && (addOn.eligibility.includes(plan) || addOn.includedIn.includes(plan)));
}

export function getEntitlement(plan: PackageKey | null | undefined, activeAddOns: AddOnKey[] = []): Entitlement {
  const capabilities = plan ? { ...PLAN_CAPABILITIES[plan] } : { ...BASE_CAPABILITIES };
  const uniqueAddOns = [...new Set(activeAddOns)];

  if (uniqueAddOns.includes('custom_domain_setup')) capabilities.custom_domain_included = true;
  if (uniqueAddOns.includes('citation_setup')) capabilities.citation_setup_included = true;
  if (uniqueAddOns.includes('gbp_posts')) capabilities.gbp_posts_included = true;
  if (uniqueAddOns.includes('review_support')) capabilities.review_support_included = true;

  return {
    plan: plan ?? null,
    capabilities,
    activeAddOns: uniqueAddOns,
  };
}

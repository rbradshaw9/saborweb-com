import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  KeyRound,
  PlugZap,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react';
import { getAdminIntegrationsData, type AdminIntegrationConnection, type AdminIntegrationStatus } from '@/lib/admin/integrations';
import type { PlatformProviderCategory } from '@/lib/platform/catalog';
import { IntegrationTestButton } from './IntegrationTestButton';
import {
  completeMetaResearchSessionCapture,
  createIntegrationConnection,
  importEnvBackedIntegrations,
  reconnectIntegrationConnection,
  removeIntegrationConnection,
  startMetaResearchSessionCapture,
} from './actions';

type IntegrationGroupKey = 'ai' | 'research' | 'assets' | 'deploy' | 'messaging' | 'monitoring' | 'analytics' | 'project_ops' | 'qa';

const GROUPS: Array<{
  key: IntegrationGroupKey;
  title: string;
  note: string;
  categories: PlatformProviderCategory[];
}> = [
  {
    key: 'ai',
    title: 'AI',
    note: 'Model providers that turn research and intake data into build packets, site specs, QA notes, and moderation decisions.',
    categories: ['llm'],
  },
  {
    key: 'research',
    title: 'Research',
    note: 'Crawlers, search providers, and local data sources that discover restaurant facts and source URLs.',
    categories: ['crawler', 'search', 'business_profile'],
  },
  {
    key: 'assets',
    title: 'Assets',
    note: 'Image storage, transformation, upload, and media delivery services.',
    categories: ['image', 'cms'],
  },
  {
    key: 'deploy',
    title: 'Deploy',
    note: 'Code, preview deployments, production publishing, domains, and release automation.',
    categories: ['deployment'],
  },
  {
    key: 'messaging',
    title: 'Messaging',
    note: 'Owner follow-up, preview release emails, admin alerts, and future SMS/WhatsApp flows.',
    categories: ['messaging'],
  },
  {
    key: 'monitoring',
    title: 'Monitoring',
    note: 'Runtime errors, CI signal, product analytics, and operational diagnostics.',
    categories: ['code_quality'],
  },
  {
    key: 'analytics',
    title: 'Analytics',
    note: 'SaborWeb-owned analytics, indexing checks, search visibility, and platform tracking.',
    categories: ['analytics'],
  },
  {
    key: 'project_ops',
    title: 'Project Ops',
    note: 'Internal project tracking and milestone updates.',
    categories: ['project_management'],
  },
  {
    key: 'qa',
    title: 'QA',
    note: 'Internal release checks that validate generated previews before admin approval.',
    categories: ['qa_testing', 'agent_runtime'],
  },
];

const BRAND_COLORS: Record<string, string> = {
  openai: '#111827',
  anthropic: '#b45f3a',
  apify: '#2563eb',
  firecrawl: '#dc2626',
  google_maps_places: '#4285f4',
  meta_research_session: '#0866ff',
  browserbase: '#4f46e5',
  stagehand: '#4f46e5',
  playwright: '#2f7d32',
  lighthouse: '#f97316',
  axe: '#6d28d9',
  screenshotone: '#0f766e',
  github_actions: '#24292f',
  sentry: '#362d59',
  vercel: '#111111',
  github: '#24292f',
  cloudflare: '#f38020',
  asana: '#f06a6a',
  resend: '#111827',
  twilio: '#f22f46',
  google_business_profile: '#4285f4',
  google_search_console: '#34a853',
  google_analytics: '#f9ab00',
  google_tag_manager: '#246fdb',
  posthog: '#f54e00',
  sanity: '#f03e2f',
  cloudinary: '#3448c5',
  uploadcare: '#111827',
  toast: '#f97316',
  square: '#111827',
  clover: '#16a34a',
  chownow: '#e11d48',
  doordash: '#eb1700',
  ubereats: '#06c167',
  opentable: '#da3743',
  resy: '#111827',
  tock: '#7c3aed',
  sevenrooms: '#0f172a',
};

const BRAND_INITIALS: Record<string, string> = {
  openai: 'AI',
  google_business_profile: 'GB',
  google_search_console: 'SC',
  google_analytics: 'GA',
  google_tag_manager: 'GT',
  google_maps_places: 'GM',
  github_actions: 'GH',
  screenshotone: 'S1',
  ubereats: 'UE',
  sevenrooms: '7R',
};

function providerColor(providerKey: string) {
  return BRAND_COLORS[providerKey] ?? '#d95f43';
}

function providerInitials(provider: AdminIntegrationStatus) {
  if (BRAND_INITIALS[provider.key]) return BRAND_INITIALS[provider.key];
  return provider.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function providerConnection(provider: AdminIntegrationStatus) {
  if (provider.operationalStatus === 'local_tool') return null;
  return provider.connections.find((connection) => connection.status === 'connected') ?? provider.connections[0] ?? null;
}

function statusTone(provider: AdminIntegrationStatus) {
  if (provider.operationalStatus === 'local_tool') return 'admin-pill admin-pill--success';
  if (provider.connections.some((connection) => connection.status === 'connected')) return 'admin-pill admin-pill--success';
  if (provider.connections.length) return 'admin-pill admin-pill--ready';
  if (provider.operationalStatus === 'coming_soon') return 'admin-pill admin-pill--neutral';
  if (provider.status === 'planned') return 'admin-pill admin-pill--neutral';
  return 'admin-pill admin-pill--warn';
}

function statusLabel(provider: AdminIntegrationStatus) {
  if (provider.operationalStatus === 'local_tool') return 'Built in';
  if (provider.connections.some((connection) => connection.status === 'connected')) return 'Connected';
  if (provider.connections.length) return 'Needs setup';
  if (provider.key === 'github_actions') return 'Uses GitHub';
  if (provider.operationalStatus === 'coming_soon') return 'Planned';
  if (provider.status === 'planned') return 'Ready to connect';
  return 'Not connected';
}

function connectionName(connection: AdminIntegrationConnection | null) {
  if (!connection) return null;
  const label = connection.public_config.label;
  return typeof label === 'string' && label.trim() ? label : connection.connection_type.replaceAll('_', ' ');
}

function credentialSource(provider: AdminIntegrationStatus, connection: AdminIntegrationConnection | null) {
  if (provider.operationalStatus === 'local_tool') return 'Built-in runner';
  if (connection?.metadata.credential_source === 'server_env') return 'Using server env';
  if (connection?.has_credentials) return 'Encrypted key saved';
  if (provider.supportsOAuth) return 'OAuth preferred';
  if (provider.supportsApiKey) return 'Key required';
  return 'Guided setup';
}

function methodLabel(provider: AdminIntegrationStatus) {
  if (provider.operationalStatus === 'local_tool') return 'Built in';
  const method = defaultMethod(provider);
  if (method === 'oauth') return 'OAuth';
  if (method === 'api_key') return 'API key';
  if (method === 'link_embed') return 'Link / embed';
  return 'Guided setup';
}

function providerUseCase(provider: AdminIntegrationStatus) {
  if (provider.category === 'llm') return 'AI reasoning, interpretation, QA notes, and build-packet generation.';
  if (provider.category === 'crawler') return 'Restaurant research, crawl jobs, extracted source material, and missing-info discovery.';
  if (provider.category === 'search') return 'Restaurant search enrichment, local facts, source discovery, and missing-info research.';
  if (provider.category === 'agent_runtime') return 'Hosted browsing and automation support for agents that need to interact with web pages.';
  if (provider.category === 'qa_testing') return 'Preview QA, screenshots, accessibility checks, SEO checks, and release confidence.';
  if (provider.category === 'code_quality') return 'Engineering checks, runtime monitoring, and issue visibility.';
  if (provider.category === 'deployment') return 'Preview deployments, production publishing, domains, and release automation.';
  if (provider.category === 'project_management') return 'Internal task tracking and project/milestone updates.';
  if (provider.category === 'messaging') return 'Transactional email, owner follow-up, and future SMS/WhatsApp workflows.';
  if (provider.category === 'business_profile') return 'Local visibility, Google profile access, posts, reviews, and location data.';
  if (provider.category === 'analytics') return 'Tracking, search visibility, reporting, and customer performance insights.';
  if (provider.category === 'cms') return 'Blog/news content management and CMS-backed add-ons.';
  if (provider.category === 'image') return 'Uploads, image optimization, transformations, and asset delivery.';
  if (provider.category === 'ordering') return 'Online ordering links, embeds, and provider account connections for restaurant sites.';
  if (provider.category === 'reservations') return 'Reservation links, widgets, and booking-provider handoff for restaurant sites.';
  return provider.notes;
}

function operationalLabel(provider: AdminIntegrationStatus) {
  if (provider.operationalStatus === 'wired') return 'Wired to workflow';
  if (provider.operationalStatus === 'local_tool') return 'Runs from the SaborWeb worker/CI without a third-party account';
  if (provider.operationalStatus === 'connectable') return 'Connectable now';
  if (provider.operationalStatus === 'coming_soon') return 'Planned';
  return 'Hidden';
}

function setupLinkLabel(provider: AdminIntegrationStatus) {
  if (provider.connectionType === 'delegated_access') return 'Setup guide';
  if (provider.connectionType === 'link_embed') return 'Provider site';
  return 'Sign up';
}

function SetupLinks({ provider, isConnected }: { provider: AdminIntegrationStatus; isConnected: boolean }) {
  if (isConnected) return null;
  const showApiLink = Boolean(provider.apiKeyUrl && provider.supportsApiKey && !provider.supportsOAuth);

  if (!provider.signupUrl && !showApiLink) return null;

  return (
    <div className="admin-setup-links">
      {provider.signupUrl && (
        <a className="admin-setup-link" href={provider.signupUrl} rel="noreferrer" target="_blank">
          <ExternalLink size={13} />
          {setupLinkLabel(provider)}
        </a>
      )}
      {showApiLink && (
        <a className="admin-setup-link" href={provider.apiKeyUrl} rel="noreferrer" target="_blank">
          <KeyRound size={13} />
          API key page
        </a>
      )}
    </div>
  );
}

function primaryActionLabel(provider: AdminIntegrationStatus) {
  const connection = providerConnection(provider);
  if (connection?.status === 'connected') return 'Test connection';
  if (connection) return 'Continue setup';
  const method = provider.preferredConnectionType ?? provider.connectionType;
  if (method === 'oauth') return 'Connect with OAuth';
  if (method === 'api_key') return 'Add API key';
  if (method === 'link_embed') return 'Add link';
  return 'Start setup';
}

function defaultMethod(provider: AdminIntegrationStatus) {
  return provider.preferredConnectionType ?? provider.connectionType;
}

function setupCopy(provider: AdminIntegrationStatus) {
  if (provider.key === 'github_actions') {
    return 'GitHub Actions does not need a separate connection. Connect GitHub once, then SaborWeb can use that connection for repository and workflow status.';
  }

  if (provider.key === 'playwright') {
    return 'No external account is needed. SaborWeb runs Playwright from the worker or CI against staging, preview, or production URLs. For local debugging, use npm run test:e2e.';
  }

  if (provider.key === 'meta_research_session') {
    return 'Save encrypted session-state JSON from the dedicated SaborWeb Facebook/Instagram research account. The worker uses it only for controlled social research and falls back to public-only mode when the session expires.';
  }

  if (provider.key === 'axe') {
    return 'No external account is needed. SaborWeb runs Axe accessibility scans from the worker or CI and stores the findings in admin.';
  }

  if (provider.key === 'lighthouse') {
    return 'No external account is needed. SaborWeb runs Lighthouse audits against a target URL and saves the report for review in admin.';
  }

  const method = defaultMethod(provider);
  if (method === 'oauth') {
    return 'OAuth is the required path for this service. The next step is provider authorization with the right scopes.';
  }
  if (method === 'api_key') {
    return 'Paste the provider key or token. SaborWeb encrypts it on the server and uses it only for backend jobs.';
  }
  if (method === 'link_embed') {
    return 'Paste the public link or embed URL that should be used on generated sites.';
  }
  return 'Use this when the provider requires an owner invite, delegated access, or a manual setup checklist.';
}

function integrationErrorMessage(error: string) {
  const messages: Record<string, string> = {
    missing_github_oauth_client: 'GitHub OAuth is ready in SaborWeb, but the server is missing GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET. Create a GitHub OAuth app, add those values to .env, restart the dev server, then connect again.',
    missing_google_oauth_client: 'Google OAuth is ready in SaborWeb, but the server is missing GOOGLE_WEB_OAUTH_CLIENT_ID and GOOGLE_WEB_OAUTH_CLIENT_SECRET.',
    missing_oauth_callback_data: 'The OAuth provider did not return the expected callback data. Start the connection again from this page.',
    oauth_provider_not_supported: 'This provider is not wired for OAuth yet.',
    oauth_state_not_found: 'The OAuth session expired or could not be matched. Start the connection again from this page.',
    oauth_token_exchange_failed: 'The provider rejected the OAuth token exchange. Check the OAuth app callback URL and client secret.',
    oauth_credential_save_failed: 'OAuth succeeded, but SaborWeb could not save the encrypted credential.',
    oauth_connection_update_failed: 'SaborWeb could not update the integration connection after OAuth.',
    oauth_connection_create_failed: 'SaborWeb could not create the integration connection before OAuth.',
  };

  return messages[error] ?? error.replaceAll('_', ' ');
}

function SecretInput({ label, name, placeholder = '', type = 'password' }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="admin-select-label">
      {label}
      <input className="admin-input" name={name} placeholder={placeholder} type={type} />
    </label>
  );
}

function CredentialFields({ provider }: { provider: AdminIntegrationStatus }) {
  if (provider.key === 'cloudinary') {
    return (
      <>
        <SecretInput label="Cloud name" name="cloudinary_cloud_name" placeholder="your-cloud-name" type="text" />
        <SecretInput label="API key" name="cloudinary_api_key" placeholder="1234567890" />
        <SecretInput label="API secret" name="cloudinary_api_secret" placeholder="••••••••••••••••" />
      </>
    );
  }

  if (provider.key === 'google_maps_places') {
    return <SecretInput label="Google Maps API key" name="google_maps_api_key" placeholder="AIza..." />;
  }

  if (provider.key === 'twilio') {
    return (
      <>
        <SecretInput label="Account SID" name="twilio_account_sid" placeholder="AC..." type="text" />
        <SecretInput label="Auth token" name="twilio_auth_token" placeholder="••••••••••••••••" />
        <SecretInput label="From number" name="twilio_from_number" placeholder="+17875551212" type="tel" />
      </>
    );
  }

  if (provider.key === 'sanity') {
    return (
      <>
        <SecretInput label="Project ID" name="sanity_project_id" placeholder="abc123" type="text" />
        <SecretInput label="Dataset" name="sanity_dataset" placeholder="production" type="text" />
        <SecretInput label="API token" name="sanity_api_token" placeholder="sk..." />
      </>
    );
  }

  if (provider.key === 'uploadcare') {
    return (
      <>
        <SecretInput label="Public key" name="uploadcare_public_key" placeholder="public key" type="text" />
        <SecretInput label="Secret key" name="uploadcare_secret_key" placeholder="secret key" />
      </>
    );
  }

  if (provider.key === 'meta_research_session') {
    return (
      <label className="admin-select-label">
        Session state JSON
        <textarea
          className="admin-textarea"
          name="session_state_json"
          placeholder='Paste Playwright-style storageState JSON from the dedicated Meta research account'
          rows={6}
        />
      </label>
    );
  }

  return <SecretInput label={provider.key === 'anthropic' ? 'API key' : provider.key === 'asana' ? 'Access token' : 'API key or token'} name="secret_value" placeholder={provider.credentialGuide ?? 'Paste key or token'} />;
}

function MissingOAuthConfig({ provider }: { provider: AdminIntegrationStatus }) {
  if (!provider.missingEnv.length) return null;

  return (
    <div className="admin-test-result admin-test-result--bad">
      <div className="admin-test-result__top">
        <CircleDashed size={15} />
        <strong>OAuth app credentials needed</strong>
      </div>
      <p>
        Add {provider.missingEnv.join(' and ')} to the server environment, restart the app, then connect {provider.name}.
      </p>
      {provider.key === 'github' && (
        <p>
          GitHub callback URL: <code>http://localhost:3000/admin/integrations/oauth/github/callback</code>
        </p>
      )}
    </div>
  );
}

function ConnectionSetup({ provider, label }: { provider: AdminIntegrationStatus; label?: string }) {
  const action = createIntegrationConnection.bind(null, provider.key);
  const preferred = defaultMethod(provider);
  const disabled = provider.operationalStatus === 'coming_soon' || provider.operationalStatus === 'local_tool';

  if (disabled) {
    return (
      <details className="admin-integration-setup">
        <summary>{provider.operationalStatus === 'local_tool' ? 'View tool details' : 'View plan'}</summary>
        <div className="admin-integration-setup__body">
          <p className="admin-muted">{provider.notes}</p>
          <SetupLinks isConnected={false} provider={provider} />
        </div>
      </details>
    );
  }

  return (
    <details className="admin-integration-setup">
      <summary>{label ?? primaryActionLabel(provider)}</summary>
      <div className="admin-integration-setup__body">
        <p className="admin-muted">{setupCopy(provider)}</p>
        <form action={action} className="admin-simple-form">
          <input name="connection_type" type="hidden" value={preferred} />
          {(preferred === 'api_key' || provider.key === 'meta_research_session') && (
            <CredentialFields provider={provider} />
          )}
          {preferred === 'link_embed' && (
            <label className="admin-select-label">
              Public link or embed URL
              <input className="admin-input" name="setup_url" placeholder="https://..." />
            </label>
          )}
          <button className="admin-btn admin-btn--primary">
            <PlugZap size={14} />
            {provider.key === 'meta_research_session'
              ? 'Save session'
              : preferred === 'oauth'
                ? 'Connect with OAuth'
                : preferred === 'api_key'
                  ? 'Save key'
                  : 'Connect'}
          </button>
        </form>
      </div>
    </details>
  );
}

function ConnectionManager({ connection }: { connection: AdminIntegrationConnection }) {
  const reconnectAction = reconnectIntegrationConnection.bind(null, connection.id);
  const removeAction = removeIntegrationConnection.bind(null, connection.id);
  const name = connectionName(connection);
  const lastTestMessage = typeof connection.metadata.last_test_message === 'string'
    ? connection.metadata.last_test_message
    : null;
  const lastTestedAt = typeof connection.metadata.last_tested_at === 'string'
    ? connection.metadata.last_tested_at
    : null;
  const lastTestOk = connection.metadata.last_test_ok === true;
  const lastTestDetails = typeof connection.metadata.last_test_details === 'object' && connection.metadata.last_test_details !== null && !Array.isArray(connection.metadata.last_test_details)
    ? connection.metadata.last_test_details as Record<string, unknown>
    : null;
  const visibleCount = typeof lastTestDetails?.visible_count === 'number' ? lastTestDetails.visible_count : null;
  const hasTestResult = Boolean(lastTestMessage || lastTestedAt || connection.last_error);

  return (
    <div className="admin-connection">
      <div className="admin-connection__summary">
        <div>
          <p className="admin-connection__name">{name}</p>
          <p className="admin-small">
            {connection.connection_type.replaceAll('_', ' ')}
            {connection.last_sync_at ? ` · checked ${new Date(connection.last_sync_at).toLocaleDateString()}` : ''}
          </p>
        </div>
        <span className={connection.status === 'connected' ? 'admin-pill admin-pill--success' : 'admin-pill admin-pill--ready'}>
          {connection.status.replaceAll('_', ' ')}
        </span>
      </div>
      {hasTestResult && (
        <div className={connection.last_error || !lastTestOk ? 'admin-test-result admin-test-result--bad' : 'admin-test-result admin-test-result--ok'}>
          <div className="admin-test-result__top">
            {connection.last_error || !lastTestOk ? <CircleDashed size={15} /> : <CheckCircle2 size={15} />}
            <strong>{connection.last_error || !lastTestOk ? 'Last test needs attention' : 'Last test passed'}</strong>
            {lastTestedAt && (
              <span>
                <Clock3 size={12} />
                {new Date(lastTestedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p>{connection.last_error || lastTestMessage || 'No test message recorded yet.'}</p>
          {visibleCount !== null && (
            <span className="admin-test-result__metric">{visibleCount} visible item{visibleCount === 1 ? '' : 's'}</span>
          )}
        </div>
      )}
      <div className="admin-action-grid">
        <IntegrationTestButton connectionId={connection.id} />
        {connection.connection_type === 'oauth' ? (
          <a className="admin-btn admin-btn--ghost" href={`/admin/integrations/oauth/${connection.provider_key}/start`}>
            <RotateCw size={13} />
            Reconnect
          </a>
        ) : (
          <form action={reconnectAction}>
            <button className="admin-btn admin-btn--ghost">
              <RotateCw size={13} />
              Reconnect
            </button>
          </form>
        )}
        <form action={removeAction}>
          <button className="admin-btn admin-btn--ghost">
            <Trash2 size={13} />
            Disconnect
          </button>
        </form>
      </div>
    </div>
  );
}

function ProviderCard({ provider }: { provider: AdminIntegrationStatus }) {
  const connection = providerConnection(provider);
  const method = defaultMethod(provider);
  const isOAuth = method === 'oauth';
  const isConnected = connection?.status === 'connected';
  const isLocalTool = provider.operationalStatus === 'local_tool';
  const oauthMissingConfig = isOAuth && provider.missingEnv.length > 0;
  const canTest = connection && (isConnected || !isOAuth);
  const usedBy = provider.usedBy ?? [];
  const metaCaptureStatus =
    provider.key === 'meta_research_session' && connection?.metadata && typeof connection.metadata === 'object' && !Array.isArray(connection.metadata)
      ? String((connection.metadata as Record<string, unknown>).capture_status ?? '')
      : '';
  const metaCookieCount =
    provider.key === 'meta_research_session' && connection?.metadata && typeof connection.metadata === 'object' && !Array.isArray(connection.metadata)
      ? Number((connection.metadata as Record<string, unknown>).cookie_count ?? 0)
      : 0;
  const metaNextRunMode =
    provider.key === 'meta_research_session' && connection?.metadata && typeof connection.metadata === 'object' && !Array.isArray(connection.metadata)
      ? String((connection.metadata as Record<string, unknown>).next_run_mode ?? '')
      : '';
  const metaLastSuccess =
    provider.key === 'meta_research_session' && connection?.metadata && typeof connection.metadata === 'object' && !Array.isArray(connection.metadata)
      ? String((connection.metadata as Record<string, unknown>).last_successful_research_use ?? '')
      : '';
  const metaLastFailureReason =
    provider.key === 'meta_research_session' && connection?.metadata && typeof connection.metadata === 'object' && !Array.isArray(connection.metadata)
      ? String((connection.metadata as Record<string, unknown>).last_failure_reason ?? '')
      : '';

  return (
    <article className="admin-integration-card">
      <div className="admin-integration-card__top">
        <div className="admin-service-logo" style={{ backgroundColor: providerColor(provider.key) }}>
          {providerInitials(provider)}
        </div>
        <div className="admin-card__header" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="admin-card__title">{provider.name}</h3>
            <p className="admin-small">
              {methodLabel(provider)} · {credentialSource(provider, connection)}
            </p>
          </div>
        </div>
        <span className={statusTone(provider)}>{statusLabel(provider)}</span>
      </div>
      <div className="admin-integration-actions">
        {provider.key === 'meta_research_session' ? (
          <div style={{ display: 'grid', gap: 10, width: '100%' }}>
            <form action={startMetaResearchSessionCapture}>
              <button className="admin-btn admin-btn--primary">
                {isConnected ? 'Reconnect guided capture' : 'Start guided capture'}
              </button>
            </form>
            {connection && (
              <form action={completeMetaResearchSessionCapture.bind(null, connection.id)}>
                <button className="admin-btn admin-btn--secondary">
                  Complete capture
                </button>
              </form>
            )}
            <p className="admin-small">
              Start guided capture, log into the dedicated Facebook/Instagram research account in the opened browser, then come back here and click Complete capture.
            </p>
            {metaCaptureStatus ? (
              <div className="admin-small" style={{ display: 'grid', gap: 4 }}>
                <p>
                  Capture status: {metaCaptureStatus.replaceAll('_', ' ')}
                  {metaCookieCount > 0 ? ` · ${metaCookieCount} cookies saved` : ''}
                </p>
                {metaNextRunMode ? <p>Next run mode: {metaNextRunMode.replaceAll('_', ' ')}</p> : null}
                {metaLastSuccess ? <p>Last successful use: {metaLastSuccess}</p> : null}
                {metaLastFailureReason ? <p>Last failure: {metaLastFailureReason}</p> : null}
              </div>
            ) : null}
          </div>
        ) : isLocalTool ? (
          <ConnectionSetup provider={provider} />
        ) : canTest ? (
          <IntegrationTestButton connectionId={connection.id} />
        ) : oauthMissingConfig ? (
          <details className="admin-integration-setup">
            <summary>Add OAuth app credentials</summary>
            <div className="admin-integration-setup__body">
              <MissingOAuthConfig provider={provider} />
              <SetupLinks isConnected={false} provider={provider} />
            </div>
          </details>
        ) : isOAuth ? (
          <a className="admin-btn admin-btn--primary" href={`/admin/integrations/oauth/${provider.key}/start`}>
            Connect with OAuth
          </a>
        ) : (
          <ConnectionSetup provider={provider} />
        )}
        {connection && !isOAuth && !isLocalTool && <ConnectionSetup label="Add another connection" provider={provider} />}
      </div>
      <p className="admin-muted admin-integration-card__summary">{providerUseCase(provider)}</p>
      <details className="admin-integration-details">
        <summary>Details and setup</summary>
        <div className="admin-integration-details__body">
          <div className="admin-integration-explain">
            <div>
              <p className="admin-label">Used for</p>
              {usedBy.length ? (
                <div className="admin-used-by-list">
                  {usedBy.map((item) => (
                    <span className="admin-chip" key={item}>{item}</span>
                  ))}
                </div>
              ) : (
                <p className="admin-muted">{provider.notes}</p>
              )}
            </div>
            <div>
              <p className="admin-label">Connection</p>
              <p className="admin-muted">{operationalLabel(provider)} · {setupCopy(provider)}</p>
            </div>
            <SetupLinks isConnected={Boolean(isConnected)} provider={provider} />
            {!connection && provider.missingEnv.length > 0 && provider.supportsApiKey && !provider.supportsOAuth && (
              <p className="admin-small">No key is connected yet. You can add it here when ready.</p>
            )}
            {!connection && oauthMissingConfig && <MissingOAuthConfig provider={provider} />}
          </div>
          {!isLocalTool && connection && <ConnectionManager connection={connection} />}
          {!isLocalTool && provider.connections.length > 1 && (
            <details className="admin-inline-details">
              <summary>Other connections ({provider.connections.length - 1})</summary>
              <div className="admin-connection-list">
                {provider.connections.slice(1).map((item) => (
                  <ConnectionManager connection={item} key={item.id} />
                ))}
              </div>
            </details>
          )}
        </div>
      </details>
    </article>
  );
}

function groupProviders(providers: AdminIntegrationStatus[], query: string) {
  const filtered = query
    ? providers.filter((provider) =>
        [
          provider.name,
          provider.key,
          provider.category,
          provider.connectionType,
          provider.visibility,
          provider.status,
          provider.surface,
          provider.operationalStatus,
          provider.notes,
          provider.credentialGuide,
          ...(provider.usedBy ?? []),
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
      )
    : providers;

  return GROUPS
    .map((group) => ({
      ...group,
      providers: filtered.filter((provider) => group.categories.includes(provider.category)),
    }))
    .filter((group) => group.providers.length > 0);
}

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tested?: string | string[]; result?: string | string[]; connected?: string | string[]; error?: string | string[]; meta_capture?: string | string[] }>;
}) {
  const data = await getAdminIntegrationsData();
  const params = await searchParams;
  const search = Array.isArray(params.q) ? params.q[0] : params.q ?? '';
  const tested = Array.isArray(params.tested) ? params.tested[0] : params.tested;
  const result = Array.isArray(params.result) ? params.result[0] : params.result;
  const connected = Array.isArray(params.connected) ? params.connected[0] : params.connected;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const metaCapture = Array.isArray(params.meta_capture) ? params.meta_capture[0] : params.meta_capture;
  const query = search.trim().toLowerCase();
  const groups = groupProviders(data.providers, query);
  const connectedCount = data.providers.filter((provider) =>
    provider.connections.some((connection) => connection.status === 'connected')
  ).length;
  const setupCount = data.providers.filter((provider) =>
    provider.connections.some((connection) => connection.status !== 'connected')
  ).length;
  const availableCount = data.providers.length;

  return (
    <main className="admin-page">
      <section className="admin-shell admin-shell--wide">
        <header className="admin-panel admin-detail-header">
          <Link className="admin-back" href="/admin">
            <ArrowLeft size={16} />
            Back to admin
          </Link>
          <div className="admin-detail-hero">
            <div>
              <p className="admin-kicker">Platform Control</p>
              <h1 className="admin-detail-title">Integrations</h1>
              <p className="admin-subtitle">
                Connect the services SaborWeb uses to research, build, launch, monitor, and improve restaurant sites.
              </p>
            </div>
            <div className="admin-header-actions">
              <span className="admin-pill admin-pill--success">{connectedCount} connected</span>
              <span className="admin-pill admin-pill--ready">{setupCount} in setup</span>
              <span className="admin-pill admin-pill--neutral">{availableCount} available</span>
            </div>
          </div>
        </header>

        <section className="admin-panel admin-integrations-intro">
          <div>
            <h2 className="admin-card__title">Simple rule: connect it here, use it everywhere.</h2>
            <p className="admin-muted">
              Use OAuth first when a service supports it. Use encrypted API keys for backend tools like OpenAI, Apify, Firecrawl, and Cloudinary. Use guided setup only when the provider requires an invite, delegation, or a customer-owned account.
            </p>
          </div>
          <div className="admin-integrations-tools">
            <form action={importEnvBackedIntegrations}>
              <button className="admin-btn admin-btn--secondary">Import existing env keys</button>
            </form>
            <form className="admin-search">
              <Search size={16} />
              <input className="admin-input" defaultValue={search} name="q" placeholder="Search integrations..." type="search" />
            </form>
          </div>
        </section>

        {(tested || connected || error || metaCapture) && (
          <section className={error || result === 'attention' ? 'admin-alert admin-alert--bad' : 'admin-alert admin-alert--good'}>
            {tested && (
              <p>
                <strong>Connection tested:</strong> {tested.replaceAll('_', ' ')} {result === 'ok' ? 'passed.' : 'needs attention. Check the result panel on its card.'}
              </p>
            )}
            {connected && (
              <p><strong>Connected:</strong> {connected.replaceAll('_', ' ')} OAuth credentials were saved.</p>
            )}
            {metaCapture === 'started' && (
              <p><strong>Meta capture started:</strong> A browser window should be opening now. Log into the dedicated Meta research account, then return here and click <strong>Complete capture</strong>.</p>
            )}
            {metaCapture === 'completed' && (
              <p><strong>Meta capture complete:</strong> The encrypted research session was saved and is ready for social research runs.</p>
            )}
            {error && (
              <p><strong>Integration error:</strong> {integrationErrorMessage(error)}</p>
            )}
          </section>
        )}

        {groups.map((group) => (
          <section className="admin-panel" key={group.key}>
            <div className="admin-section-heading">
              <div className="admin-card__header" style={{ marginBottom: 0 }}>
                <PlugZap size={18} />
                <h2 className="admin-card__title">{group.title}</h2>
              </div>
              <p className="admin-muted">{group.note}</p>
            </div>
            <div className="admin-integration-grid">
              {group.providers.map((provider) => (
                <ProviderCard key={provider.key} provider={provider} />
              ))}
            </div>
          </section>
        ))}
        {!groups.length && (
          <section className="admin-panel">
            <p className="admin-muted" style={{ textAlign: 'center' }}>No integrations match that search.</p>
          </section>
        )}
      </section>
    </main>
  );
}

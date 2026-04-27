import 'server-only';

import { PROVIDER_REGISTRY } from '@/lib/platform/catalog';
import { decryptSecret, encryptSecret } from '@/lib/security/encryption';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type IntegrationConnectionForTest = {
  id: string;
  provider_key: string;
  connection_type: string;
  public_config: Record<string, unknown> | null;
};

type TestResult = {
  ok: boolean;
  status: 'connected' | 'pending_admin' | 'needs_owner_action' | 'blocked';
  message: string;
  details?: Record<string, unknown>;
};

type CloudinaryCredential = {
  cloudName?: string;
  cloud_name?: string;
  apiKey?: string;
  api_key?: string;
  apiSecret?: string;
  api_secret?: string;
};

type StoredCredential = {
  id: string | null;
  hasCredential: boolean;
  secret: string | null;
  decryptable: boolean;
};

type GoogleOAuthCredential = {
  provider?: string;
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string | null;
  scope?: string | null;
  obtained_at?: string | null;
  expires_at?: string | null;
};

type OAuthCredential = {
  provider?: string;
  access_token?: string;
  token_type?: string | null;
  scope?: string | null;
  obtained_at?: string | null;
};

type JsonRecord = Record<string, unknown>;

const REQUEST_TIMEOUT_MS = 10_000;

function providerByKey(key: string) {
  return PROVIDER_REGISTRY.find((provider) => provider.key === key) ?? null;
}

function envConfigured(envKey: string) {
  return Boolean(process.env[envKey]?.trim());
}

function envValue(envKey: string) {
  return process.env[envKey]?.trim() || null;
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
}

function parseJsonCredential(value: string): JsonRecord {
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return {};
  }
}

function bearerFromCredential(secret: string | null, envKey: string | null) {
  return secret || (envKey ? envValue(envKey) : null);
}

function credentialField(secret: string | null, keys: string[], envKey: string) {
  if (secret && !secret.trim().startsWith('{') && keys.some((key) => /api.*key|token|secret/i.test(key))) {
    return secret.trim();
  }
  const parsed = parseJsonCredential(secret ?? '');
  for (const key of keys) {
    if (typeof parsed[key] === 'string' && String(parsed[key]).trim()) return String(parsed[key]).trim();
  }
  return envValue(envKey);
}

async function latestEncryptedCredential(connectionId: string): Promise<StoredCredential> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('integration_credentials')
    .select('id, secret_ciphertext')
    .eq('integration_connection_id', connectionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Integration Test] Credential lookup failed:', error);
    return { id: null, hasCredential: false, secret: null, decryptable: false };
  }

  if (!data?.secret_ciphertext) return { id: null, hasCredential: false, secret: null, decryptable: false };

  try {
    return {
      id: String(data.id),
      hasCredential: true,
      secret: decryptSecret(String(data.secret_ciphertext)),
      decryptable: true,
    };
  } catch (error) {
    console.error('[Integration Test] Credential decrypt failed:', error);
    return { id: String(data.id),
      hasCredential: true,
      secret: null,
      decryptable: false };
  }
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  let body: unknown = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 300) };
  }

  return { response, body };
}

function describeHttpFailure(providerName: string, status: number, body: unknown) {
  const record = asRecord(body);
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof asRecord(record.error).message === 'string'
        ? String(asRecord(record.error).message)
        : `${providerName} returned HTTP ${status}.`;

  return message;
}

async function testOpenAI(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'OPENAI_API_KEY');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add an OpenAI API key.' };

  const { response, body } = await requestJson('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('OpenAI', response.status, body) };

  const data = Array.isArray(asRecord(body).data) ? asRecord(body).data as unknown[] : [];
  return {
    ok: true,
    status: 'connected',
    message: `OpenAI connected. ${data.length} models visible.`,
    details: { model_count: data.length },
  };
}

async function testAnthropic(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'ANTHROPIC_API_KEY');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add an Anthropic API key.' };

  const { response, body } = await requestJson('https://api.anthropic.com/v1/models?limit=20', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Anthropic', response.status, body) };

  const data = Array.isArray(asRecord(body).data) ? asRecord(body).data as unknown[] : [];
  return {
    ok: true,
    status: 'connected',
    message: `Anthropic connected. ${data.length} models visible.`,
    details: { model_count: data.length },
  };
}

async function testApify(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'APIFY_API_TOKEN');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add an Apify API token.' };

  const { response, body } = await requestJson('https://api.apify.com/v2/users/me', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Apify', response.status, body) };

  const data = asRecord(asRecord(body).data);
  return {
    ok: true,
    status: 'connected',
    message: `Apify connected${data.username ? ` as ${String(data.username)}` : ''}.`,
    details: { username: data.username ?? null, user_id: data.id ?? null },
  };
}

async function testFirecrawl(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'FIRECRAWL_API_KEY');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a Firecrawl API key.' };

  const { response, body } = await requestJson('https://api.firecrawl.dev/v1/team/credit-usage', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Firecrawl', response.status, body) };

  const data = asRecord(asRecord(body).data);
  return {
    ok: true,
    status: 'connected',
    message: `Firecrawl connected${typeof data.remaining_credits === 'number' ? ` with ${data.remaining_credits} credits remaining` : ''}.`,
    details: {
      remaining_credits: data.remaining_credits ?? null,
      plan_credits: data.plan_credits ?? null,
    },
  };
}

async function testCloudinary(secret: string | null): Promise<TestResult> {
  const parsed = parseJsonCredential(secret ?? '');
  const credential = parsed as CloudinaryCredential;
  const cloudName = credential.cloudName || credential.cloud_name || envValue('CLOUDINARY_CLOUD_NAME');
  const apiKey = credential.apiKey || credential.api_key || envValue('CLOUDINARY_API_KEY');
  const apiSecret = credential.apiSecret || credential.api_secret || envValue('CLOUDINARY_API_SECRET');

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      ok: false,
      status: 'pending_admin',
      message: 'Add Cloudinary cloud name, API key, and API secret.',
    };
  }

  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const { response, body } = await requestJson(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/ping`, {
    headers: { Authorization: `Basic ${basic}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Cloudinary', response.status, body) };

  return {
    ok: true,
    status: 'connected',
    message: `Cloudinary connected for cloud ${cloudName}.`,
    details: { cloud_name: cloudName },
  };
}

async function testResend(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'RESEND_API_KEY');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a Resend API key.' };

  const { response, body } = await requestJson('https://api.resend.com/domains', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'saborweb-integrations/1.0',
    },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Resend', response.status, body) };

  const data = Array.isArray(asRecord(body).data) ? asRecord(body).data as unknown[] : [];
  return {
    ok: true,
    status: 'connected',
    message: `Resend connected. ${data.length} domains visible.`,
    details: { domain_count: data.length },
  };
}

async function testVercel(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'VERCEL_API_TOKEN');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a Vercel API token.' };

  const { response, body } = await requestJson('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Vercel', response.status, body) };

  const user = asRecord(asRecord(body).user || body);
  return {
    ok: true,
    status: 'connected',
    message: `Vercel connected${user.username ? ` as ${String(user.username)}` : ''}.`,
    details: { username: user.username ?? null, user_id: user.id ?? null },
  };
}

async function testGitHub(secret: string | null): Promise<TestResult> {
  const parsed = parseJsonCredential(secret ?? '') as OAuthCredential;
  const apiKey = typeof parsed.access_token === 'string' && parsed.access_token.trim()
    ? parsed.access_token.trim()
    : bearerFromCredential(secret && !secret.trim().startsWith('{') ? secret : null, 'GITHUB_TOKEN');
  if (!apiKey) return { ok: false, status: 'needs_owner_action', message: 'Connect GitHub with OAuth before branch/PR automation can run.' };

  const { response, body } = await requestJson('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'saborweb-integrations/1.0',
    },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('GitHub', response.status, body) };
  const user = asRecord(body);
  return {
    ok: true,
    status: 'connected',
    message: `GitHub connected${user.login ? ` as ${String(user.login)}` : ''}.`,
    details: {
      login: user.login ?? null,
      user_id: user.id ?? null,
      scope: parsed.scope ?? null,
      token_type: parsed.token_type ?? null,
    },
  };
}

async function testCloudflare(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'CLOUDFLARE_API_TOKEN');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a Cloudflare API token before custom hostname automation can run.' };

  const { response, body } = await requestJson('https://api.cloudflare.com/client/v4/user/tokens/verify', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Cloudflare', response.status, body) };
  const result = asRecord(asRecord(body).result);
  return {
    ok: true,
    status: 'connected',
    message: `Cloudflare token verified${result.status ? ` (${String(result.status)})` : ''}.`,
    details: { token_status: result.status ?? null },
  };
}

async function testSentry(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'SENTRY_AUTH_TOKEN');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a Sentry auth token.' };

  const { response, body } = await requestJson('https://sentry.io/api/0/organizations/', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Sentry', response.status, body) };
  const orgs = Array.isArray(body) ? body : [];
  return {
    ok: true,
    status: 'connected',
    message: `Sentry connected. ${orgs.length} organization${orgs.length === 1 ? '' : 's'} visible.`,
    details: { organization_count: orgs.length },
  };
}

async function testAsana(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'ASANA_ACCESS_TOKEN');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add an Asana access token.' };

  const { response, body } = await requestJson('https://app.asana.com/api/1.0/users/me', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Asana', response.status, body) };
  const data = asRecord(asRecord(body).data);
  return {
    ok: true,
    status: 'connected',
    message: `Asana connected${data.email ? ` as ${String(data.email)}` : ''}.`,
    details: { user_gid: data.gid ?? null, email: data.email ?? null },
  };
}

async function testPostHog(secret: string | null): Promise<TestResult> {
  const apiKey = bearerFromCredential(secret, 'POSTHOG_API_KEY');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a PostHog project or personal API key.' };

  const host = envValue('POSTHOG_HOST') ?? 'https://us.posthog.com';
  const { response, body } = await requestJson(`${host.replace(/\/$/, '')}/api/projects/`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('PostHog', response.status, body) };
  const results = Array.isArray(asRecord(body).results) ? asRecord(body).results as unknown[] : [];
  return {
    ok: true,
    status: 'connected',
    message: `PostHog connected. ${results.length} project${results.length === 1 ? '' : 's'} visible.`,
    details: { project_count: results.length },
  };
}

async function testGooglePlaces(secret: string | null): Promise<TestResult> {
  const apiKey = credentialField(secret, ['apiKey', 'api_key', 'GOOGLE_MAPS_API_KEY'], 'GOOGLE_MAPS_API_KEY');
  if (!apiKey) return { ok: false, status: 'pending_admin', message: 'Add a Google Maps API key with Places API enabled.' };

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', 'restaurant San Juan Puerto Rico');
  url.searchParams.set('key', apiKey);
  const { response, body } = await requestJson(url.toString(), {});

  if (!response.ok) return { ok: false, status: 'blocked', message: describeHttpFailure('Google Places', response.status, body) };
  const record = asRecord(body);
  const status = typeof record.status === 'string' ? record.status : 'UNKNOWN';
  if (status !== 'OK' && status !== 'ZERO_RESULTS') {
    return {
      ok: false,
      status: 'blocked',
      message: `Google Places returned ${status}${typeof record.error_message === 'string' ? `: ${record.error_message}` : ''}.`,
    };
  }

  const results = Array.isArray(record.results) ? record.results as unknown[] : [];
  return {
    ok: true,
    status: 'connected',
    message: `Google Places connected. ${results.length} sample place${results.length === 1 ? '' : 's'} returned.`,
    details: { visible_count: results.length },
  };
}

function parseGoogleCredential(secret: string | null): GoogleOAuthCredential | null {
  if (!secret) return null;
  const parsed = parseJsonCredential(secret);
  if (typeof parsed.access_token !== 'string') return null;
  return parsed as GoogleOAuthCredential;
}

function googleCredentialNeedsRefresh(credential: GoogleOAuthCredential) {
  if (!credential.expires_at) return false;
  return new Date(credential.expires_at).getTime() < Date.now() + 60_000;
}

async function refreshGoogleCredential(storedCredential: StoredCredential, credential: GoogleOAuthCredential) {
  const refreshToken = credential.refresh_token;
  const clientId = envValue('GOOGLE_WEB_OAUTH_CLIENT_ID');
  const clientSecret = envValue('GOOGLE_WEB_OAUTH_CLIENT_SECRET');

  if (!storedCredential.id || !refreshToken || !clientId || !clientSecret) return null;

  const { response, body } = await requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('[Integration Test] Google token refresh failed:', body);
    return null;
  }

  const record = asRecord(body);
  if (typeof record.access_token !== 'string') return null;

  const now = new Date();
  const expiresAt = typeof record.expires_in === 'number'
    ? new Date(now.getTime() + Number(record.expires_in) * 1000).toISOString()
    : credential.expires_at ?? null;
  const updated: GoogleOAuthCredential = {
    ...credential,
    access_token: record.access_token,
    token_type: typeof record.token_type === 'string' ? record.token_type : credential.token_type ?? 'Bearer',
    scope: typeof record.scope === 'string' ? record.scope : credential.scope ?? null,
    obtained_at: now.toISOString(),
    expires_at: expiresAt,
  };
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('integration_credentials')
    .update({
      secret_ciphertext: encryptSecret(JSON.stringify(updated)),
      expires_at: expiresAt,
      metadata: {
        refreshed_from: 'admin_integration_test',
        refreshed_at: now.toISOString(),
        scope: updated.scope ?? null,
        has_refresh_token: Boolean(updated.refresh_token),
      },
    })
    .eq('id', storedCredential.id);

  if (error) {
    console.error('[Integration Test] Google credential refresh save failed:', error);
    return null;
  }

  return updated;
}

async function googleAccessToken(storedCredential: StoredCredential) {
  let credential = parseGoogleCredential(storedCredential.secret);

  if (!storedCredential.hasCredential) {
    return { result: { ok: false, status: 'needs_owner_action' as const, message: 'Connect this Google integration with OAuth.' } };
  }

  if (!credential?.access_token) {
    return { result: { ok: false, status: 'blocked' as const, message: 'Stored Google OAuth credential is missing an access token. Reconnect this integration.' } };
  }

  if (googleCredentialNeedsRefresh(credential)) {
    credential = await refreshGoogleCredential(storedCredential, credential) ?? credential;
  }

  return { token: credential.access_token };
}

async function testGoogleApi(params: {
  storedCredential: StoredCredential;
  providerName: string;
  endpoint: string;
  collectionField: string;
  label: string;
}) {
  const tokenResult = await googleAccessToken(params.storedCredential);
  if (tokenResult.result) return tokenResult.result;

  const { response, body } = await requestJson(params.endpoint, {
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  });

  if (!response.ok) {
    const status = response.status === 401 ? 'needs_owner_action' : 'blocked';
    const hint = response.status === 403
      ? ' Check that the API is enabled in Google Cloud and the OAuth consent screen includes the requested scope.'
      : response.status === 401
        ? ' Reconnect this integration with OAuth.'
        : '';
    return {
      ok: false,
      status: status as 'needs_owner_action' | 'blocked',
      message: `${describeHttpFailure(params.providerName, response.status, body)}${hint}`,
    };
  }

  const count = Array.isArray(asRecord(body)[params.collectionField])
    ? (asRecord(body)[params.collectionField] as unknown[]).length
    : 0;

  return {
    ok: true,
    status: 'connected' as const,
    message: `${params.providerName} connected. ${count} ${params.label} visible.`,
    details: {
      visible_count: count,
      collection: params.collectionField,
    },
  };
}

async function testGoogleBusinessProfile(storedCredential: StoredCredential) {
  return testGoogleApi({
    storedCredential,
    providerName: 'Google Business Profile',
    endpoint: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    collectionField: 'accounts',
    label: 'accounts',
  });
}

async function testGoogleSearchConsole(storedCredential: StoredCredential) {
  return testGoogleApi({
    storedCredential,
    providerName: 'Google Search Console',
    endpoint: 'https://www.googleapis.com/webmasters/v3/sites',
    collectionField: 'siteEntry',
    label: 'properties',
  });
}

async function testGoogleAnalytics(storedCredential: StoredCredential) {
  return testGoogleApi({
    storedCredential,
    providerName: 'Google Analytics',
    endpoint: 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    collectionField: 'accountSummaries',
    label: 'account summaries',
  });
}

async function testGoogleTagManager(storedCredential: StoredCredential) {
  return testGoogleApi({
    storedCredential,
    providerName: 'Google Tag Manager',
    endpoint: 'https://tagmanager.googleapis.com/tagmanager/v2/accounts',
    collectionField: 'account',
    label: 'accounts',
  });
}

function localToolResult(connection: IntegrationConnectionForTest): TestResult {
  const provider = providerByKey(connection.provider_key);
  return {
    ok: true,
    status: 'connected',
    message: `${provider?.name ?? connection.provider_key} is available as a local/tooling integration. Provider-specific runner wiring comes next.`,
  };
}

function oauthPendingResult(connection: IntegrationConnectionForTest): TestResult {
  const provider = providerByKey(connection.provider_key);
  const envReady = provider?.envKeys?.length ? provider.envKeys.every(envConfigured) : false;
  return {
    ok: false,
    status: envReady ? 'needs_owner_action' : 'pending_admin',
    message: envReady
      ? `${provider?.name ?? connection.provider_key} OAuth app is configured. Authorization/callback flow still needs to be completed.`
      : `${provider?.name ?? connection.provider_key} needs OAuth app configuration before authorization can start.`,
  };
}

function guidedOrLinkResult(connection: IntegrationConnectionForTest): TestResult {
  const publicConfig = asRecord(connection.public_config);
  const setupUrl = typeof publicConfig.setup_url === 'string' ? publicConfig.setup_url.trim() : '';
  if (setupUrl) {
    return {
      ok: true,
      status: 'connected',
      message: 'Guided/link integration has setup URL or public link configured.',
      details: { setup_url_configured: true },
    };
  }

  return {
    ok: false,
    status: 'needs_owner_action',
    message: 'Add setup instructions, an owner invite, or a public link/embed before this integration is ready.',
  };
}

function testMetaResearchSession(secret: string | null): TestResult {
  if (!secret) {
    return {
      ok: false,
      status: 'needs_owner_action',
      message: 'Add session-state JSON from the dedicated Meta research account.',
    };
  }

  try {
    const parsed = asRecord(JSON.parse(secret));
    const storageState = asRecord(parsed.storageState);
    const cookies = Array.isArray(storageState.cookies)
      ? storageState.cookies
      : Array.isArray(parsed.cookies)
        ? parsed.cookies
        : [];
    const authCookieCount = cookies.filter((cookie) => {
      const name = typeof asRecord(cookie).name === 'string' ? String(asRecord(cookie).name) : '';
      return ['c_user', 'xs', 'sessionid', 'ds_user_id'].includes(name);
    }).length;

    return cookies.length && authCookieCount
      ? {
          ok: true,
          status: 'connected',
          message: `Meta session is saved. ${authCookieCount} auth cookies available for controlled social research.`,
          details: { cookie_count: cookies.length, auth_cookie_count: authCookieCount },
        }
      : {
          ok: false,
          status: 'blocked',
          message: cookies.length
            ? 'Session JSON is valid, but it does not include usable Meta auth cookies.'
            : 'Session JSON is valid, but it does not include any cookies.',
        };
  } catch {
    return {
      ok: false,
      status: 'blocked',
      message: 'Session-state JSON could not be parsed. Paste Playwright-style storageState JSON.',
    };
  }
}

export async function runIntegrationConnectionTest(connection: IntegrationConnectionForTest): Promise<TestResult> {
  const credential = await latestEncryptedCredential(connection.id);
  if (credential.hasCredential && !credential.decryptable) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Stored credential could not be decrypted. Replace this credential.',
    };
  }

  try {
    switch (connection.provider_key) {
      case 'openai':
      case 'anthropic':
        return connection.provider_key === 'openai'
          ? testOpenAI(credential.secret)
          : testAnthropic(credential.secret);
      case 'apify':
        return testApify(credential.secret);
      case 'firecrawl':
        return testFirecrawl(credential.secret);
      case 'meta_research_session':
        return testMetaResearchSession(credential.secret);
      case 'cloudinary':
        return testCloudinary(credential.secret);
      case 'resend':
        return testResend(credential.secret);
      case 'vercel':
        return testVercel(credential.secret);
      case 'github':
        return testGitHub(credential.secret);
      case 'cloudflare':
        return testCloudflare(credential.secret);
      case 'sentry':
        return testSentry(credential.secret);
      case 'asana':
        return testAsana(credential.secret);
      case 'posthog':
        return testPostHog(credential.secret);
      case 'google_maps_places':
        return testGooglePlaces(credential.secret);
      case 'google_business_profile':
        return testGoogleBusinessProfile(credential);
      case 'google_search_console':
        return testGoogleSearchConsole(credential);
      case 'google_analytics':
        return testGoogleAnalytics(credential);
      case 'google_tag_manager':
        return testGoogleTagManager(credential);
      case 'playwright':
      case 'lighthouse':
      case 'axe':
        return localToolResult(connection);
      default:
        if (connection.connection_type === 'oauth') return oauthPendingResult(connection);
        if (connection.connection_type === 'link_embed' || connection.connection_type === 'delegated_access') return guidedOrLinkResult(connection);
        return {
          ok: false,
          status: 'pending_admin',
          message: 'Provider-specific live test is not wired yet. Credential can still be stored and managed here.',
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown integration test error.';
    return { ok: false, status: 'blocked', message };
  }
}

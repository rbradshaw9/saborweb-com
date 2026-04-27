import 'server-only';

import { PROVIDER_REGISTRY } from '@/lib/platform/catalog';
import { decryptSecret } from '@/lib/security/encryption';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type StoredCredential = {
  id: string | null;
  secret: string | null;
  expiresAt: string | null;
  source: 'encrypted_db' | 'server_env' | 'missing' | 'undecryptable';
};

export type StoredBrowserSessionCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
};

export type StoredBrowserSession = {
  storageState: {
    cookies: StoredBrowserSessionCookie[];
    origins: Array<{
      origin: string;
      localStorage: Array<{ name: string; value: string }>;
    }>;
  } | null;
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function envValue(key: string) {
  return process.env[key]?.trim() || null;
}

function envJson(keys: string[]) {
  const record: Record<string, string> = {};
  for (const key of keys) {
    const value = envValue(key);
    if (value) record[key] = value;
  }
  return Object.keys(record).length ? JSON.stringify(record) : null;
}

function envFallback(providerKey: string) {
  const provider = PROVIDER_REGISTRY.find((item) => item.key === providerKey);
  if (!provider?.envKeys?.length) return null;

  if (provider.envKeys.length === 1) return envValue(provider.envKeys[0]);
  return envJson(provider.envKeys);
}

export async function getProviderCredential(providerKey: string): Promise<StoredCredential> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('integration_connections')
    .select('id, status, integration_credentials(id, secret_ciphertext, expires_at, created_at)')
    .eq('provider_key', providerKey)
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    const credentials = Array.isArray(data.integration_credentials) ? data.integration_credentials : [];
    const latest = credentials
      .map((credential) => asRecord(credential))
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))[0];

    if (latest?.secret_ciphertext) {
      try {
        return {
          id: String(latest.id ?? ''),
          secret: decryptSecret(String(latest.secret_ciphertext)),
          expiresAt: typeof latest.expires_at === 'string' ? latest.expires_at : null,
          source: 'encrypted_db',
        };
      } catch (credentialError) {
        console.error('[Credentials] Could not decrypt provider credential:', { providerKey, credentialError });
        return { id: String(latest.id ?? ''), secret: null, expiresAt: null, source: 'undecryptable' };
      }
    }
  } else if (error && !String(error.message ?? '').includes('integration_connections')) {
    console.error('[Credentials] Provider credential lookup failed:', { providerKey, error });
  }

  const fallback = envFallback(providerKey);
  if (fallback) return { id: null, secret: fallback, expiresAt: null, source: 'server_env' };
  return { id: null, secret: null, expiresAt: null, source: 'missing' };
}

export function credentialAsJson(secret: string | null) {
  if (!secret) return {};
  try {
    return asRecord(JSON.parse(secret));
  } catch {
    return {};
  }
}

export function credentialValue(secret: string | null, envKey: string) {
  if (secret && !secret.trim().startsWith('{')) return secret;
  const parsed = credentialAsJson(secret);
  return typeof parsed[envKey] === 'string' ? String(parsed[envKey]) : envValue(envKey);
}

export function readStoredBrowserSession(secret: string | null): StoredBrowserSession | null {
  if (!secret) return null;

  try {
    const parsed = asRecord(JSON.parse(secret));
    const storageStateRecord = asRecord(parsed.storageState);
    const rawCookies = Array.isArray(storageStateRecord.cookies)
      ? storageStateRecord.cookies
      : Array.isArray(parsed.cookies)
        ? parsed.cookies
        : [];
    const cookies: StoredBrowserSessionCookie[] = rawCookies
      .filter((cookie): cookie is Record<string, unknown> => typeof cookie === 'object' && cookie !== null && !Array.isArray(cookie))
      .map((cookie) => {
        const sameSite: StoredBrowserSessionCookie['sameSite'] =
          cookie.sameSite === 'Strict' || cookie.sameSite === 'None'
            ? cookie.sameSite
            : 'Lax';

        return {
          name: typeof cookie.name === 'string' ? cookie.name : '',
          value: typeof cookie.value === 'string' ? cookie.value : '',
          domain: typeof cookie.domain === 'string' ? cookie.domain : '',
          path: typeof cookie.path === 'string' ? cookie.path : '/',
          expires: typeof cookie.expires === 'number' ? cookie.expires : -1,
          httpOnly: Boolean(cookie.httpOnly),
          secure: Boolean(cookie.secure),
          sameSite,
        };
      })
      .filter((cookie) => cookie.name && cookie.value && cookie.domain);

    if (!cookies.length) return null;

    return {
      storageState: {
        cookies,
        origins: (
          Array.isArray(storageStateRecord.origins)
            ? storageStateRecord.origins
            : Array.isArray(parsed.origins)
              ? parsed.origins
              : []
        )
          .filter((origin): origin is Record<string, unknown> => typeof origin === 'object' && origin !== null && !Array.isArray(origin))
          .map((origin) => ({
            origin: typeof origin.origin === 'string' ? origin.origin : '',
            localStorage: Array.isArray(origin.localStorage)
              ? origin.localStorage
                  .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
                  .map((item) => ({
                    name: typeof item.name === 'string' ? item.name : '',
                    value: typeof item.value === 'string' ? item.value : '',
                  }))
                  .filter((item) => item.name.length > 0)
              : [],
          }))
          .filter((origin) => origin.origin.length > 0),
      },
    };
  } catch {
    return null;
  }
}

function domainMatches(hostname: string, cookieDomain: string) {
  const normalizedCookieDomain = cookieDomain.replace(/^\./, '').toLowerCase();
  const normalizedHost = hostname.toLowerCase();
  return normalizedHost === normalizedCookieDomain || normalizedHost.endsWith(`.${normalizedCookieDomain}`);
}

export function cookieHeaderForUrl(session: StoredBrowserSession | null, url: string) {
  if (!session?.storageState?.cookies?.length) return null;

  try {
    const target = new URL(url);
    const pairs = session.storageState.cookies
      .filter((cookie) => domainMatches(target.hostname, cookie.domain))
      .filter((cookie) => !cookie.secure || target.protocol === 'https:')
      .map((cookie) => `${cookie.name}=${cookie.value}`);
    return pairs.length ? pairs.join('; ') : null;
  } catch {
    return null;
  }
}

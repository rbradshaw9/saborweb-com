import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const envPath = resolve(root, '.env');
const tokenPath = resolve(root, '.google', 'oauth-token.json');
const redirectUri = 'http://127.0.0.1:8725/oauth2callback';

const defaultScopes = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
];

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=');
        return [key, rest.join('=').replace(/^["']|["']$/g, '')];
      })
  );
}

async function loadConfig() {
  const env = parseEnv(await readFile(envPath, 'utf8'));
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in .env');
  }

  return { clientId, clientSecret };
}

function openBrowser(url) {
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  spawn(opener, args, { stdio: 'ignore', detached: true }).unref();
}

async function exchangeCode({ clientId, clientSecret, code }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${JSON.stringify(data)}`);
  return data;
}

async function refreshToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth token refresh failed: ${JSON.stringify(data)}`);
  return data;
}

export async function getGoogleAccessToken({ scopes = defaultScopes } = {}) {
  const config = await loadConfig();

  if (existsSync(tokenPath)) {
    const saved = JSON.parse(await readFile(tokenPath, 'utf8'));
    const refreshed = await refreshToken({
      ...config,
      refreshToken: saved.refresh_token,
    });
    return refreshed.access_token;
  }

  const state = randomBytes(16).toString('hex');
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  const code = await new Promise((resolveCode, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', redirectUri);
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      if (url.searchParams.get('state') !== state) {
        res.writeHead(400);
        res.end('State mismatch');
        server.close();
        reject(new Error('OAuth state mismatch'));
        return;
      }
      const authCode = url.searchParams.get('code');
      if (!authCode) {
        res.writeHead(400);
        res.end('Missing code');
        server.close();
        reject(new Error('OAuth callback missing code'));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<p>Google authorization complete. You can close this tab and return to Codex.</p>');
      server.close();
      resolveCode(authCode);
    });

    server.listen(8725, '127.0.0.1', () => {
      console.log('Opening Google consent URL...');
      console.log(authUrl.toString());
      openBrowser(authUrl.toString());
    });
  });

  const token = await exchangeCode({ ...config, code });
  await mkdir(dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, JSON.stringify(token, null, 2));
  return token.access_token;
}

export async function googleRequest(pathOrUrl, accessToken, options = {}) {
  let url = pathOrUrl;
  if (!pathOrUrl.startsWith('http')) {
    const host = pathOrUrl.startsWith('/tagmanager/')
      ? 'https://tagmanager.googleapis.com'
      : pathOrUrl.startsWith('/v1beta/')
        ? 'https://analyticsadmin.googleapis.com'
        : 'https://www.googleapis.com';
    url = `${host}${pathOrUrl}`;
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

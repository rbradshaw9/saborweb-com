import 'server-only';

import crypto from 'node:crypto';

export type GoogleOAuthProviderKey =
  | 'google_business_profile'
  | 'google_search_console'
  | 'google_analytics'
  | 'google_tag_manager';

export type GitHubOAuthProviderKey = 'github';

const GOOGLE_SCOPES: Record<GoogleOAuthProviderKey, string[]> = {
  google_business_profile: ['https://www.googleapis.com/auth/business.manage'],
  google_search_console: ['https://www.googleapis.com/auth/webmasters.readonly'],
  google_analytics: ['https://www.googleapis.com/auth/analytics.readonly'],
  google_tag_manager: ['https://www.googleapis.com/auth/tagmanager.readonly'],
};

const GITHUB_SCOPES: Record<GitHubOAuthProviderKey, string[]> = {
  github: ['repo', 'workflow', 'read:user', 'user:email'],
};

export function isGoogleOAuthProvider(providerKey: string): providerKey is GoogleOAuthProviderKey {
  return providerKey in GOOGLE_SCOPES;
}

export function isGitHubOAuthProvider(providerKey: string): providerKey is GitHubOAuthProviderKey {
  return providerKey in GITHUB_SCOPES;
}

export function googleScopesFor(providerKey: GoogleOAuthProviderKey) {
  return GOOGLE_SCOPES[providerKey];
}

export function githubScopesFor(providerKey: GitHubOAuthProviderKey) {
  return GITHUB_SCOPES[providerKey];
}

export function createOAuthState() {
  return crypto.randomBytes(32).toString('base64url');
}

export function googleRedirectUri(origin: string) {
  return `${origin}/admin/integrations/oauth/google/callback`;
}

export function githubRedirectUri(origin: string) {
  return `${origin}/admin/integrations/oauth/github/callback`;
}

export function googleAuthorizationUrl(params: {
  clientId: string;
  origin: string;
  providerKey: GoogleOAuthProviderKey;
  state: string;
}) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', googleRedirectUri(params.origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', googleScopesFor(params.providerKey).join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', params.state);
  return url;
}

export function githubAuthorizationUrl(params: {
  clientId: string;
  origin: string;
  providerKey: GitHubOAuthProviderKey;
  state: string;
}) {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', githubRedirectUri(params.origin));
  url.searchParams.set('scope', githubScopesFor(params.providerKey).join(' '));
  url.searchParams.set('state', params.state);
  url.searchParams.set('allow_signup', 'true');
  return url;
}

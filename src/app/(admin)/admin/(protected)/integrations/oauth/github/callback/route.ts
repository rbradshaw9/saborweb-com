import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/auth';
import { githubRedirectUri, isGitHubOAuthProvider } from '@/lib/admin/oauth';
import { encryptSecret } from '@/lib/security/encryption';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type GitHubTokenResponse = {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET(request: NextRequest) {
  const user = await requireAdminUser();
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (error) {
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/admin/integrations?error=missing_oauth_callback_data', request.url));
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin/integrations?error=missing_github_oauth_client', request.url));
  }

  const supabase = getSupabaseAdmin();
  const { data: connection, error: lookupError } = await supabase
    .from('integration_connections')
    .select('id, provider_key, metadata')
    .eq('connection_type', 'oauth')
    .filter('metadata->>oauth_state', 'eq', state)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError || !connection || !isGitHubOAuthProvider(connection.provider_key)) {
    console.error('[Admin OAuth] Could not match GitHub OAuth state:', lookupError);
    return NextResponse.redirect(new URL('/admin/integrations?error=oauth_state_not_found', request.url));
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'saborweb-integrations/1.0',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: githubRedirectUri(url.origin),
    }),
  });
  const tokenJson = await tokenResponse.json() as GitHubTokenResponse;

  if (!tokenResponse.ok || tokenJson.error || !tokenJson.access_token) {
    const message = tokenJson.error_description || tokenJson.error || `GitHub token exchange failed with HTTP ${tokenResponse.status}.`;
    await supabase
      .from('integration_connections')
      .update({
        status: 'blocked',
        last_error: message,
        metadata: {
          ...asRecord(connection.metadata),
          oauth_error_at: new Date().toISOString(),
          oauth_error_seen_by: user.email,
        },
      })
      .eq('id', connection.id);
    return NextResponse.redirect(new URL('/admin/integrations?error=oauth_token_exchange_failed', request.url));
  }

  const now = new Date();
  const { error: credentialError } = await supabase.from('integration_credentials').insert({
    integration_connection_id: connection.id,
    provider_key: connection.provider_key,
    credential_kind: 'oauth_token',
    secret_ciphertext: encryptSecret(JSON.stringify({
      provider: 'github',
      access_token: tokenJson.access_token,
      token_type: tokenJson.token_type ?? 'bearer',
      scope: tokenJson.scope ?? null,
      obtained_at: now.toISOString(),
    })),
    metadata: {
      connected_from: 'admin_github_oauth',
      connected_by: user.email,
      scope: tokenJson.scope ?? null,
    },
  });

  if (credentialError) {
    console.error('[Admin OAuth] Could not save GitHub OAuth credential:', credentialError);
    return NextResponse.redirect(new URL('/admin/integrations?error=oauth_credential_save_failed', request.url));
  }

  const { error: updateError } = await supabase
    .from('integration_connections')
    .update({
      status: 'connected',
      last_error: null,
      last_sync_at: now.toISOString(),
      metadata: {
        ...asRecord(connection.metadata),
        oauth_state: null,
        oauth_connected_at: now.toISOString(),
        oauth_connected_by: user.email,
        granted_scopes: tokenJson.scope ?? null,
      },
    })
    .eq('id', connection.id);

  if (updateError) {
    console.error('[Admin OAuth] Could not update GitHub OAuth connection:', updateError);
    return NextResponse.redirect(new URL('/admin/integrations?error=oauth_connection_update_failed', request.url));
  }

  return NextResponse.redirect(new URL(`/admin/integrations?connected=${encodeURIComponent(connection.provider_key)}`, request.url));
}

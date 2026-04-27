import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/auth';
import {
  createOAuthState,
  githubAuthorizationUrl,
  googleAuthorizationUrl,
  isGitHubOAuthProvider,
  isGoogleOAuthProvider,
} from '@/lib/admin/oauth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function oauthConfigFor(provider: string) {
  if (isGoogleOAuthProvider(provider)) {
    return {
      oauthProvider: 'google',
      clientId: process.env.GOOGLE_WEB_OAUTH_CLIENT_ID?.trim(),
      missingError: 'missing_google_oauth_client',
      publicLabel: 'Google OAuth',
      setupChecklist: [
        'Authorize with Google OAuth.',
        'Confirm the correct account/location/property.',
        'Run a connection test after authorization.',
      ],
      authorizationUrl: (origin: string, state: string) => googleAuthorizationUrl({
        clientId: process.env.GOOGLE_WEB_OAUTH_CLIENT_ID?.trim() ?? '',
        origin,
        providerKey: provider,
        state,
      }),
    };
  }

  if (isGitHubOAuthProvider(provider)) {
    return {
      oauthProvider: 'github',
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID?.trim(),
      missingError: 'missing_github_oauth_client',
      publicLabel: 'GitHub OAuth',
      setupChecklist: [
        'Authorize SaborWeb with GitHub OAuth.',
        'Confirm the account has access to the SaborWeb repository.',
        'Run a connection test after authorization.',
      ],
      authorizationUrl: (origin: string, state: string) => githubAuthorizationUrl({
        clientId: process.env.GITHUB_OAUTH_CLIENT_ID?.trim() ?? '',
        origin,
        providerKey: provider,
        state,
      }),
    };
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const user = await requireAdminUser();
  const { provider } = await params;
  const config = oauthConfigFor(provider);

  if (!config) {
    return NextResponse.redirect(new URL('/admin/integrations?error=oauth_provider_not_supported', request.url));
  }

  if (!config.clientId) {
    return NextResponse.redirect(new URL(`/admin/integrations?error=${config.missingError}`, request.url));
  }

  const supabase = getSupabaseAdmin();
  const state = createOAuthState();
  const now = new Date().toISOString();
  const metadata = {
    oauth_provider: config.oauthProvider,
    oauth_state: state,
    oauth_started_at: now,
    oauth_started_by: user.email,
  };

  const { data: existing } = await supabase
    .from('integration_connections')
    .select('id, metadata')
    .eq('provider_key', provider)
    .eq('connection_type', 'oauth')
    .neq('status', 'disconnected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const previousMetadata =
      typeof existing.metadata === 'object' && existing.metadata !== null && !Array.isArray(existing.metadata)
        ? existing.metadata
        : {};
    const { error } = await supabase
      .from('integration_connections')
      .update({
        status: 'needs_owner_action',
        last_error: null,
        metadata: {
          ...previousMetadata,
          ...metadata,
        },
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[Admin OAuth] Could not update OAuth connection:', error);
      return NextResponse.redirect(new URL('/admin/integrations?error=oauth_connection_update_failed', request.url));
    }
  } else {
    const { error } = await supabase.from('integration_connections').insert({
      provider_key: provider,
      connection_type: 'oauth',
      status: 'needs_owner_action',
      setup_checklist: config.setupChecklist,
      public_config: {
        label: config.publicLabel,
      },
      metadata,
    });

    if (error) {
      console.error('[Admin OAuth] Could not create OAuth connection:', error);
      return NextResponse.redirect(new URL('/admin/integrations?error=oauth_connection_create_failed', request.url));
    }
  }

  const authUrl = config.authorizationUrl(new URL(request.url).origin, state);

  return NextResponse.redirect(authUrl);
}

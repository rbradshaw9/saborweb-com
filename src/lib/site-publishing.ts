import 'server-only';

import { logSiteEvent } from '@/lib/site-events';
import { absoluteSiteUrl, restaurantSubdomainUrl } from '@/lib/site-rendering';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { updatePromptStudioRevision } from '@/lib/admin/prompt-studio';

type PublishActor = {
  actorType: 'admin' | 'stripe' | 'system';
  actorId?: string | null;
  actorEmail?: string | null;
};

type PublishResult = {
  siteId: string;
  siteVersionId: string;
  deploymentUrl: string | null;
  liveUrl: string;
};

function publicLiveUrl(slug: string, previewUrl: string | null) {
  return restaurantSubdomainUrl(slug) ?? absoluteSiteUrl(previewUrl) ?? `/preview/${slug}`;
}

export async function publishLatestApprovedSiteVersion(params: {
  siteId: string;
  slug: string;
  requestId: string | null;
  previewUrl: string | null;
  actor: PublishActor;
}): Promise<PublishResult> {
  const supabase = getSupabaseAdmin();
  const { data: approvedVersion, error: approvedError } = await supabase
    .from('site_versions')
    .select('id, deployment_url, site_spec_id, status, metadata')
    .eq('site_id', params.siteId)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (approvedError) {
    throw new Error(`Could not load the latest approved site version: ${approvedError.message}`);
  }

  if (!approvedVersion?.id) {
    throw new Error('No approved site version is available to publish.');
  }

  const liveUrl = publicLiveUrl(params.slug, params.previewUrl);
  const publishedAt = new Date().toISOString();

  const { error: versionError } = await supabase
    .from('site_versions')
    .update({
      status: 'published',
      release_channel: 'production',
      published_at: publishedAt,
      published_by: params.actor.actorType === 'admin' ? params.actor.actorId ?? null : null,
      deployment_url: liveUrl,
      metadata: {
        published_via: params.actor.actorType,
        published_actor: params.actor.actorEmail ?? params.actor.actorId ?? null,
      },
    })
    .eq('id', approvedVersion.id);

  if (versionError) {
    throw new Error(`Could not publish the site version: ${versionError.message}`);
  }

  if (approvedVersion.site_spec_id) {
    const { error: specError } = await supabase
      .from('site_specs')
      .update({ status: 'published' })
      .eq('id', approvedVersion.site_spec_id);
    if (specError) {
      console.error('[Site Publishing] Site spec publish failed:', specError);
    }
  }

  const { error: siteError } = await supabase
    .from('restaurant_sites')
    .update({
      status: 'live',
      project_stage: 'paid_live',
      deployment_status: 'live',
      release_channel: 'production',
      live_url: liveUrl,
      preview_released_at: publishedAt,
    })
    .eq('id', params.siteId);

  if (siteError) {
    throw new Error(`Could not update the restaurant site live state: ${siteError.message}`);
  }

  await logSiteEvent({
    eventType: params.actor.actorType === 'admin' ? 'admin_site_version_published' : 'site_version_published',
    siteId: params.siteId,
    requestId: params.requestId,
    actorType: params.actor.actorType,
    actorId: params.actor.actorId ?? undefined,
    message: `${params.slug} published live`,
    metadata: {
      actor_email: params.actor.actorEmail ?? null,
      site_version_id: approvedVersion.id,
      deployment_url: liveUrl,
      published_via: params.actor.actorType,
    },
  });

  const promptRevisionId =
    approvedVersion?.metadata && typeof approvedVersion.metadata === 'object' && !Array.isArray(approvedVersion.metadata)
      ? (approvedVersion.metadata as Record<string, unknown>).prompt_revision_id
      : null;
  if (typeof promptRevisionId === 'string' && promptRevisionId) {
    await updatePromptStudioRevision({
      revisionId: promptRevisionId,
      status: 'published',
      metadata: {
        live_url: liveUrl,
        published_at: publishedAt,
      },
    });
  }

  return {
    siteId: params.siteId,
    siteVersionId: approvedVersion.id,
    deploymentUrl: approvedVersion.deployment_url,
    liveUrl,
  };
}

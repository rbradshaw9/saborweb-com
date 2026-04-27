'use server';

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminUser } from '@/lib/admin/auth';
import { generateAdminBuildPacket } from '@/lib/admin/build-packets';
import { credentialValue, getProviderCredential } from '@/lib/admin/credentials';
import { getAdminSiteDetail } from '@/lib/admin/dashboard';
import { GENERATED_SITE_REGISTRY } from '@/generated-sites/registry';
import {
  addMonitoringBreadcrumb,
  captureMonitoringException,
  initSentry,
} from '@/lib/monitoring/sentry';
import { createPromptStudioRevision } from '@/lib/admin/prompt-studio';
import {
  readResearchReviewState,
  summarizeResearchReview,
  type MenuDisplayMode,
  type ResearchReviewDecisionState,
  type ReviewWizardStep,
} from '@/lib/admin/research-review';
import { persistResolvedMenu, type ResolvedMenuFallbackMode, type ResolvedMenuStatus } from '@/lib/admin/menu-research';
import { type ResolvedSiteBrief } from '@/lib/admin/site-brief';
import { slugifyProjectValue } from '@/lib/admin/slugs';
import { generatedSiteRegistrySource } from '@/lib/generated-sites';
import { publishLatestApprovedSiteVersion } from '@/lib/site-publishing';
import { logSiteEvent } from '@/lib/site-events';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const SITE_STATUSES = new Set([
  'draft',
  'preview_building',
  'preview_ready',
  'claim_started',
  'claimed',
  'paid',
  'live',
  'archived',
]);

const OWNER_STATUSES = new Set(['unclaimed', 'claim_started', 'claimed']);
const PAYMENT_STATUSES = new Set(['unpaid', 'checkout_started', 'paid', 'failed', 'refunded', 'cancelled']);
const PACKAGE_KEYS = new Set(['presencia', 'visibilidad', 'crecimiento']);
const PROJECT_STAGES = new Set([
  'request_received',
  'collecting_evidence',
  'ai_audit',
  'resolved_profile_ready',
  'admin_review_required',
  'researching',
  'needs_info',
  'build_packet_ready',
  'building',
  'qa_failed',
  'ready_for_admin_review',
  'preview_sent',
  'viewed',
  'claim_started',
  'paid_live',
  'reclaim_cancelled',
  'archived',
]);
const AUTOMATION_MODES = new Set(['paused', 'admin_approval_required', 'research_only', 'packet_only', 'admin_gate', 'trusted_full_auto']);
const RELEASE_CHANNELS = new Set(['development', 'preview', 'staging', 'production']);
const LEGACY_PROJECT_STAGE_FALLBACK: Record<string, string> = {
  collecting_evidence: 'researching',
  ai_audit: 'researching',
  resolved_profile_ready: 'researching',
  admin_review_required: 'researching',
};

function readAllowed(formData: FormData, key: string, allowed: Set<string>) {
  const value = String(formData.get(key) ?? '');
  return allowed.has(value) ? value : null;
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function productionDeployBranch() {
  return process.env.SABORWEB_PRODUCTION_BRANCH || process.env.GITHUB_PRODUCTION_BRANCH || 'main';
}

function githubRepoParts() {
  const fullName = process.env.GITHUB_REPO_FULL_NAME;
  if (fullName?.includes('/')) {
    const [owner, repo] = fullName.split('/');
    return { owner, repo };
  }
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  return owner && repo ? { owner, repo } : null;
}

async function githubApi(path: string, params: {
  method?: string;
  body?: Record<string, unknown>;
  token: string;
}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: params.method ?? 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
    cache: 'no-store',
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub API ${params.method ?? 'GET'} ${path} failed: ${JSON.stringify(json)}`);
  return asRecord(json);
}

async function removeGeneratedSiteFromGitHub(slug: string) {
  const repo = githubRepoParts();
  const credential = await getProviderCredential('github');
  const token =
    credentialValue(credential.secret, 'GITHUB_REPO_TOKEN') ||
    credentialValue(credential.secret, 'GITHUB_TOKEN') ||
    process.env.GITHUB_REPO_TOKEN ||
    process.env.GITHUB_TOKEN ||
    null;
  const branch = productionDeployBranch();
  if (!repo || !token) {
    return {
      committed: false,
      blocked: true,
      branch,
      reason: repo ? 'missing_github_repo_token' : 'missing_github_repo',
    };
  }

  const nextRegistry = { ...GENERATED_SITE_REGISTRY };
  delete nextRegistry[slug];
  const files = [
    {
      path: `src/generated-sites/${slug}/site.json`,
      mode: '100644',
      type: 'blob',
      sha: null,
    },
    {
      path: 'src/generated-sites/registry.ts',
      mode: '100644',
      type: 'blob',
      content: generatedSiteRegistrySource(nextRegistry),
    },
  ];

  const ref = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/ref/heads/${encodeURIComponent(branch)}`,
    { token },
  );
  const headSha = cleanString(asRecord(ref.object).sha);
  if (!headSha) throw new Error(`Could not resolve ${branch} branch head before removing generated site files.`);

  const headCommit = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/commits/${encodeURIComponent(headSha)}`,
    { token },
  );
  const baseTreeSha = cleanString(asRecord(headCommit.tree).sha);
  if (!baseTreeSha) throw new Error(`Could not resolve ${branch} tree before removing generated site files.`);

  const tree = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/trees`,
    {
      method: 'POST',
      token,
      body: {
        base_tree: baseTreeSha,
        tree: files,
      },
    },
  );
  const treeSha = cleanString(tree.sha);
  if (!treeSha) throw new Error('GitHub did not return a tree SHA for generated site cleanup.');

  const commit = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/commits`,
    {
      method: 'POST',
      token,
      body: {
        message: `Remove ${slug} generated preview artifact`,
        tree: treeSha,
        parents: [headSha],
      },
    },
  );
  const commitSha = cleanString(commit.sha);
  if (!commitSha) throw new Error('GitHub did not return a commit SHA for generated site cleanup.');

  await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: 'PATCH',
      token,
      body: {
        sha: commitSha,
        force: false,
      },
    },
  );

  return {
    committed: true,
    blocked: false,
    branch,
    commitSha,
    repo: `${repo.owner}/${repo.repo}`,
    files: files.map((file) => file.path),
  };
}

function siteRootHost() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://saborweb.com';
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'saborweb.com';
  }
}

function vercelProjectKey() {
  return process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME || null;
}

async function removeVercelProjectDomain(domain: string) {
  const credential = await getProviderCredential('vercel');
  const token = credentialValue(credential.secret, 'VERCEL_API_TOKEN') || process.env.VERCEL_API_TOKEN || null;
  const project = vercelProjectKey();
  if (!token || !project) {
    return { domain, removed: false, skipped: true, reason: token ? 'missing_vercel_project_id' : 'missing_vercel_token' };
  }

  const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`);
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) url.searchParams.set('teamId', teamId);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  const json = await response.json().catch(() => ({}));
  if (response.ok) return { domain, removed: true, result: json };
  const message = JSON.stringify(json).toLowerCase();
  if (response.status === 404 || message.includes('not found')) {
    return { domain, removed: false, alreadyMissing: true };
  }
  throw new Error(`Vercel domain delete failed for ${domain}: ${JSON.stringify(json)}`);
}

export async function updateSiteStatus(slug: string, formData: FormData) {
  const user = await requireAdminUser();
  const status = readAllowed(formData, 'status', SITE_STATUSES);
  const ownerStatus = readAllowed(formData, 'owner_status', OWNER_STATUSES);
  const paymentStatus = readAllowed(formData, 'payment_status', PAYMENT_STATUSES);
  const selectedPackage = readAllowed(formData, 'selected_package', PACKAGE_KEYS);
  const projectStage = readAllowed(formData, 'project_stage', PROJECT_STAGES);
  const automationMode = readAllowed(formData, 'automation_mode', AUTOMATION_MODES);
  const releaseChannel = readAllowed(formData, 'release_channel', RELEASE_CHANNELS);

  if (!status || !ownerStatus || !paymentStatus) {
    throw new Error('Invalid site status update.');
  }

  const supabase = getSupabaseAdmin();
  const { data: site, error: lookupError } = await supabase
    .from('restaurant_sites')
    .select('id, request_id')
    .eq('slug', slug)
    .single();

  if (lookupError || !site) {
    console.error('[Admin Site] Status lookup failed:', lookupError);
    throw new Error('Could not find site.');
  }

  const { error } = await supabase
    .from('restaurant_sites')
    .update({
      status,
      owner_status: ownerStatus,
      payment_status: paymentStatus,
      selected_package: selectedPackage,
      ...(projectStage ? { project_stage: projectStage } : {}),
      ...(automationMode ? { automation_mode: automationMode } : {}),
      ...(releaseChannel ? { release_channel: releaseChannel } : {}),
    })
    .eq('id', site.id);

  if (error) {
    console.error('[Admin Site] Status update failed:', error);
    throw new Error('Could not update site status.');
  }

  await logSiteEvent({
    eventType: 'admin_site_status_updated',
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'admin',
    actorId: user.id,
    message: `Admin updated ${slug} status`,
    metadata: {
      status,
      owner_status: ownerStatus,
      payment_status: paymentStatus,
      selected_package: selectedPackage,
      project_stage: projectStage,
      automation_mode: automationMode,
      release_channel: releaseChannel,
      admin_email: user.email,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function createSiteRecordForRequest(slug: string) {
  const user = await requireAdminUser();
  const detail = await getAdminSiteDetail(slug);

  if (!detail?.request) {
    throw new Error('Could not find a preview request for this admin item.');
  }

  if (detail.site) {
    revalidatePath('/admin');
    revalidatePath(`/admin/sites/${detail.site.slug}`);
    return;
  }

  const request = detail.request;
  const supabase = getSupabaseAdmin();
  const previewUrl = `/preview/${request.client_slug}`;
  const claimUrl = `/claim/${request.client_slug}`;

  const { data: site, error } = await supabase
    .from('restaurant_sites')
    .insert({
      request_id: request.id,
      slug: request.client_slug,
      restaurant_name: request.restaurant_name,
      city: request.city,
      preview_type: 'native',
      preview_url: previewUrl,
      external_preview_url: null,
      claim_url: claimUrl,
      status: 'draft',
      owner_name: request.owner_name,
      owner_email: request.email,
      owner_phone: request.phone,
      owner_status: 'unclaimed',
      payment_status: 'unpaid',
      metadata: {
        repaired_from_admin: true,
        source: request.source,
        preferred_language: request.preferred_language,
      },
    })
    .select('id')
    .single();

  if (error || !site) {
    console.error('[Admin Site] Site repair failed:', error);
    throw new Error('Could not create a site record for this request.');
  }

  await logSiteEvent({
    eventType: 'admin_site_record_created',
    siteId: site.id,
    requestId: request.id,
    actorType: 'admin',
    actorId: user.id,
    message: `Admin created site record for ${request.client_slug}`,
    metadata: {
      admin_email: user.email,
      preview_url: previewUrl,
      claim_url: claimUrl,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${request.client_slug}`);
}

export async function generateBuildPacket(slug: string) {
  const user = await requireAdminUser();
  initSentry('server');
  const detail = await getAdminSiteDetail(slug);

  if (!detail) {
    throw new Error('Could not find this admin item.');
  }
  if (!detail.researchAudit || !detail.resolvedProfile || detail.researchReview.blockers.length) {
    addMonitoringBreadcrumb({
      category: 'admin.build_packet',
      message: 'Build packet generation blocked',
      data: {
        slug,
        hasResearchAudit: Boolean(detail.researchAudit),
        hasResolvedProfile: Boolean(detail.resolvedProfile),
        reviewReady: detail.researchReview.readyForPacket,
        overrideStatus: detail.researchReview.overrideStatus,
        blockers: detail.researchReview.blockers,
      },
    });
    throw new Error(detail.researchReview.blockers[0] ?? 'Research audit and resolved profile must be complete before generating the build packet.');
  }

  await generateAdminBuildPacket(detail, user);

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

function nullableString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  if (!value.length) return null;
  if (/^(none|none yet|non yet|not yet|n\/a|na|null|unknown|not provided|undefined)$/i.test(value)) return null;
  return value;
}

function normalizeUrl(value: string | null) {
  if (!value) return null;
  if (/^(none|none yet|non yet|not yet|n\/a|na|null|unknown|not provided|undefined)$/i.test(value.trim())) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return value;
}

function validateOptionalHttpUrl(value: string | null, label: string) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    throw new Error(`${label} must start with http:// or https://.`);
  }

  try {
    const parsed = new URL(value);
    if (!parsed.hostname || !/\./.test(parsed.hostname)) {
      throw new Error('missing hostname');
    }
    return parsed.toString();
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
}

function checked(formData: FormData, key: string) {
  return String(formData.get(key) ?? '') === 'on';
}

function formValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim()))];
}

function isProjectStageConstraintError(error: { message?: string; details?: string; hint?: string } | null | undefined) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase();
  return text.includes('project_stage') && (text.includes('check constraint') || text.includes('violates check constraint'));
}

async function updateProjectStageWithFallback(params: {
  siteId: string;
  projectStage: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const attempt = await supabase
    .from('restaurant_sites')
    .update({
      project_stage: params.projectStage,
      metadata: params.metadata,
    })
    .eq('id', params.siteId);

  if (!attempt.error) return null;
  if (!isProjectStageConstraintError(attempt.error)) return attempt.error;

  const fallback = LEGACY_PROJECT_STAGE_FALLBACK[params.projectStage];
  if (!fallback) return attempt.error;

  const fallbackAttempt = await supabase
    .from('restaurant_sites')
    .update({
      project_stage: fallback,
      metadata: params.metadata,
    })
    .eq('id', params.siteId);

  return fallbackAttempt.error;
}

function sourceTypeForManualUrl(url: string | null) {
  const value = (url ?? '').toLowerCase();
  if (/(instagram\.com|instagr\.am)/.test(value)) return 'instagram';
  if (/(facebook\.com|fb\.com)/.test(value)) return 'facebook';
  if (/(menu|allmenus|menupix|singleplatform|toasttab|doordash|ubereats|grubhub|seamless|chownow)/.test(value)) return 'menu';
  if (/(share\.google|google\.com\/maps|maps\.google)/.test(value)) return 'google_business';
  return 'website';
}

function normalizedSeedSource(sourceType: string, url: string | null) {
  const inferred = sourceTypeForManualUrl(url);
  if (sourceType === 'website' && inferred !== 'website') return inferred;
  if (sourceType === 'menu' && inferred !== 'menu') return inferred;
  return sourceType;
}

function sourceRowsFromManualInputs(inputs: {
  websiteUrl: string | null;
  googleUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  menuUrl: string | null;
}) {
  return [
    { source_type: sourceTypeForManualUrl(inputs.websiteUrl), url: inputs.websiteUrl, title: 'Website' },
    { source_type: 'google_business', url: inputs.googleUrl, title: 'Google Business Profile' },
    { source_type: 'instagram', url: inputs.instagramUrl, title: 'Instagram' },
    { source_type: 'facebook', url: inputs.facebookUrl, title: 'Facebook' },
    { source_type: sourceTypeForManualUrl(inputs.menuUrl), url: inputs.menuUrl, title: 'Menu' },
  ].filter((source) => Boolean(source.url));
}

function hashJson(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function outputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];

  for (const item of output) {
    const content =
      typeof item === 'object' && item !== null && 'content' in item
        ? (item as { content?: unknown }).content
        : null;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part === 'object' && part !== null && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
        return (part as { text: string }).text;
      }
    }
  }

  return '';
}

function promptStudioSiteBriefSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['outputSummary', 'siteBrief'],
    properties: {
      outputSummary: { type: 'string' },
      siteBrief: {
        type: 'object',
        additionalProperties: false,
        required: [
          'version',
          'summary',
          'siteIntent',
          'positioning',
          'hero',
          'sections',
          'visualDirection',
          'copyDirection',
          'moduleUsage',
          'editableOwnership',
          'operatorNotes',
        ],
        properties: {
          version: { type: 'integer', enum: [1] },
          summary: { type: 'string' },
          siteIntent: { type: 'string' },
          positioning: { type: 'string' },
          hero: {
            type: 'object',
            additionalProperties: false,
            required: ['headline', 'subheadline', 'primaryCtaLabel', 'secondaryCtaLabel'],
            properties: {
              eyebrow: { type: ['string', 'null'] },
              headline: { type: 'string' },
              subheadline: { type: 'string' },
              primaryCtaLabel: { type: 'string' },
              secondaryCtaLabel: { type: ['string', 'null'] },
            },
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'title', 'body'],
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                body: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          visualDirection: {
            type: 'object',
            additionalProperties: false,
            required: ['themePreset', 'fontPreset', 'moodWords', 'colorNotes', 'typographyTone'],
            properties: {
              themePreset: { type: 'string', enum: ['coastal_bright', 'sunny_editorial', 'tropical_modern', 'classic_neutral'] },
              fontPreset: { type: 'string', enum: ['clean_sans', 'editorial_serif', 'friendly_modern', 'coastal_mix'] },
              moodWords: { type: 'array', items: { type: 'string' } },
              colorNotes: { type: 'array', items: { type: 'string' } },
              typographyTone: { type: 'string' },
            },
          },
          copyDirection: {
            type: 'object',
            additionalProperties: false,
            required: ['tone', 'seoKeywords'],
            properties: {
              tone: { type: 'string' },
              seoKeywords: { type: 'array', items: { type: 'string' } },
            },
          },
          moduleUsage: {
            type: 'object',
            additionalProperties: false,
            required: ['menu', 'hours', 'gallery', 'contact'],
            properties: {
              menu: { type: 'string', enum: ['customer_portal'] },
              hours: { type: 'string', enum: ['customer_portal'] },
              gallery: { type: 'string', enum: ['operator_managed'] },
              contact: { type: 'string', enum: ['operator_managed'] },
            },
          },
          editableOwnership: {
            type: 'object',
            additionalProperties: false,
            required: ['customerManaged', 'operatorManaged'],
            properties: {
              customerManaged: { type: 'array', items: { type: 'string' } },
              operatorManaged: { type: 'array', items: { type: 'string' } },
            },
          },
          operatorNotes: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  };
}

function promptStudioLinks(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '');
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function getSiteForAction(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data: site, error } = await supabase
    .from('restaurant_sites')
    .select('id, request_id, restaurant_name, slug, preview_url')
    .eq('slug', slug)
    .single();

  if (error || !site) {
    console.error('[Admin Site] Action site lookup failed:', error);
    throw new Error('Could not find site.');
  }

  return site;
}

async function queueOperationalRun(params: {
  slug: string;
  taskType: 'research_collect' | 'ai_review' | 'build_brief' | 'build_packet' | 'code_build' | 'deploy' | 'qa' | 'sales_followup';
  provider: string;
  model?: string | null;
  queuedBy: string | null | undefined;
  metadata?: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
}) {
  const site = await getSiteForAction(params.slug);
  const supabase = getSupabaseAdmin();
  const existingRun = await supabase
    .from('agent_runs')
    .select('id')
    .eq('site_id', site.id)
    .eq('task_type', params.taskType)
    .in('status', ['queued', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRun.data?.id) {
    return {
      site,
      run: {
        id: existingRun.data.id,
      },
    };
  }

  const progressLabel = params.taskType.replaceAll('_', ' ');
  const metadata = {
    queued_by: params.queuedBy,
    slug: params.slug,
    workflow_step: params.taskType,
    retry_count: 0,
    progress: {
      task_type: params.taskType,
      percent: 5,
      label: `Queued ${progressLabel}`,
      detail: 'Waiting for the worker to start.',
      status: 'queued',
      updated_at: new Date().toISOString(),
    },
    progress_history: [
      {
        percent: 5,
        label: `Queued ${progressLabel}`,
        detail: 'Waiting for the worker to start.',
        status: 'queued',
        updated_at: new Date().toISOString(),
      },
    ],
    ...(params.metadata ?? {}),
  };
  const { data: run, error } = await supabase.from('agent_runs').insert({
    site_id: site.id,
    request_id: site.request_id,
    task_type: params.taskType,
    provider: params.provider,
    model: params.model ?? null,
    status: 'queued',
    input_hash: hashJson(metadata),
    artifacts: params.artifacts ?? {},
    metadata,
  }).select('id').single();

  if (error || !run) {
    console.error('[Admin Site] Operational run queue failed:', error);
    throw new Error(`Could not queue ${params.taskType.replaceAll('_', ' ')}.`);
  }

  await logSiteEvent({
    eventType: `admin_${params.taskType}_queued`,
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'admin',
    message: `Admin queued ${params.taskType.replaceAll('_', ' ')} for ${site.restaurant_name}`,
    metadata: {
      admin_email: params.queuedBy,
      provider: params.provider,
      agent_run_id: run.id,
    },
  });

  const { data: existingSite } = await supabase
    .from('restaurant_sites')
    .select('metadata')
    .eq('id', site.id)
    .maybeSingle();

  await supabase.from('restaurant_sites').update({
    metadata: {
      ...((existingSite?.metadata && typeof existingSite.metadata === 'object' && !Array.isArray(existingSite.metadata)) ? existingSite.metadata : {}),
      current_operation: {
        task_type: params.taskType,
        percent: 5,
        label: `Queued ${progressLabel}`,
        detail: 'Waiting for the worker to start.',
        status: 'queued',
        updated_at: new Date().toISOString(),
      },
    },
  }).eq('id', site.id);

  return { site, run };
}

export async function createManualProject(formData: FormData) {
  const user = await requireAdminUser();
  const restaurantName = nullableString(formData, 'restaurant_name');
  const city = nullableString(formData, 'city');
  const requestedSlug = nullableString(formData, 'slug');

  if (!restaurantName) throw new Error('Restaurant name is required.');

  const slug = slugifyProjectValue(requestedSlug || restaurantName);
  if (!slug) throw new Error('Could not create a valid slug for this project.');

  const supabase = getSupabaseAdmin();
  const ownerName = nullableString(formData, 'owner_name');
  const ownerEmail = nullableString(formData, 'owner_email');
  const ownerPhone = nullableString(formData, 'owner_phone');
  const websiteUrl = validateOptionalHttpUrl(nullableString(formData, 'website_url'), 'Website');
  const googleUrl = normalizeUrl(nullableString(formData, 'google_url'));
  const instagramUrl = normalizeUrl(nullableString(formData, 'instagram_url'));
  const facebookUrl = normalizeUrl(nullableString(formData, 'facebook_url'));
  const menuUrl = normalizeUrl(nullableString(formData, 'menu_url'));
  const address = nullableString(formData, 'address');
  const projectPrompt = nullableString(formData, 'project_prompt');
  const notes = projectPrompt ?? nullableString(formData, 'notes');
  const previewUrl = `/preview/${slug}`;
  const claimUrl = `/claim/${slug}`;

  const [existingSite, existingRequest] = await Promise.all([
    supabase.from('restaurant_sites').select('id').eq('slug', slug).limit(1).maybeSingle(),
    supabase.from('preview_requests').select('id').eq('client_slug', slug).limit(1).maybeSingle(),
  ]);

  if (existingSite.error) {
    console.error('[Admin Site] Manual project site slug check failed:', existingSite.error);
    throw new Error('Could not verify slug availability.');
  }

  if (existingRequest.error) {
    console.error('[Admin Site] Manual project request slug check failed:', existingRequest.error);
    throw new Error('Could not verify slug availability.');
  }

  if (existingSite.data || existingRequest.data) {
    throw new Error('That slug is already in use.');
  }

  const { data: site, error } = await supabase
    .from('restaurant_sites')
    .insert({
      slug,
      restaurant_name: restaurantName,
      city,
      preview_type: 'native',
      preview_url: previewUrl,
      claim_url: claimUrl,
      status: 'draft',
      project_stage: 'collecting_evidence',
      automation_mode: 'trusted_full_auto',
      release_channel: 'preview',
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      owner_status: 'unclaimed',
      payment_status: 'unpaid',
      metadata: {
        source: 'admin_manual_project',
        address,
        website_url: websiteUrl,
        google_url: googleUrl,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        menu_url: menuUrl,
        notes,
        project_prompt: projectPrompt,
        research_seed_sources: sourceRowsFromManualInputs({ websiteUrl, googleUrl, instagramUrl, facebookUrl, menuUrl }),
      },
    })
    .select('id')
    .single();

  if (error || !site) {
    console.error('[Admin Site] Manual project create failed:', error);
    throw new Error(error?.code === '23505' ? 'That slug is already in use.' : 'Could not create manual project.');
  }

  await logSiteEvent({
    eventType: 'admin_manual_project_created',
    siteId: site.id,
    actorType: 'admin',
    actorId: user.id,
    message: `Admin created manual project for ${restaurantName}`,
    metadata: {
      admin_email: user.email,
      slug,
      website_url: websiteUrl,
      google_url: googleUrl,
      instagram_url: instagramUrl,
      project_prompt: projectPrompt,
    },
  });

  const seedSources = sourceRowsFromManualInputs({ websiteUrl, googleUrl, instagramUrl, facebookUrl, menuUrl });
  const { run } = await queueOperationalRun({
    slug,
    taskType: 'research_collect',
    provider: 'apify',
    queuedBy: user.email,
    metadata: {
      queued_from: 'manual_project_create',
    },
    artifacts: {
      seed_sources: seedSources,
      expected_outputs: ['research_sources', 'extracted_facts', 'missing_items', 'asset_candidates'],
    },
  });

  if (seedSources.length) {
    const { error: sourceError } = await supabase.from('research_sources').insert(seedSources.map((source) => ({
      site_id: site.id,
      request_id: null,
      agent_run_id: run.id,
      source_type: normalizedSeedSource(source.source_type, source.url),
      url: source.url,
      title: source.title ?? null,
      confidence: 0,
      metadata: {
        seeded_from: 'admin_manual_project',
        queued_by: user.email,
      },
    })));

    if (sourceError) {
      console.error('[Admin Site] Manual project seed source save failed:', sourceError);
    }
  }

  const stageError = await updateProjectStageWithFallback({
    siteId: site.id,
    projectStage: 'collecting_evidence',
    metadata: {
      source: 'admin_manual_project',
      address,
      website_url: websiteUrl,
      google_url: googleUrl,
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      menu_url: menuUrl,
      notes,
      project_prompt: projectPrompt,
      research_seed_sources: seedSources,
      research_pipeline: {
        current_phase: 'collecting_evidence',
        phase_history: [
          {
            phase: 'collecting_evidence',
            label: 'Queued research',
            detail: 'We are gathering links, facts, menu clues, and assets for this restaurant.',
            status: 'queued',
            updated_at: new Date().toISOString(),
          },
        ],
      },
      current_operation: {
        task_type: 'research_collect',
        percent: 5,
        label: 'Queued research',
        detail: 'We are gathering links, facts, menu clues, and assets for this restaurant.',
        status: 'queued',
        phase: 'collecting_evidence',
        updated_at: new Date().toISOString(),
      },
    },
  });

  if (stageError) {
    console.error('[Admin Site] Manual project research stage update failed:', stageError);
  }

  revalidatePath('/admin');
  redirect(`/admin/sites/${slug}`);
}

export async function queueResearchRun(slug: string) {
  const user = await requireAdminUser();
  initSentry('server');
  const supabase = getSupabaseAdmin();
  const { data: site, error: lookupError } = await supabase
    .from('restaurant_sites')
    .select('id, request_id, restaurant_name, city, owner_name, owner_email, owner_phone, metadata')
    .eq('slug', slug)
    .single();

  if (lookupError || !site) {
    console.error('[Admin Site] Research queue lookup failed:', lookupError);
    throw new Error('Could not find site.');
  }
  const existingRun = await supabase
    .from('agent_runs')
    .select('id')
    .eq('site_id', site.id)
    .in('task_type', ['research_collect', 'research'])
    .in('status', ['queued', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRun.data?.id) {
    revalidatePath('/admin');
    revalidatePath(`/admin/sites/${slug}`);
    return;
  }
  const metadata = typeof site.metadata === 'object' && site.metadata !== null && !Array.isArray(site.metadata)
    ? site.metadata as Record<string, unknown>
    : {};
  const seedSources = Array.isArray(metadata.research_seed_sources)
    ? metadata.research_seed_sources.filter((source): source is { source_type: string; url: string; title?: string } => {
        return typeof source === 'object' && source !== null && 'url' in source && typeof source.url === 'string';
      })
    : [];
  const researchInput = {
    restaurant_name: site.restaurant_name,
    city: site.city,
    owner: {
      name: site.owner_name,
      email: site.owner_email,
      phone: site.owner_phone,
    },
    slug,
    seed_sources: seedSources,
    admin_notes: metadata.notes ?? null,
    address: metadata.address ?? null,
    goals: [
      'Find official restaurant facts: address, hours, phone, cuisine, menu, ordering/reservations, social links, and brand assets.',
      'Capture source URLs and confidence for each extracted fact.',
      'Flag missing or uncertain facts instead of guessing.',
      'Prepare data for the AI build-packet interpreter.',
    ],
  };

  const { data: run, error: runError } = await supabase.from('agent_runs').insert({
    site_id: site.id,
    request_id: site.request_id,
    task_type: 'research_collect',
    provider: 'apify',
    status: 'queued',
    input_hash: hashJson(researchInput),
    artifacts: {
      seed_sources: seedSources,
      expected_outputs: ['research_sources', 'extracted_facts', 'missing_items', 'asset_candidates'],
    },
    metadata: {
      queued_by: user.email,
      slug,
      research_input: researchInput,
      workflow_step: 'research_collect',
      retry_count: 0,
      progress: {
        task_type: 'research_collect',
        percent: 5,
        label: 'Queued research',
        detail: 'Waiting for the worker to start discovery and crawling.',
        status: 'queued',
        phase: 'collecting_evidence',
        updated_at: new Date().toISOString(),
      },
      progress_history: [
        {
          percent: 5,
          label: 'Queued research',
          detail: 'Waiting for the worker to start discovery and crawling.',
          status: 'queued',
          phase: 'collecting_evidence',
          updated_at: new Date().toISOString(),
        },
      ],
    },
  }).select('id').single();

  if (runError || !run) {
    console.error('[Admin Site] Research run insert failed:', runError);
    throw new Error('Could not queue research. Has the autonomous platform migration been applied?');
  }

  if (seedSources.length) {
    const { error: sourceError } = await supabase.from('research_sources').insert(seedSources.map((source) => ({
      site_id: site.id,
      request_id: site.request_id,
      agent_run_id: run.id,
      source_type: normalizedSeedSource(source.source_type, source.url),
      url: source.url,
      title: source.title ?? null,
      confidence: 0,
      metadata: {
        seeded_from: 'admin_manual_project',
        queued_by: user.email,
      },
    })));

    if (sourceError) {
      console.error('[Admin Site] Research source seed failed:', sourceError);
    }
  }

  const { error: updateError } = {
    error: await updateProjectStageWithFallback({
      siteId: site.id,
      projectStage: 'collecting_evidence',
      metadata: {
        ...metadata,
        research_pipeline: {
          current_phase: 'collecting_evidence',
          phase_history: [
            {
              phase: 'collecting_evidence',
              label: 'Queued research',
              detail: 'Waiting for the worker to start discovery and crawling.',
              status: 'queued',
              updated_at: new Date().toISOString(),
            },
          ],
        },
        current_operation: {
          task_type: 'research_collect',
          percent: 5,
          label: 'Queued research',
          detail: 'Waiting for the worker to start discovery and crawling.',
          status: 'queued',
          phase: 'collecting_evidence',
          updated_at: new Date().toISOString(),
        },
      },
    }),
  };

  if (updateError) {
    console.error('[Admin Site] Research stage update failed:', updateError);
    throw new Error('Research queued, but project stage could not be updated.');
  }

  await logSiteEvent({
    eventType: 'admin_research_queued',
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'admin',
    actorId: user.id,
    message: `Research queued for ${site.restaurant_name}`,
    metadata: {
      admin_email: user.email,
      provider: 'apify',
      seed_source_count: seedSources.length,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function queueBuildPacketRun(slug: string) {
  const user = await requireAdminUser();
  initSentry('server');
  const detail = await getAdminSiteDetail(slug);
  if (!detail?.site) throw new Error('Could not find site.');
  const packetBlockers = [...detail.researchReview.blockers];
  if (detail.researchAudit && detail.researchAudit.summary.buildable === false) {
    packetBlockers.unshift(
      detail.researchAudit.summary.rationale || 'AI research marked this project as not buildable yet.',
    );
  }
  if ((!detail.researchAudit && !detail.resolvedProfile) || packetBlockers.length) {
    throw new Error(packetBlockers[0] ?? 'AI research must produce a saved audit or resolved profile before queuing the build packet.');
  }
  const { site } = await queueOperationalRun({
    slug,
    taskType: 'build_brief',
    provider: 'openai',
    queuedBy: user.email,
  });

  const supabase = getSupabaseAdmin();
  await supabase.from('restaurant_sites').update({ project_stage: 'resolved_profile_ready' }).eq('id', site.id);
  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function applyPromptStudioRevision(slug: string, formData: FormData) {
  const user = await requireAdminUser();
  initSentry('server');
  const detail = await getAdminSiteDetail(slug, { tab: 'overview' });
  if (!detail?.site) throw new Error('Could not find site.');

  const promptText = nullableString(formData, 'prompt_text');
  if (!promptText) throw new Error('Describe the change you want to make.');

  const attachedLinks = promptStudioLinks(formData, 'reference_links');
  const credential = await getProviderCredential('openai');
  const apiKey = credential.secret;
  if (!apiKey) {
    throw new Error('Missing OpenAI credentials. Connect OpenAI before using Prompt Studio.');
  }

  const supabase = getSupabaseAdmin();
  const { data: latestVersion } = await supabase
    .from('site_versions')
    .select('id, site_spec_id, status')
    .eq('site_id', detail.site.id)
    .in('status', ['published', 'approved', 'staged'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const studioInput = {
    restaurant: {
      slug: detail.slug,
      name: detail.resolvedProfile?.restaurantName ?? detail.site.restaurant_name,
      city: detail.resolvedProfile?.city ?? detail.site.city,
      summary: detail.siteBrief.summary,
    },
    currentSiteBrief: detail.siteBrief,
    currentFacts: detail.resolvedProfile,
    currentMenu: {
      status: detail.resolvedMenu?.status ?? 'no_menu_found',
      provenanceMode: detail.resolvedMenu?.provenanceMode ?? 'source_backed',
      categories: detail.resolvedMenu?.categories.map((category) => ({
        name: category.name,
        itemCount: category.items.length,
        items: category.items.slice(0, 8).map((item) => ({
          name: item.name,
          description: item.description,
          priceText: item.priceText,
        })),
      })) ?? [],
    },
    currentAssets: {
      logo: detail.researchReview.canonicalLogo
        ? {
            assetUrl: detail.researchReview.canonicalLogo.assetUrl,
            sourceType: detail.researchReview.canonicalLogo.sourceType,
          }
        : null,
      photos: detail.researchReview.approvedPhotos.slice(0, 6).map((asset) => ({
        assetUrl: asset.assetUrl,
        sourceType: asset.sourceType,
      })),
    },
    guardrails: {
      customerManaged: ['menu', 'hours'],
      operatorManaged: ['homepage copy', 'about/story', 'layout', 'hero treatment', 'gallery curation', 'visual direction', 'CTA strategy', 'SEO copy', 'brand presentation'],
      rules: [
        'Do not change ownership: menu and hours remain customer-managed structured data.',
        'Do not rewrite factual restaurant identity unless the operator prompt explicitly asks for it.',
        'Use real restaurant imagery first and do not invent restaurant-specific photography.',
        'Return a decisive site brief that can drive the next preview.',
      ],
    },
    operatorPrompt: promptText,
    attachedLinks,
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.5',
      input: [
        {
          role: 'system',
          content:
            'You are SaborWeb Prompt Studio. Update the current site brief for a restaurant website based on an operator request. Keep the restaurant facts stable unless the request explicitly changes them. Menu and hours stay customer-managed and must remain wired to structured data. The output should be a normalized site brief for the next preview, not code and not a research memo. The brief should be decisive, polished, and implementation-ready for the shared renderer.',
        },
        {
          role: 'user',
          content: JSON.stringify(studioInput, null, 2),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'saborweb_prompt_studio_revision',
          strict: true,
          schema: promptStudioSiteBriefSchema(),
        },
      },
    }),
  });

  const json = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof json.error === 'object' && json.error !== null && 'message' in json.error
        ? String((json.error as { message?: unknown }).message)
        : 'Prompt Studio could not generate a new site brief.';
    throw new Error(message);
  }

  const text = outputText(json);
  if (!text) throw new Error('Prompt Studio returned no structured output.');
  const parsed = JSON.parse(text) as { outputSummary?: string; siteBrief?: ResolvedSiteBrief };
  if (!parsed.siteBrief || !parsed.outputSummary) {
    throw new Error('Prompt Studio returned an incomplete site brief.');
  }

  const revision = await createPromptStudioRevision({
    siteId: detail.site.id,
    promptText,
    attachedLinks,
    outputSummary: parsed.outputSummary,
    model: process.env.OPENAI_MODEL || 'gpt-5.5',
    sourceSiteSpecId: latestVersion?.site_spec_id ?? null,
    sourceSiteVersionId: latestVersion?.id ?? null,
    metadata: {
      operator_email: user.email,
    },
  });

  const currentMetadata =
    detail.site.metadata && typeof detail.site.metadata === 'object' && !Array.isArray(detail.site.metadata)
      ? (detail.site.metadata as Record<string, unknown>)
      : {};
  const { error: metadataError } = await supabase
    .from('restaurant_sites')
    .update({
      metadata: {
        ...currentMetadata,
        resolved_site_brief: parsed.siteBrief,
        prompt_studio_last_summary: parsed.outputSummary,
        current_operation: {
          task_type: 'code_build',
          percent: 5,
          label: 'Queued preview update',
          detail: 'Applying your Prompt Studio changes to a new preview revision.',
          status: 'queued',
          updated_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', detail.site.id);

  if (metadataError) {
    throw new Error(`Could not save the updated site brief: ${metadataError.message}`);
  }

  await queueOperationalRun({
    slug,
    taskType: 'code_build',
    provider: 'renderer',
    queuedBy: user.email,
    metadata: {
      triggered_by: 'prompt_studio',
      prompt_revision_id: revision?.id ?? null,
      prompt_summary: parsed.outputSummary,
    },
  });

  await logSiteEvent({
    eventType: 'prompt_studio_revision_requested',
    siteId: detail.site.id,
    requestId: detail.site.request_id,
    actorType: 'admin',
    actorId: user.id,
    message: `Prompt Studio queued a preview update for ${detail.site.restaurant_name}`,
    metadata: {
      operator_email: user.email,
      prompt_text: promptText,
      attached_links: attachedLinks,
      revision_id: revision?.id ?? null,
      output_summary: parsed.outputSummary,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
  revalidatePath(`/admin/sites/${slug}/studio`);
  redirect(`/admin/sites/${slug}/studio`);
}

export async function saveResearchReview(slug: string, formData: FormData) {
  const user = await requireAdminUser();
  initSentry('server');
  const detail = await getAdminSiteDetail(slug);

  if (!detail?.site) {
    throw new Error('Could not find site.');
  }

  const candidateOfficialSites = uniqueStrings([
    ...detail.researchReview.officialSiteCandidates,
    detail.researchAudit?.canonicalSources.officialSiteUrl ?? null,
    detail.resolvedProfile?.officialSiteUrl ?? null,
  ]);
  const candidateMenuSources = uniqueStrings([
    ...detail.researchReview.menuCandidates,
    detail.researchAudit?.canonicalSources.menuSourceUrl ?? null,
    detail.resolvedProfile?.menuSourceUrl ?? null,
  ]);
  const candidateSocials = uniqueStrings([
    ...detail.researchReview.socialCandidates,
    ...(detail.researchAudit?.canonicalSources.confirmedSocialUrls ?? []),
    ...(detail.resolvedProfile?.confirmedSocialUrls ?? []),
  ]);
  const validLogoAssetKeys = new Set(
    detail.researchReview.reviewedAssets
      .filter((asset) => asset.assetType === 'logo' || asset.assetType === 'social_profile_asset')
      .map((asset) => asset.assetKey),
  );
  const validPhotoAssetKeys = new Set(
    detail.researchReview.reviewedAssets
      .filter((asset) => ['cover_photo', 'food_photo', 'interior_photo', 'social_profile_asset'].includes(asset.assetType))
      .map((asset) => asset.assetKey),
  );
  const wizardSteps: ReviewWizardStep[] = ['snapshot', 'facts', 'web_menu', 'brand_assets', 'ready'];

  const reviewIntent = nullableString(formData, 'review_intent') ?? 'save';
  const currentStepInput = nullableString(formData, 'wizard_step');
  const wizardStep = wizardSteps.includes(String(currentStepInput) as ReviewWizardStep)
    ? (currentStepInput as ReviewWizardStep)
    : detail.researchReview.wizardStep;
  const wizardNav = nullableString(formData, 'wizard_nav');
  const questionId = nullableString(formData, 'question_id');
  const questionNav = nullableString(formData, 'question_nav');
  const overrideNote = nullableString(formData, 'override_note');
  const redirectTo = (() => {
    const value = nullableString(formData, 'redirect_to');
    return value && value.startsWith('/') ? value : null;
  })();
  const effectiveDecisions = detail.researchReview.effectiveDecisions;

  const officialSiteChoice = nullableString(formData, 'official_site_choice');
  const legacyOfficialSiteUrlInput = normalizeUrl(nullableString(formData, 'official_site_url'));
  const officialSiteUrlInput = normalizeUrl(
    officialSiteChoice && officialSiteChoice !== 'none' ? officialSiteChoice : legacyOfficialSiteUrlInput,
  );
  const noOfficialSite = officialSiteChoice === 'none' || checked(formData, 'no_official_site');

  const menuSourceUrlInput = normalizeUrl(nullableString(formData, 'menu_source_url'));
  const noMenuSource = checked(formData, 'no_menu_source');
  const primaryWebPresenceInput = normalizeUrl(nullableString(formData, 'primary_web_presence_url'));
  const confirmedSocialsInput = formData.has('confirmed_social_urls')
    ? uniqueStrings(formValues(formData, 'confirmed_social_urls').map((value) => normalizeUrl(value)))
    : effectiveDecisions.confirmedSocialUrls;
  const approvedPhotoAssetKeys = formData.has('approved_photo_asset_keys')
    ? uniqueStrings(formValues(formData, 'approved_photo_asset_keys')).filter((value) => validPhotoAssetKeys.has(value))
    : effectiveDecisions.approvedPhotoAssetKeys.filter((value) => validPhotoAssetKeys.has(value));
  const photoStrategyInput = nullableString(formData, 'photo_strategy');
  const menuStatusInput = nullableString(formData, 'menu_status');
  const menuFallbackModeInput = nullableString(formData, 'menu_fallback_mode');
  const menuDisplayModeInput = nullableString(formData, 'menu_display_mode');
  const logoChoice = nullableString(formData, 'canonical_logo_choice');
  const factsStepNote = nullableString(formData, 'step_note_facts');
  const webMenuStepNote = nullableString(formData, 'step_note_web_menu');
  const brandAssetsStepNote = nullableString(formData, 'step_note_brand_assets');
  const finalBuildNote = nullableString(formData, 'final_build_note');
  const factChoiceByField = new Map(
    (detail.researchAudit?.conflictRecords ?? [])
      .filter((conflict) => ['restaurantName', 'address', 'phone', 'hours'].includes(conflict.field))
      .map((conflict) => {
        const raw = nullableString(formData, `conflict_${conflict.field}`);
        const allowed = conflict.candidates.map((candidate) => candidate.value);
        const chosen = raw && allowed.includes(raw) ? raw : null;
        return [conflict.field, chosen] as const;
      }),
  );

  let canonicalLogoAssetKey: string | null = null;
  let logoStrategy: ResearchReviewDecisionState['assetDecisions']['logoStrategy'] = null;
  if (logoChoice?.startsWith('asset:')) {
    const candidateKey = logoChoice.replace(/^asset:/, '');
    if (validLogoAssetKeys.has(candidateKey)) canonicalLogoAssetKey = candidateKey;
  } else if (logoChoice === 'strategy:text_mark') {
    logoStrategy = 'text_mark';
  } else if (logoChoice === 'strategy:generated_placeholder') {
    logoStrategy = 'generated_placeholder';
  }
  if (canonicalLogoAssetKey) logoStrategy = 'canonical_asset';

  const state = readResearchReviewState(detail.site.metadata);
  const approvedMenuDisplayMode: MenuDisplayMode | null =
    menuDisplayModeInput && ['full_menu', 'partial_menu', 'summary_only', 'hide_menu'].includes(menuDisplayModeInput)
      ? (menuDisplayModeInput as MenuDisplayMode)
      : state.menuDecisions.displayMode ?? effectiveDecisions.menuDisplayMode;
  const approvedMenuStatus: ResolvedMenuStatus | null =
    menuStatusInput && ['structured_menu', 'partial_menu', 'menu_evidence_only', 'no_menu_found'].includes(menuStatusInput)
      ? (menuStatusInput as ResolvedMenuStatus)
      : state.menuDecisions.approvedStatus ?? detail.resolvedMenu?.status ?? null;
  const approvedMenuFallbackMode: ResolvedMenuFallbackMode | null =
    menuFallbackModeInput && ['none', 'summary_only', 'aggressive_ai_generated'].includes(menuFallbackModeInput)
      ? (menuFallbackModeInput as ResolvedMenuFallbackMode)
      : approvedMenuDisplayMode === 'summary_only'
        ? 'summary_only'
        : state.menuDecisions.approvedFallbackMode ?? detail.resolvedMenu?.fallbackMode ?? null;
  const approvedSourceUrls = uniqueStrings([
    ...state.sourceDecisions.approvedUrls,
    ...confirmedSocialsInput,
    !noOfficialSite ? officialSiteUrlInput : null,
    !noMenuSource ? (menuSourceUrlInput ?? effectiveDecisions.menuSourceUrl) : null,
    primaryWebPresenceInput,
  ]);
  const currentStepIndex = Math.max(0, wizardSteps.indexOf(wizardStep));
  const nextStepFromNav =
    wizardNav === 'continue'
      ? wizardSteps[Math.min(wizardSteps.length - 1, currentStepIndex + 1)]
      : wizardNav === 'back'
        ? wizardSteps[Math.max(0, currentStepIndex - 1)]
        : wizardStep;
  const reviewQueue = detail.researchReview.reviewQueue;
  const queueIndex = questionId ? reviewQueue.findIndex((card) => card.id === questionId) : -1;
  const currentQueueIndex = queueIndex >= 0 ? queueIndex : 0;
  const nextQuestionId =
    questionNav === 'continue'
      ? reviewQueue[Math.min(reviewQueue.length - 1, currentQueueIndex + 1)]?.id ?? null
      : questionNav === 'back'
        ? reviewQueue[Math.max(0, currentQueueIndex - 1)]?.id ?? null
        : state.currentQuestionId ?? reviewQueue[0]?.id ?? null;
  const completedSteps = new Set<ReviewWizardStep>(state.wizard.completedSteps);
  if (wizardNav === 'continue' && wizardStep !== 'ready') {
    completedSteps.add(wizardStep);
  }
  if (reviewIntent === 'approve' || reviewIntent === 'approve_build') {
    completedSteps.add('facts');
    completedSteps.add('web_menu');
    completedSteps.add('brand_assets');
  }
  const completedQuestionIds = new Set(state.completedQuestionIds);
  if (questionNav === 'continue' && questionId) completedQuestionIds.add(questionId);
  if (questionNav === 'back' && nextQuestionId) completedQuestionIds.delete(nextQuestionId);
  const overrideNotesByField = {
    ...state.overrideNotesByField,
    ...(questionId ? { [questionId]: overrideNote } : {}),
  };
  const nextState: ResearchReviewDecisionState = {
    factDecisions: {
      restaurantName: factChoiceByField.get('restaurantName') ?? state.factDecisions.restaurantName,
      address: factChoiceByField.get('address') ?? state.factDecisions.address,
      phone: factChoiceByField.get('phone') ?? state.factDecisions.phone,
      hoursSummary: factChoiceByField.get('hours') ?? state.factDecisions.hoursSummary,
    },
    menuDecisions: {
      approvedStatus: approvedMenuStatus,
      approvedFallbackMode: approvedMenuFallbackMode,
      displayMode: approvedMenuDisplayMode,
    },
    sourceDecisions: {
      approvedUrls: approvedSourceUrls,
      rejectedUrls: state.sourceDecisions.rejectedUrls,
      officialSiteUrl: noOfficialSite
        ? null
        : candidateOfficialSites.includes(officialSiteUrlInput ?? '')
          ? officialSiteUrlInput
          : effectiveDecisions.officialSiteUrl,
      menuSourceUrl: noMenuSource
        ? null
        : candidateMenuSources.includes(menuSourceUrlInput ?? '')
          ? menuSourceUrlInput
          : effectiveDecisions.menuSourceUrl,
      primaryWebPresenceUrl: primaryWebPresenceInput ?? effectiveDecisions.primaryWebPresenceUrl,
      confirmedSocialUrls: confirmedSocialsInput.filter((value) => candidateSocials.includes(value) || value === effectiveDecisions.primaryWebPresenceUrl),
      noOfficialSite,
      noMenuSource: noMenuSource || approvedMenuDisplayMode === 'hide_menu',
    },
    assetDecisions: {
      approvedAssetKeys: uniqueStrings([
        ...state.assetDecisions.approvedAssetKeys,
        canonicalLogoAssetKey,
        ...approvedPhotoAssetKeys,
      ]),
      rejectedAssetKeys: state.assetDecisions.rejectedAssetKeys,
      approvedPhotoAssetKeys,
      canonicalLogoAssetKey,
      logoStrategy,
      photoStrategy: photoStrategyInput === 'approved_assets' || photoStrategyInput === 'tasteful_placeholders' || photoStrategyInput === 'generated_imagery'
        ? photoStrategyInput
        : state.assetDecisions.photoStrategy ?? effectiveDecisions.photoStrategy,
    },
    wizard: {
      currentStep:
        reviewIntent === 'approve' || reviewIntent === 'approve_build'
          ? 'ready'
          : nextStepFromNav,
      completedSteps: [...completedSteps],
      decisionStatus: state.wizard.decisionStatus,
    },
    stepNotes: {
      facts: factsStepNote ?? state.stepNotes.facts,
      webMenu: webMenuStepNote ?? state.stepNotes.webMenu,
      brandAssets: brandAssetsStepNote ?? state.stepNotes.brandAssets,
    },
    finalBuildNote: finalBuildNote ?? state.finalBuildNote,
    overrideStatus: state.overrideStatus,
    overrideNotesByField,
    currentQuestionId: nextQuestionId,
    completedQuestionIds: [...completedQuestionIds],
    status:
      reviewIntent === 'needs_more_research'
        ? 'needs_more_research'
        : reviewIntent === 'approve' || reviewIntent === 'approve_build'
          ? 'approved'
          : 'needs_review',
    reviewedAt: new Date().toISOString(),
  };

  const metadata =
    detail.site.metadata && typeof detail.site.metadata === 'object' && !Array.isArray(detail.site.metadata)
      ? detail.site.metadata as Record<string, unknown>
      : {};
  const nextResolvedMenu = detail.resolvedMenu
    ? {
        ...detail.resolvedMenu,
        status: approvedMenuStatus ?? detail.resolvedMenu.status,
        fallbackMode: approvedMenuFallbackMode ?? detail.resolvedMenu.fallbackMode,
        canonicalSourceUrl: nextState.sourceDecisions.menuSourceUrl ?? detail.resolvedMenu.canonicalSourceUrl,
      }
    : null;
  const reviewSummary = summarizeResearchReview({
    siteMetadata: {
      ...metadata,
      resolved_menu: nextResolvedMenu,
      research_review: nextState,
    },
    siteName: detail.site.restaurant_name,
    researchSources: detail.researchSources,
    siteAssets: detail.siteAssets,
  });

  nextState.status =
    reviewIntent === 'needs_more_research'
      ? 'needs_more_research'
      : reviewSummary.readyForPacket
        ? 'approved'
        : 'needs_review';
  nextState.wizard.decisionStatus = reviewSummary.state.wizard.decisionStatus;
  nextState.wizard.currentStep =
    reviewIntent === 'approve' || reviewIntent === 'approve_build'
      ? 'ready'
      : reviewSummary.wizardStep;
  nextState.overrideStatus = reviewSummary.overrideStatus;
  nextState.currentQuestionId = reviewSummary.currentQuestionId;
  nextState.completedQuestionIds = reviewSummary.completedQuestionIds;

  const stage =
    nextState.status === 'approved' && reviewSummary.readyForPacket
      ? detail.packetState === 'ready' && reviewIntent === 'approve_build'
        ? 'building'
        : 'resolved_profile_ready'
      : nextState.status === 'needs_more_research'
        ? 'needs_info'
        : 'admin_review_required';
  const shouldQueueBuildPacket =
    reviewIntent !== 'needs_more_research' &&
    nextState.status === 'approved' &&
    reviewSummary.readyForPacket &&
    detail.packetState !== 'ready';
  const shouldQueueCodeBuild =
    reviewIntent === 'approve_build' &&
    nextState.status === 'approved' &&
    reviewSummary.readyForPacket &&
    detail.packetState === 'ready';

  try {
    addMonitoringBreadcrumb({
      category: 'admin.research_review',
      message: 'Research review saved',
      data: {
        slug,
        reviewIntent,
        reviewStatus: nextState.status,
        reviewReady: reviewSummary.readyForPacket,
      },
    });

    const error = await updateProjectStageWithFallback({
      siteId: detail.site.id,
      projectStage: stage,
      metadata: {
        ...metadata,
        research_pipeline: {
          ...(metadata.research_pipeline && typeof metadata.research_pipeline === 'object' && !Array.isArray(metadata.research_pipeline)
            ? metadata.research_pipeline
            : {}),
          current_phase: nextState.status === 'approved' ? 'resolved_profile_ready' : 'admin_review_required',
        },
        resolved_menu: nextResolvedMenu,
        research_review: nextState,
        current_operation: {
          task_type: nextState.status === 'approved' && shouldQueueBuildPacket ? 'build_brief' : 'research_review',
          percent: nextState.status === 'approved' ? (shouldQueueBuildPacket ? 5 : 100) : 92,
          label:
            nextState.status === 'approved'
              ? shouldQueueBuildPacket
                ? 'Generating packet'
                : 'AI choices saved'
              : nextState.status === 'needs_more_research'
                ? 'Needs more research'
                : 'AI choices updated',
          detail:
            nextState.status === 'approved'
              ? shouldQueueBuildPacket
                ? 'AI picked the best available info and packet generation is starting automatically.'
                : 'AI picked the best available info. You can still override anything before or after the build.'
              : nextState.status === 'needs_more_research'
                ? reviewSummary.blockers.join(' | ') || 'More research is needed before packet generation.'
                : reviewSummary.overrideStatus === 'required'
                  ? 'We still need a little help before the packet can be generated.'
                  : 'AI choices are available to review, but packet generation does not need to wait for manual approval.',
          status: nextState.status === 'approved' ? (shouldQueueBuildPacket ? 'queued' : 'succeeded') : 'blocked',
          phase: nextState.status === 'approved' ? 'resolved_profile_ready' : 'admin_review_required',
          updated_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error('[Admin Site] Research review save failed:', error);
      throw new Error('Could not save the research review.');
    }

    await logSiteEvent({
      eventType: 'admin_research_review_saved',
      siteId: detail.site.id,
      requestId: detail.site.request_id,
      actorType: 'admin',
      actorId: user.id,
      message: `Research review updated for ${detail.site.restaurant_name}`,
      metadata: {
        admin_email: user.email,
        review_intent: reviewIntent,
        review_status: nextState.status,
        review_ready: reviewSummary.readyForPacket,
        override_status: nextState.overrideStatus,
        menu_status: nextResolvedMenu?.status ?? null,
        menu_fallback_mode: nextResolvedMenu?.fallbackMode ?? null,
        menu_display_mode: nextState.menuDecisions.displayMode,
        official_site_url: nextState.sourceDecisions.officialSiteUrl,
        menu_source_url: nextState.sourceDecisions.menuSourceUrl,
        primary_web_presence_url: nextState.sourceDecisions.primaryWebPresenceUrl,
        canonical_logo_asset_key: nextState.assetDecisions.canonicalLogoAssetKey,
        approved_photo_asset_keys: nextState.assetDecisions.approvedPhotoAssetKeys,
        step_notes: nextState.stepNotes,
        override_notes_by_field: nextState.overrideNotesByField,
        final_build_note: nextState.finalBuildNote,
      },
    });
    if (nextResolvedMenu) {
      await persistResolvedMenu(detail.site.id, nextResolvedMenu);
    }

    if (shouldQueueBuildPacket) {
      const supabase = getSupabaseAdmin();
      const { data: existingBuildPacketRun } = await supabase
        .from('agent_runs')
        .select('id, status')
        .eq('site_id', detail.site.id)
        .in('task_type', ['build_brief', 'build_packet'])
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingBuildPacketRun?.id) {
        await queueOperationalRun({
          slug,
          taskType: 'build_brief',
          provider: 'openai',
          queuedBy: user.email,
          metadata: {
            triggered_by: 'research_review_approval',
            review_approved_at: nextState.reviewedAt,
          },
        });
      }
    }

    if (shouldQueueCodeBuild) {
      const supabase = getSupabaseAdmin();
      const { data: existingCodeBuildRun } = await supabase
        .from('agent_runs')
        .select('id')
        .eq('site_id', detail.site.id)
        .eq('task_type', 'code_build')
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingCodeBuildRun?.id) {
        await queueOperationalRun({
          slug,
          taskType: 'code_build',
          provider: 'github',
          queuedBy: user.email,
          metadata: {
            triggered_by: 'research_review_ready_step',
            review_approved_at: nextState.reviewedAt,
          },
        });
      }
    }
  } catch (error) {
    captureMonitoringException(error, {
      tags: {
        area: 'research_review',
        action: 'save',
      },
      extra: {
        slug,
        siteId: detail.site.id,
        reviewIntent,
      },
    });
    throw error;
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
  revalidatePath(`/admin/sites/${slug}/review`);
  if (redirectTo) redirect(redirectTo);
}

export async function queueCodeBuildRun(slug: string) {
  const user = await requireAdminUser();
  const detail = await getAdminSiteDetail(slug);
  if (!detail?.site) throw new Error('Could not find site.');
  if (detail.packetState !== 'ready' || !['build_packet_ready', 'ready_for_admin_review'].includes(detail.site.project_stage ?? '')) {
    throw new Error('This project is not ready to build yet. Complete research and generate a ready build packet first.');
  }
  const { site } = await queueOperationalRun({
    slug,
    taskType: 'code_build',
    provider: 'github',
    queuedBy: user.email,
  });

  const supabase = getSupabaseAdmin();
  await supabase.from('restaurant_sites').update({ project_stage: 'building' }).eq('id', site.id);
  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function queueQaRun(slug: string) {
  const user = await requireAdminUser();
  await queueOperationalRun({
    slug,
    taskType: 'qa',
    provider: 'playwright',
    queuedBy: user.email,
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function retryLatestFailedRun(slug: string) {
  const user = await requireAdminUser();
  const site = await getSiteForAction(slug);
  const supabase = getSupabaseAdmin();
  const { data: failedRun, error } = await supabase
    .from('agent_runs')
    .select('task_type, provider, model, metadata, artifacts')
    .eq('site_id', site.id)
    .eq('status', 'failed')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !failedRun) {
    if (error) console.error('[Admin Site] Retry lookup failed:', error);
    throw new Error('No failed agent run is available to retry.');
  }

  const metadata = typeof failedRun.metadata === 'object' && failedRun.metadata !== null && !Array.isArray(failedRun.metadata)
    ? failedRun.metadata as Record<string, unknown>
    : {};
  const retryCount = typeof metadata.retry_count === 'number' ? metadata.retry_count + 1 : 1;

  await queueOperationalRun({
    slug,
    taskType: failedRun.task_type as 'research_collect' | 'ai_review' | 'build_brief' | 'build_packet' | 'code_build' | 'deploy' | 'qa' | 'sales_followup',
    provider: failedRun.provider,
    model: failedRun.model,
    queuedBy: user.email,
    metadata: {
      ...metadata,
      retry_count: retryCount,
      retry_queued_by: user.email,
    },
    artifacts: typeof failedRun.artifacts === 'object' && failedRun.artifacts !== null && !Array.isArray(failedRun.artifacts)
      ? failedRun.artifacts as Record<string, unknown>
      : {},
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function approvePreviewRelease(slug: string) {
  const user = await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const { data: site, error: lookupError } = await supabase
    .from('restaurant_sites')
    .select('id, request_id, restaurant_name')
    .eq('slug', slug)
    .single();

  if (lookupError || !site) {
    console.error('[Admin Site] Preview release lookup failed:', lookupError);
    throw new Error('Could not find site.');
  }

  const { data: approvedVersion, error: versionError } = await supabase
    .from('site_versions')
    .select('id, deployment_url')
    .eq('site_id', site.id)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError || !approvedVersion?.id) {
    if (versionError) console.error('[Admin Site] Preview release version lookup failed:', versionError);
    throw new Error('Preview release is blocked until an approved staged version exists.');
  }

  const { error } = await supabase
    .from('restaurant_sites')
    .update({
      status: 'preview_ready',
      project_stage: 'preview_sent',
      preview_released_at: new Date().toISOString(),
      staging_url: approvedVersion.deployment_url,
    })
    .eq('id', site.id);

  if (error) {
    console.error('[Admin Site] Preview release failed:', error);
    throw new Error('Could not approve preview release.');
  }

  await logSiteEvent({
    eventType: 'admin_preview_release_approved',
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'admin',
    actorId: user.id,
    message: `Preview release approved for ${site.restaurant_name}`,
    metadata: {
      admin_email: user.email,
    },
  });

  await queueOperationalRun({
    slug,
    taskType: 'sales_followup',
    provider: 'resend',
    queuedBy: user.email,
    metadata: {
      preview_release_approved_at: new Date().toISOString(),
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function publishLatestApprovedVersion(slug: string) {
  const user = await requireAdminUser();
  const site = await getSiteForAction(slug);
  await publishLatestApprovedSiteVersion({
    siteId: site.id,
    slug: site.slug,
    requestId: site.request_id,
    previewUrl: site.preview_url,
    actor: {
      actorType: 'admin',
      actorId: user.id,
      actorEmail: user.email,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function rollbackLatestPublishedVersion(slug: string) {
  const user = await requireAdminUser();
  const site = await getSiteForAction(slug);
  const supabase = getSupabaseAdmin();
  const { data: versions, error } = await supabase
    .from('site_versions')
    .select('id, deployment_url, site_spec_id')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(2);

  if (error || !versions?.length) {
    if (error) console.error('[Admin Site] Rollback lookup failed:', error);
    throw new Error('No published site version is available to roll back.');
  }

  const current = versions[0];
  const previous = versions[1];
  if (!previous) throw new Error('Rollback needs an earlier published version.');

  await supabase.from('site_versions').update({ status: 'rolled_back' }).eq('id', current.id);
  const { error: rollbackError } = await supabase.from('site_versions').insert({
    site_id: site.id,
    site_spec_id: previous.site_spec_id ?? null,
    status: 'published',
    release_channel: 'production',
    deployment_url: previous.deployment_url,
    published_at: new Date().toISOString(),
    published_by: user.id,
    rollback_of_version_id: current.id,
    metadata: {
      rolled_back_by: user.email,
    },
  });

  if (rollbackError) {
    console.error('[Admin Site] Rollback insert failed:', rollbackError);
    throw new Error('Could not create rollback version.');
  }

  await supabase.from('restaurant_sites').update({ live_url: previous.deployment_url }).eq('id', site.id);
  await logSiteEvent({
    eventType: 'admin_site_version_rolled_back',
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'admin',
    actorId: user.id,
    message: `Admin rolled back ${site.restaurant_name}`,
    metadata: {
      admin_email: user.email,
      rolled_back_version_id: current.id,
      restored_deployment_url: previous.deployment_url,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function archiveAdminItem(slug: string) {
  const user = await requireAdminUser();
  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase
    .from('restaurant_sites')
    .select('id, request_id, restaurant_name')
    .eq('slug', slug)
    .maybeSingle();

  if (site) {
    const { error } = await supabase
      .from('restaurant_sites')
      .update({ status: 'archived', project_stage: 'archived' })
      .eq('id', site.id);

    if (error) {
      console.error('[Admin Site] Archive site failed:', error);
      throw new Error('Could not archive site.');
    }

    await logSiteEvent({
      eventType: 'admin_site_archived',
      siteId: site.id,
      requestId: site.request_id,
      actorType: 'admin',
      actorId: user.id,
      message: `Admin archived ${site.restaurant_name}`,
      metadata: { admin_email: user.email },
    });
  } else {
    const { error } = await supabase
      .from('preview_requests')
      .update({ status: 'archived' })
      .eq('client_slug', slug);

    if (error) {
      console.error('[Admin Site] Archive request failed:', error);
      throw new Error('Could not archive request.');
    }
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

export async function deleteRequestOnlyItem(slug: string) {
  const user = await requireAdminUser();
  const detail = await getAdminSiteDetail(slug);

  if (!detail?.request) throw new Error('Could not find a preview request.');
  if (detail.site) throw new Error('Only request-only items can be hard-deleted from this action. Archive site projects instead.');

  await logSiteEvent({
    eventType: 'admin_request_deleted',
    requestId: detail.request.id,
    actorType: 'admin',
    actorId: user.id,
    message: `Admin deleted request-only item ${slug}`,
    metadata: {
      admin_email: user.email,
      restaurant_name: detail.request.restaurant_name,
    },
  });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('preview_requests').delete().eq('id', detail.request.id);

  if (error) {
    console.error('[Admin Site] Delete request failed:', error);
    throw new Error('Could not delete request.');
  }

  revalidatePath('/admin');
}

export async function deleteAdminProject(slug: string) {
  const user = await requireAdminUser();
  const detail = await getAdminSiteDetail(slug);

  if (!detail) throw new Error('Could not find this admin item.');

  const supabase = getSupabaseAdmin();
  const customDomains = detail.site?.id
    ? await supabase
        .from('custom_domains')
        .select('domain')
        .eq('site_id', detail.site.id)
    : { data: [], error: null };

  if (customDomains.error) {
    console.error('[Admin Site] Delete project custom domain lookup failed:', customDomains.error);
    throw new Error('Could not load project domains before deletion.');
  }

  if (detail.site) {
    const generatedCleanup = await removeGeneratedSiteFromGitHub(slug);
    if (generatedCleanup.blocked || !generatedCleanup.committed) {
      throw new Error(`Could not remove generated site artifact before deleting project: ${generatedCleanup.reason ?? 'GitHub cleanup failed'}.`);
    }
    const domains = [
      `${slug}.${siteRootHost()}`,
      ...(customDomains.data ?? []).map((row) => cleanString(row.domain)).filter((domain): domain is string => Boolean(domain)),
    ];
    const domainCleanup = [];
    for (const domain of Array.from(new Set(domains))) {
      domainCleanup.push(await removeVercelProjectDomain(domain));
    }

    await logSiteEvent({
      eventType: 'admin_site_deleted',
      siteId: detail.site.id,
      requestId: detail.request?.id ?? detail.site.request_id,
      actorType: 'admin',
      actorId: user.id,
      message: `Admin deleted project ${slug}`,
      metadata: {
        admin_email: user.email,
        restaurant_name: detail.site.restaurant_name,
        generated_cleanup: generatedCleanup,
        domain_cleanup: domainCleanup,
      },
    });

    const { error: siteError } = await supabase.from('restaurant_sites').delete().eq('id', detail.site.id);
    if (siteError) {
      console.error('[Admin Site] Delete project site failed:', siteError);
      throw new Error('Could not delete project.');
    }
  }

  if (detail.request?.id) {
    const { error: requestError } = await supabase.from('preview_requests').delete().eq('id', detail.request.id);
    if (requestError) {
      console.error('[Admin Site] Delete project request failed:', requestError);
      throw new Error('Project site was deleted, but the linked request could not be removed.');
    }
  }

  revalidatePath('/admin');
  redirect('/admin');
}

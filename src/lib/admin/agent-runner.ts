import 'server-only';

import { createHash } from 'crypto';
import { Resend } from 'resend';
import { GENERATED_SITE_REGISTRY } from '@/generated-sites/registry';
import { generateAdminBuildPacket } from '@/lib/admin/build-packets';
import { uploadImageToCloudinary } from '@/lib/admin/cloudinary';
import { credentialValue, getProviderCredential, readStoredBrowserSession } from '@/lib/admin/credentials';
import { getAdminSiteDetail } from '@/lib/admin/dashboard';
import {
  buildGeneratedSiteManifest,
  generatedSiteRegistrySource,
  generatedSiteSubdomain,
  writeGeneratedSiteManifest,
  type GeneratedSiteManifest,
} from '@/lib/generated-sites';
import {
  applyAuditSuggestionsToReviewState,
  generateResearchAudit,
  type ResearchAuditRecord,
} from '@/lib/admin/research-audit';
import { generateResolvedMenu, normalizeResolvedMenu, persistResolvedMenu, readResolvedMenu, type ResolvedMenu } from '@/lib/admin/menu-research';
import {
  assetKey,
  extractAssetCandidatesFromSources,
  readResearchReviewState,
  suggestedSourceDecisions,
  summarizeResearchReview,
  type ResearchAssetCandidate,
} from '@/lib/admin/research-review';
import { capturePageScreenshots, runBrowserQa } from '@/lib/admin/qa-runner';
import {
  addMonitoringBreadcrumb,
  captureMonitoringException,
  initSentry,
} from '@/lib/monitoring/sentry';
import { updatePromptStudioRevision } from '@/lib/admin/prompt-studio';
import {
  absoluteSiteUrl as renderAbsoluteSiteUrl,
  buildSiteRenderPayload,
  renderPayloadHash,
  restaurantSubdomainUrl,
} from '@/lib/site-rendering';
import { logSiteEvent } from '@/lib/site-events';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type AgentRun = {
  id: string;
  site_id: string | null;
  request_id: string | null;
  task_type:
    | 'research'
    | 'research_collect'
    | 'ai_review'
    | 'extraction'
    | 'strategy'
    | 'build_brief'
    | 'build_packet'
    | 'code_build'
    | 'deploy'
    | 'qa'
    | 'sales_followup'
    | 'support'
    | 'moderation';
  provider: string;
  model: string | null;
  status: string;
  artifacts: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

type SiteForRun = {
  id: string;
  request_id: string | null;
  slug: string;
  restaurant_name: string;
  city: string | null;
  owner_email: string | null;
  preview_url: string;
  claim_url: string;
  staging_url: string | null;
  live_url: string | null;
  metadata: Record<string, unknown> | null;
};

type ResearchPipelinePhase =
  | 'collecting_evidence'
  | 'ai_audit'
  | 'resolved_profile_ready'
  | 'admin_review_required'
  | 'needs_info';

const LEGACY_PROJECT_STAGE_FALLBACK: Record<ResearchPipelinePhase, string> = {
  collecting_evidence: 'researching',
  ai_audit: 'researching',
  resolved_profile_ready: 'researching',
  admin_review_required: 'researching',
  needs_info: 'needs_info',
};

type SourceCandidate = {
  source_type: 'website' | 'google_business' | 'instagram' | 'facebook' | 'menu' | 'ordering' | 'reservations' | 'directory' | 'web' | 'upload' | 'manual';
  url: string | null;
  title: string;
  confidence: number;
  extracted_facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

const WORKER_ACTOR = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'agent-worker@saborweb.com',
};

type ResearchMode = 'prompt_first' | 'full_crawl';

function researchMode(): ResearchMode {
  const configured = (process.env.SABORWEB_RESEARCH_MODE || process.env.RESEARCH_MODE || 'prompt_first').trim().toLowerCase();
  return configured === 'full_crawl' || configured === 'crawl' ? 'full_crawl' : 'prompt_first';
}

function shouldRunCrawlerResearch() {
  return researchMode() === 'full_crawl';
}

function shouldBuildThroughContentGaps() {
  const configured = process.env.SABORWEB_ALWAYS_BUILD ?? 'true';
  return !['0', 'false', 'no', 'off'].includes(configured.trim().toLowerCase());
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function hashJson(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function productionDeployBranch() {
  return process.env.SABORWEB_PRODUCTION_BRANCH || process.env.GITHUB_PRODUCTION_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main';
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

async function commitGeneratedSiteToGitHub(manifest: GeneratedSiteManifest) {
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

  const files = [
    {
      path: `src/generated-sites/${manifest.slug}/site.json`,
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    {
      path: 'src/generated-sites/registry.ts',
      content: generatedSiteRegistrySource({
        ...GENERATED_SITE_REGISTRY,
        [manifest.slug]: manifest,
      }),
    },
  ];
  const ref = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/ref/heads/${encodeURIComponent(branch)}`,
    { token },
  );
  const headSha = asString(asRecord(ref.object).sha);
  if (!headSha) throw new Error(`Could not resolve ${branch} branch head before committing generated site files.`);

  const headCommit = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/commits/${encodeURIComponent(headSha)}`,
    { token },
  );
  const baseTreeSha = asString(asRecord(headCommit.tree).sha);
  if (!baseTreeSha) throw new Error(`Could not resolve ${branch} tree before committing generated site files.`);

  const tree = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/trees`,
    {
      method: 'POST',
      token,
      body: {
        base_tree: baseTreeSha,
        tree: files.map((file) => ({
          path: file.path,
          mode: '100644',
          type: 'blob',
          content: file.content,
        })),
      },
    },
  );
  const treeSha = asString(tree.sha);
  if (!treeSha) throw new Error('GitHub did not return a tree SHA for generated site files.');

  const commit = await githubApi(
    `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/commits`,
    {
      method: 'POST',
      token,
      body: {
        message: `Generate ${manifest.slug} preview artifact`,
        tree: treeSha,
        parents: [headSha],
      },
    },
  );
  const commitSha = asString(commit.sha);
  if (!commitSha) throw new Error('GitHub did not return a commit SHA for generated site files.');

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

async function queueWorkerRun(params: {
  site: SiteForRun;
  taskType: AgentRun['task_type'];
  provider: string;
  model?: string | null;
  metadata?: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const existing = await supabase
    .from('agent_runs')
    .select('id, status')
    .eq('site_id', params.site.id)
    .eq('task_type', params.taskType)
    .in('status', ['queued', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  const progressLabel = params.taskType.replaceAll('_', ' ');
  const metadata = {
    queued_by: WORKER_ACTOR.email,
    slug: params.site.slug,
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

  const inserted = await supabase
    .from('agent_runs')
    .insert({
      site_id: params.site.id,
      request_id: params.site.request_id,
      task_type: params.taskType,
      provider: params.provider,
      model: params.model ?? null,
      status: 'queued',
      input_hash: hashJson(metadata),
      artifacts: params.artifacts ?? {},
      metadata,
    })
    .select('id')
    .single();

  if (inserted.error || !inserted.data?.id) {
    console.error('[Agent Runner] Could not queue follow-up run:', inserted.error);
    return null;
  }

  return String(inserted.data.id);
}

function appendResearchPhaseHistory(
  siteMetadata: Record<string, unknown> | null | undefined,
  entry: {
    phase: ResearchPipelinePhase;
    label: string;
    detail: string;
    status: 'queued' | 'running' | 'blocked' | 'succeeded' | 'failed';
  },
) {
  const metadata = asRecord(siteMetadata);
  const current = asRecord(metadata.research_pipeline);
  const history = Array.isArray(current.phase_history)
    ? current.phase_history.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
    : [];
  const nextEntry = {
    phase: entry.phase,
    label: entry.label,
    detail: entry.detail,
    status: entry.status,
    updated_at: new Date().toISOString(),
  };

  return {
    current_phase: entry.phase,
    last_completed_phase:
      entry.phase === 'admin_review_required' || entry.phase === 'needs_info'
        ? 'resolved_profile_ready'
        : current.last_completed_phase,
    phase_history: [...history, nextEntry].slice(-20),
  };
}

function isProjectStageConstraintError(error: { message?: string; details?: string; hint?: string } | null | undefined) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase();
  return text.includes('project_stage') && (text.includes('check constraint') || text.includes('violates check constraint'));
}

function isMissingRenderJsonColumnError(error: { message?: string; details?: string; hint?: string } | null | undefined) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase();
  return text.includes('render_json') && (text.includes('column') || text.includes('schema cache'));
}

async function updateResearchProjectStage(params: {
  siteId: string;
  projectStage: ResearchPipelinePhase;
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

  if (!attempt.error) return;
  if (!isProjectStageConstraintError(attempt.error)) {
    console.error('[Agent Runner] Project stage update failed:', attempt.error);
    return;
  }

  const fallback = LEGACY_PROJECT_STAGE_FALLBACK[params.projectStage];
  const fallbackAttempt = await supabase
    .from('restaurant_sites')
    .update({
      project_stage: fallback,
      metadata: params.metadata,
    })
    .eq('id', params.siteId);

  if (fallbackAttempt.error) {
    console.error('[Agent Runner] Project stage fallback update failed:', fallbackAttempt.error);
  }
}

async function updateMetaResearchSessionMetadata(params: {
  credentialId: string | null;
  status: 'connected' | 'expired' | 'failed';
  detail?: string | null;
}) {
  if (!params.credentialId) return;
  const supabase = getSupabaseAdmin();
  const { data: credential } = await supabase
    .from('integration_credentials')
    .select('integration_connection_id')
    .eq('id', params.credentialId)
    .maybeSingle();

  const connectionId = credential?.integration_connection_id;
  if (!connectionId) return;

  const { data: connection } = await supabase
    .from('integration_connections')
    .select('metadata')
    .eq('id', connectionId)
    .maybeSingle();

  const existingMetadata = asRecord(connection?.metadata);
  const nextMetadata = {
    ...existingMetadata,
    capture_status:
      params.status === 'connected'
        ? existingMetadata.capture_status ?? 'connected'
        : params.status === 'expired'
          ? 'expired'
          : 'failed',
    ...(params.status === 'connected'
      ? { last_successful_research_use: new Date().toISOString() }
      : {
          last_failure_at: new Date().toISOString(),
          last_failure_reason: params.detail ?? params.status,
        }),
  };

  await supabase
    .from('integration_connections')
    .update({
      metadata: nextMetadata,
      ...(params.status === 'expired' ? { status: 'expired' } : {}),
    })
    .eq('id', connectionId);
}

function normalizeUrl(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return value;
}

function hostname(value: string | null) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, '').toLowerCase() : null;
  } catch {
    return null;
  }
}

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://saborweb.com').replace(/\/$/, '');
}

function absoluteSiteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteOrigin()}${value.startsWith('/') ? value : `/${value}`}`;
}

function clipText(value: string | null, length = 4000) {
  if (!value) return null;
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function sourceTypeFromUrl(url: string | null, title?: string | null): SourceCandidate['source_type'] {
  const value = `${url ?? ''} ${title ?? ''}`.toLowerCase();
  if (/(instagram\.com|instagr\.am)/.test(value)) return 'instagram';
  if (/(facebook\.com|fb\.com)/.test(value)) return 'facebook';
  if (/(menu|allmenus|menupix|singleplatform)/.test(value)) return 'menu';
  if (/(opentable|tock|sevenrooms|resy|reservation)/.test(value)) return 'reservations';
  if (/(doordash|ubereats|grubhub|seamless|chownow|toasttab|square\.site|clover)/.test(value)) return 'ordering';
  if (/(share\.google|google\.com\/maps|maps\.google)/.test(value)) return 'google_business';
  if (/(tripadvisor|yelp|waze|restaurantji|todosbiz)/.test(value)) return 'directory';
  return 'website';
}

function normalizedSourceType(type: string | null | undefined, url: string | null, title?: string | null): SourceCandidate['source_type'] {
  const inferred = sourceTypeFromUrl(url, title);
  const current = (type ?? '').trim().toLowerCase();

  if (!current) return inferred;
  if (current === 'website' && inferred !== 'website') return inferred;
  if (current === 'menu' && inferred !== 'menu' && isGoogleSearchLikeUrl(url)) return inferred;
  if (
    current === 'web' ||
    current === 'manual' ||
    current === 'upload' ||
    current === 'directory' ||
    current === 'google_business' ||
    current === 'instagram' ||
    current === 'facebook' ||
    current === 'ordering' ||
    current === 'reservations'
  ) {
    return current as SourceCandidate['source_type'];
  }

  return inferred;
}

function isGoogleSearchLikeUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  return /(google\.com\/search|google\.com\/sorry|support\.google\.com\/websearch|google\.com\/webhp|google\.com\/imgres)/.test(value);
}

function isSocialUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  return /(instagram\.com|instagr\.am|facebook\.com|fb\.com)/.test(value);
}

function isDirectoryUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  return /(tripadvisor|yelp|waze|restaurantji|todosbiz|google\.com\/maps|maps\.google|share\.google)/.test(value);
}

function isOfficialWebsiteUrl(url: string | null | undefined) {
  if (!url) return false;
  return !isSocialUrl(url) && !isDirectoryUrl(url) && !isGoogleSearchLikeUrl(url);
}

function isUsableMenuUrl(url: string | null | undefined) {
  const value = (url ?? '').toLowerCase();
  if (!value) return false;
  if (isGoogleSearchLikeUrl(value)) return false;
  return /(\.pdf($|\?)|menu|allmenus|menupix|singleplatform|toasttab|doordash|ubereats|grubhub|seamless|chownow)/.test(value);
}

function isGoogleCaptchaOrSearchNoise(text: string | null | undefined) {
  const value = (text ?? '').toLowerCase();
  if (!value) return false;
  return (
    value.includes("if you're having trouble accessing google search") ||
    value.includes('recaptcha requires verification') ||
    value.includes('our systems have detected unusual traffic') ||
    value.includes('search results') ||
    value.includes('accessibility feedback')
  );
}

function isUsefulSourceCandidate(source: SourceCandidate) {
  const sourceMetadata = asRecord(source.metadata);
  const extractedFacts = asRecord(source.extracted_facts);
  const extractionMetadata = asRecord(extractedFacts.metadata);
  const url = normalizeUrl(source.url ?? null);
  const textExcerpt = asString(extractedFacts.text_excerpt);
  const markdownExcerpt = asString(extractedFacts.markdown_excerpt);
  const description = asString(extractedFacts.description);
  const statusCode = typeof extractionMetadata.statusCode === 'number' ? extractionMetadata.statusCode : null;
  const extractionError = asString(extractionMetadata.error);

  if (source.source_type === 'google_business' && extractedFacts.place_id) return true;
  if (sourceMetadata.seeded) return true;
  if (statusCode !== null && statusCode >= 400) return false;
  if (extractionError) return false;
  if (isGoogleSearchLikeUrl(url)) return false;
  if (textExcerpt && isGoogleCaptchaOrSearchNoise(textExcerpt)) return false;
  if (markdownExcerpt && isGoogleCaptchaOrSearchNoise(markdownExcerpt)) return false;
  if (description && isGoogleCaptchaOrSearchNoise(description)) return false;

  return true;
}

function dedupeSources(sources: SourceCandidate[]) {
  const unique = new Map<string, SourceCandidate>();

  for (const source of sources) {
    const key = `${source.source_type}:${source.url ?? source.title}`;
    const existing = unique.get(key);
    if (!existing || existing.confidence < source.confidence) {
      unique.set(key, source);
    }
  }

  return [...unique.values()];
}

function extractUrls(value: string | null) {
  if (!value) return [];
  const matches = value.match(/https?:\/\/[^\s)"'<>\]]+/gi) ?? [];
  return [...new Set(matches.map((match) => match.replace(/[),.;]+$/, '')))];
}

function restaurantTerms(site: SiteForRun) {
  return [...new Set(
    [site.restaurant_name, site.slug, site.city]
      .filter(Boolean)
      .flatMap((value) => String(value).toLowerCase().split(/[^a-z0-9]+/))
      .filter((part) => part.length >= 4)
  )];
}

function isUsefulImageCandidate(url: string) {
  if (!/\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(url)) return false;
  return !/(google\.com\/images\/branding|maps\.gstatic\.com|web-assets\.waze\.com|dynamic-media-cdn\.tripadvisor\.com\/media\/photo-o\/1a\/f6\/f2\/11\/default-avatar)/i.test(url);
}

function imageCandidatesFromValue(value: unknown): string[] {
  if (typeof value === 'string') {
    return extractUrls(value).filter(isUsefulImageCandidate);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => imageCandidatesFromValue(entry));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((entry) => imageCandidatesFromValue(entry));
  }

  return [];
}

function shouldKeepDiscoveredUrl(url: string, source: SourceCandidate, site: SiteForRun) {
  const lowerUrl = url.toLowerCase();
  if (source.url === url) return false;
  if (isGoogleSearchLikeUrl(lowerUrl)) return false;
  if (/^(https?:\/\/)?(accounts\.google\.com|maps\.gstatic\.com|streetviewpixels-pa\.googleapis\.com|maps\.googleapis\.com|web-assets\.waze\.com)/i.test(lowerUrl)) return false;
  if (/tripadvisor\.com\/(clientlink|profile|transparencyreport|owners-|improvelisting|tourism-|restaurants-|showuserreviews|postphotos)/i.test(lowerUrl)) return false;
  if (/todosbiz\.com\/(l\/|PR\/aguadilla-aguadilla\/)/i.test(lowerUrl)) return false;

  const terms = restaurantTerms(site);
  const hasRestaurantTerm = terms.some((term) => lowerUrl.includes(term));
  const keepByType = /(instagram\.com|facebook\.com|allmenus|menupix|singleplatform|opentable|tock|sevenrooms|resy|doordash|ubereats|grubhub|seamless|chownow|toasttab|square\.site|clover|tripadvisor\.com\/restaurant_review|google\.com\/maps\/place|maps\.google\.com)/i.test(lowerUrl);

  if (keepByType) return true;
  if (hasRestaurantTerm) return true;
  if (source.url && new URL(source.url).hostname === new URL(url).hostname) return true;
  return false;
}

function discoverSourcesFromCandidates(sources: SourceCandidate[], site: SiteForRun) {
  const discovered: SourceCandidate[] = [];

  for (const source of sources) {
    const text = [
      source.url ?? '',
      source.title,
      typeof source.extracted_facts?.markdown_excerpt === 'string' ? source.extracted_facts.markdown_excerpt : '',
      typeof source.extracted_facts?.text_excerpt === 'string' ? source.extracted_facts.text_excerpt : '',
      typeof source.extracted_facts?.description === 'string' ? source.extracted_facts.description : '',
      typeof source.extracted_facts?.website === 'string' ? source.extracted_facts.website : '',
      typeof source.extracted_facts?.maps_url === 'string' ? source.extracted_facts.maps_url : '',
    ].join('\n');

    for (const url of extractUrls(text)) {
      if (!shouldKeepDiscoveredUrl(url, source, site)) continue;
      discovered.push({
        source_type: sourceTypeFromUrl(url),
        url,
        title: `Discovered from ${source.title}`,
        confidence: Math.max(source.confidence - 0.08, 0.42),
        metadata: {
          discovered_from: source.url ?? source.title,
          provider: source.metadata?.provider ?? null,
        },
      });
    }
  }

  return dedupeSources(discovered).filter(isUsefulSourceCandidate);
}

function summarizeResearchProfile(sources: SourceCandidate[]) {
  const firstFact = (keys: string[], predicate?: (source: SourceCandidate, value: string) => boolean) => {
    for (const source of sources) {
      const facts = asRecord(source.extracted_facts);
      for (const key of keys) {
        const value = facts[key];
        if (typeof value === 'string' && value.trim()) {
          const cleaned = value.trim();
          if (!predicate || predicate(source, cleaned)) return cleaned;
        }
      }
    }
    return null;
  };

  const listFacts = (predicate: (source: SourceCandidate) => boolean, validator?: (url: string) => boolean) =>
    [...new Set(
      sources
        .filter(predicate)
        .map((source) => source.url)
        .filter((value): value is string => Boolean(value))
        .filter((value) => (validator ? validator(value) : true))
    )];

  const imageCandidates = [...new Set(
    sources.flatMap((source) => {
      const facts = asRecord(source.extracted_facts);
      const directCandidates = imageCandidatesFromValue(source.extracted_facts);
      const googlePhotoCandidates =
        source.source_type === 'google_business' && Array.isArray(facts.photo_references)
          ? facts.photo_references
              .map((value) => asString(value))
              .filter((value): value is string => Boolean(value))
              .map((reference) => `google-place-photo:${reference}`)
          : [];
      return [...directCandidates, ...googlePhotoCandidates];
    }).slice(0, 12)
  )];

  return {
    address: firstFact(['address', 'formatted_address']),
    phone: firstFact(['formatted_phone_number', 'international_phone_number', 'phone']),
    website:
      listFacts((source) => source.source_type === 'website', isOfficialWebsiteUrl)[0] ??
      firstFact(['website'], (_source, value) => isOfficialWebsiteUrl(value)),
    mapsUrl: firstFact(['maps_url']),
    hours: firstFact(['hours_summary']),
    cuisine: firstFact(['primary_type']),
    menuLinks: listFacts((source) => source.source_type === 'menu', isUsableMenuUrl),
    orderingLinks: listFacts((source) => source.source_type === 'ordering'),
    reservationLinks: listFacts((source) => source.source_type === 'reservations'),
    socialLinks: listFacts((source) => source.source_type === 'instagram' || source.source_type === 'facebook'),
    directoryLinks: listFacts((source) => source.source_type === 'directory' || source.source_type === 'google_business'),
    imageCandidates,
  };
}

function assessResearchProfile(profile: ReturnType<typeof summarizeResearchProfile>, sources: SourceCandidate[]) {
  const hasAddress = Boolean(profile.address);
  const hasPhone = Boolean(profile.phone);
  const hasHours = Boolean(profile.hours);
  const hasWebsite = Boolean(profile.website);
  const hasMenu = profile.menuLinks.length > 0;
  const hasSocial = profile.socialLinks.length > 0;
  const hasImages = profile.imageCandidates.length > 0;
  const hasStyleSignals = sources.some((source) => {
    const facts = asRecord(source.extracted_facts);
    const markdownExcerpt = asString(facts.markdown_excerpt);
    const textExcerpt = asString(facts.text_excerpt);
    const description = asString(facts.description);
    return Boolean(
      (markdownExcerpt && !isGoogleCaptchaOrSearchNoise(markdownExcerpt)) ||
      (textExcerpt && !isGoogleCaptchaOrSearchNoise(textExcerpt)) ||
      (description && !isGoogleCaptchaOrSearchNoise(description)) ||
      (Array.isArray(facts.photo_references) && facts.photo_references.length)
    );
  });

  const blockers: string[] = [];
  if (!hasAddress) blockers.push('Missing address');
  if (!hasHours) blockers.push('Missing hours');
  if (!hasStyleSignals) blockers.push('Missing enough style/content cues');

  const helpfulGaps: string[] = [];
  if (!hasPhone) helpfulGaps.push('Phone not confirmed');
  if (!hasMenu) helpfulGaps.push('Menu source not confirmed; use a clearly marked starter menu.');
  if (!hasWebsite) helpfulGaps.push('Official website not confirmed; use Google/social/contact links.');
  if (!hasSocial) helpfulGaps.push('Social profiles not confirmed');
  if (!hasImages) helpfulGaps.push('Image/logo candidates not found');

  const score = [hasAddress, hasPhone, hasHours, hasWebsite, hasMenu, hasSocial, hasImages, hasStyleSignals]
    .filter(Boolean).length * 12.5;

  return {
    score: Math.round(score),
    blockers,
    helpfulGaps,
    readyForPacket: blockers.length === 0 && score >= 50,
  };
}

function isLaunchNonBlockingGap(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('missing menu') ||
    normalized.includes('menu source') ||
    normalized.includes('structured menu') ||
    normalized.includes('official website') ||
    normalized.includes('standalone website') ||
    normalized.includes('no website')
  );
}

function launchBlockingGaps(blockers: string[]) {
  if (shouldBuildThroughContentGaps()) return [];
  return blockers.filter((blocker) => !isLaunchNonBlockingGap(blocker));
}

function asBlockedResult(message: string, detail: Record<string, unknown>) {
  return {
    blocked: true,
    message,
    ...detail,
  };
}

function countSourceBackedMenuItems(menu: ResolvedMenu | null | undefined) {
  if (!menu) return 0;
  return menu.categories.reduce((total, category) => (
    total + category.items.filter((item) => item.sourceBacked && !item.inferred).length
  ), 0);
}

function resolvedMenuScore(menu: ResolvedMenu | null | undefined) {
  if (!menu) return -1;
  const statusScore =
    menu.status === 'structured_menu'
      ? 300
      : menu.status === 'partial_menu'
        ? 220
        : menu.status === 'menu_evidence_only'
          ? 80
          : 0;
  const provenanceScore =
    menu.provenanceMode === 'source_backed'
      ? 80
      : menu.provenanceMode === 'hybrid_generated'
        ? 45
        : 10;
  const sourceTypeScore = menu.sourceType && menu.sourceType !== 'unknown' ? 18 : 0;
  const canonicalSourceScore = menu.canonicalSourceUrl ? 15 : 0;
  const categoryScore = Math.min(menu.categories.length, 8) * 4;
  const sourceBackedScore = countSourceBackedMenuItems(menu) * 12;
  const fallbackPenalty = menu.fallbackMode === 'aggressive_ai_generated' ? -20 : menu.fallbackMode === 'summary_only' ? -40 : 0;
  return statusScore + provenanceScore + sourceTypeScore + canonicalSourceScore + categoryScore + sourceBackedScore + fallbackPenalty;
}

function preferredResolvedMenu(...menus: Array<ResolvedMenu | null | undefined>) {
  return menus
    .filter((menu): menu is ResolvedMenu => Boolean(menu))
    .sort((left, right) => resolvedMenuScore(right) - resolvedMenuScore(left))[0] ?? null;
}

async function loadHistoricalResolvedMenu(siteId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('agent_runs')
    .select('artifacts')
    .eq('site_id', siteId)
    .in('task_type', ['research', 'ai_review'])
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data?.length) return null;

  const menus = data
    .map((row) => {
      const artifacts = asRecord(row.artifacts);
      const result = asRecord(artifacts.result);
      const audit = asRecord(result.research_audit);
      return normalizeResolvedMenu(result.resolved_menu ?? audit.resolvedMenu ?? null);
    })
    .filter((menu) => menu && menu.categories.length);

  return preferredResolvedMenu(...menus);
}

async function markRun(runId: string, patch: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('agent_runs').update(patch).eq('id', runId);
  if (error) console.error('[Agent Runner] Could not update run:', { runId, error });
}

async function updateSiteMetadata(siteId: string, patch: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('restaurant_sites').select('metadata').eq('id', siteId).maybeSingle();
  const current = asRecord(data?.metadata);
  const next = { ...current, ...patch };
  const { error } = await supabase.from('restaurant_sites').update({ metadata: next }).eq('id', siteId);
  if (error) console.error('[Agent Runner] Could not update site metadata:', { siteId, error });
}

async function setRunProgress(
  run: AgentRun,
  site: SiteForRun | null,
  params: { percent: number; label: string; detail?: string; status?: 'queued' | 'running' | 'blocked' | 'failed' | 'succeeded' }
) {
  const updatedAt = new Date().toISOString();
  const priorHistory = Array.isArray(run.metadata.progress_history)
    ? run.metadata.progress_history.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
    : [];
  const nextHistory = [
    ...priorHistory,
    {
      percent: Math.max(0, Math.min(100, Math.round(params.percent))),
      label: params.label,
      detail: params.detail ?? null,
      status: params.status ?? 'running',
      updated_at: updatedAt,
    },
  ].slice(-12);
  const nextMetadata = {
    ...run.metadata,
    progress: {
      task_type: run.task_type,
      percent: Math.max(0, Math.min(100, Math.round(params.percent))),
      label: params.label,
      detail: params.detail ?? null,
      status: params.status ?? 'running',
      updated_at: updatedAt,
    },
    progress_history: nextHistory,
  };
  await markRun(run.id, {
    metadata: nextMetadata,
  });
  run.metadata = nextMetadata;

  if (site?.id) {
    await updateSiteMetadata(site.id, {
      current_operation: {
        task_type: run.task_type,
        percent: Math.max(0, Math.min(100, Math.round(params.percent))),
        label: params.label,
        detail: params.detail ?? null,
        status: params.status ?? 'running',
        updated_at: updatedAt,
      },
    });
  }
}

function siteAssetType(candidateType: ResearchAssetCandidate['assetType']) {
  if (candidateType === 'logo') return 'logo';
  if (candidateType === 'menu_asset') return 'menu';
  return 'photo';
}

async function uploadRemoteCandidateAsset(site: SiteForRun, candidate: ResearchAssetCandidate) {
  if (candidate.captureMethod !== 'remote_url') return null;
  let file: string | Blob = candidate.assetUrl;

  if (candidate.provider === 'google_maps_places' && candidate.assetUrl.startsWith('google-place-photo:')) {
    const photoReference = candidate.assetUrl.replace(/^google-place-photo:/, '');
    if (!photoReference) return null;
    const credential = await getProviderCredential('google_maps_places');
    const apiKey = credentialValue(credential.secret, 'GOOGLE_MAPS_API_KEY');
    if (!apiKey) return null;
    const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
    photoUrl.searchParams.set('maxwidth', '1600');
    photoUrl.searchParams.set('photo_reference', photoReference);
    photoUrl.searchParams.set('key', apiKey);
    const photoResponse = await fetch(photoUrl.toString(), {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (!photoResponse?.ok) return null;
    const photoBlob = await photoResponse.blob().catch(() => null);
    if (!photoBlob) return null;
    file = photoBlob;
  }

  const upload = await uploadImageToCloudinary({
    file,
    folder: 'saborweb/research-assets',
    publicId: `${site.slug}-${candidate.assetType}-${assetKey({ assetType: candidate.assetType, assetUrl: candidate.assetUrl, sourceUrl: candidate.sourceUrl })}`,
    tags: ['saborweb', 'research-asset', site.slug, candidate.assetType],
    context: {
      source_url: candidate.sourceUrl ?? '',
      source_type: candidate.sourceType,
    },
  });

  if (!upload) return null;
  return {
    secureUrl: upload.secureUrl,
    publicId: upload.publicId,
    width: upload.width,
    height: upload.height,
  };
}

async function buildGooglePlacesPhotoCandidates(sources: SourceCandidate[]) {
  const candidates = new Map<string, ResearchAssetCandidate>();

  for (const source of sources) {
    if (source.source_type !== 'google_business') continue;
    const facts = asRecord(source.extracted_facts);
    const references = Array.isArray(facts.photo_references)
      ? facts.photo_references.map((value) => asString(value)).filter((value): value is string => Boolean(value))
      : [];

    references.slice(0, 6).forEach((reference, index) => {
      const key = assetKey({
        assetType: 'cover_photo',
        assetUrl: `google-place-photo:${reference}`,
        sourceUrl: source.url,
      });

      candidates.set(key, {
        assetKey: key,
        assetType: 'cover_photo',
        assetUrl: `google-place-photo:${reference}`,
        thumbnailUrl: `google-place-photo:${reference}`,
        sourceUrl: normalizeUrl(source.url),
        sourceTitle: source.title,
        sourceType: 'google_business_photo',
        captureMethod: 'remote_url',
        provider: 'google_maps_places',
        confidence: Math.min(0.94, source.confidence + 0.06),
        whySelected: `Downloaded candidate photo ${index + 1} from Google Places for restaurant imagery review.`,
        title: source.title ? `${source.title} photo ${index + 1}` : `Google Places photo ${index + 1}`,
      });
    });
  }

  return [...candidates.values()];
}

async function buildScreenshotCandidates(site: SiteForRun, sources: SourceCandidate[]) {
  const normalizedSources = sources.map((source) => ({
    ...source,
    extracted_facts: source.extracted_facts ?? {},
    metadata: source.metadata ?? {},
  }));
  const suggestions = suggestedSourceDecisions(site.restaurant_name, normalizedSources);
  const targets = [...new Set([
    ...suggestions.officialSiteCandidates.slice(0, 1),
    ...suggestions.socialCandidates.slice(0, 2),
    ...suggestions.menuCandidates.slice(0, 1),
  ])].slice(0, 4);

  const metaSessionCredential = await getProviderCredential('meta_research_session');
  const metaSession = readStoredBrowserSession(metaSessionCredential.secret);
  const captures = await capturePageScreenshots(targets, {
    storageState: metaSession?.storageState ?? null,
  });
  const candidates: ResearchAssetCandidate[] = [];

  for (const capture of captures) {
    const url = normalizeUrl(capture.url);
    if (!url) continue;
    const blob = new Blob([new Uint8Array(capture.screenshot)], { type: 'image/png' });
    const key = assetKey({ assetType: 'screenshot_capture', assetUrl: url, sourceUrl: url });
    const upload = await uploadImageToCloudinary({
      file: blob,
      folder: 'saborweb/research-assets',
      publicId: `${site.slug}-screenshot-${key}`,
      tags: ['saborweb', 'research-screenshot', site.slug],
      context: {
        source_url: url,
        source_type: hostname(url) ?? 'web',
      },
    });
    if (!upload) continue;

    candidates.push({
      assetKey: key,
      assetType: 'screenshot_capture',
      assetUrl: upload.secureUrl,
      thumbnailUrl: upload.secureUrl,
      sourceUrl: url,
      sourceTitle: capture.title,
      sourceType: /instagram|facebook/.test(url) ? 'social_capture' : 'page_capture',
      captureMethod: 'screenshot',
      provider: 'playwright',
      confidence: 0.7,
      whySelected: 'Screenshot capture for visual review when a direct asset file was not reliable.',
      title: capture.title,
    });

    for (const visualCandidate of capture.visualCandidates) {
      const visualBlob = new Blob([new Uint8Array(visualCandidate.screenshot)], { type: 'image/png' });
      const visualAssetType = visualCandidate.kind === 'social_profile_image' ? 'social_profile_asset' : 'cover_photo';
      const visualKey = assetKey({
        assetType: visualAssetType,
        assetUrl: visualCandidate.imageUrl ?? `${url}#${visualCandidate.kind}`,
        sourceUrl: url,
      });
      const visualUpload = await uploadImageToCloudinary({
        file: visualBlob,
        folder: 'saborweb/research-assets',
        publicId: `${site.slug}-${visualCandidate.kind}-${visualKey}`,
        tags: ['saborweb', 'research-social-asset', site.slug, visualCandidate.kind],
        context: {
          source_url: url,
          source_type: hostname(url) ?? 'social',
        },
      });
      if (!visualUpload) continue;

      candidates.push({
        assetKey: visualKey,
        assetType: visualAssetType,
        assetUrl: visualUpload.secureUrl,
        thumbnailUrl: visualUpload.secureUrl,
        sourceUrl: url,
        sourceTitle: capture.title,
        sourceType: /instagram/i.test(url)
          ? 'instagram_profile'
          : /facebook|fb\.com/i.test(url)
            ? visualCandidate.kind === 'social_cover_image'
              ? 'facebook_cover'
              : 'facebook_profile'
            : 'social_capture',
        captureMethod: 'screenshot',
        provider: 'playwright',
        confidence: visualCandidate.kind === 'social_profile_image' ? 0.86 : 0.8,
        whySelected:
          visualCandidate.kind === 'social_profile_image'
            ? 'Captured the social profile image directly from the page for logo/profile review.'
            : 'Captured the social cover image directly from the page for hero/photo review.',
        title: `${capture.title ?? 'Social page'} - ${visualCandidate.label}`,
      });
    }
  }

  return candidates;
}

async function saveResearchAssets(site: SiteForRun, sources: SourceCandidate[]) {
  const supabase = getSupabaseAdmin();
  const reviewState = readResearchReviewState(site.metadata);
  const normalizedSources = sources.map((source) => ({
    ...source,
    extracted_facts: source.extracted_facts ?? {},
    metadata: source.metadata ?? {},
  }));
  const sourceAssets = extractAssetCandidatesFromSources(normalizedSources);
  const googlePhotoAssets = await buildGooglePlacesPhotoCandidates(normalizedSources).catch((error) => {
    console.error('[Agent Runner] Google Places photo candidate build failed:', error);
    return [] as ResearchAssetCandidate[];
  });
  const screenshotAssets = await buildScreenshotCandidates(site, normalizedSources).catch((error) => {
    console.error('[Agent Runner] Screenshot capture failed:', error);
    return [] as ResearchAssetCandidate[];
  });
  const candidates = [...sourceAssets, ...googlePhotoAssets, ...screenshotAssets];

  const { data: existingAssets } = await supabase
    .from('site_assets')
    .select('id')
    .eq('site_id', site.id)
    .contains('metadata', { managed_by: 'research_asset_pipeline' });

  if (existingAssets?.length) {
    const { error: deleteError } = await supabase.from('site_assets').delete().in('id', existingAssets.map((asset) => asset.id));
    if (deleteError) console.error('[Agent Runner] Research asset cleanup failed:', deleteError);
  }

  const rows = [];
  for (const candidate of candidates) {
    const upload = candidate.captureMethod === 'remote_url'
      ? await uploadRemoteCandidateAsset(site, candidate).catch(() => null)
      : null;
    const requiresUpload = candidate.assetUrl.startsWith('google-place-photo:');
    if (requiresUpload && !upload) continue;

    const approved = reviewState.assetDecisions.approvedAssetKeys.includes(candidate.assetKey) || reviewState.assetDecisions.approvedPhotoAssetKeys.includes(candidate.assetKey);
    const rejected = reviewState.assetDecisions.rejectedAssetKeys.includes(candidate.assetKey);
    const isCanonical = reviewState.assetDecisions.canonicalLogoAssetKey === candidate.assetKey;

    rows.push({
      site_id: site.id,
      asset_type: siteAssetType(candidate.assetType),
      status: isCanonical || approved ? 'approved' : rejected ? 'rejected' : 'draft',
      storage_bucket: upload ? 'cloudinary' : null,
      storage_path: upload?.publicId ?? null,
      source_url: candidate.sourceUrl,
      source_label: candidate.title ?? candidate.whySelected,
      rights_notes: 'Publicly discovered for internal preview research. Admin review required before use.',
      metadata: {
        managed_by: 'research_asset_pipeline',
        asset_key: candidate.assetKey,
        candidate_type: candidate.assetType,
        asset_url: upload?.secureUrl ?? candidate.assetUrl,
        thumbnail_url: upload?.secureUrl ?? candidate.thumbnailUrl,
        source_page_url: candidate.sourceUrl,
        source_type: candidate.sourceType,
        source_title: candidate.sourceTitle,
        capture_method: candidate.captureMethod,
        provider: candidate.provider,
        confidence: candidate.confidence,
        why_selected: candidate.whySelected,
        title: candidate.title,
        is_canonical: isCanonical,
      },
    });
  }

  if (rows.length) {
    const { error } = await supabase.from('site_assets').insert(rows);
    if (error) console.error('[Agent Runner] Research asset save failed:', error);
  }

  return rows.length;
}

async function loadSite(run: AgentRun): Promise<SiteForRun | null> {
  if (!run.site_id) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('restaurant_sites')
    .select('id, request_id, slug, restaurant_name, city, owner_email, preview_url, claim_url, staging_url, live_url, metadata')
    .eq('id', run.site_id)
    .maybeSingle();

  if (error) {
    console.error('[Agent Runner] Site lookup failed:', error);
    return null;
  }

  return (data ?? null) as unknown as SiteForRun | null;
}

async function queueRun(params: {
  siteId: string | null;
  requestId: string | null;
  taskType: AgentRun['task_type'];
  provider: string;
  model?: string | null;
  metadata?: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  if (params.siteId) {
    const existing = await supabase
      .from('agent_runs')
      .select('id')
      .eq('site_id', params.siteId)
      .eq('task_type', params.taskType)
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.data?.id) return;
  }
  const input = {
    site_id: params.siteId,
    request_id: params.requestId,
    task_type: params.taskType,
    provider: params.provider,
    model: params.model ?? null,
    status: 'queued',
    input_hash: hashJson(params.metadata ?? {}),
    metadata: {
      queued_from: 'agent_worker',
      workflow_step: params.taskType,
      retry_count: 0,
      ...(params.metadata ?? {}),
    },
    artifacts: params.artifacts ?? {},
  };
  const { error } = await supabase.from('agent_runs').insert(input);
  if (error) console.error('[Agent Runner] Could not queue next run:', { taskType: params.taskType, error });
}

function sourceCandidatesFromSite(site: SiteForRun, run: AgentRun) {
  const metadata = asRecord(site.metadata);
  const seeded = Array.isArray(run.artifacts.seed_sources)
    ? run.artifacts.seed_sources
    : Array.isArray(metadata.research_seed_sources)
      ? metadata.research_seed_sources
      : [];
  const rows: SourceCandidate[] = [];

  for (const source of seeded) {
    const record = asRecord(source);
    const url = normalizeUrl(asString(record.url));
    if (!url) continue;
    rows.push({
      source_type: normalizedSourceType(asString(record.source_type), url, asString(record.title)),
      url,
      title: asString(record.title) ?? 'Seed source',
      confidence: 0.35,
      metadata: { seeded: true },
    });
  }

  for (const [key, sourceType, title] of [
    ['website_url', 'website', 'Website'],
    ['google_url', 'google_business', 'Google Business Profile'],
    ['instagram_url', 'instagram', 'Instagram'],
    ['facebook_url', 'facebook', 'Facebook'],
    ['menu_url', 'menu', 'Menu'],
  ] as const) {
    const url = normalizeUrl(asString(metadata[key]));
    if (url && !rows.some((row) => row.url === url)) {
      rows.push({ source_type: normalizedSourceType(sourceType, url, title), url, title, confidence: 0.4, metadata: { from_site_metadata: key } });
    }
  }

  return rows;
}

async function googlePlaceSource(site: SiteForRun): Promise<SourceCandidate | null> {
  const credential = await getProviderCredential('google_maps_places');
  const apiKey = credentialValue(credential.secret, 'GOOGLE_MAPS_API_KEY');
  if (!apiKey) return null;

  const query = [site.restaurant_name, site.city].filter(Boolean).join(' ');
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', apiKey);
  const response = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  const json = asRecord(await response.json().catch(() => ({})));
  const first = Array.isArray(json.results) ? asRecord(json.results[0]) : {};
  if (!response.ok || !first.place_id) return null;

  const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  detailsUrl.searchParams.set('place_id', String(first.place_id));
  detailsUrl.searchParams.set(
    'fields',
    [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'opening_hours',
      'website',
      'url',
      'rating',
      'price_level',
      'business_status',
      'types',
      'photos',
    ].join(',')
  );
  detailsUrl.searchParams.set('key', apiKey);

  const detailsResponse = await fetch(detailsUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const detailsJson = detailsResponse ? asRecord(await detailsResponse.json().catch(() => ({}))) : {};
  const details = asRecord(detailsJson.result);
  const openingHours = asRecord(details.opening_hours);
  const detailsPhotos = Array.isArray(details.photos) ? details.photos.map((photo) => asRecord(photo).photo_reference).filter(Boolean) : [];
  const website = normalizeUrl(asString(details.website));

  return {
    source_type: 'google_business',
    url: first.place_id ? `https://www.google.com/maps/place/?q=place_id:${String(first.place_id)}` : null,
    title: asString(details.name) ?? asString(first.name) ?? 'Google Places match',
    confidence: 0.86,
    extracted_facts: {
      name: details.name ?? first.name ?? null,
      address: details.formatted_address ?? first.formatted_address ?? null,
      rating: details.rating ?? first.rating ?? null,
      price_level: details.price_level ?? first.price_level ?? null,
      place_id: first.place_id ?? null,
      open_now: openingHours.open_now ?? asRecord(first.opening_hours).open_now ?? null,
      hours_weekday_text: Array.isArray(openingHours.weekday_text) ? openingHours.weekday_text : [],
      hours_summary: Array.isArray(openingHours.weekday_text) ? openingHours.weekday_text.join(' | ') : null,
      website,
      maps_url: asString(details.url),
      formatted_phone_number: asString(details.formatted_phone_number),
      international_phone_number: asString(details.international_phone_number),
      business_status: asString(details.business_status),
      primary_type: Array.isArray(details.types) && typeof details.types[0] === 'string' ? details.types[0] : null,
      photo_references: detailsPhotos.slice(0, 6),
    },
    metadata: { provider: 'google_maps_places', credential_source: credential.source },
  };
}

async function apifyWebsiteSources(seedSources: SourceCandidate[]): Promise<SourceCandidate[]> {
  const credential = await getProviderCredential('apify');
  const apiKey = credentialValue(credential.secret, 'APIFY_API_TOKEN');
  if (!apiKey) return [];

  const crawlRoots = [...new Set(
    seedSources
      .map((source) => normalizeUrl(source.url ?? null))
      .filter((url): url is string => Boolean(url))
      .filter((url) => !/(instagram\.com|facebook\.com|google\.com\/maps|share\.google|google\.com\/search|google\.com\/sorry|support\.google\.com|waze\.com)/i.test(url))
  )].slice(0, 2);

  const sources: SourceCandidate[] = [];

  for (const rootUrl of crawlRoots) {
    const response = await fetch(`https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url: rootUrl }],
        maxCrawlPages: 16,
        maxCrawlDepth: 2,
        crawlerType: 'playwright:adaptive',
        includeUrlGlobs: [
          `${rootUrl.replace(/\/$/, '')}/**`,
          `${rootUrl.replace(/\/$/, '')}/menu**`,
          `${rootUrl.replace(/\/$/, '')}/about**`,
          `${rootUrl.replace(/\/$/, '')}/contact**`,
          `${rootUrl.replace(/\/$/, '')}/gallery**`,
        ],
        excludeUrlGlobs: [
          '**/privacy**',
          '**/terms**',
          '**/login**',
          '**/signin**',
          '**/account**',
          '**/checkout**',
          '**/cart**',
        ],
        clickElementsCssSelector: '[aria-expanded="false"], [role="tab"], details summary',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    }).catch(() => null);

    if (!response?.ok) continue;
    const payload = await response.json().catch(() => []);
    const arrayItems = Array.isArray(payload) ? payload : [];

    for (const item of arrayItems.slice(0, 8)) {
      const record = asRecord(item);
      const pageUrl = normalizeUrl(asString(record.url) ?? asString(record.loadedUrl));
      const title = asString(record.title) ?? asString(record.pageTitle) ?? 'Apify crawl page';
      const excerpt = clipText(asString(record.text) ?? asString(record.markdown) ?? asString(record.description), 5000);
      const pageImages = Array.isArray(record.images) ? record.images.map((value) => asString(value)).filter(Boolean) : [];
      const downloadedFiles = Array.isArray(record.downloadedFiles)
        ? record.downloadedFiles.map((value) => asString(value)).filter(Boolean)
        : [];
      const discoveredLinks = extractUrls([
        excerpt ?? '',
        asString(record.markdown) ?? '',
        downloadedFiles.join('\n'),
      ].join('\n'));

      if (!pageUrl) continue;
      const candidate: SourceCandidate = {
        source_type: sourceTypeFromUrl(pageUrl, title),
        url: pageUrl,
        title,
        confidence: 0.62,
        extracted_facts: {
          text_excerpt: excerpt,
          description: asString(record.description),
          discovered_links: discoveredLinks.slice(0, 12),
          images: pageImages.slice(0, 16),
          downloaded_files: downloadedFiles.slice(0, 12),
        },
        metadata: {
          provider: 'apify',
          actor: 'apify/website-content-crawler',
          credential_source: credential.source,
          root_url: rootUrl,
          crawler_type: 'playwright:adaptive',
        },
      };
      if (isUsefulSourceCandidate(candidate)) sources.push(candidate);
    }
  }

  return dedupeSources(sources);
}

async function firecrawlSources(seedSources: SourceCandidate[]): Promise<SourceCandidate[]> {
  const credential = await getProviderCredential('firecrawl');
  if (!credential.secret) return [];

  const sources: SourceCandidate[] = [];
  for (const source of dedupeSources(seedSources).filter((item) => item.url && !isGoogleSearchLikeUrl(item.url)).slice(0, 5)) {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential.secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.url,
        onlyMainContent: true,
        waitFor: 1500,
        formats: [
          'markdown',
          'links',
          'images',
          { type: 'screenshot', fullPage: true, quality: 70 },
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (!response?.ok) continue;
    const json = asRecord(await response.json().catch(() => ({})));
    const data = asRecord(json.data);
    const markdown = clipText(asString(data.markdown), 5000);
    const links = Array.isArray(data.links) ? data.links.map((value) => asString(value)).filter(Boolean) : [];
    const images = Array.isArray(data.images) ? data.images.map((value) => asString(value)).filter(Boolean) : [];
    const screenshot = asString(asRecord(data.screenshot).url) ?? asString(data.screenshot);
    const candidate: SourceCandidate = {
      ...source,
      title: `${source.title} extraction`,
      confidence: Math.max(source.confidence, 0.62),
      extracted_facts: {
        markdown_excerpt: markdown,
        discovered_links: [...new Set([...links, ...extractUrls(markdown)])].slice(0, 20),
        images: images.slice(0, 20),
        metadata: data.metadata ?? null,
      },
      metadata: {
        ...(source.metadata ?? {}),
        provider: 'firecrawl',
        credential_source: credential.source,
        images,
        screenshot,
      },
    };
    if (isUsefulSourceCandidate(candidate)) sources.push(candidate);
  }
  return dedupeSources(sources);
}

async function saveResearch(site: SiteForRun, run: AgentRun, sources: SourceCandidate[]) {
  const supabase = getSupabaseAdmin();
  const uniqueSources = dedupeSources(sources).filter(isUsefulSourceCandidate);
  const rows = uniqueSources.map((source) => ({
    site_id: site.id,
    request_id: site.request_id,
    agent_run_id: run.id,
    source_type: source.source_type,
    url: source.url ?? null,
    title: source.title,
    extracted_facts: source.extracted_facts ?? {},
    confidence: source.confidence,
    metadata: {
      ...(source.metadata ?? {}),
      captured_by: 'agent_worker',
    },
  }));

  if (rows.length) {
    const { error } = await supabase.from('research_sources').insert(rows);
    if (error) console.error('[Agent Runner] Research source save failed:', error);
  }

  const profile = summarizeResearchProfile(uniqueSources);
  const specJson = {
    source: 'research_agent',
    restaurant: {
      name: site.restaurant_name,
      city: site.city,
      slug: site.slug,
    },
    profile,
    sources: rows.map((row) => ({
      type: row.source_type,
      url: row.url,
      title: row.title,
      confidence: row.confidence,
      facts: row.extracted_facts,
    })),
    missing: {
      hours: !profile.hours,
      menu: profile.menuLinks.length === 0,
      logo: profile.imageCandidates.length === 0,
      photos: profile.imageCandidates.length < 2,
    },
  };

  const { data: existing } = await supabase
    .from('site_specs')
    .select('id')
    .eq('site_id', site.id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    site_id: site.id,
    version_label: 'research-draft',
    status: 'draft',
    source_hash: hashJson(specJson),
    spec_json: specJson,
    seo_json: { source: 'research_agent', bilingual: true, locales: ['es', 'en'] },
    generated_by_agent_run_id: run.id,
  };
  const { error: specError } = existing?.id
    ? await supabase.from('site_specs').update(payload).eq('id', existing.id)
    : await supabase.from('site_specs').insert(payload);
  if (specError) console.error('[Agent Runner] Research site spec save failed:', specError);
}

async function processResearchCollect(run: AgentRun) {
  initSentry('server');
  const site = await loadSite(run);
  if (!site) throw new Error('Research collection run is missing a site.');

  await setRunProgress(run, site, {
    percent: 8,
    label: 'Preparing research seeds',
    detail: 'Collecting manual links, Google profile hints, and known restaurant URLs.',
  });
  const seedSources = sourceCandidatesFromSite(site, run);

  await setRunProgress(run, site, {
    percent: 20,
    label: 'Checking Google Places',
    detail: 'Looking for address, phone, hours, photos, and official web presence.',
  });
  const placeSource = await googlePlaceSource(site).catch((error) => {
    console.error('[Agent Runner] Google Places failed:', error);
    captureMonitoringException(error, {
      tags: { area: 'research_collect', provider: 'google_maps_places' },
      extra: { siteId: site.id, siteSlug: site.slug, agentRunId: run.id },
    });
    return null;
  });
  const googleWebsite = normalizeUrl(asString(placeSource?.extracted_facts?.website));
  const enrichedSeeds = dedupeSources([
    ...seedSources,
    ...(placeSource ? [placeSource] : []),
    ...(googleWebsite
      ? [{
          source_type: normalizedSourceType('website', googleWebsite, 'Website discovered from Google Places'),
          url: googleWebsite,
          title: isSocialUrl(googleWebsite) ? 'Social page discovered from Google Places' : 'Website discovered from Google Places',
          confidence: 0.74,
          metadata: { provider: 'google_maps_places' },
        }]
      : []),
  ]);

  const crawlerResearchEnabled = shouldRunCrawlerResearch();
  await setRunProgress(run, site, {
    percent: 38,
    label: crawlerResearchEnabled ? 'Crawling likely pages' : 'Preparing prompt-first evidence',
    detail: crawlerResearchEnabled
      ? 'Using Apify to gather website, menu, directory, and social clues.'
      : 'Skipping Apify/Firecrawl for this test mode. Submitted details and lightweight verification will feed the AI review prompt.',
  });
  const apifySources = crawlerResearchEnabled
    ? await apifyWebsiteSources(enrichedSeeds).catch((error) => {
        console.error('[Agent Runner] Apify crawl failed:', error);
        captureMonitoringException(error, {
          tags: { area: 'research_collect', provider: 'apify' },
          extra: { siteId: site.id, siteSlug: site.slug, agentRunId: run.id },
        });
        return [];
      })
    : [];

  const firstPassInputs = dedupeSources([
    ...enrichedSeeds,
    ...apifySources,
    ...discoverSourcesFromCandidates(apifySources, site),
  ]);
  await setRunProgress(run, site, {
    percent: 58,
    label: crawlerResearchEnabled ? 'Extracting source details' : 'Building prompt-first dossier',
    detail: crawlerResearchEnabled
      ? 'Using Firecrawl for markdown, links, screenshots, menus, and asset clues.'
      : 'Saving a compact dossier for GPT-5.5 to turn into the build-agent prompt.',
  });
  const firecrawlExtracted = crawlerResearchEnabled
    ? await firecrawlSources(firstPassInputs).catch((error) => {
        console.error('[Agent Runner] Firecrawl failed:', error);
        captureMonitoringException(error, {
          tags: { area: 'research_collect', provider: 'firecrawl' },
          extra: { siteId: site.id, siteSlug: site.slug, agentRunId: run.id },
        });
        return [];
      })
    : [];
  const sources = dedupeSources([
    ...firstPassInputs,
    ...firecrawlExtracted,
    ...discoverSourcesFromCandidates(firecrawlExtracted, site),
  ]);

  await setRunProgress(run, site, {
    percent: 78,
    label: 'Saving research dossier',
    detail: 'Persisting raw evidence, source confidence, screenshots, and asset candidates.',
  });
  await saveResearch(site, run, sources);
  const assetCount = await saveResearchAssets(site, sources);

  const queuedReviewRunId = await queueWorkerRun({
    site,
    taskType: 'ai_review',
    provider: 'openai',
    model: process.env.OPENAI_AUDITOR_MODEL || process.env.OPENAI_MODEL || 'gpt-5.5',
    metadata: {
      triggered_by: 'research_collect',
      research_collect_run_id: run.id,
      auto_queued: true,
    },
  });

  await updateResearchProjectStage({
    siteId: site.id,
    projectStage: 'ai_audit',
    metadata: {
      ...asRecord(site.metadata),
      research_pipeline: appendResearchPhaseHistory(site.metadata, {
        phase: 'ai_audit',
        label: 'AI review queued',
        detail: crawlerResearchEnabled
          ? 'Raw research is saved. The AI project manager will verify, supplement, and write the build brief.'
          : 'Prompt-first evidence is saved. The AI project manager will use GPT-5.5 reasoning to write the build-agent prompt.',
        status: 'queued',
      }),
      current_operation: {
        task_type: 'ai_review',
        percent: 5,
        label: 'AI review queued',
        detail: crawlerResearchEnabled
          ? 'Raw research is saved. The AI project manager will verify and fill gaps next.'
          : 'Submitted details and lightweight verification are ready for prompt-first review.',
        status: 'queued',
        updated_at: new Date().toISOString(),
      },
    },
  });

  await setRunProgress(run, site, {
    percent: 100,
    label: 'Research collected',
    detail: 'Evidence was saved and AI review was queued.',
    status: 'succeeded',
  });

  return {
    source_count: sources.length,
    asset_candidate_count: assetCount,
    queued_next: queuedReviewRunId ? 'ai_review' : null,
    queued_ai_review_run_id: queuedReviewRunId,
    research_mode: researchMode(),
    crawler_research_enabled: crawlerResearchEnabled,
  };
}

async function processResearch(run: AgentRun) {
  initSentry('server');
  const site = await loadSite(run);
  if (!site) throw new Error('Research run is missing a site.');
  addMonitoringBreadcrumb({
    category: 'agent.research',
    message: 'Research run started',
    data: {
      siteId: site.id,
      siteSlug: site.slug,
      agentRunId: run.id,
    },
  });
  await setRunProgress(run, site, {
    percent: 8,
    label: 'Preparing research seeds',
    detail: 'Collecting manual links, Google profile hints, and known restaurant URLs.',
  });

  const seedSources = sourceCandidatesFromSite(site, run);
  await setRunProgress(run, site, {
    percent: 18,
    label: 'Checking Google Places',
    detail: 'Looking for address, phone, hours, and a likely official website.',
  });
  const placeSource = await googlePlaceSource(site).catch((error) => {
    console.error('[Agent Runner] Google Places failed:', error);
    captureMonitoringException(error, {
      tags: {
        area: 'research',
        provider: 'google_maps_places',
        task_type: run.task_type,
      },
      extra: {
        siteId: site.id,
        siteSlug: site.slug,
        agentRunId: run.id,
      },
    });
    return null;
  });

  const googleWebsite = normalizeUrl(asString(placeSource?.extracted_facts?.website));
  const enrichedSeeds = dedupeSources([
    ...seedSources,
    ...(placeSource ? [placeSource] : []),
    ...(googleWebsite
      ? [{
          source_type: normalizedSourceType('website', googleWebsite, 'Website discovered from Google Places'),
          url: googleWebsite,
          title: isSocialUrl(googleWebsite) ? 'Social page discovered from Google Places' : 'Website discovered from Google Places',
          confidence: 0.74,
          metadata: { provider: 'google_maps_places' },
        }]
      : []),
  ]);

  const crawlerResearchEnabled = shouldRunCrawlerResearch();
  await setRunProgress(run, site, {
    percent: 32,
    label: crawlerResearchEnabled ? 'Crawling likely source pages' : 'Preparing prompt-first evidence',
    detail: crawlerResearchEnabled
      ? 'Running Apify on the best website and directory candidates.'
      : 'Skipping Apify/Firecrawl for this test mode. GPT-5.5 will use submitted details and lightweight verification to write the build-agent prompt.',
  });
  const apifySources = crawlerResearchEnabled
    ? await apifyWebsiteSources(enrichedSeeds).catch((error) => {
        console.error('[Agent Runner] Apify crawl failed:', error);
        captureMonitoringException(error, {
          tags: {
            area: 'research',
            provider: 'apify',
            task_type: run.task_type,
          },
          extra: {
            siteId: site.id,
            siteSlug: site.slug,
            agentRunId: run.id,
          },
        });
        return [];
      })
    : [];
  const discoveredFromApify = discoverSourcesFromCandidates(apifySources, site);
  const firstPassInputs = dedupeSources([...enrichedSeeds, ...apifySources, ...discoveredFromApify]);
  await setRunProgress(run, site, {
    percent: 48,
    label: crawlerResearchEnabled ? 'Extracting menus and socials' : 'Building prompt-first dossier',
    detail: crawlerResearchEnabled
      ? 'Using Firecrawl to pull markdown, links, and social/menu targets from discovered pages.'
      : 'Saving a compact dossier for GPT-5.5 to turn into the build-agent prompt.',
  });
  const firecrawlExtracted = crawlerResearchEnabled
    ? await firecrawlSources(firstPassInputs).catch((error) => {
        console.error('[Agent Runner] Firecrawl failed:', error);
        captureMonitoringException(error, {
          tags: {
            area: 'research',
            provider: 'firecrawl',
            task_type: run.task_type,
          },
          extra: {
            siteId: site.id,
            siteSlug: site.slug,
            agentRunId: run.id,
          },
        });
        return [];
      })
    : [];
  const discoveredFromFirecrawl = discoverSourcesFromCandidates(firecrawlExtracted, site);
  let sources = dedupeSources([
    ...enrichedSeeds,
    ...apifySources,
    ...discoveredFromApify,
    ...firecrawlExtracted,
    ...discoveredFromFirecrawl,
  ]);
  let profile = summarizeResearchProfile(sources);
  let researchQa = assessResearchProfile(profile, sources);

  let secondPassFirecrawl: SourceCandidate[] = [];
  if (crawlerResearchEnabled && !researchQa.readyForPacket) {
    await setRunProgress(run, site, {
      percent: 62,
      label: 'Running deeper research pass',
      detail: 'Following menu, social, and directory leads to close remaining gaps.',
    });
    const deeperTargets = dedupeSources([
      ...discoveredFromApify,
      ...discoveredFromFirecrawl,
      ...sources.filter((source) => ['menu', 'instagram', 'facebook', 'directory', 'ordering', 'reservations'].includes(source.source_type)),
    ]);
    secondPassFirecrawl = await firecrawlSources(deeperTargets).catch((error) => {
      console.error('[Agent Runner] Firecrawl second pass failed:', error);
      captureMonitoringException(error, {
        tags: {
          area: 'research',
          provider: 'firecrawl',
          task_type: run.task_type,
        },
        extra: {
          siteId: site.id,
          siteSlug: site.slug,
          agentRunId: run.id,
          pass: 'second',
        },
      });
      return [];
    });
    sources = dedupeSources([...sources, ...secondPassFirecrawl, ...discoverSourcesFromCandidates(secondPassFirecrawl, site)]);
    profile = summarizeResearchProfile(sources);
    researchQa = assessResearchProfile(profile, sources);
  }
  await setRunProgress(run, site, {
    percent: 78,
    label: 'Saving research findings',
    detail: 'Persisting factual sources and visual asset candidates for the autopilot packet flow.',
  });
  await saveResearch(site, run, sources);
  const assetCount = await saveResearchAssets(site, sources);

  const previousMetadata = asRecord(site.metadata);
  const metaSessionCredential = await getProviderCredential('meta_research_session');
  const metaSession = readStoredBrowserSession(metaSessionCredential.secret);
  const socialResearchMode =
    metaSession?.storageState?.cookies?.length
      ? 'connected_meta_session'
      : metaSessionCredential.source === 'encrypted_db'
        ? 'expired_meta_session_fallback'
        : 'public_only';
  await updateMetaResearchSessionMetadata({
    credentialId: metaSessionCredential.id,
    status:
      metaSession?.storageState?.cookies?.length
        ? 'connected'
        : metaSessionCredential.source === 'encrypted_db'
          ? 'expired'
          : 'failed',
    detail:
      metaSession?.storageState?.cookies?.length
        ? null
        : metaSessionCredential.source === 'encrypted_db'
          ? 'Stored Meta session did not contain usable auth cookies during research.'
          : 'Research ran without a connected Meta session.',
  });
  const reviewState = readResearchReviewState(previousMetadata);
  const priorResolvedMenu = readResolvedMenu(previousMetadata);
  const historicalResolvedMenu = await loadHistoricalResolvedMenu(site.id);
  const reviewInputs = {
    siteMetadata: previousMetadata,
    siteName: site.restaurant_name,
    researchSources: sources.map((source) => ({
      source_type: source.source_type,
      url: source.url ?? null,
      title: source.title,
      confidence: source.confidence,
      extracted_facts: source.extracted_facts ?? {},
      metadata: source.metadata ?? {},
    })),
    siteAssets: [],
  };
  let audit: ResearchAuditRecord | null = null;
  let resolvedProfile = null;
  let resolvedMenu: ResolvedMenu | null = null;
  let effectiveReviewState = reviewState;

  await setRunProgress(run, site, {
    percent: 70,
    label: 'Extracting menu structure',
    detail: 'Parsing menu URLs, PDFs, images, and uploaded files into the best current structured menu.',
  });
  const extractedMenu = await generateResolvedMenu({
    site: {
      id: site.id,
      requestId: site.request_id,
      slug: site.slug,
      restaurantName: site.restaurant_name,
      city: site.city,
    },
    researchSources: reviewInputs.researchSources,
  }).catch((error) => {
    console.error('[Agent Runner] Menu extraction failed:', error);
    captureMonitoringException(error, {
      tags: {
        area: 'menu_extraction',
        provider: 'openai',
        task_type: run.task_type,
      },
      extra: {
        siteId: site.id,
        siteSlug: site.slug,
        agentRunId: run.id,
      },
    });
    return null;
  });
  resolvedMenu = preferredResolvedMenu(extractedMenu, priorResolvedMenu, historicalResolvedMenu);
  if (resolvedMenu) {
    await persistResolvedMenu(site.id, resolvedMenu);
  }

  try {
    await updateResearchProjectStage({
      siteId: site.id,
      projectStage: 'ai_audit',
      metadata: {
        ...previousMetadata,
        social_research_access: {
          mode: socialResearchMode,
          credential_source: metaSessionCredential.source,
          checked_at: new Date().toISOString(),
        },
        research_pipeline: appendResearchPhaseHistory(previousMetadata, {
          phase: 'ai_audit',
          label: 'AI audit',
          detail: 'GPT-5.5 is reviewing the evidence dossier and selecting canonical sources.',
          status: 'running',
        }),
      },
    });
    await setRunProgress(run, site, {
      percent: 88,
      label: 'Running AI research audit',
      detail: 'Using GPT-5.5 to judge the evidence set, pick canonical sources, and draft the resolved profile.',
    });
    addMonitoringBreadcrumb({
      category: 'agent.research',
      message: 'AI research audit started',
      data: {
        siteId: site.id,
        siteSlug: site.slug,
        agentRunId: run.id,
      },
    });
    const detail = await getAdminSiteDetail(site.slug);
    if (!detail) {
      throw new Error(`Could not load admin detail for research audit on ${site.slug}.`);
    }
    audit = await generateResearchAudit({
      slug: detail.slug,
      site: detail.site
        ? {
            id: detail.site.id,
            slug: detail.site.slug,
            restaurantName: detail.site.restaurant_name,
            city: detail.site.city,
            status: detail.site.status,
            metadata: detail.site.metadata ?? null,
          }
        : null,
      request: detail.request,
      intake: detail.intake,
      researchReview: {
        officialSiteCandidates: detail.researchReview.officialSiteCandidates,
        menuCandidates: detail.researchReview.menuCandidates,
        socialCandidates: detail.researchReview.socialCandidates,
        conflicts: detail.researchReview.conflicts,
        blockers: detail.researchReview.blockers,
      },
      researchSources: detail.researchSources.map((source) => ({
        id: source.id,
        source_type: source.source_type,
        url: source.url,
        title: source.title,
        confidence: source.confidence,
        extracted_facts: source.extracted_facts,
        metadata: source.metadata ?? {},
        captured_at: source.captured_at,
      })),
      siteAssets: detail.siteAssets.map((asset) => ({
        id: asset.id,
        asset_type: asset.asset_type,
        status: asset.status,
        source_url: asset.source_url,
        source_label: asset.source_label,
        metadata: asset.metadata,
      })),
      existingResolvedProfile: detail.resolvedProfile ?? null,
      existingResolvedMenu: resolvedMenu ?? detail.resolvedMenu ?? null,
    });
    resolvedProfile = audit.resolvedProfile;
    resolvedMenu = preferredResolvedMenu(audit.resolvedMenu, resolvedMenu, detail.resolvedMenu, priorResolvedMenu, historicalResolvedMenu);
    if (resolvedMenu) {
      await persistResolvedMenu(site.id, resolvedMenu);
    }
    effectiveReviewState = applyAuditSuggestionsToReviewState(reviewState, audit);
    addMonitoringBreadcrumb({
      category: 'agent.research',
      message: 'AI research audit completed',
      data: {
        siteId: site.id,
        siteSlug: site.slug,
        agentRunId: run.id,
        buildable: audit.summary.buildable,
        evidenceStrength: audit.summary.evidenceStrength,
      },
    });
  } catch (error) {
    console.error('[Agent Runner] Research audit failed:', error);
    captureMonitoringException(error, {
      tags: {
        area: 'research_audit',
        provider: 'openai',
        task_type: run.task_type,
      },
      extra: {
        siteId: site.id,
        siteSlug: site.slug,
        agentRunId: run.id,
      },
    });
  }

  const effectiveBlockers = audit?.blockers?.length ? audit.blockers : researchQa.blockers;
  const hardBlockers = launchBlockingGaps(effectiveBlockers);
  const buildThroughContentGaps = shouldBuildThroughContentGaps();
  const effectiveBuildable = hardBlockers.length === 0 && (audit ? true : buildThroughContentGaps || researchQa.readyForPacket);
  const reviewStateForSummary = effectiveBuildable && effectiveReviewState.status === 'needs_more_research'
    ? { ...effectiveReviewState, status: 'in_review' as const }
    : effectiveReviewState;
  const effectiveReviewSummary = summarizeResearchReview({
    ...reviewInputs,
    siteMetadata: {
      ...previousMetadata,
      resolved_menu: resolvedMenu,
      research_review: reviewStateForSummary,
    },
  });
  const reviewBlockers = launchBlockingGaps(effectiveReviewSummary.blockers);
  const readyForPacket = effectiveBuildable && reviewBlockers.length === 0;
  const queuedBuildPacketId = readyForPacket
    ? await queueWorkerRun({
        site,
        taskType: 'build_brief',
        provider: 'openai',
        model: audit ? 'gpt-5.5' : null,
        metadata: {
          triggered_by: 'research_autopilot',
          research_run_id: run.id,
          auto_queued: true,
        },
      })
    : null;
  const effectiveStatus =
    readyForPacket
      ? 'approved'
      : effectiveBuildable
        ? 'needs_review'
        : 'needs_more_research';
  const finalResearchPhase: ResearchPipelinePhase = readyForPacket
    ? 'resolved_profile_ready'
    : effectiveBuildable
      ? 'admin_review_required'
      : 'needs_info';
  await updateResearchProjectStage({
    siteId: site.id,
    projectStage: finalResearchPhase,
    metadata: {
      ...previousMetadata,
      research_audit: audit,
      resolved_menu: resolvedMenu,
      resolved_profile: resolvedProfile,
      strategic_profile: audit?.strategicProfile ?? null,
      social_research_access: {
        mode: socialResearchMode,
        credential_source: metaSessionCredential.source,
        checked_at: new Date().toISOString(),
      },
      research_pipeline: appendResearchPhaseHistory(previousMetadata, {
        phase: finalResearchPhase,
        label: readyForPacket
          ? 'AI finished research'
          : effectiveBuildable
            ? 'Needs your help'
            : 'Research held for more evidence',
        detail: effectiveBuildable
          ? readyForPacket
            ? 'The evidence has been audited and the build packet was queued automatically.'
            : 'The evidence has been audited. AI picked the best available info, but we still need a little help before packet generation.'
          : effectiveBlockers.join(' | '),
        status: readyForPacket ? 'succeeded' : effectiveBuildable ? 'blocked' : 'failed',
      }),
      research_review: {
        ...effectiveReviewState,
        status: effectiveStatus,
        overrideStatus: effectiveReviewSummary.overrideStatus,
        launchMode: buildThroughContentGaps ? 'always_build' : 'gated',
        reviewedAt: effectiveReviewState.reviewedAt,
        suggestions: {
          officialSiteCandidates: effectiveReviewSummary.officialSiteCandidates.slice(0, 4),
          menuCandidates: effectiveReviewSummary.menuCandidates.slice(0, 4),
          socialCandidates: effectiveReviewSummary.socialCandidates.slice(0, 6),
        },
      },
      current_operation: {
        task_type: readyForPacket ? 'build_brief' : run.task_type,
        percent: readyForPacket ? 5 : 92,
        label: readyForPacket ? 'Generating packet' : effectiveBuildable ? 'Needs your help' : 'Research needs more info',
        detail: readyForPacket
          ? 'AI picked the best available info and packet generation is starting automatically.'
          : effectiveBuildable
            ? reviewBlockers.join(' | ') || 'There are a couple of low-confidence items worth checking.'
            : effectiveBlockers.join(' | '),
        status: readyForPacket ? 'queued' : 'blocked',
        phase: finalResearchPhase,
        updated_at: new Date().toISOString(),
      },
    },
  });

  await setRunProgress(run, site, {
    percent: 100,
    label: readyForPacket ? 'AI finished research' : effectiveBuildable ? 'Research complete, needs your help' : 'Research complete, more info needed',
    detail: readyForPacket
      ? 'Packet generation was queued automatically using the best available research.'
      : effectiveBuildable
        ? reviewBlockers.join(' | ') || 'The AI finished research, but one or two low-confidence choices still need a human glance.'
        : effectiveBlockers.join(' | '),
    status: readyForPacket ? 'succeeded' : 'blocked',
  });
  await logSiteEvent({
    eventType: 'agent_research_completed',
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'system',
    message: `Research completed for ${site.restaurant_name}`,
    metadata: {
      source_count: sources.length,
      queued_build_packet: Boolean(queuedBuildPacketId),
      queued_build_packet_run_id: queuedBuildPacketId,
      asset_candidate_count: assetCount,
      providers_used: {
        google_maps_places: Boolean(placeSource),
        apify: apifySources.length > 0,
        firecrawl: firecrawlExtracted.length > 0 || secondPassFirecrawl.length > 0,
        openai_auditor: Boolean(audit),
      },
      research_mode: researchMode(),
      research_qa: researchQa,
      research_audit: audit,
      profile,
      resolved_menu: resolvedMenu,
      resolved_profile: resolvedProfile,
    },
  });

  return {
    source_count: sources.length,
    asset_candidate_count: assetCount,
    queued_next: queuedBuildPacketId ? 'build_brief' : null,
    providers_used: {
      google_maps_places: Boolean(placeSource),
      apify: apifySources.length > 0,
      firecrawl: firecrawlExtracted.length > 0 || secondPassFirecrawl.length > 0,
      openai_auditor: Boolean(audit),
    },
    research_mode: researchMode(),
    launch_mode: buildThroughContentGaps ? 'always_build' : 'gated',
    research_qa: researchQa,
    research_audit: audit,
    profile,
    resolved_menu: resolvedMenu,
    resolved_profile: resolvedProfile,
  };
}

async function processBuildPacket(run: AgentRun) {
  const site = await loadSite(run);
  if (!site) throw new Error('Build packet run is missing a site.');
  await setRunProgress(run, site, {
    percent: 20,
    label: 'Validating AI research choices',
    detail: 'Checking whether the resolved profile is strong enough to turn into a build packet.',
  });
  const detail = await getAdminSiteDetail(site.slug);
  if (!detail) throw new Error('Could not load admin detail for build packet.');
  const profile = summarizeResearchProfile(detail.researchSources.map((source) => ({
    source_type: source.source_type,
    url: source.url,
    title: source.title ?? 'Research source',
    confidence: source.confidence,
    extracted_facts: source.extracted_facts,
    metadata: source.metadata,
  })));
  const researchQa = assessResearchProfile(profile, detail.researchSources.map((source) => ({
    source_type: source.source_type,
    url: source.url,
    title: source.title ?? 'Research source',
    confidence: source.confidence,
    extracted_facts: source.extracted_facts,
    metadata: source.metadata,
  })));
  const packetBlockers = launchBlockingGaps([...detail.researchReview.blockers]);
  const auditBlockers = launchBlockingGaps(detail.researchAudit?.blockers ?? []);
  if (detail.researchAudit && detail.researchAudit.summary.buildable === false && auditBlockers.length) {
    packetBlockers.unshift(
      detail.researchAudit.summary.rationale || 'AI research marked this project as not buildable yet.',
    );
  }
  packetBlockers.unshift(...auditBlockers);
  const missingCoreResearch = !detail.resolvedProfile;

  if (missingCoreResearch || packetBlockers.length) {
    const supabase = getSupabaseAdmin();
    const blockedDetail = packetBlockers.length
      ? `Needs your help: ${packetBlockers.join(' | ')}`
      : 'AI research is missing the saved audit/profile outputs needed to generate a build packet yet.';
    await supabase.from('restaurant_sites').update({
      project_stage: packetBlockers.length ? 'admin_review_required' : 'needs_info',
      metadata: {
        ...asRecord(site.metadata),
        current_operation: {
          task_type: run.task_type,
          percent: 20,
          label: 'Build packet blocked',
          detail: blockedDetail,
          status: 'blocked',
          updated_at: new Date().toISOString(),
        },
      },
    }).eq('id', site.id);
    await logSiteEvent({
      eventType: 'agent_build_packet_blocked',
      siteId: site.id,
      requestId: site.request_id,
      actorType: 'system',
      message: `Build packet blocked for ${site.restaurant_name}`,
      metadata: {
        research_qa: researchQa,
        review_blockers: packetBlockers,
        audit_ready: Boolean(detail.researchAudit),
        resolved_profile_ready: Boolean(detail.resolvedProfile),
        launch_mode: shouldBuildThroughContentGaps() ? 'always_build' : 'gated',
      },
    });
    return asBlockedResult(blockedDetail, {
      research_qa: researchQa,
      review_blockers: packetBlockers,
      audit_ready: Boolean(detail.researchAudit),
      resolved_profile_ready: Boolean(detail.resolvedProfile),
      launch_mode: shouldBuildThroughContentGaps() ? 'always_build' : 'gated',
    });
  }
  await setRunProgress(run, site, {
    percent: 58,
    label: 'Generating build packet',
    detail: 'Using the curated research set to produce the implementation handoff.',
  });
  const packet = await generateAdminBuildPacket(detail, WORKER_ACTOR, { agentRunId: run.id });
  const supabase = getSupabaseAdmin();
  if (packet.status === 'ready') {
    await queueRun({
      siteId: site.id,
      requestId: site.request_id,
      taskType: 'code_build',
      provider: 'renderer',
      metadata: {
        queued_after_agent_run_id: run.id,
        build_packet_id: packet.id,
        workflow_step: 'code_build',
      },
    });
  }
  await supabase.from('restaurant_sites').update({
    project_stage: packet.status === 'ready' ? 'building' : 'needs_info',
    metadata: {
      ...asRecord(site.metadata),
      current_operation: {
        task_type: packet.status === 'ready' ? 'code_build' : run.task_type,
        percent: packet.status === 'ready' ? 8 : 0,
        label: packet.status === 'ready' ? 'Building preview' : 'Build brief failed',
        detail: packet.status === 'ready'
          ? 'The build brief is ready and preview generation has started automatically.'
          : 'Build brief generation failed.',
        status: packet.status === 'ready' ? 'succeeded' : 'failed',
        updated_at: new Date().toISOString(),
      },
    },
  }).eq('id', site.id);
  if (packet.status !== 'ready') {
    await setRunProgress(run, site, {
      percent: 100,
      label: 'Build brief failed',
      detail: 'Build brief generation failed.',
      status: 'failed',
    });
    return asBlockedResult('Build packet generation failed.', {
      packet_id: packet.id,
      packet_status: packet.status,
    });
  }
  await setRunProgress(run, site, {
    percent: 100,
    label: 'Build brief ready',
    detail: 'The build brief was generated and preview build was queued automatically.',
    status: 'succeeded',
  });
  return { packet_id: packet.id, packet_status: packet.status, queued_next: 'code_build' };
}

async function processCodeBuild(run: AgentRun) {
  const site = await loadSite(run);
  if (!site) throw new Error('Code build run is missing a site.');
  const detail = await getAdminSiteDetail(site.slug);
  if (!detail?.site || !detail.resolvedProfile) {
    return asBlockedResult('Build blocked because the site or resolved profile could not be loaded.', {
      review_ready: detail?.researchReview.readyForPacket ?? false,
      blockers: detail?.researchReview.blockers ?? [],
      resolved_profile_ready: Boolean(detail?.resolvedProfile),
      launch_mode: shouldBuildThroughContentGaps() ? 'always_build' : 'gated',
    });
  }
  await setRunProgress(run, site, {
    percent: 20,
    label: 'Preparing render payload',
    detail: 'Generating the structured site payload from the approved packet and resolved profile.',
  });

  const supabase = getSupabaseAdmin();
  const renderPayload = buildSiteRenderPayload(detail);
  const generatedManifest = buildGeneratedSiteManifest(detail);
  const generatedFile = await writeGeneratedSiteManifest(generatedManifest).catch((error) => {
    console.error('[Agent Runner] Generated site artifact write failed:', error);
    return null;
  });
  const generatedFiles = [
    ...(generatedFile ? [generatedFile.path, generatedFile.registryPath] : []),
  ].filter(Boolean);
  await setRunProgress(run, site, {
    percent: 34,
    label: 'Committing generated code',
    detail: `Writing ${site.slug} generated site files to the production deploy branch.`,
  });
  const githubCommit = await commitGeneratedSiteToGitHub(generatedManifest).catch((error) => ({
    committed: false,
    blocked: true,
    branch: productionDeployBranch(),
    reason: error instanceof Error ? error.message : 'github_commit_failed',
  }));
  if (githubCommit.blocked || !githubCommit.committed) {
    const blockedAt = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    await supabase.from('restaurant_sites').update({
      deployment_status: 'failed',
      generated_site_manifest: generatedManifest,
      generated_file_manifest: generatedFiles.map((path) => ({ path, kind: path.endsWith('registry.ts') ? 'registry' : 'manifest' })),
    }).eq('id', site.id);
    await updateSiteMetadata(site.id, {
      current_operation: {
        task_type: run.task_type,
        percent: 34,
        label: 'Generated code commit blocked',
        detail: `Connect GitHub repo credentials before deployment can continue: ${githubCommit.reason ?? 'missing GitHub configuration'}.`,
        status: 'blocked',
        updated_at: blockedAt,
      },
      generated_site: generatedManifest,
      generated_site_files: generatedFiles,
      generated_site_commit: githubCommit,
    });
    return asBlockedResult('Generated site code could not be committed to the production deploy branch.', {
      github_commit: githubCommit,
      generated_files: generatedFiles,
    });
  }
  const renderHash = renderPayloadHash(renderPayload);
  const sourceHash = detail.packetSourceHash;
  const deploymentUrl = generatedSiteSubdomain(site.slug) ?? restaurantSubdomainUrl(site.slug) ?? renderAbsoluteSiteUrl(site.preview_url);
  const branch = githubCommit.branch ?? productionDeployBranch();

  addMonitoringBreadcrumb({
    category: 'agent.build',
    message: 'Render payload build started',
    data: {
      siteId: site.id,
      siteSlug: site.slug,
      agentRunId: run.id,
      sourceHash,
      renderHash,
    },
  });

  await setRunProgress(run, site, {
    percent: 48,
    label: 'Saving render payload',
    detail: 'Persisting the runtime render spec for preview and live routing.',
  });

  const specInsert = {
    site_id: site.id,
    version_label: `preview-${new Date().toISOString()}`,
    status: 'staged',
    source_hash: sourceHash,
    spec_json: {
      packet_id: detail.buildPacket?.id ?? null,
      render_hash: renderHash,
      render_version: renderPayload.version,
      packet_state: detail.packetState,
      siteBrief: detail.siteBrief,
      renderPayload,
      generatedSite: generatedManifest,
      generatedFiles,
    },
    seo_json: {
      title: `${renderPayload.restaurant.name} | ${renderPayload.restaurant.city ?? 'SaborWeb'}`,
      description: renderPayload.brand.summary,
    },
    render_json: renderPayload,
    generated_by_agent_run_id: run.id,
  };

  let spec: { id: string } | null = null;
  let specError: { message?: string } | null = null;
  const primarySpecInsert = await supabase
    .from('site_specs')
    .insert(specInsert)
    .select('id')
    .single();
  if (primarySpecInsert.error && isMissingRenderJsonColumnError(primarySpecInsert.error)) {
    const { render_json, ...legacySpecInsert } = specInsert;
    void render_json;
    const fallbackSpecInsert = await supabase
      .from('site_specs')
      .insert(legacySpecInsert)
      .select('id')
      .single();
    spec = fallbackSpecInsert.data;
    specError = fallbackSpecInsert.error;
  } else {
    spec = primarySpecInsert.data;
    specError = primarySpecInsert.error;
  }

  if (specError || !spec) {
    throw new Error(specError?.message ?? 'Could not store the staged site spec.');
  }

  await setRunProgress(run, site, {
    percent: 72,
    label: 'Creating staged preview version',
    detail: 'Recording the preview artifact that QA and claim flow will use.',
  });

  const { data: version, error } = await supabase.from('site_versions').insert({
    site_id: site.id,
    site_spec_id: spec.id,
    status: 'staged',
    release_channel: 'preview',
    source_branch: branch,
    deployment_url: deploymentUrl,
    metadata: {
      created_by_agent_run_id: run.id,
      github_status: 'generated_site_committed',
      github_commit: githubCommit,
      vercel_status: restaurantSubdomainUrl(site.slug) ? 'subdomain_route_ready' : 'preview_route_ready',
      build_packet_id: run.metadata.build_packet_id ?? null,
      prompt_revision_id: typeof run.metadata.prompt_revision_id === 'string' ? run.metadata.prompt_revision_id : null,
      render_hash: renderHash,
      source_hash: sourceHash,
      build_strategy: 'generated_site',
      generated_files: generatedFiles,
    },
  }).select('id, deployment_url').single();

  if (error || !version) throw new Error(error?.message ?? 'Could not create staged site version.');

  if (typeof run.metadata.prompt_revision_id === 'string') {
    await updatePromptStudioRevision({
      revisionId: run.metadata.prompt_revision_id,
      resultingSiteSpecId: spec.id,
      resultingSiteVersionId: version.id,
      status: 'draft_preview',
      metadata: {
        source_hash: sourceHash,
        render_hash: renderHash,
      },
    });
  }

  await supabase.from('restaurant_sites').update({
    project_stage: 'building',
    build_strategy: 'generated_site',
    generated_site_manifest: generatedManifest,
    generated_file_manifest: generatedFiles.map((path) => ({ path, kind: path.endsWith('registry.ts') ? 'registry' : 'manifest' })),
    deployment_status: 'queued',
    staging_url: deploymentUrl,
    metadata: {
      ...asRecord(site.metadata),
      render_payload: {
        source_hash: sourceHash,
        render_hash: renderHash,
        site_spec_id: spec.id,
        site_version_id: version.id,
      },
      generated_site: generatedManifest,
      generated_site_files: generatedFiles,
      generated_site_commit: githubCommit,
      build_strategy: 'generated_site',
      current_operation: {
        task_type: run.task_type,
        percent: 72,
        label: 'Generated site staged',
        detail: 'Generated site files and manifest were recorded. Next the deploy worker will publish the preview route.',
        status: 'running',
        updated_at: new Date().toISOString(),
      },
    },
  }).eq('id', site.id);
  await queueRun({
    siteId: site.id,
    requestId: site.request_id,
    taskType: 'deploy',
    provider: 'vercel',
    metadata: {
      queued_after_agent_run_id: run.id,
      site_version_id: version.id,
      workflow_step: 'deploy',
      github_commit: githubCommit,
    },
  });

  return {
    site_version_id: version.id,
    deployment_url: deploymentUrl,
    source_branch: branch,
    generated_site_file: generatedFile?.path ?? null,
    generated_site_files: generatedFiles,
    github_commit: githubCommit,
    queued_next: 'deploy',
  };
}

function projectEnvKey() {
  return process.env.VERCEL_PROJECT_ID ?? process.env.VERCEL_PROJECT_NAME ?? null;
}

async function vercelApiRequest(path: string, method: string, body?: Record<string, unknown>) {
  const credential = await getProviderCredential('vercel');
  const token = credentialValue(credential.secret, 'VERCEL_API_TOKEN');
  if (!token) throw new Error('Missing Vercel credentials.');
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Vercel API ${method} ${path} failed: ${JSON.stringify(json)}`);
  return asRecord(json);
}

async function addVercelProjectDomain(domain: string) {
  const project = projectEnvKey();
  if (!project) return { configured: false, reason: 'missing_vercel_project_id' };
  const result = await vercelApiRequest(`/v10/projects/${encodeURIComponent(project)}/domains`, 'POST', {
    name: domain,
  }).catch(async (error) => {
    const message = error instanceof Error ? error.message : 'Domain add failed.';
    if (message.includes('already') || message.includes('taken')) {
      return { alreadyConfigured: true };
    }
    throw error;
  });
  return { configured: true, result };
}

async function verifyVercelProjectDomain(domain: string) {
  const project = projectEnvKey();
  if (!project) return { verified: false, reason: 'missing_vercel_project_id' };
  const result = await vercelApiRequest(`/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}/verify`, 'POST')
    .catch((error) => ({ verified: false, error: error instanceof Error ? error.message : 'Verification failed.' }));
  return result;
}

async function triggerSaborWebDeploy() {
  const hook = process.env.DEPLOY_HOOK_SABORWEB || process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return { triggered: false, reason: 'missing_deploy_hook' };
  const response = await fetch(hook, { method: 'POST', cache: 'no-store' });
  if (!response.ok) throw new Error(`Deploy hook failed: ${response.status}`);
  return { triggered: true };
}

async function waitForVercelDeployment(params: {
  commitSha: string | null;
  branch: string | null;
}) {
  const project = projectEnvKey();
  if (!project) return { ready: false, reason: 'missing_vercel_project_id' };
  if (!params.commitSha) return { ready: false, reason: 'missing_generated_commit_sha' };
  const targetSha = params.commitSha;

  const started = Date.now();
  const timeoutMs = Number(process.env.VERCEL_DEPLOY_WAIT_MS ?? 180_000);
  const intervalMs = Number(process.env.VERCEL_DEPLOY_POLL_MS ?? 10_000);
  let lastSeen: Record<string, unknown> | null = null;

  while (Date.now() - started < timeoutMs) {
    const result = await vercelApiRequest(
      `/v6/deployments?projectId=${encodeURIComponent(project)}&limit=20`,
      'GET',
    );
    const deployments = Array.isArray(result.deployments) ? result.deployments : [];
    const match = deployments
      .map((deployment) => asRecord(deployment))
      .find((deployment) => {
        const meta = asRecord(deployment.meta);
        const gitSource = asRecord(deployment.gitSource);
        const sha =
          asString(meta.githubCommitSha) ||
          asString(meta.githubCommitRef) ||
          asString(gitSource.sha) ||
          asString(deployment.metaGithubCommitSha);
        const branch =
          asString(meta.githubCommitRef) ||
          asString(meta.githubCommitBranch) ||
          asString(gitSource.ref);
        return sha === targetSha || (params.branch && branch === params.branch && sha?.startsWith(targetSha.slice(0, 12)));
      });

    if (match) {
      lastSeen = match;
      const state = asString(match.state) ?? asString(match.readyState);
      if (state === 'READY') {
        return {
          ready: true,
          deploymentId: asString(match.uid) ?? asString(match.id),
          deploymentUrl: asString(match.url),
          state,
        };
      }
      if (state === 'ERROR' || state === 'CANCELED') {
        return {
          ready: false,
          reason: `vercel_deployment_${state.toLowerCase()}`,
          deploymentId: asString(match.uid) ?? asString(match.id),
          state,
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    ready: false,
    reason: 'vercel_deployment_timeout',
    lastSeen,
  };
}

async function processDeploy(run: AgentRun) {
  const site = await loadSite(run);
  if (!site) throw new Error('Deploy run is missing a site.');
  const supabase = getSupabaseAdmin();
  const githubCommit = asRecord(run.metadata.github_commit);
  const commitSha = asString(githubCommit.commitSha);
  const commitBranch = asString(githubCommit.branch) ?? productionDeployBranch();
  await setRunProgress(run, site, {
    percent: 18,
    label: 'Preparing subdomain',
    detail: `Preparing ${site.slug}.saborweb.com routing for the generated preview.`,
  });

  const previewDomain = `${site.slug}.saborweb.com`;
  await supabase.from('restaurant_sites').update({
    deployment_status: 'deploying',
  }).eq('id', site.id);
  const subdomain = await addVercelProjectDomain(previewDomain).catch((error) => ({
    configured: false,
    error: error instanceof Error ? error.message : 'Could not configure subdomain.',
  }));

  await setRunProgress(run, site, {
    percent: 42,
    label: 'Checking custom domains',
    detail: 'Adding and verifying any customer-owned custom domains already attached to this project.',
  });
  const { data: customDomains } = await supabase
    .from('custom_domains')
    .select('id, domain, status')
    .eq('site_id', site.id)
    .in('status', ['requested', 'pending', 'verification_failed'])
    .limit(10);
  const customDomainResults = [];
  for (const domainRow of customDomains ?? []) {
    const domain = asString(asRecord(domainRow).domain);
    const id = asString(asRecord(domainRow).id);
    if (!domain || !id) continue;
    const added = await addVercelProjectDomain(domain).catch((error) => ({
      configured: false,
      error: error instanceof Error ? error.message : 'Could not add custom domain.',
    }));
    const verified = await verifyVercelProjectDomain(domain);
    const verifiedRecord = asRecord(verified);
    const verifiedOk = verifiedRecord.verified === true || asString(verifiedRecord.configuredBy) !== null;
    await supabase
      .from('custom_domains')
      .update({
        status: verifiedOk ? 'verified' : 'pending',
        last_checked_at: new Date().toISOString(),
        verification: { added, verified },
      })
      .eq('id', id);
    customDomainResults.push({ domain, added, verified, status: verifiedOk ? 'verified' : 'pending' });
  }

  await setRunProgress(run, site, {
    percent: 68,
    label: 'Triggering SaborWeb deploy',
    detail: 'Starting a SaborWeb deployment so generated site artifacts can be served from the subdomain.',
  });
  const deployHook = await triggerSaborWebDeploy().catch((error) => ({
    triggered: false,
    error: error instanceof Error ? error.message : 'Deploy hook failed.',
  }));
  await setRunProgress(run, site, {
    percent: 82,
    label: 'Waiting for Vercel',
    detail: `Watching the Vercel deployment for commit ${commitSha?.slice(0, 12) ?? 'unknown'}.`,
  });
  const observedDeployment = await waitForVercelDeployment({
    commitSha,
    branch: commitBranch,
  }).catch((error) => ({
    ready: false,
    reason: error instanceof Error ? error.message : 'vercel_observation_failed',
  }));
  if (!observedDeployment.ready) {
    await supabase.from('restaurant_sites').update({
      deployment_status: 'failed',
      metadata: {
        ...asRecord(site.metadata),
        deployment: {
          provider: 'vercel',
          status: 'blocked_before_qa',
          deploy_hook: deployHook,
          observed_deployment: observedDeployment,
          github_commit: githubCommit,
          subdomain,
          custom_domains: customDomainResults,
        },
        current_operation: {
          task_type: run.task_type,
          percent: 82,
          label: 'Deployment not ready',
          detail: `QA is blocked until Vercel reports the generated commit ready: ${observedDeployment.reason ?? 'not ready'}.`,
          status: 'blocked',
          updated_at: new Date().toISOString(),
        },
      },
    }).eq('id', site.id);
    return asBlockedResult('Vercel deployment was not ready, so QA was not queued.', {
      observed_deployment: observedDeployment,
      github_commit: githubCommit,
      deploy_hook: deployHook,
    });
  }
  const deploymentUrl = generatedSiteSubdomain(site.slug);
  const deployedAt = new Date().toISOString();

  await supabase.from('restaurant_sites').update({
    project_stage: 'building',
    deployment_status: 'preview_ready',
    staging_url: deploymentUrl,
    metadata: {
      ...asRecord(site.metadata),
      deployment: {
        provider: 'vercel',
        status: 'preview_ready_for_qa',
        deployed_at: deployedAt,
        deploy_hook: deployHook,
        observed_deployment: observedDeployment,
        github_commit: githubCommit,
        subdomain,
        custom_domains: customDomainResults,
      },
      subdomain_status: {
        domain: previewDomain,
        url: deploymentUrl,
        status: 'configured',
        checked_at: deployedAt,
      },
      current_operation: {
        task_type: run.task_type,
        percent: 100,
        label: 'Preview deployed, QA queued',
        detail: `${deploymentUrl} is ready for QA checks.`,
        status: 'succeeded',
        updated_at: deployedAt,
      },
    },
  }).eq('id', site.id);

  await queueRun({
    siteId: site.id,
    requestId: site.request_id,
    taskType: 'qa',
    provider: 'playwright',
    metadata: { queued_after_agent_run_id: run.id, workflow_step: 'qa', deployment_url: deploymentUrl },
  });

  return {
    deployment_url: deploymentUrl,
    subdomain,
    custom_domains: customDomainResults,
    deploy_hook: deployHook,
    observed_deployment: observedDeployment,
    queued_next: 'qa',
  };
}

async function processQa(run: AgentRun) {
  const site = await loadSite(run);
  if (!site) throw new Error('QA run is missing a site.');
  await setRunProgress(run, site, {
    percent: 20,
    label: 'Running preview QA',
    detail: 'Checking preview availability, bilingual routes, and accessibility smoke tests.',
  });

  const supabase = getSupabaseAdmin();
  const { data: version } = await supabase
    .from('site_versions')
    .select('id, deployment_url, metadata')
    .eq('site_id', site.id)
    .in('status', ['staged', 'qa_failed'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseUrl = asString(version?.deployment_url) ?? absoluteSiteUrl(site.preview_url);
  const urls = [baseUrl, `${baseUrl.replace(/\/$/, '')}/es`, `${baseUrl.replace(/\/$/, '')}/en`];
  let checks: Array<Record<string, unknown>>;
  let usedPlaywright = false;

  try {
    checks = await runBrowserQa(urls);
    usedPlaywright = true;
  } catch (error) {
    console.error('[Agent Runner] Playwright QA failed, falling back to HTTP smoke:', error);
    checks = await Promise.all(urls.map(async (url) => {
      const started = Date.now();
      try {
        const response = await fetch(url, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(12_000) });
        return { url, ok: response.ok, status: response.status, duration_ms: Date.now() - started };
      } catch (fallbackError) {
        return { url, ok: false, status: 0, duration_ms: Date.now() - started, error: fallbackError instanceof Error ? fallbackError.message : 'Fetch failed' };
      }
    }));
  }

  const passed = checks.some((check) => check.url === baseUrl && check.ok === true);
  const qaResult = {
    passed,
    checks,
    tools: {
      playwright: usedPlaywright ? 'browser_smoke_check' : 'http_smoke_fallback',
      lighthouse: 'configured_for_local_or_ci_runner',
      axe: usedPlaywright ? 'browser_a11y_audit' : 'not_run',
    },
  };

  if (version?.id) {
    await supabase.from('site_versions').update({
      status: passed ? 'approved' : 'qa_failed',
      qa_result: qaResult,
    }).eq('id', version.id);

    const promptRevisionId =
      version && typeof asRecord(version).metadata === 'object' && version.metadata
        ? (asRecord(version.metadata).prompt_revision_id as string | null)
        : null;
    if (promptRevisionId) {
      await updatePromptStudioRevision({
        revisionId: promptRevisionId,
        status: passed ? 'approved' : 'failed',
        metadata: {
          qa_passed: passed,
          qa_result: qaResult,
        },
      });
    }
  }
  await supabase.from('restaurant_sites').update({
    status: passed ? 'preview_ready' : 'preview_building',
    project_stage: passed ? 'preview_sent' : 'qa_failed',
    preview_released_at: passed ? new Date().toISOString() : null,
    metadata: {
      ...asRecord(site.metadata),
      current_operation: {
        task_type: run.task_type,
        percent: 100,
        label: passed ? 'QA passed, preview released' : 'QA failed',
        detail: passed ? 'Preview passed smoke checks and owner follow-up is being queued.' : 'Preview failed QA checks. Review the latest QA result.',
        status: passed ? 'succeeded' : 'failed',
        updated_at: new Date().toISOString(),
      },
    },
  }).eq('id', site.id);

  if (passed) {
    await queueRun({
      siteId: site.id,
      requestId: site.request_id,
      taskType: 'sales_followup',
      provider: 'resend',
      metadata: {
        queued_after_agent_run_id: run.id,
        workflow_step: 'sales_followup',
        triggered_by: 'qa_passed_autopilot',
      },
    });
  }

  return qaResult;
}

async function processSalesFollowup(run: AgentRun) {
  const site = await loadSite(run);
  if (!site?.owner_email) return { sent: false, reason: 'missing_owner_email' };
  await setRunProgress(run, site, {
    percent: 45,
    label: 'Sending owner follow-up',
    detail: 'Preparing preview-ready email.',
  });

  const resendCredential = await getProviderCredential('resend');
  const apiKey = credentialValue(resendCredential.secret, 'RESEND_API_KEY');
  if (!apiKey) return { sent: false, reason: 'missing_resend_api_key' };

  const resend = new Resend(apiKey);
  const previewUrl = site.staging_url ?? restaurantSubdomainUrl(site.slug) ?? absoluteSiteUrl(site.preview_url);
  const claimUrl = absoluteSiteUrl(site.claim_url);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'SaborWeb <hello@saborweb.com>',
    to: site.owner_email,
    subject: `Your ${site.restaurant_name} preview is ready`,
    text: [
      `Your SaborWeb preview for ${site.restaurant_name} is ready for review.`,
      '',
      `Preview: ${previewUrl}`,
      `Claim: ${claimUrl}`,
      '',
      'Reply to this email if anything important is missing.',
    ].join('\n'),
  });
  await updateSiteMetadata(site.id, {
    current_operation: {
      task_type: run.task_type,
      percent: 100,
      label: 'Owner follow-up sent',
      detail: `Preview email sent to ${site.owner_email}.`,
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    },
  });
  return { sent: true, to: site.owner_email };
}

async function dispatchRun(run: AgentRun) {
  switch (run.task_type) {
    case 'research_collect':
      return processResearchCollect(run);
    case 'research':
    case 'ai_review':
      return processResearch(run);
    case 'build_brief':
    case 'build_packet':
      return processBuildPacket(run);
    case 'code_build':
      return processCodeBuild(run);
    case 'deploy':
      return processDeploy(run);
    case 'qa':
      return processQa(run);
    case 'sales_followup':
      return processSalesFollowup(run);
    default:
      return { skipped: true, reason: `No runner is wired for ${run.task_type}.` };
  }
}

export async function processQueuedAgentRuns(limit = 3) {
  const supabase = getSupabaseAdmin();
  const results = [];

  while (results.length < limit) {
    const { data, error } = await supabase
      .from('agent_runs')
      .select('id, site_id, request_id, task_type, provider, model, status, artifacts, metadata')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Could not load queued agent runs: ${error.message}`);
    if (!data) break;

    const rawRun = data;
    const run = {
      ...rawRun,
      artifacts: asRecord(rawRun.artifacts),
      metadata: asRecord(rawRun.metadata),
    } as AgentRun;
    const startedAt = new Date().toISOString();
    await markRun(run.id, {
      status: 'running',
      started_at: startedAt,
      metadata: {
        ...run.metadata,
        started_by: 'agent_worker',
        started_at: startedAt,
      },
    });

    try {
      const artifacts = await dispatchRun(run);
      const blocked = typeof artifacts === 'object' && artifacts !== null && 'blocked' in artifacts && artifacts.blocked === true;
      await markRun(run.id, {
        status: blocked ? 'blocked' : 'succeeded',
        finished_at: new Date().toISOString(),
        artifacts: {
          ...run.artifacts,
          result: artifacts,
        },
        error_message: blocked && typeof artifacts === 'object' && artifacts !== null && 'message' in artifacts ? String(artifacts.message) : null,
      });
      results.push({ id: run.id, task_type: run.task_type, status: blocked ? 'blocked' : 'succeeded', artifacts });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent run failed.';
      await markRun(run.id, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: message,
        metadata: {
          ...run.metadata,
          failed_by: 'agent_worker',
        },
      });
      results.push({ id: run.id, task_type: run.task_type, status: 'failed', error: message });
    }
  }

  return { processed: results.length, results };
}

import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type PromptStudioRevisionStatus =
  | 'draft_preview'
  | 'approved'
  | 'published'
  | 'discarded'
  | 'failed';

export type PromptStudioRevision = {
  id: string;
  createdAt: string;
  updatedAt: string;
  siteId: string;
  promptText: string;
  attachedLinks: string[];
  outputSummary: string | null;
  model: string | null;
  sourceSiteSpecId: string | null;
  sourceSiteVersionId: string | null;
  resultingSiteSpecId: string | null;
  resultingSiteVersionId: string | null;
  status: PromptStudioRevisionStatus;
  metadata: Record<string, unknown>;
};

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isMissingPromptRevisionsTable(error: { message?: string; code?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === '42P01' ||
        error.message?.includes('site_prompt_revisions') ||
        error.message?.includes('relation') ||
        error.message?.includes('schema cache')),
  );
}

export function normalizePromptStudioRevision(value: unknown): PromptStudioRevision | null {
  const record = asRecord(value);
  const status = cleanString(record.status);
  if (!cleanString(record.id) || !cleanString(record.site_id) || !cleanString(record.prompt_text)) {
    return null;
  }
  if (!status || !['draft_preview', 'approved', 'published', 'discarded', 'failed'].includes(status)) {
    return null;
  }

  return {
    id: cleanString(record.id) ?? '',
    createdAt: cleanString(record.created_at) ?? '',
    updatedAt: cleanString(record.updated_at) ?? '',
    siteId: cleanString(record.site_id) ?? '',
    promptText: cleanString(record.prompt_text) ?? '',
    attachedLinks: stringArray(record.attached_links),
    outputSummary: cleanString(record.output_summary),
    model: cleanString(record.model),
    sourceSiteSpecId: cleanString(record.source_site_spec_id),
    sourceSiteVersionId: cleanString(record.source_site_version_id),
    resultingSiteSpecId: cleanString(record.resulting_site_spec_id),
    resultingSiteVersionId: cleanString(record.resulting_site_version_id),
    status: status as PromptStudioRevisionStatus,
    metadata: asRecord(record.metadata),
  };
}

export async function listPromptStudioRevisions(siteId: string): Promise<PromptStudioRevision[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('site_prompt_revisions')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    if (isMissingPromptRevisionsTable(error)) return [];
    console.error('[Prompt Studio] Revision lookup failed:', error);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizePromptStudioRevision(row))
    .filter((row): row is PromptStudioRevision => Boolean(row));
}

export async function createPromptStudioRevision(params: {
  siteId: string;
  promptText: string;
  attachedLinks: string[];
  outputSummary: string | null;
  model: string | null;
  sourceSiteSpecId: string | null;
  sourceSiteVersionId: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const payload = {
    site_id: params.siteId,
    prompt_text: params.promptText,
    attached_links: params.attachedLinks,
    output_summary: params.outputSummary,
    model: params.model,
    source_site_spec_id: params.sourceSiteSpecId,
    source_site_version_id: params.sourceSiteVersionId,
    status: 'draft_preview',
    metadata: params.metadata ?? {},
  };
  const { data, error } = await supabase
    .from('site_prompt_revisions')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (isMissingPromptRevisionsTable(error)) return null;
    throw new Error(`Could not create prompt revision: ${error.message}`);
  }

  return normalizePromptStudioRevision(data);
}

export async function updatePromptStudioRevision(params: {
  revisionId: string;
  status?: PromptStudioRevisionStatus;
  outputSummary?: string | null;
  resultingSiteSpecId?: string | null;
  resultingSiteVersionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};
  if (params.status) patch.status = params.status;
  if (params.outputSummary !== undefined) patch.output_summary = params.outputSummary;
  if (params.resultingSiteSpecId !== undefined) patch.resulting_site_spec_id = params.resultingSiteSpecId;
  if (params.resultingSiteVersionId !== undefined) patch.resulting_site_version_id = params.resultingSiteVersionId;
  if (params.metadata !== undefined) patch.metadata = params.metadata;

  const { error } = await supabase.from('site_prompt_revisions').update(patch).eq('id', params.revisionId);
  if (error && !isMissingPromptRevisionsTable(error)) {
    console.error('[Prompt Studio] Revision update failed:', error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { buildRestaurantBrief, normalizeUrl, toStringArray } from '@/lib/intake/shared';
import type { IntakeRecord, PreviewRequestRecord } from '@/lib/intake/shared';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  asNullableString,
  hashIntakeToken,
  isRecord,
  readString,
  sendIntakeCompleteEmail,
} from '@/lib/intake/server';
import { logSiteEvent } from '@/lib/site-events';

type IntakePatch = Partial<IntakeRecord> & {
  request_id?: string;
  status?: 'draft' | 'complete';
  last_step?: number;
};

const SAFE_INTAKE_SELECT = [
  'id',
  'request_id',
  'address',
  'neighborhood',
  'cuisine',
  'current_website',
  'google_business_url',
  'instagram_url',
  'facebook_url',
  'menu_url',
  'ordering_url',
  'reservations_url',
  'domain_status',
  'launch_urgency',
  'brand_style',
  'brand_notes',
  'ideal_guest',
  'differentiators',
  'owner_goals',
  'hours',
  'menu_notes',
  'feature_requests',
  'asset_links',
  'status',
  'last_step',
].join(', ');

async function getRequestByToken(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('preview_requests')
    .select(
      'id, owner_name, email, phone, restaurant_name, city, preferred_language, source, status, notes, instagram_url, google_url, website_url, client_slug, email_verified_at'
    )
    .eq('intake_token_hash', hashIntakeToken(token))
    .single();

  if (error || !data) return { supabase, requestRecord: null };
  return { supabase, requestRecord: data as PreviewRequestRecord };
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function asMutableRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function readNullableFromRecord(record: Record<string, unknown>, key: string) {
  return hasOwn(record, key) ? asNullableString(record[key]) : undefined;
}

function readAssetLinks(value: unknown) {
  if (Array.isArray(value)) return toStringArray(value);
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function setNullableText(
  patch: IntakePatch,
  column: keyof IntakeRecord,
  body: Record<string, unknown>,
  key: string
) {
  if (hasOwn(body, key)) {
    patch[column] = asNullableString(body[key]);
  }
}

function setNullableUrl(
  patch: IntakePatch,
  column: keyof IntakeRecord,
  body: Record<string, unknown>,
  key: string
) {
  if (hasOwn(body, key)) {
    patch[column] = normalizeUrl(asNullableString(body[key]));
  }
}

function buildMenuNotes(
  body: Record<string, unknown>,
  existing: unknown = {}
) {
  const menuNotes = asMutableRecord(existing);
  let changed = false;

  const setTopLevel = (bodyKey: string, noteKey: string) => {
    const value = readNullableFromRecord(body, bodyKey);
    if (value !== undefined) {
      menuNotes[noteKey] = value;
      changed = true;
    }
  };

  setTopLevel('menuSource', 'source');
  setTopLevel('menuNotes', 'notes');
  setTopLevel('menuHighlights', 'highlights');
  setTopLevel('menuCategories', 'categories');
  setTopLevel('priceAccuracy', 'priceAccuracy');

  const creativeDirection = asMutableRecord(menuNotes.creativeDirection);
  let creativeChanged = false;
  const setCreative = (bodyKey: string, noteKey: string) => {
    const value = readNullableFromRecord(body, bodyKey);
    if (value !== undefined) {
      creativeDirection[noteKey] = value;
      creativeChanged = true;
    }
  };

  setCreative('colorNotes', 'colorNotes');
  setCreative('fontMood', 'fontMood');
  setCreative('photoDirection', 'photoDirection');
  setCreative('brandVoice', 'brandVoice');
  setCreative('visualReferences', 'visualReferences');
  setCreative('avoidStyles', 'avoidStyles');
  if (creativeChanged) {
    menuNotes.creativeDirection = creativeDirection;
    changed = true;
  }

  const pagePlan = asMutableRecord(menuNotes.pagePlan);
  let pagePlanChanged = false;
  const setPagePlan = (bodyKey: string, noteKey: string) => {
    const value = readNullableFromRecord(body, bodyKey);
    if (value !== undefined) {
      pagePlan[noteKey] = value;
      pagePlanChanged = true;
    }
  };

  setPagePlan('primaryAction', 'primaryAction');
  setPagePlan('secondaryAction', 'secondaryAction');
  setPagePlan('mustHavePages', 'mustHavePages');
  setPagePlan('launchNotes', 'launchNotes');
  if (pagePlanChanged) {
    menuNotes.pagePlan = pagePlan;
    changed = true;
  }

  const researchInputs = asMutableRecord(menuNotes.researchInputs);
  let researchChanged = false;
  const setResearch = (bodyKey: string, noteKey: string) => {
    const value = readNullableFromRecord(body, bodyKey);
    if (value !== undefined) {
      researchInputs[noteKey] = value;
      researchChanged = true;
    }
  };

  setResearch('logoStatus', 'logoStatus');
  setResearch('photoStatus', 'photoStatus');
  setResearch('researchPermission', 'researchPermission');
  setResearch('otherSocialLinks', 'otherSocialLinks');
  if (researchChanged) {
    menuNotes.researchInputs = researchInputs;
    changed = true;
  }

  return changed ? menuNotes : null;
}

function buildCompleteIntakeRecord(
  body: Record<string, unknown>,
  requestId: string
): IntakeRecord & { request_id: string; status: 'complete'; last_step: number } {
  return {
    request_id: requestId,
    address: asNullableString(body.address),
    neighborhood: asNullableString(body.neighborhood),
    cuisine: asNullableString(body.cuisine),
    current_website: normalizeUrl(asNullableString(body.currentWebsite)),
    google_business_url: normalizeUrl(asNullableString(body.googleBusinessUrl)),
    instagram_url: normalizeUrl(asNullableString(body.instagramUrl)),
    facebook_url: normalizeUrl(asNullableString(body.facebookUrl)),
    menu_url: normalizeUrl(asNullableString(body.menuUrl)),
    ordering_url: normalizeUrl(asNullableString(body.orderingUrl)),
    reservations_url: normalizeUrl(asNullableString(body.reservationsUrl)),
    domain_status: asNullableString(body.domainStatus),
    launch_urgency: asNullableString(body.launchUrgency),
    brand_style: asNullableString(body.brandStyle),
    brand_notes: asNullableString(body.brandNotes),
    ideal_guest: asNullableString(body.idealGuest),
    differentiators: asNullableString(body.differentiators),
    owner_goals: asNullableString(body.ownerGoals),
    hours: { raw: asNullableString(body.hours) },
    menu_notes: {
      source: asNullableString(body.menuSource),
      notes: asNullableString(body.menuNotes),
      highlights: asNullableString(body.menuHighlights),
      categories: asNullableString(body.menuCategories),
      priceAccuracy: asNullableString(body.priceAccuracy),
      creativeDirection: {
        colorNotes: asNullableString(body.colorNotes),
        fontMood: asNullableString(body.fontMood),
        photoDirection: asNullableString(body.photoDirection),
        brandVoice: asNullableString(body.brandVoice),
        visualReferences: asNullableString(body.visualReferences),
        avoidStyles: asNullableString(body.avoidStyles),
      },
      pagePlan: {
        primaryAction: asNullableString(body.primaryAction),
        secondaryAction: asNullableString(body.secondaryAction),
        mustHavePages: asNullableString(body.mustHavePages),
        launchNotes: asNullableString(body.launchNotes),
      },
      researchInputs: {
        logoStatus: asNullableString(body.logoStatus),
        photoStatus: asNullableString(body.photoStatus),
        researchPermission: asNullableString(body.researchPermission),
        otherSocialLinks: asNullableString(body.otherSocialLinks),
      },
    },
    feature_requests: toStringArray(body.featureRequests),
    asset_links: readAssetLinks(body.assetLinks),
    status: 'complete',
    last_step: 6,
  };
}

function buildDraftPatch(body: Record<string, unknown>, existingIntake: unknown): IntakePatch {
  const existing = asMutableRecord(existingIntake);
  const patch: IntakePatch = {};

  setNullableText(patch, 'address', body, 'address');
  setNullableText(patch, 'neighborhood', body, 'neighborhood');
  setNullableText(patch, 'cuisine', body, 'cuisine');
  setNullableUrl(patch, 'current_website', body, 'currentWebsite');
  setNullableUrl(patch, 'google_business_url', body, 'googleBusinessUrl');
  setNullableUrl(patch, 'instagram_url', body, 'instagramUrl');
  setNullableUrl(patch, 'facebook_url', body, 'facebookUrl');
  setNullableUrl(patch, 'menu_url', body, 'menuUrl');
  setNullableUrl(patch, 'ordering_url', body, 'orderingUrl');
  setNullableUrl(patch, 'reservations_url', body, 'reservationsUrl');
  setNullableText(patch, 'domain_status', body, 'domainStatus');
  setNullableText(patch, 'launch_urgency', body, 'launchUrgency');
  setNullableText(patch, 'brand_style', body, 'brandStyle');
  setNullableText(patch, 'brand_notes', body, 'brandNotes');
  setNullableText(patch, 'ideal_guest', body, 'idealGuest');
  setNullableText(patch, 'differentiators', body, 'differentiators');
  setNullableText(patch, 'owner_goals', body, 'ownerGoals');

  if (hasOwn(body, 'hours')) {
    patch.hours = { raw: asNullableString(body.hours) };
  }

  const menuNotes = buildMenuNotes(body, existing.menu_notes);
  if (menuNotes) {
    patch.menu_notes = menuNotes;
  }

  if (hasOwn(body, 'featureRequests')) {
    patch.feature_requests = toStringArray(body.featureRequests);
  }

  if (hasOwn(body, 'assetLinks')) {
    patch.asset_links = readAssetLinks(body.assetLinks);
  }

  return patch;
}

function valueAsString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function hashJson(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function sourceRowsFromIntake(requestRecord: PreviewRequestRecord, intakeRecord: IntakeRecord) {
  const rows = [
    { source_type: 'website', url: intakeRecord.current_website ?? requestRecord.website_url, title: 'Owner supplied website' },
    { source_type: 'google_business', url: intakeRecord.google_business_url ?? requestRecord.google_url, title: 'Owner supplied Google Business profile' },
    { source_type: 'instagram', url: intakeRecord.instagram_url ?? requestRecord.instagram_url, title: 'Owner supplied Instagram' },
    { source_type: 'facebook', url: intakeRecord.facebook_url, title: 'Owner supplied Facebook' },
    { source_type: 'menu', url: intakeRecord.menu_url, title: 'Owner supplied menu' },
    { source_type: 'ordering', url: intakeRecord.ordering_url, title: 'Owner supplied ordering link' },
    { source_type: 'reservations', url: intakeRecord.reservations_url, title: 'Owner supplied reservations link' },
  ] as const;

  const normalized: Array<{
    source_type: typeof rows[number]['source_type'];
    url: string;
    title: string;
  }> = [];

  for (const row of rows) {
    const url = normalizeUrl(row.url);
    if (url) normalized.push({ source_type: row.source_type, url, title: row.title });
  }

  return normalized;
}

async function queueResearchForCompletedIntake(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  requestRecord: PreviewRequestRecord;
  intakeRecord: IntakeRecord;
  generatedBrief: string;
  briefJson: Record<string, unknown>;
  fileNames: string[];
}) {
  if (!params.requestRecord.email_verified_at) {
    return { queued: false, reason: 'email_not_verified' };
  }

  const { data: site, error: siteError } = await params.supabase
    .from('restaurant_sites')
    .select('id, metadata')
    .eq('request_id', params.requestRecord.id)
    .maybeSingle();

  if (siteError || !site?.id) {
    console.error('[Intake POST] Could not find site for autopilot queue:', siteError);
    return { queued: false, reason: 'missing_site' };
  }

  const existingRun = await params.supabase
    .from('agent_runs')
    .select('id')
    .eq('site_id', site.id)
    .in('task_type', ['research_collect', 'ai_review', 'build_brief', 'code_build', 'deploy', 'qa'])
    .in('status', ['queued', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRun.data?.id) return { queued: false, reason: 'active_run_exists', runId: existingRun.data.id };

  const seedSources = sourceRowsFromIntake(params.requestRecord, params.intakeRecord);
  const researchInput = {
    restaurant_name: params.requestRecord.restaurant_name,
    city: params.requestRecord.city,
    owner: {
      name: params.requestRecord.owner_name,
      email: params.requestRecord.email,
      phone: params.requestRecord.phone,
    },
    slug: params.requestRecord.client_slug,
    seed_sources: seedSources,
    intake_brief: params.generatedBrief,
    brief_json: params.briefJson,
    uploaded_files: params.fileNames,
    goals: [
      'Gather all public restaurant evidence before AI review begins.',
      'Verify operational facts and keep assumptions marked.',
      'Prepare an evidence bundle for the AI Review/PM agent.',
    ],
  };

  const { data: run, error: runError } = await params.supabase.from('agent_runs').insert({
    site_id: site.id,
    request_id: params.requestRecord.id,
    task_type: 'research_collect',
    provider: 'apify',
    status: 'queued',
    input_hash: hashJson(researchInput),
    artifacts: {
      seed_sources: seedSources,
      expected_outputs: ['research_sources', 'extracted_facts', 'missing_items', 'asset_candidates'],
    },
    metadata: {
      queued_by: params.requestRecord.email,
      queued_from: 'verified_public_intake',
      slug: params.requestRecord.client_slug,
      research_input: researchInput,
      workflow_step: 'research_collect',
      retry_count: 0,
      progress: {
        task_type: 'research_collect',
        percent: 5,
        label: 'Queued research',
        detail: 'Verified intake is complete. Research collection will gather evidence first.',
        status: 'queued',
        phase: 'collecting_evidence',
        updated_at: new Date().toISOString(),
      },
      progress_history: [
        {
          percent: 5,
          label: 'Queued research',
          detail: 'Verified intake is complete. Research collection will gather evidence first.',
          status: 'queued',
          phase: 'collecting_evidence',
          updated_at: new Date().toISOString(),
        },
      ],
    },
  }).select('id').single();

  if (runError || !run?.id) {
    console.error('[Intake POST] Could not queue public autopilot research:', runError);
    return { queued: false, reason: 'queue_failed' };
  }

  const metadata =
    typeof site.metadata === 'object' && site.metadata !== null && !Array.isArray(site.metadata)
      ? site.metadata
      : {};
  const queuedAt = new Date().toISOString();

  await params.supabase.from('restaurant_sites').update({
    project_stage: 'collecting_evidence',
    metadata: {
      ...metadata,
      source: 'verified_public_intake',
      research_seed_sources: seedSources,
      owner_intake: {
        submitted_at: queuedAt,
        uploaded_files: params.fileNames,
      },
      research_pipeline: {
        current_phase: 'collecting_evidence',
        phase_history: [
          {
            phase: 'collecting_evidence',
            label: 'Queued research',
            detail: 'Verified intake is complete. Research collection will gather evidence first.',
            status: 'queued',
            updated_at: queuedAt,
          },
        ],
      },
      current_operation: {
        task_type: 'research_collect',
        percent: 5,
        label: 'Queued research',
        detail: 'Verified intake is complete. Research collection will gather evidence first.',
        status: 'queued',
        phase: 'collecting_evidence',
        updated_at: queuedAt,
      },
    },
  }).eq('id', site.id);

  if (seedSources.length) {
    await params.supabase.from('research_sources').insert(seedSources.map((source) => ({
      site_id: site.id,
      request_id: params.requestRecord.id,
      agent_run_id: run.id,
      source_type: source.source_type,
      url: source.url,
      title: source.title,
      confidence: 0,
      metadata: {
        seeded_from: 'verified_public_intake',
        owner_verified_email: params.requestRecord.email,
      },
    })));
  }

  return { queued: true, runId: run.id };
}

function toSafeIntakePayload(intake: Record<string, unknown> | null) {
  if (!intake) return null;

  const hours = asMutableRecord(intake.hours);
  const menuNotes = asMutableRecord(intake.menu_notes);
  const creativeDirection = asMutableRecord(menuNotes.creativeDirection);
  const pagePlan = asMutableRecord(menuNotes.pagePlan);
  const researchInputs = asMutableRecord(menuNotes.researchInputs);

  return {
    address: valueAsString(intake.address),
    neighborhood: valueAsString(intake.neighborhood),
    cuisine: valueAsString(intake.cuisine),
    currentWebsite: valueAsString(intake.current_website),
    googleBusinessUrl: valueAsString(intake.google_business_url),
    instagramUrl: valueAsString(intake.instagram_url),
    facebookUrl: valueAsString(intake.facebook_url),
    menuUrl: valueAsString(intake.menu_url),
    orderingUrl: valueAsString(intake.ordering_url),
    reservationsUrl: valueAsString(intake.reservations_url),
    domainStatus: valueAsString(intake.domain_status),
    launchUrgency: valueAsString(intake.launch_urgency),
    brandStyle: valueAsString(intake.brand_style),
    brandNotes: valueAsString(intake.brand_notes),
    idealGuest: valueAsString(intake.ideal_guest),
    differentiators: valueAsString(intake.differentiators),
    ownerGoals: valueAsString(intake.owner_goals),
    hours: valueAsString(hours.raw),
    menuSource: valueAsString(menuNotes.source),
    menuNotes: valueAsString(menuNotes.notes),
    menuHighlights: valueAsString(menuNotes.highlights),
    menuCategories: valueAsString(menuNotes.categories),
    priceAccuracy: valueAsString(menuNotes.priceAccuracy),
    colorNotes: valueAsString(creativeDirection.colorNotes),
    fontMood: valueAsString(creativeDirection.fontMood),
    photoDirection: valueAsString(creativeDirection.photoDirection),
    brandVoice: valueAsString(creativeDirection.brandVoice),
    visualReferences: valueAsString(creativeDirection.visualReferences),
    avoidStyles: valueAsString(creativeDirection.avoidStyles),
    primaryAction: valueAsString(pagePlan.primaryAction),
    secondaryAction: valueAsString(pagePlan.secondaryAction),
    mustHavePages: valueAsString(pagePlan.mustHavePages),
    launchNotes: valueAsString(pagePlan.launchNotes),
    logoStatus: valueAsString(researchInputs.logoStatus),
    photoStatus: valueAsString(researchInputs.photoStatus),
    researchPermission: valueAsString(researchInputs.researchPermission),
    otherSocialLinks: valueAsString(researchInputs.otherSocialLinks),
    featureRequests: toStringArray(intake.feature_requests),
    assetLinks: toStringArray(intake.asset_links).join('\n'),
    status: valueAsString(intake.status),
    lastStep: typeof intake.last_step === 'number' ? intake.last_step : 0,
  };
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token) {
    return NextResponse.json({ error: 'Missing intake token.' }, { status: 400 });
  }

  try {
    const { supabase, requestRecord } = await getRequestByToken(token);
    if (!requestRecord) {
      return NextResponse.json({ error: 'Invalid or expired intake link.' }, { status: 404 });
    }
    if (!requestRecord.email_verified_at) {
      return NextResponse.json({ error: 'Verify your email before opening the intake.' }, { status: 403 });
    }

    const { data: intake } = await supabase
      .from('restaurant_intake')
      .select(SAFE_INTAKE_SELECT)
      .eq('request_id', requestRecord.id)
      .maybeSingle();

    await supabase
      .from('preview_requests')
      .update({
        status: requestRecord.status === 'new' ? 'intake_started' : requestRecord.status,
        intake_started_at: new Date().toISOString(),
      })
      .eq('id', requestRecord.id);

    return NextResponse.json({
      request: requestRecord,
      intake: toSafeIntakePayload((intake as unknown as Record<string, unknown> | null) ?? null),
    });
  } catch (error) {
    console.error('[Intake GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const token = readString(body.token);
    const step = Number(body.step);
    if (!token) {
      return NextResponse.json({ error: 'Missing intake token.' }, { status: 400 });
    }
    if (!Number.isInteger(step) || step < 0 || step > 6) {
      return NextResponse.json({ error: 'Invalid wizard step.' }, { status: 400 });
    }

    const { supabase, requestRecord } = await getRequestByToken(token);
    if (!requestRecord) {
      return NextResponse.json({ error: 'Invalid or expired intake link.' }, { status: 404 });
    }
    if (!requestRecord.email_verified_at) {
      return NextResponse.json({ error: 'Verify your email before saving the intake.' }, { status: 403 });
    }

    const { data: existingIntake, error: existingError } = await supabase
      .from('restaurant_intake')
      .select(SAFE_INTAKE_SELECT)
      .eq('request_id', requestRecord.id)
      .maybeSingle();

    if (existingError) {
      console.error('[Intake PATCH] Supabase lookup failed:', existingError);
      return NextResponse.json({ error: 'Could not load draft intake.' }, { status: 500 });
    }

    const draftPatch = buildDraftPatch(body, existingIntake);
    const draftRecord = {
      ...draftPatch,
      request_id: requestRecord.id,
      status: 'draft',
      last_step: step,
    };

    const query = existingIntake
      ? supabase
          .from('restaurant_intake')
          .update(draftRecord)
          .eq('request_id', requestRecord.id)
      : supabase.from('restaurant_intake').insert(draftRecord);

    const { data: intake, error } = await query.select(SAFE_INTAKE_SELECT).single();

    if (error || !intake) {
      console.error('[Intake PATCH] Supabase upsert failed:', error);
      return NextResponse.json({ error: 'Could not save draft intake.' }, { status: 500 });
    }

    await supabase
      .from('preview_requests')
      .update({
        status: requestRecord.status === 'new' ? 'intake_started' : requestRecord.status,
        intake_started_at: new Date().toISOString(),
      })
      .eq('id', requestRecord.id);

    await logSiteEvent({
      eventType: 'intake_draft_saved',
      requestId: requestRecord.id,
      intakeId: (intake as { id?: string }).id ?? null,
      actorType: 'visitor',
      message: `Draft saved at step ${step}`,
      metadata: {
        step,
        client_slug: requestRecord.client_slug,
      },
    });

    return NextResponse.json({
      ok: true,
      intake: toSafeIntakePayload(intake as unknown as Record<string, unknown>),
    });
  } catch (error) {
    console.error('[Intake PATCH] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const token = readString(body.token);
    if (!token) {
      return NextResponse.json({ error: 'Missing intake token.' }, { status: 400 });
    }

    const { supabase, requestRecord } = await getRequestByToken(token);
    if (!requestRecord) {
      return NextResponse.json({ error: 'Invalid or expired intake link.' }, { status: 404 });
    }
    if (!requestRecord.email_verified_at) {
      return NextResponse.json({ error: 'Verify your email before submitting the intake.' }, { status: 403 });
    }

    const intakeRecord = buildCompleteIntakeRecord(body, requestRecord.id);

    const { data: files } = await supabase
      .from('intake_files')
      .select('file_name')
      .eq('request_id', requestRecord.id);

    const fileNames = Array.isArray(files)
      ? files.map((file) => String(file.file_name)).filter(Boolean)
      : [];
    const generatedBrief = buildRestaurantBrief(requestRecord, intakeRecord, fileNames);
    const briefJson = {
      clientSlug: requestRecord.client_slug,
      generatedAt: new Date().toISOString(),
      requestedFeatures: intakeRecord.feature_requests,
      assetLinks: intakeRecord.asset_links,
      uploadedFiles: fileNames,
      buildHandoff: {
        restaurant: requestRecord.restaurant_name,
        city: requestRecord.city,
        cuisine: intakeRecord.cuisine,
        primaryAction: asNullableString(body.primaryAction),
        secondaryAction: asNullableString(body.secondaryAction),
        visualStyle: intakeRecord.brand_style,
        colorNotes: asNullableString(body.colorNotes),
        fontMood: asNullableString(body.fontMood),
        photoDirection: asNullableString(body.photoDirection),
        brandVoice: asNullableString(body.brandVoice),
        visualReferences: asNullableString(body.visualReferences),
        avoidStyles: asNullableString(body.avoidStyles),
        menuHighlights: asNullableString(body.menuHighlights),
        menuCategories: asNullableString(body.menuCategories),
        mustHavePages: asNullableString(body.mustHavePages),
        researchInputs: {
          currentWebsite: intakeRecord.current_website,
          instagram: intakeRecord.instagram_url ?? requestRecord.instagram_url,
          facebook: intakeRecord.facebook_url,
          googleBusiness: intakeRecord.google_business_url ?? requestRecord.google_url,
          otherSocialLinks: asNullableString(body.otherSocialLinks),
          logoStatus: asNullableString(body.logoStatus),
          photoStatus: asNullableString(body.photoStatus),
          researchPermission: asNullableString(body.researchPermission),
        },
      },
    };

    const { data: intake, error } = await supabase
      .from('restaurant_intake')
      .upsert(
        {
          ...intakeRecord,
          generated_brief: generatedBrief,
          brief_json: briefJson,
          status: 'complete',
          last_step: 6,
        },
        { onConflict: 'request_id' }
      )
      .select('*')
      .single();

    if (error || !intake) {
      console.error('[Intake POST] Supabase upsert failed:', error);
      return NextResponse.json({ error: 'Could not save intake.' }, { status: 500 });
    }

    await supabase
      .from('preview_requests')
      .update({
        status: 'brief_ready',
        intake_submitted_at: new Date().toISOString(),
        generated_brief: generatedBrief,
        brief_json: briefJson,
      })
      .eq('id', requestRecord.id);

    const autopilot = await queueResearchForCompletedIntake({
      supabase,
      requestRecord,
      intakeRecord,
      generatedBrief,
      briefJson,
      fileNames,
    });

    await logSiteEvent({
      eventType: 'intake_completed',
      requestId: requestRecord.id,
      intakeId: (intake as { id?: string }).id ?? null,
      actorType: 'visitor',
      message: `Intake completed for ${requestRecord.restaurant_name}`,
      metadata: {
        client_slug: requestRecord.client_slug,
        uploaded_file_count: fileNames.length,
        autopilot,
      },
    });

    try {
      await sendIntakeCompleteEmail(requestRecord, generatedBrief);
    } catch (emailError) {
      console.error('[Intake POST] Notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      request: requestRecord,
      intake: toSafeIntakePayload(intake as unknown as Record<string, unknown>),
      generatedBrief,
      autopilot,
    });
  } catch (error) {
    console.error('[Intake POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

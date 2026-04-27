import 'server-only';

import { randomUUID } from 'crypto';
import {
  type AdminBuildAnalysis,
  type AdminSiteDetail,
  type BuildPacketRecord,
  getPacketSourceHash,
} from '@/lib/admin/dashboard';
import { getProviderCredential } from '@/lib/admin/credentials';
import { logSiteEvent } from '@/lib/site-events';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_OPENAI_MODEL = 'gpt-5.5';

type BuildPacketActor = {
  id: string;
  email?: string | null;
};

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'briefHealth',
    'missingInputs',
    'scrapePlan',
    'assetPlan',
    'contentPlan',
    'designDirection',
    'buildTasks',
    'acceptanceCriteria',
    'siteBrief',
    'handoffMarkdown',
  ],
  properties: {
    briefHealth: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'confidence', 'readinessLabel', 'summary'],
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        confidence: { type: 'string' },
        readinessLabel: { type: 'string' },
        summary: { type: 'string' },
      },
    },
    missingInputs: {
      type: 'object',
      additionalProperties: false,
      required: ['critical', 'helpful', 'optional'],
      properties: {
        critical: { type: 'array', items: missingInputSchema() },
        helpful: { type: 'array', items: missingInputSchema() },
        optional: { type: 'array', items: missingInputSchema() },
      },
    },
    scrapePlan: { type: 'array', items: { type: 'string' } },
    assetPlan: { type: 'array', items: { type: 'string' } },
    contentPlan: { type: 'array', items: { type: 'string' } },
    designDirection: { type: 'array', items: { type: 'string' } },
    buildTasks: { type: 'array', items: { type: 'string' } },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    siteBrief: siteBriefSchema(),
    handoffMarkdown: { type: 'string' },
  },
};

function siteBriefSchema() {
  return {
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
  };
}

function missingInputSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['label', 'severity', 'guidance'],
    properties: {
      label: { type: 'string' },
      severity: { type: 'string', enum: ['critical', 'helpful', 'optional'] },
      guidance: { type: 'string' },
    },
  };
}

function summarizeResolvedMenu(detail: AdminSiteDetail) {
  const menu = detail.resolvedMenu;
  if (!menu) return null;

  const categories = menu.categories.map((category) => {
    const sourceBackedItemCount = category.items.filter((item) => item.sourceBacked).length;
    return {
      name: category.name,
      description: category.description ?? null,
      itemCount: category.items.length,
      sourceBackedItemCount,
      inferredItemCount: Math.max(category.items.length - sourceBackedItemCount, 0),
      sampleItems: category.items.slice(0, 6).map((item) => ({
        name: item.name,
        description: item.description ?? null,
        priceText: item.priceText ?? null,
        badges: item.badges,
        inferred: item.inferred,
        sourceBacked: item.sourceBacked,
      })),
    };
  });

  const sourceBackedItemCount = categories.reduce((sum, category) => sum + category.sourceBackedItemCount, 0);
  const inferredItemCount = categories.reduce((sum, category) => sum + category.inferredItemCount, 0);

  return {
    status: menu.status,
    provenanceMode: menu.provenanceMode,
    fallbackMode: menu.fallbackMode,
    confidence: menu.confidence,
    requiredExperience: categories.length ? 'full_editable_menu' : 'menu_generation_required',
    sourceType: menu.sourceType,
    categories,
    featuredItems: menu.featuredItems,
    sourceBackedItemCount,
    inferredItemCount,
    missingFields: menu.missingFields,
    pricesComplete: menu.pricesComplete,
    descriptionsSourceBacked: menu.descriptionsSourceBacked,
    summaryLines: menu.summaryLines,
    extractionNotes: menu.extractionNotes,
    publicRules: [
      'Render the full menu experience whenever categories exist.',
      'Hide prices when priceText is missing. Never fabricate prices.',
      'Keep provenance internal. The public site should still feel complete and editable.',
      'Use source-backed language where available and confident concept-aligned copy elsewhere.',
    ],
  };
}

function summarizeAssetBuildContract(detail: AdminSiteDetail) {
  const logo = detail.researchReview.canonicalLogo
    ? {
        assetUrl: detail.researchReview.canonicalLogo.assetUrl,
        sourceType: detail.researchReview.canonicalLogo.sourceType,
        whySelected: detail.researchReview.canonicalLogo.whySelected,
      }
    : null;
  const photos = detail.researchReview.approvedPhotos.map((asset) => ({
    assetUrl: asset.assetUrl,
    sourceType: asset.sourceType,
    whySelected: asset.whySelected,
  }));

  return {
    logo,
    approvedPhotoCount: photos.length,
    approvedPhotos: photos,
    heroStrategy:
      photos.length > 1
        ? 'real_photo_led'
        : photos.length === 1
          ? 'single_real_photo_plus_brand_system'
          : 'brand_system_without_real_photos',
    publicRules: [
      'Use the best real logo and real restaurant photos first.',
      'If there is only one real photo, make the site feel rich through typography, layout, and non-photographic brand accents rather than fake photography.',
      'Non-photographic decorative generation is allowed for shapes, gradients, texture, and brand motifs only.',
      'Do not fabricate restaurant-specific food, interior, or exterior photography.',
    ],
  };
}

function packetInput(detail: AdminSiteDetail) {
  const approvedAssets = detail.researchReview.reviewedAssets
    .filter((asset) => asset.status === 'approved' || asset.isCanonical)
    .map((asset) => ({
      assetType: asset.assetType,
      sourceType: asset.sourceType,
      assetUrl: asset.assetUrl,
      thumbnailUrl: asset.thumbnailUrl,
      sourceUrl: asset.sourceUrl,
      title: asset.title,
      whySelected: asset.whySelected,
      isCanonical: asset.isCanonical,
    }));

  return {
    productIntent: {
      websiteType: 'owned_restaurant_website',
      socialRole: 'research_and_optional_outbound_cta_only',
      siteGoal: 'launch-ready first-party restaurant website that the customer can keep editing after publish',
      primaryVisitorActions: ['view menu', 'check hours', 'get directions', 'call'],
      customerPortalEdits: ['hours', 'menu'],
      menuPolicy:
        'Use source-backed menu content when available. Otherwise use hybrid or fully generated menu content from resolvedMenu and preserve provenance internally.',
      publicPresentationRules: [
        'Do not frame the site as a social microsite, brochure-only page, or unclaimed draft.',
        'Build a complete restaurant website even when the strongest research sources are social profiles.',
        'Social links are supporting CTAs only, not the main product experience.',
        'The public website should feel confident and customer-ready. Internal provenance belongs in implementation notes, not in the main user experience.',
      ],
    },
    buildContract: {
      websiteOutcome: 'complete_restaurant_website',
      menuOutcome: detail.resolvedMenu?.categories.length ? 'render_full_editable_menu' : 'generate_full_editable_menu',
      socialUsage: 'supporting_cta_only',
      portalRequirements: ['editable hours', 'editable menu'],
      publicCopyPolicy:
        'Use decisive restaurant copy rooted in verified facts and concept-supported menu content. Do not let uncertainty language overwhelm the public experience.',
    },
    site: detail.site
      ? {
          slug: detail.site.slug,
          status: detail.site.status,
          ownerStatus: detail.site.owner_status,
          paymentStatus: detail.site.payment_status,
          selectedPackage: detail.site.selected_package,
          previewType: detail.site.preview_type,
          previewUrl: detail.site.preview_url,
          claimUrl: detail.site.claim_url,
        }
      : null,
    request: detail.request,
    intake: detail.intake,
    files: detail.files.map((file) => ({
      fileRole: file.file_role,
      fileName: file.file_name,
      contentType: file.content_type,
      sizeBytes: file.size_bytes,
    })),
    approvedResearchReview: {
      readyForPacket: detail.researchReview.readyForPacket,
      blockers: detail.researchReview.blockers,
      conflicts: detail.researchReview.conflicts,
      overrideStatus: detail.researchReview.overrideStatus,
      reviewQueue: detail.researchReview.reviewQueue.map((card) => ({
        id: card.id,
        title: card.title,
        field: card.field,
        explanation: card.explanation,
        evidenceSummary: card.evidenceSummary,
        sourcePills: card.sourcePills,
        note: card.note,
      })),
      wizardStep: detail.researchReview.wizardStep,
      decisionStatus: detail.researchReview.state.wizard.decisionStatus,
      stepNotes: detail.researchReview.state.stepNotes,
      finalBuildNote: detail.researchReview.state.finalBuildNote,
      overrideNotesByField: detail.researchReview.state.overrideNotesByField,
      effectiveDecisions: detail.researchReview.effectiveDecisions,
      officialSiteCandidates: detail.researchReview.officialSiteCandidates,
      menuCandidates: detail.researchReview.menuCandidates,
      socialCandidates: detail.researchReview.socialCandidates,
      canonicalLogo: detail.researchReview.canonicalLogo
        ? {
            assetUrl: detail.researchReview.canonicalLogo.assetUrl,
            sourceUrl: detail.researchReview.canonicalLogo.sourceUrl,
            sourceType: detail.researchReview.canonicalLogo.sourceType,
            whySelected: detail.researchReview.canonicalLogo.whySelected,
          }
        : null,
      approvedPhotos: detail.researchReview.approvedPhotos.map((asset) => ({
        assetKey: asset.assetKey,
        assetUrl: asset.assetUrl,
        sourceUrl: asset.sourceUrl,
        sourceType: asset.sourceType,
        whySelected: asset.whySelected,
      })),
    },
    researchAudit: detail.researchAudit
      ? {
          summary: detail.researchAudit.summary,
          readableProfileSummary: detail.researchAudit.readableProfileSummary,
          canonicalSources: detail.researchAudit.canonicalSources,
          canonicalAssets: detail.researchAudit.canonicalAssets,
          resolvedMenu: detail.researchAudit.resolvedMenu,
          strategicProfile: detail.researchAudit.strategicProfile,
          conflictRecords: detail.researchAudit.conflictRecords,
          blockers: detail.researchAudit.blockers,
          conflicts: detail.researchAudit.conflicts,
          menuFindings: detail.researchAudit.menuFindings,
          menuBlockers: detail.researchAudit.menuBlockers,
          menuFallbackRecommendation: detail.researchAudit.menuFallbackRecommendation,
          supplementalFindings: detail.researchAudit.supplementalFindings,
          recommendedNextAction: detail.researchAudit.recommendedNextAction,
        }
      : null,
    assetBuildContract: summarizeAssetBuildContract(detail),
    menuBuildContract: summarizeResolvedMenu(detail),
    resolvedMenu: detail.resolvedMenu,
    resolvedProfile: detail.resolvedProfile,
    strategicProfile: detail.strategicProfile,
    siteAssets: approvedAssets,
    researchSources: detail.researchSources.slice(0, 40).map((source) => ({
      type: source.source_type,
      url: source.url,
      title: source.title,
      confidence: source.confidence,
      capturedAt: source.captured_at,
      facts: source.extracted_facts,
      metadata: source.metadata,
    })),
    currentReadiness: detail.readiness,
    existingBrief: detail.intake?.generated_brief ?? detail.request?.generated_brief ?? null,
  };
}

function outputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];

  for (const item of output) {
    const content = typeof item === 'object' && item !== null && 'content' in item ? (item as { content?: unknown }).content : null;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part === 'object' && part !== null && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
        return (part as { text: string }).text;
      }
    }
  }

  return '';
}

function isMissingPacketTable(error: { message?: string; code?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === '42P01' ||
        error.message?.includes('admin_build_packets') ||
        error.message?.includes('relation') ||
        error.message?.includes('schema cache'))
  );
}

function validateAnalysis(value: unknown): AdminBuildAnalysis {
  if (typeof value !== 'object' || value === null) throw new Error('OpenAI returned an invalid packet object.');
  const analysis = value as AdminBuildAnalysis;
  if (!analysis.briefHealth || typeof analysis.handoffMarkdown !== 'string' || !analysis.siteBrief) {
    throw new Error('OpenAI returned an incomplete build packet.');
  }
  return analysis;
}

async function requestOpenAiAnalysis(detail: AdminSiteDetail, model: string): Promise<AdminBuildAnalysis> {
  const credential = await getProviderCredential('openai');
  const apiKey = credential.secret;
  if (!apiKey) {
    throw new Error('Missing OpenAI credentials. Connect OpenAI in admin integrations or add OPENAI_API_KEY server-side before generating build packets.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are Sabor Web operations intelligence. Convert the resolved restaurant truth into a concise builder handoff for a GPT-5.5 coding agent. Treat the resolved profile and effective AI choices as canonical truth unless an override note says otherwise. Strategic profile is design and copy guidance, not a second source of truth. The deliverable is always a real first-party restaurant website with a confident public experience. Social profiles may inform research or serve as supporting CTAs, but they are never the main product framing. When menu data exists, render the full menu experience from the existing menu module and never hard-code menu items into page prose. Hide prices only when they are missing. Never fabricate prices. Customer-managed content is limited to menu and hours. Gallery curation, contact presentation, SEO copy, layout, hero treatment, and brand presentation remain operator-managed. Produce two things at once: a structured siteBrief the renderer and Prompt Studio can reuse, and a human-readable build brief that feels like a strong prompt you would hand to Codex directly. Avoid audit language, hedging, and internal workflow narration. When there is only one strong real photo, tell the builder to create richness through typography, spacing, color, and brand accents instead of fake photography. The handoffMarkdown must use exactly these sections in this order: "# <Restaurant Name> — Build Brief", "## Build objective", "## Canonical truth", "## Menu execution", "## Assets", "## Page architecture", "## Editable data contract", "## Visual and copy direction", "## Guardrails", and "## Acceptance checklist". In Editable data contract, explicitly say that only menu and hours are customer-managed later through the portal. The siteBrief should be decisive, normalized, and directly reusable for future prompt-led revisions.',
        },
        {
          role: 'user',
          content: JSON.stringify(packetInput(detail), null, 2),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'saborweb_admin_build_packet',
          strict: true,
          schema: analysisSchema,
        },
      },
    }),
  });

  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof json.error === 'object' && json.error !== null && 'message' in json.error
        ? String((json.error as { message?: unknown }).message)
        : `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const text = outputText(json);
  if (!text) throw new Error('OpenAI returned no structured output text.');

  return validateAnalysis(JSON.parse(text));
}

async function saveSiteSpecDraft(params: {
  detail: AdminSiteDetail;
  analysis: AdminBuildAnalysis;
  sourceHash: string;
  generatedByAgentRunId?: string | null;
}) {
  if (!params.detail.site?.id) return;

  const supabase = getSupabaseAdmin();
  const specJson = {
    source: 'admin_build_packet',
    restaurant: {
      slug: params.detail.slug,
      name: params.detail.site.restaurant_name,
      city: params.detail.site.city,
    },
    briefHealth: params.analysis.briefHealth,
    missingInputs: params.analysis.missingInputs,
    scrapePlan: params.analysis.scrapePlan,
    assetPlan: params.analysis.assetPlan,
    contentPlan: params.analysis.contentPlan,
    designDirection: params.analysis.designDirection,
    buildTasks: params.analysis.buildTasks,
    acceptanceCriteria: params.analysis.acceptanceCriteria,
    siteBrief: params.analysis.siteBrief ?? null,
  };
  const seoJson = {
    bilingual: true,
    locales: ['es', 'en'],
    source: 'admin_build_packet',
    acceptanceCriteria: params.analysis.acceptanceCriteria.filter((item) => /seo|schema|metadata|local|google|canonical|hreflang/i.test(item)),
    siteBrief: params.analysis.siteBrief ?? null,
  };

  const { data: existing, error: lookupError } = await supabase
    .from('site_specs')
    .select('id')
    .eq('site_id', params.detail.site.id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError && !lookupError.message?.includes('site_specs')) {
    console.error('[Admin Build Packet] Site spec lookup failed:', lookupError);
    return;
  }

  const payload = {
    site_id: params.detail.site.id,
    version_label: 'build-packet-draft',
    status: 'draft',
    source_hash: params.sourceHash,
    spec_json: specJson,
    seo_json: seoJson,
    generated_by_agent_run_id: params.generatedByAgentRunId ?? null,
  };

  const { error } = existing?.id
    ? await supabase.from('site_specs').update(payload).eq('id', existing.id)
    : await supabase.from('site_specs').insert(payload);

  if (error) {
    console.error('[Admin Build Packet] Site spec save failed:', error);
  }
}

function fallbackPacketMarkdown(detail: AdminSiteDetail, analysis: AdminBuildAnalysis) {
  return [
    `# ${detail.request?.restaurant_name ?? detail.site?.restaurant_name ?? detail.slug} Build Brief`,
    '',
    `Readiness: ${analysis.briefHealth.readinessLabel} (${analysis.briefHealth.score}/100)`,
    '',
    '## Next Build Tasks',
    ...analysis.buildTasks.map((task) => `- ${task}`),
    '',
    '## Scrape Plan',
    ...analysis.scrapePlan.map((task) => `- ${task}`),
    '',
    '## Missing Inputs',
    ...analysis.missingInputs.critical.map((item) => `- Critical: ${item.label} - ${item.guidance}`),
    ...analysis.missingInputs.helpful.map((item) => `- Helpful: ${item.label} - ${item.guidance}`),
    ...analysis.missingInputs.optional.map((item) => `- Optional: ${item.label} - ${item.guidance}`),
    '',
    '## Acceptance Criteria',
    ...analysis.acceptanceCriteria.map((item) => `- ${item}`),
  ].join('\n');
}

export async function generateAdminBuildPacket(detail: AdminSiteDetail, user: BuildPacketActor, options?: { agentRunId?: string | null }) {
  if (!detail.request && !detail.site) throw new Error('A site or preview request is required before generating a build packet.');

  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const sourceHash = detail.workItem?.packetSourceHash ?? getPacketSourceHash({
    site: detail.site,
    request: detail.request,
    intake: detail.intake,
    files: detail.files,
    siteAssets: detail.siteAssets,
    researchSources: detail.researchSources,
  });

  const supabase = getSupabaseAdmin();
  let analysis: AdminBuildAnalysis | null = null;
  let errorMessage: string | null = null;

  try {
    analysis = await requestOpenAiAnalysis(detail, model);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Build packet generation failed.';
  }

  const packetMarkdown =
    analysis?.handoffMarkdown || (analysis ? fallbackPacketMarkdown(detail, analysis) : '');

  const insert = {
    request_id: detail.request?.id ?? null,
    site_id: detail.site?.id ?? null,
    intake_id: detail.intake?.id ?? null,
    status: analysis ? 'ready' : 'failed',
    source_hash: sourceHash,
    model,
    analysis_json: analysis ?? {},
    packet_markdown: packetMarkdown,
    error_message: errorMessage,
    generated_by: user.id,
    generated_by_email: user.email,
  };

  const { data, error } = await supabase
    .from('admin_build_packets')
    .insert(insert)
    .select('id, created_at, request_id, site_id, intake_id, status, source_hash, model, analysis_json, packet_markdown, error_message, generated_by_email')
    .single();

  if (isMissingPacketTable(error)) {
    if (!detail.request) {
      throw new Error('The admin_build_packets migration has not been applied, and manual projects cannot use preview-request fallback packet storage.');
    }
    const createdAt = new Date().toISOString();
    const fallbackPacket: BuildPacketRecord = {
      id: randomUUID(),
      created_at: createdAt,
      request_id: detail.request.id,
      site_id: detail.site?.id ?? null,
      intake_id: detail.intake?.id ?? null,
      status: analysis ? 'ready' : 'failed',
      source_hash: sourceHash,
      model,
      analysis_json: analysis ?? {},
      packet_markdown: packetMarkdown,
      error_message: errorMessage,
      generated_by_email: user.email ?? null,
    };
    const existingBriefJson =
      detail.request.brief_json && typeof detail.request.brief_json === 'object' && !Array.isArray(detail.request.brief_json)
        ? detail.request.brief_json
        : {};

    const { error: fallbackError } = await supabase
      .from('preview_requests')
      .update({
        brief_json: {
          ...existingBriefJson,
          adminBuildPacket: fallbackPacket,
        },
      })
      .eq('id', detail.request.id);

    if (fallbackError) {
      console.error('[Admin Build Packet] Fallback save failed:', fallbackError);
      throw new Error('The admin_build_packets migration has not been applied, and fallback packet storage failed.');
    }

    await logSiteEvent({
      eventType: analysis ? 'admin_build_packet_generated' : 'admin_build_packet_failed',
      siteId: detail.site?.id ?? null,
      requestId: detail.request?.id ?? null,
      intakeId: detail.intake?.id ?? null,
      actorType: 'admin',
      actorId: user.id,
      message: analysis ? 'Admin generated a build packet using fallback storage' : 'Admin build packet generation failed using fallback storage',
      metadata: {
        model,
        source_hash: sourceHash,
        admin_email: user.email,
        storage: 'preview_requests.brief_json',
        error: errorMessage,
      },
    });

    return fallbackPacket;
  }

  if (error || !data) {
    console.error('[Admin Build Packet] Save failed:', error);
    throw new Error('Could not save the generated build packet.');
  }

  await logSiteEvent({
    eventType: analysis ? 'admin_build_packet_generated' : 'admin_build_packet_failed',
    siteId: detail.site?.id ?? null,
    requestId: detail.request?.id ?? null,
    intakeId: detail.intake?.id ?? null,
    actorType: 'admin',
    actorId: user.id,
    message: analysis ? 'Admin generated a build packet' : 'Admin build packet generation failed',
    metadata: {
      model,
      source_hash: sourceHash,
      admin_email: user.email,
      error: errorMessage,
    },
  });

  if (analysis) {
    if (detail.site?.id) {
      const currentMetadata =
        detail.site.metadata && typeof detail.site.metadata === 'object' && !Array.isArray(detail.site.metadata)
          ? (detail.site.metadata as Record<string, unknown>)
          : {};
      const { error: metadataError } = await supabase
        .from('restaurant_sites')
        .update({
          metadata: {
            ...currentMetadata,
            resolved_site_brief: analysis.siteBrief ?? null,
            build_brief_updated_at: new Date().toISOString(),
          },
        })
        .eq('id', detail.site.id);
      if (metadataError) {
        console.error('[Admin Build Packet] Could not persist resolved site brief:', metadataError);
      }
    }
    await saveSiteSpecDraft({
      detail,
      analysis,
      sourceHash,
      generatedByAgentRunId: options?.agentRunId ?? null,
    });
  }

  return data as unknown as BuildPacketRecord;
}

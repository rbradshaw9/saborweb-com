import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, History, MessageSquareText, Rocket, Undo2 } from 'lucide-react';
import { getAdminSiteDetail } from '@/lib/admin/dashboard';
import { listPromptStudioRevisions } from '@/lib/admin/prompt-studio';
import { absoluteSiteUrl } from '@/lib/site-rendering';
import { applyPromptStudioRevision, publishLatestApprovedVersion, rollbackLatestPublishedVersion } from '../actions';

function formatDate(value: string | null | undefined) {
  if (!value) return 'None';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusLabel(detail: Awaited<ReturnType<typeof getAdminSiteDetail>>) {
  if (!detail?.site) return 'Prompt Studio';
  if (detail.site.live_url) return 'Published';
  if (detail.site.staging_url) return 'Preview ready';
  if (['build_brief', 'code_build', 'deploy', 'qa', 'building_preview'].includes(detail.workItem?.operatorStage ?? '')) return 'Building preview';
  return 'Prompt Studio';
}

export default async function AdminPromptStudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getAdminSiteDetail(slug, { tab: 'overview' });
  if (!detail?.site) notFound();

  const revisions = await listPromptStudioRevisions(detail.site.id);
  const previewUrl = detail.site.staging_url ?? detail.site.preview_url ?? `/preview/${detail.slug}`;
  const liveUrl = detail.site.live_url ?? null;
  const previewHref = absoluteSiteUrl(previewUrl) ?? `/preview/${detail.slug}`;
  const liveHref = absoluteSiteUrl(liveUrl);
  const submitAction = applyPromptStudioRevision.bind(null, detail.slug);
  const publishAction = publishLatestApprovedVersion.bind(null, detail.slug);
  const rollbackAction = rollbackLatestPublishedVersion.bind(null, detail.slug);
  const latestMenuCategories = detail.resolvedMenu?.categories.slice(0, 6) ?? [];

  return (
    <main className="admin-page">
      <section className="admin-shell" style={{ display: 'grid', gap: 20 }}>
        <header className="admin-panel admin-detail-header">
          <Link className="admin-back" href={`/admin/sites/${detail.slug}`}>
            <ArrowLeft size={16} />
            Back to project
          </Link>

          <div className="admin-detail-hero">
            <div>
              <span className="admin-pill admin-pill--ready">{statusLabel(detail)}</span>
              <h1 className="admin-detail-title" style={{ marginTop: 10 }}>Prompt Studio</h1>
              <p className="admin-subtitle">
                {detail.site.restaurant_name} · {detail.site.city ?? 'City unknown'} · Updated {formatDate(detail.site.updated_at)}
              </p>
            </div>
            <div className="admin-header-actions">
              <a className="admin-btn admin-btn--secondary" href={previewHref} rel="noreferrer" target="_blank">
                Preview <ExternalLink size={14} />
              </a>
              {liveHref ? (
                <a className="admin-btn admin-btn--secondary" href={liveHref} rel="noreferrer" target="_blank">
                  Live <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <section className="admin-workflow-callout">
          <div>
            <p className="admin-label">How Prompt Studio works</p>
            <h2 className="admin-workflow-callout__title">Describe the change, then we stage a new preview revision</h2>
            <p className="admin-muted" style={{ marginTop: 8 }}>
              Menu and hours stay tied to structured customer-portal data. Everything else here is operator-managed through prompts and routed back through the shared preview pipeline.
            </p>
          </div>
          <div className="admin-chip-list">
            <span className="admin-chip is-active">Prompt</span>
            <span className="admin-chip">Preview</span>
            <span className="admin-chip">Publish</span>
          </div>
        </section>

        <div className="admin-grid-2">
          <form action={submitAction} className="admin-card" style={{ display: 'grid', gap: 16 }}>
            <div className="admin-card__header">
              <MessageSquareText size={18} />
              <h2 className="admin-card__title">Request a change</h2>
            </div>
            <p className="admin-muted">
              Talk to it the way you would talk to Codex directly. Example: “Make the hero feel brighter and use an interior image if we have one.”
            </p>

            <label className="admin-select-label">
              What should change?
              <textarea
                className="admin-textarea"
                name="prompt_text"
                placeholder="Make the homepage feel more premium, tighten the hero copy, and add a small catering section."
                required
              />
            </label>

            <label className="admin-select-label">
              Optional reference links
              <textarea
                className="admin-textarea"
                name="reference_links"
                placeholder="One URL per line"
              />
            </label>

            <button className="admin-btn admin-btn--primary" type="submit">
              Generate new preview
            </button>
          </form>

          <section className="admin-card" style={{ display: 'grid', gap: 16 }}>
            <div className="admin-card__header">
              <History size={18} />
              <h2 className="admin-card__title">Current brief</h2>
            </div>
            <p className="admin-muted">{detail.siteBrief.summary}</p>
            <div className="admin-chip-list">
              <span className="admin-pill admin-pill--neutral">Theme: {detail.siteBrief.visualDirection.themePreset.replaceAll('_', ' ')}</span>
              <span className="admin-pill admin-pill--neutral">Font: {detail.siteBrief.visualDirection.fontPreset.replaceAll('_', ' ')}</span>
              <span className="admin-pill admin-pill--neutral">Primary CTA: {detail.siteBrief.hero.primaryCtaLabel}</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {detail.siteBrief.sections.slice(0, 6).map((section) => (
                <div className="admin-link-card" key={section.id}>
                  <p style={{ fontWeight: 800 }}>{section.title}</p>
                  <p className="admin-muted" style={{ marginTop: 8 }}>
                    {section.body[0] ?? 'Section guidance ready.'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-grid-2">
          <section className="admin-card" style={{ display: 'grid', gap: 14 }}>
            <h2 className="admin-card__title">Structured menu + hours snapshot</h2>
            <p className="admin-muted">
              These remain customer-managed later through the portal. Prompt revisions can reference them but should not replace their ownership.
            </p>
            <div className="admin-chip-list">
              <span className="admin-pill admin-pill--neutral">Hours: {detail.resolvedProfile?.hours.length ? `${detail.resolvedProfile.hours.length} entries` : 'Not set'}</span>
              <span className="admin-pill admin-pill--neutral">Menu: {detail.resolvedMenu?.status.replaceAll('_', ' ') ?? 'No menu yet'}</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {latestMenuCategories.length ? latestMenuCategories.map((category) => (
                <div className="admin-link-card" key={category.name}>
                  <p style={{ fontWeight: 800 }}>{category.name}</p>
                  <p className="admin-muted" style={{ marginTop: 8 }}>
                    {category.items.length} item{category.items.length === 1 ? '' : 's'}
                  </p>
                </div>
              )) : <p className="admin-muted">The system will still build a complete menu experience even if menu recovery is partial.</p>}
            </div>
          </section>

          <section className="admin-card" style={{ display: 'grid', gap: 14 }}>
            <h2 className="admin-card__title">Publish controls</h2>
            <p className="admin-muted">
              Every studio prompt creates a new preview revision first. Publish only after the staged preview looks right.
            </p>
            <div className="admin-header-actions" style={{ justifyContent: 'flex-start' }}>
              <form action={publishAction}>
                <button className="admin-btn admin-btn--primary">
                  <Rocket size={14} />
                  Publish latest approved
                </button>
              </form>
              <form action={rollbackAction}>
                <button className="admin-btn admin-btn--secondary">
                  <Undo2 size={14} />
                  Roll back
                </button>
              </form>
            </div>
            {revisions.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {revisions.map((revision) => (
                  <div className="admin-link-card" key={revision.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 800, margin: 0 }}>{revision.status.replaceAll('_', ' ')}</p>
                      <span className="admin-small">{formatDate(revision.createdAt)}</span>
                    </div>
                    <p className="admin-muted" style={{ marginTop: 8 }}>{revision.outputSummary ?? revision.promptText}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-muted">No prompt revisions yet.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

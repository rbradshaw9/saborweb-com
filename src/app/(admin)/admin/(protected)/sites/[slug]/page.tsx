import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Bot, ExternalLink, FileText, Gauge, Play, RotateCw, Rocket, Send, ShieldCheck, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { cleanAdminValue, getAdminSiteDetail, summarizeResearchSources, type AdminSiteDetail, type MissingInput } from '@/lib/admin/dashboard';
import {
  approvePreviewRelease,
  archiveAdminItem,
  createSiteRecordForRequest,
  deleteAdminProject,
  deleteRequestOnlyItem,
  generateBuildPacket,
  publishLatestApprovedVersion,
  queueBuildPacketRun,
  queueCodeBuildRun,
  queueQaRun,
  queueResearchRun,
  retryLatestFailedRun,
  rollbackLatestPublishedVersion,
  updateSiteStatus,
} from './actions';
import { BuildPacketCopyButton, BuildPacketGenerateButton } from './BuildPacketCopyButton';
import { DangerConfirmButton } from './DangerConfirmButton';

const TABS = [
  ['overview', 'Overview'],
  ['intake', 'Intake'],
  ['assets', 'Research'],
  ['packet', 'Build Brief'],
  ['timeline', 'Timeline'],
] as const;

function absoluteSiteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://saborweb.com';
  return `${siteUrl.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'None';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function displayValue(value: unknown) {
  if (typeof value === 'string') return cleanAdminValue(value) ?? 'Not provided';
  if (value === null || value === undefined) return 'Not provided';
  return String(value);
}

function siteMetadataValue(detail: AdminSiteDetail, key: string) {
  const metadata =
    detail.site?.metadata && typeof detail.site.metadata === 'object' && !Array.isArray(detail.site.metadata)
      ? detail.site.metadata as Record<string, unknown>
      : {};

  const value = metadata[key];
  return typeof value === 'string' ? cleanAdminValue(value) : null;
}

function operationStateClass(state: string | null | undefined) {
  switch (state) {
    case 'succeeded':
      return 'admin-pill admin-pill--success';
    case 'failed':
    case 'blocked':
      return 'admin-pill admin-pill--warn';
    case 'running':
      return 'admin-pill admin-pill--ready';
    case 'queued':
      return 'admin-pill admin-pill--neutral';
    default:
      return 'admin-pill admin-pill--neutral';
  }
}

function isOperationActive(state: string | null | undefined) {
  return state === 'queued' || state === 'running';
}

function currentOperation(detail: AdminSiteDetail) {
  const metadata =
    detail.site?.metadata && typeof detail.site.metadata === 'object' && !Array.isArray(detail.site.metadata)
      ? detail.site.metadata
      : {};
  const persisted =
    metadata.current_operation && typeof metadata.current_operation === 'object' && !Array.isArray(metadata.current_operation)
      ? metadata.current_operation as Record<string, unknown>
      : {};

  const percent =
    typeof persisted.percent === 'number'
      ? Math.max(0, Math.min(100, Math.round(persisted.percent)))
      : detail.workItem?.currentOperationPercent ?? 0;
  const label =
    (typeof persisted.label === 'string' && persisted.label.trim()) ||
    detail.workItem?.currentOperationLabel ||
    'Waiting for the next operation';
  const state =
    (typeof persisted.status === 'string' && persisted.status) ||
    detail.workItem?.currentOperationState ||
    'idle';
  const detailText = typeof persisted.detail === 'string' && persisted.detail.trim() ? persisted.detail : null;
  const updatedAt =
    (typeof persisted.updated_at === 'string' && persisted.updated_at) ||
    detail.workItem?.currentOperationUpdatedAt ||
    null;
  const taskType =
    (typeof persisted.task_type === 'string' && persisted.task_type) ||
    detail.workItem?.latestAgentRun?.task_type ||
    null;

  return { percent, label, state, detailText, updatedAt, taskType };
}

function operationFeed(detail: AdminSiteDetail) {
  const history = Array.isArray(detail.workItem?.latestAgentRun?.metadata?.progress_history)
    ? detail.workItem?.latestAgentRun?.metadata?.progress_history
    : [];

  return history
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
    .map((entry) => ({
      label: typeof entry.label === 'string' ? entry.label : 'Worker update',
      detail: typeof entry.detail === 'string' ? entry.detail : null,
      status: typeof entry.status === 'string' ? entry.status : 'running',
      updatedAt: typeof entry.updated_at === 'string' ? entry.updated_at : null,
      percent: typeof entry.percent === 'number' ? Math.max(0, Math.min(100, Math.round(entry.percent))) : null,
    }))
    .slice(-6)
    .reverse();
}

function factHighlights(value: unknown) {
  const facts = typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const highlights: string[] = [];

  for (const [label, key] of [
    ['Address', 'address'],
    ['Phone', 'formatted_phone_number'],
    ['Website', 'website'],
    ['Hours', 'hours_summary'],
    ['Cuisine', 'primary_type'],
  ] as const) {
    const raw = facts[key];
    if (typeof raw === 'string' && raw.trim()) highlights.push(`${label}: ${raw.trim()}`);
  }

  if (Array.isArray(facts.hours_weekday_text) && facts.hours_weekday_text.length && highlights.every((item) => !item.startsWith('Hours:'))) {
    highlights.push(`Hours: ${facts.hours_weekday_text.slice(0, 2).join(' | ')}`);
  }

  if (Array.isArray(facts.discovered_links) && facts.discovered_links.length) {
    highlights.push(`Discovered links: ${facts.discovered_links.slice(0, 3).length}`);
  }

  return highlights.slice(0, 4);
}

function hasUsefulHours(value: unknown) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}

function buildBriefStatusLabel(detail: AdminSiteDetail) {
  if (detail.packetState === 'ready') return 'Build brief ready';
  if (detail.packetState === 'stale') return 'Build brief stale';
  if (detail.packetState === 'failed') return 'Build brief failed';
  return 'No build brief yet';
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="admin-field">
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  );
}

function JsonDetails({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="admin-details">
      <summary>{label}</summary>
      <pre>{JSON.stringify(value ?? {}, null, 2)}</pre>
    </details>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="admin-select-label">
      {label}
      <select className="admin-select" defaultValue={defaultValue} name={name}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option ? option.replaceAll('_', ' ') : 'None'}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPanel({ detail }: { detail: AdminSiteDetail }) {
  if (!detail.site) {
    const action = createSiteRecordForRequest.bind(null, detail.slug);

    return (
      <section className="admin-alert">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} />
          <div>
            <h2 className="admin-card__title">Site record missing</h2>
            <p className="admin-muted" style={{ marginTop: 6 }}>
              This preview request does not have a matching site row yet. Create one to unlock status updates, claim tracking, payment state, and preview generation.
            </p>
            <form action={action} style={{ marginTop: 12 }}>
              <button className="admin-btn admin-btn--primary">Create site record</button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const action = updateSiteStatus.bind(null, detail.site.slug);

  return (
    <form action={action} className="admin-card">
      <h2 className="admin-card__title">Operational status</h2>
      <div className="admin-form-grid" style={{ marginTop: 14 }}>
        <SelectField
          defaultValue={detail.site.status}
          label="Site status"
          name="status"
          options={['draft', 'preview_building', 'preview_ready', 'claim_started', 'claimed', 'paid', 'live', 'archived']}
        />
        <SelectField
          defaultValue={detail.site.owner_status}
          label="Owner status"
          name="owner_status"
          options={['unclaimed', 'claim_started', 'claimed']}
        />
        <SelectField
          defaultValue={detail.site.payment_status}
          label="Payment status"
          name="payment_status"
          options={['unpaid', 'checkout_started', 'paid', 'failed', 'refunded', 'cancelled']}
        />
        <SelectField
          defaultValue={detail.site.selected_package ?? ''}
          label="Package"
          name="selected_package"
          options={['', 'presencia', 'visibilidad', 'crecimiento']}
        />
        <SelectField
          defaultValue={detail.site.project_stage ?? 'request_received'}
          label="Project stage"
          name="project_stage"
          options={[
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
          ]}
        />
        <SelectField
          defaultValue={detail.site.automation_mode ?? 'admin_gate'}
          label="Automation"
          name="automation_mode"
          options={['paused', 'admin_approval_required', 'research_only', 'packet_only', 'admin_gate', 'trusted_full_auto']}
        />
        <SelectField
          defaultValue={detail.site.release_channel ?? 'preview'}
          label="Release channel"
          name="release_channel"
          options={['development', 'preview', 'staging', 'production']}
        />
      </div>
      <button className="admin-btn admin-btn--primary" style={{ marginTop: 14 }}>
        Save status
      </button>
    </form>
  );
}

function AdminActionsPanel({ detail }: { detail: AdminSiteDetail }) {
  const researchAction = queueResearchRun.bind(null, detail.slug);
  const packetAction = queueBuildPacketRun.bind(null, detail.slug);
  const buildAction = queueCodeBuildRun.bind(null, detail.slug);
  const qaAction = queueQaRun.bind(null, detail.slug);
  const releaseAction = approvePreviewRelease.bind(null, detail.slug);
  const publishAction = publishLatestApprovedVersion.bind(null, detail.slug);
  const rollbackAction = rollbackLatestPublishedVersion.bind(null, detail.slug);
  const retryAction = retryLatestFailedRun.bind(null, detail.slug);
  const archiveAction = archiveAdminItem.bind(null, detail.slug);
  const deleteProjectAction = deleteAdminProject.bind(null, detail.slug);
  const deleteAction = deleteRequestOnlyItem.bind(null, detail.slug);
  const latestRunFailed = detail.workItem?.latestAgentRun?.status === 'failed';
  const canQueueBuild = detail.packetState === 'ready' && ['Build packet ready', 'Packet ready', 'Ready for admin review'].includes(detail.workItem?.pipelineStage ?? '');

  return (
    <section className="admin-card">
      <h2 className="admin-card__title">Admin actions</h2>
      <p className="admin-muted" style={{ marginTop: 6 }}>
        Queue the next operational step without leaving the project workbench.
      </p>
      <div className="admin-action-grid" style={{ marginTop: 14 }}>
        {detail.site && (
          <>
            <form action={researchAction}>
              <button className="admin-btn admin-btn--secondary">
                <Play size={14} />
                Queue research
              </button>
            </form>
            <form action={packetAction}>
              <button className="admin-btn admin-btn--secondary">
                <Bot size={14} />
                Queue build brief
              </button>
            </form>
            <form action={buildAction}>
              <button className="admin-btn admin-btn--secondary" disabled={!canQueueBuild} title={canQueueBuild ? 'Queue build' : 'Build is blocked until research and the build brief are ready.'}>
                <Rocket size={14} />
                {canQueueBuild ? 'Queue build' : 'Build blocked'}
              </button>
            </form>
            <form action={qaAction}>
              <button className="admin-btn admin-btn--secondary">
                <ShieldCheck size={14} />
                Queue QA
              </button>
            </form>
            {latestRunFailed && (
              <form action={retryAction}>
                <button className="admin-btn admin-btn--secondary">
                  <RotateCw size={14} />
                  Retry failed
                </button>
              </form>
            )}
            <form action={releaseAction}>
              <button className="admin-btn admin-btn--secondary">
                <Send size={14} />
                Approve release
              </button>
            </form>
            <form action={publishAction}>
              <button className="admin-btn admin-btn--secondary">
                <Rocket size={14} />
                Publish live
              </button>
            </form>
            <form action={rollbackAction}>
              <button className="admin-btn admin-btn--secondary">
                <Undo2 size={14} />
                Roll back
              </button>
            </form>
          </>
        )}
        <form action={archiveAction}>
          <button className="admin-btn admin-btn--secondary">
            <Trash2 size={14} />
            Archive
          </button>
        </form>
        {detail.site && (
          <form action={deleteProjectAction}>
            <DangerConfirmButton
              confirmMessage={`Delete ${detail.request?.restaurant_name ?? detail.site?.restaurant_name ?? detail.slug}? This permanently removes the project and linked request data from admin.`}
              label="Delete project"
            />
          </form>
        )}
        {!detail.site && detail.request && (
          <form action={deleteAction}>
            <DangerConfirmButton
              confirmMessage={`Delete request-only item ${detail.request.restaurant_name}? This cannot be undone.`}
              label="Delete request"
            />
          </form>
        )}
      </div>
    </section>
  );
}

function MissingList({ items }: { items: MissingInput[] }) {
  if (!items.length) {
    return <p className="admin-chip">No critical intake gaps detected</p>;
  }

  return (
    <div className="admin-missing-list">
      {items.map((item) => (
        <div className="admin-missing-item" key={`${item.severity}-${item.label}`}>
          <div className="admin-missing-title">
            <span>{item.label}</span>
            <span className="admin-pill admin-pill--neutral">{item.severity}</span>
          </div>
          <p className="admin-muted" style={{ marginTop: 6 }}>
            {item.guidance}
          </p>
        </div>
      ))}
    </div>
  );
}

function TabLink({ slug, value, active, children }: { slug: string; value: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link className={`admin-tab ${active ? 'is-active' : ''}`} href={`/admin/sites/${slug}?tab=${value}`}>
      {children}
    </Link>
  );
}

function OverviewTab({ detail }: { detail: AdminSiteDetail }) {
  const item = detail.workItem;
  const operation = currentOperation(detail);
  const feed = operationFeed(detail);
  const previewUrl = detail.site?.staging_url ?? detail.site?.preview_url ?? `/preview/${detail.slug}`;
  const liveUrl = detail.site?.live_url;
  const menuStatus = detail.resolvedMenu?.status.replaceAll('_', ' ') ?? 'still resolving';
  const socialLinks = [
    detail.resolvedProfile?.primaryWebPresenceUrl,
    ...(detail.resolvedProfile?.confirmedSocialUrls ?? []),
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
  const latestEvents = detail.events.slice(0, 5);
  const customerOwnership = detail.siteBrief.editableOwnership.customerManaged.join(', ') || 'menu, hours';
  const generatedFiles = Array.isArray(detail.site?.generated_file_manifest)
    ? detail.site.generated_file_manifest
        .map((item) => (typeof item === 'object' && item !== null && 'path' in item ? String(item.path) : null))
        .filter((item): item is string => Boolean(item))
    : [];
  const siteMetadata = detail.site?.metadata && typeof detail.site.metadata === 'object' && !Array.isArray(detail.site.metadata)
    ? detail.site.metadata as Record<string, unknown>
    : {};
  const generatedCommit = siteMetadata.generated_site_commit && typeof siteMetadata.generated_site_commit === 'object' && !Array.isArray(siteMetadata.generated_site_commit)
    ? siteMetadata.generated_site_commit as Record<string, unknown>
    : {};

  return (
    <div className="admin-grid-2">
      <div style={{ display: 'grid', gap: 16 }}>
        <section className="admin-card">
          <div className="admin-card__header">
            <Bot size={19} />
            <h2 className="admin-card__title">Current stage</h2>
          </div>
          <div className="admin-run-progress">
            <div className="admin-run-progress__top">
              <p className="admin-label">Pipeline stage</p>
              <span className={operationStateClass(operation.state)}>{operation.state.replaceAll('_', ' ')}</span>
            </div>
            <p className="admin-run-progress__label">{operation.label}</p>
            <div className={`admin-progress admin-progress--operation${isOperationActive(operation.state) ? ' is-active' : ''}`} aria-label={`Current operation ${operation.percent}%`}>
              <div className="admin-progress__track">
                <div className="admin-progress__bar admin-progress__bar--operation" style={{ width: `${operation.percent}%` }} />
              </div>
              <span className="admin-progress__value">{operation.percent}%</span>
            </div>
            <p className="admin-muted" style={{ marginTop: 10 }}>
              {item?.operatorStatusLine ?? operation.detailText ?? 'The worker will keep advancing this project until the preview is ready or a real blocker appears.'}
            </p>
            <p className="admin-small" style={{ marginTop: 8 }}>
              {operation.updatedAt ? `Last update ${formatDate(operation.updatedAt)}` : 'No worker heartbeat yet.'}
            </p>
          </div>
        </section>
        <section className="admin-card">
          <div className="admin-card__header">
            <ExternalLink size={18} />
            <h2 className="admin-card__title">Preview and live status</h2>
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <div className="admin-link-card">
              <p style={{ fontWeight: 800 }}>Preview</p>
              <p className="admin-muted" style={{ marginTop: 8 }}>
                {detail.site?.staging_url ? 'A staged preview is ready to inspect.' : 'The preview will appear here as soon as the build finishes.'}
              </p>
              <p className="admin-small" style={{ marginTop: 8 }}>
                Deploy status: {detail.site?.deployment_status?.replaceAll('_', ' ') ?? 'not started'}
              </p>
              <div className="admin-header-actions" style={{ marginTop: 12 }}>
                <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(previewUrl)} rel="noreferrer" target="_blank">
                  Open preview <ExternalLink size={13} />
                </a>
              </div>
            </div>
            <div className="admin-link-card">
              <p style={{ fontWeight: 800 }}>Generated code</p>
              <p className="admin-muted" style={{ marginTop: 8 }}>
                {generatedFiles.length ? generatedFiles.join(' · ') : 'No generated repo files recorded yet.'}
              </p>
              <p className="admin-small" style={{ marginTop: 8 }}>
                Commit: {typeof generatedCommit.commitSha === 'string' ? generatedCommit.commitSha.slice(0, 12) : 'pending'} · Branch: {typeof generatedCommit.branch === 'string' ? generatedCommit.branch : 'pending'}
              </p>
            </div>
            <div className="admin-link-card">
              <p style={{ fontWeight: 800 }}>Owner verification</p>
              <p className="admin-muted" style={{ marginTop: 8 }}>
                {detail.request?.email_verified_at
                  ? `Verified ${formatDate(detail.request.email_verified_at)}`
                  : detail.request?.email_verification_sent_at
                    ? `Verification sent ${formatDate(detail.request.email_verification_sent_at)}`
                    : 'No owner email verification sent yet.'}
              </p>
            </div>
            <div className="admin-link-card">
              <p style={{ fontWeight: 800 }}>Live site</p>
              <p className="admin-muted" style={{ marginTop: 8 }}>
                {liveUrl ? 'A published version already exists.' : 'Nothing is live yet. Publish from Prompt Studio once the staged preview looks right.'}
              </p>
              {liveUrl ? (
                <div className="admin-header-actions" style={{ marginTop: 12 }}>
                  <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(liveUrl)} rel="noreferrer" target="_blank">
                    Open live site <ExternalLink size={13} />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card__header">
            <Sparkles size={18} />
            <h2 className="admin-card__title">Recent activity</h2>
          </div>
          {!!feed.length ? (
            <ol className="admin-operation-feed">
              {feed.map((entry, index) => (
                <li className="admin-operation-feed__item" key={`${entry.updatedAt ?? entry.label}-${index}`}>
                  <div className="admin-operation-feed__top">
                    <p className="admin-operation-feed__label">{entry.label}</p>
                    <span className={operationStateClass(entry.status)}>{entry.percent !== null ? `${entry.percent}%` : entry.status}</span>
                  </div>
                  {entry.detail && <p className="admin-muted">{entry.detail}</p>}
                  <p className="admin-small">{entry.updatedAt ? formatDate(entry.updatedAt) : 'Just now'}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="admin-muted" style={{ marginTop: 12 }}>No detailed worker activity yet.</p>
          )}
          <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            {latestEvents.map((event) => (
              <div className="admin-link-card" key={event.id ?? `${event.event_type}-${event.created_at}`}>
                <p style={{ fontWeight: 800 }}>{event.event_type.replaceAll('_', ' ')}</p>
                <p className="admin-muted" style={{ marginTop: 6 }}>
                  {event.message ?? event.actor_type ?? 'Event recorded'}
                </p>
                <p className="admin-small">{formatDate(event.created_at)}</p>
              </div>
            ))}
            {!latestEvents.length && <p className="admin-small">No project events yet.</p>}
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="admin-card">
          <div className="admin-card__header">
            <Gauge size={19} />
            <h2 className="admin-card__title">Restaurant snapshot</h2>
          </div>
          <p className="admin-muted" style={{ marginTop: 6 }}>{detail.siteBrief.summary}</p>
          <div className="admin-stat-grid" style={{ marginTop: 16 }}>
            <div className="admin-stat">
              <p className="admin-label">Operator stage</p>
              <p className="admin-stat__value">{item?.operatorStageLabel ?? 'Researching'}</p>
            </div>
            <div className="admin-stat">
              <p className="admin-label">Build brief</p>
              <p className="admin-stat__value">{buildBriefStatusLabel(detail)}</p>
            </div>
            <div className="admin-stat">
              <p className="admin-label">Menu status</p>
              <p className="admin-stat__value">{menuStatus}</p>
            </div>
            <div className="admin-stat">
              <p className="admin-label">Asset status</p>
              <p className="admin-stat__value">{detail.siteAssets.length ? `${detail.siteAssets.length} captured` : 'Still collecting'}</p>
            </div>
            <div className="admin-stat">
              <p className="admin-label">Customer-managed later</p>
              <p className="admin-stat__value">{customerOwnership}</p>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <p className="admin-label">Best current facts</p>
            <dl style={{ marginTop: 8 }}>
              <Field label="Name" value={detail.resolvedProfile?.restaurantName ?? detail.site?.restaurant_name ?? detail.request?.restaurant_name} />
              <Field label="Address" value={displayValue(detail.resolvedProfile?.address ?? detail.site?.city ?? detail.request?.city)} />
              <Field label="Phone" value={displayValue(detail.resolvedProfile?.phone)} />
              <Field label="Hours" value={displayValue(detail.resolvedProfile?.hours.length ? detail.resolvedProfile.hours.join(' | ') : null)} />
              <Field label="Primary CTA" value={displayValue(detail.siteBrief.hero.primaryCtaLabel)} />
              <Field label="Off-site links" value={socialLinks.length ? socialLinks.join(' · ') : 'Not provided'} />
            </dl>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card__header">
            <FileText size={18} />
            <h2 className="admin-card__title">What still matters</h2>
          </div>
          <p className="admin-muted" style={{ marginTop: 6 }}>
            Low-confidence menu and asset details should not block preview creation. Only real blockers should slow the pipeline down.
          </p>
          <div style={{ marginTop: 18 }}>
            <p className="admin-label" style={{ marginBottom: 10 }}>Outstanding inputs</p>
            <MissingList items={detail.readiness.missing.slice(0, 6)} />
          </div>
        </section>

        <StatusPanel detail={detail} />
        <AdminActionsPanel detail={detail} />

        <section className="admin-card">
          <h2 className="admin-card__title">Project contact</h2>
          <dl style={{ marginTop: 10 }}>
            <Field label="Owner" value={displayValue(detail.site?.owner_name ?? detail.request?.owner_name)} />
            <Field label="Email" value={displayValue(detail.site?.owner_email ?? detail.request?.email)} />
            <Field label="Phone" value={displayValue(detail.site?.owner_phone ?? detail.request?.phone)} />
            <Field label="Source" value={displayValue(detail.request?.source)} />
            <Field label="Preferred language" value={displayValue(detail.request?.preferred_language)} />
            <Field label="Automation" value={displayValue(detail.site?.automation_mode)} />
            <Field label="Release channel" value={displayValue(detail.site?.release_channel)} />
            <Field label="Risk score" value={displayValue(detail.site?.risk_score)} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function IntakeTab({ detail }: { detail: AdminSiteDetail }) {
  const intake = detail.intake;
  const researchSummary = summarizeResearchSources(detail.researchSources);

  return (
    <section className="admin-card">
      <div className="admin-card__header">
        <FileText size={19} />
        <h2 className="admin-card__title">Structured intake</h2>
      </div>
      <dl className="admin-form-grid">
        <Field label="Status" value={displayValue(intake?.status ?? detail.request?.status)} />
        <Field label="Last step" value={String(intake?.last_step ?? 0)} />
        <Field label="Cuisine" value={displayValue(intake?.cuisine ?? researchSummary.cuisine)} />
        <Field label="Address" value={displayValue(intake?.address ?? siteMetadataValue(detail, 'address') ?? researchSummary.address)} />
        <Field label="Neighborhood" value={displayValue(intake?.neighborhood)} />
        <Field label="Domain status" value={displayValue(intake?.domain_status)} />
        <Field label="Launch urgency" value={displayValue(intake?.launch_urgency)} />
        <Field label="Brand style" value={displayValue(intake?.brand_style)} />
        <Field label="Current website" value={displayValue(intake?.current_website ?? siteMetadataValue(detail, 'website_url') ?? researchSummary.website ?? detail.request?.website_url)} />
        <Field label="Instagram" value={displayValue(intake?.instagram_url ?? siteMetadataValue(detail, 'instagram_url') ?? detail.request?.instagram_url)} />
        <Field label="Google Business" value={displayValue(intake?.google_business_url ?? siteMetadataValue(detail, 'google_url') ?? detail.request?.google_url ?? researchSummary.mapsUrl)} />
        <Field label="Menu URL" value={displayValue(intake?.menu_url ?? siteMetadataValue(detail, 'menu_url') ?? researchSummary.menuLinks[0])} />
        <Field label="Ordering URL" value={displayValue(intake?.ordering_url ?? researchSummary.orderingLinks[0])} />
        <Field label="Reservations URL" value={displayValue(intake?.reservations_url ?? researchSummary.reservationLinks[0])} />
      </dl>
      <dl style={{ marginTop: 8 }}>
        <Field label="Brand notes" value={displayValue(intake?.brand_notes)} />
        <Field label="Ideal guest" value={displayValue(intake?.ideal_guest)} />
        <Field label="Differentiators" value={displayValue(intake?.differentiators)} />
        <Field label="Owner goals" value={displayValue(intake?.owner_goals ?? siteMetadataValue(detail, 'notes') ?? detail.request?.notes)} />
        <Field label="Phone" value={displayValue(researchSummary.phone)} />
        <Field label="Maps URL" value={displayValue(researchSummary.mapsUrl)} />
        <Field label="Rating" value={displayValue(researchSummary.rating === null ? null : String(researchSummary.rating))} />
      </dl>
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        <JsonDetails label="Hours" value={hasUsefulHours(intake?.hours) ? intake?.hours : researchSummary.hours} />
        <JsonDetails label="Menu notes" value={intake?.menu_notes} />
        <JsonDetails label="Feature requests" value={intake?.feature_requests} />
        <JsonDetails label="Asset links" value={intake?.asset_links} />
      </div>
    </section>
  );
}

function AssetsTab({ detail }: { detail: AdminSiteDetail }) {
  const researchSummary = summarizeResearchSources(detail.researchSources, detail.siteAssets);
  const operation = currentOperation(detail);
  const feed = operationFeed(detail);
  const uniqueScrapeTargets = [...new Set(detail.readiness.scrapeTargets)];
  const socialAccessMode =
    detail.site?.metadata &&
    typeof detail.site.metadata === 'object' &&
    !Array.isArray(detail.site.metadata) &&
    detail.site.metadata.social_research_access &&
    typeof detail.site.metadata.social_research_access === 'object' &&
    !Array.isArray(detail.site.metadata.social_research_access) &&
    typeof (detail.site.metadata.social_research_access as Record<string, unknown>).mode === 'string'
      ? String((detail.site.metadata.social_research_access as Record<string, unknown>).mode)
      : null;
  const reviewHref = `/admin/sites/${detail.slug}/review`;

  return (
    <div className="admin-grid-2">
      <section className="admin-card">
        <div className="admin-card__header">
          <Bot size={19} />
          <h2 className="admin-card__title">Research progress</h2>
        </div>
        <div className="admin-run-progress" style={{ marginBottom: 18 }}>
          <div className="admin-run-progress__top">
            <p className="admin-label">Current research step</p>
            <span className={operationStateClass(operation.state)}>{operation.state.replaceAll('_', ' ')}</span>
          </div>
          <p className="admin-run-progress__label">{operation.label}</p>
          <div className={`admin-progress admin-progress--operation${isOperationActive(operation.state) ? ' is-active' : ''}`} aria-label={`Research progress ${operation.percent}%`}>
            <div className="admin-progress__track">
              <div className="admin-progress__bar admin-progress__bar--operation" style={{ width: `${operation.percent}%` }} />
            </div>
            <span className="admin-progress__value">{operation.percent}%</span>
          </div>
          <p className="admin-muted" style={{ marginTop: 10 }}>
            {operation.detailText ?? 'Review discovered URLs, approved assets, and the research profile here as the worker advances.'}
          </p>
          {!!feed.length && (
            <ol className="admin-operation-feed">
              {feed.map((entry, index) => (
                <li className="admin-operation-feed__item" key={`${entry.updatedAt ?? entry.label}-${index}`}>
                  <div className="admin-operation-feed__top">
                    <p className="admin-operation-feed__label">{entry.label}</p>
                    <span className={operationStateClass(entry.status)}>{entry.percent !== null ? `${entry.percent}%` : entry.status}</span>
                  </div>
                  {entry.detail && <p className="admin-muted">{entry.detail}</p>}
                  <p className="admin-small">{entry.updatedAt ? formatDate(entry.updatedAt) : 'Just now'}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
        <h2 className="admin-card__title">Research targets</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {uniqueScrapeTargets.map((target, index) => (
            <a className="admin-link-card" href={absoluteSiteUrl(target)} key={index} rel="noreferrer" target="_blank">
              {target}
            </a>
          ))}
          {!uniqueScrapeTargets.length && <p className="admin-muted">No source links are available yet.</p>}
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
          <p className="admin-label">Restaurant snapshot</p>
          <p style={{ fontWeight: 800 }}>{detail.siteBrief.summary}</p>
          <p className="admin-muted">{researchSummary.address ?? 'Address not confirmed yet.'}</p>
          <p className="admin-muted">{researchSummary.phone ? `Phone: ${researchSummary.phone}` : 'Phone not confirmed yet.'}</p>
          <p className="admin-muted">{researchSummary.hours.length ? `Hours: ${researchSummary.hours.slice(0, 3).join(' | ')}` : 'Hours not confirmed yet.'}</p>
          <p className="admin-muted">{researchSummary.mapsUrl ? `Maps: ${researchSummary.mapsUrl}` : 'Maps URL not confirmed yet.'}</p>
          <p className="admin-muted">{researchSummary.rating !== null ? `Rating: ${researchSummary.rating}` : 'Rating not available.'}</p>
          <p className="admin-muted">
            {socialAccessMode === 'connected_meta_session'
              ? 'Social research mode: connected Meta session'
              : socialAccessMode === 'expired_meta_session_fallback'
                ? 'Social research mode: expired Meta session fallback'
              : 'Social research mode: public-only access'}
          </p>
          <p className="admin-muted">
            {detail.resolvedMenu
              ? `Menu status: ${detail.resolvedMenu.status.replaceAll('_', ' ')}`
              : 'Menu status: still being resolved.'}
          </p>
        </div>
        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
          <p className="admin-label">AI review</p>
          <div className="admin-link-card">
            <p style={{ fontWeight: 800 }}>
              {detail.researchReview.overrideStatus === 'required'
                ? 'Needs help before we can keep moving'
                : 'Autopilot is using the best available information'}
            </p>
            <p className="admin-muted" style={{ marginTop: 8 }}>
              {detail.researchAudit?.readableProfileSummary ?? 'The AI review summary will appear here after research completes.'}
            </p>
            {!!detail.researchReview.blockers.length && (
              <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                {detail.researchReview.blockers.map((blocker) => (
                  <p className="admin-muted" key={blocker}>{blocker}</p>
                ))}
              </div>
            )}
            <div className="admin-header-actions" style={{ marginTop: 12 }}>
              <Link className="admin-btn admin-btn--secondary" href={reviewHref}>
                {detail.researchReview.overrideStatus === 'required' ? 'Fix blocker' : 'Review AI choices'}
              </Link>
            </div>
          </div>
        </div>
        <details className="admin-details" style={{ marginTop: 18 }}>
          <summary>View evidence</summary>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <p className="admin-label">Captured research profile</p>
            {detail.researchSources.map((source) => (
              <article className="admin-link-card" key={source.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 800 }}>{source.title || 'Research source'}</p>
                    <p className="admin-small">
                      {source.source_type.replaceAll('_', ' ')} · {Math.round(source.confidence * 100)}% confidence
                    </p>
                  </div>
                  {source.url && (
                    <a className="admin-btn admin-btn--ghost" href={source.url} rel="noreferrer" target="_blank">
                      Open <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                {factHighlights(source.extracted_facts).map((fact) => (
                  <p className="admin-muted" key={`${source.id}-${fact}`} style={{ marginTop: 6 }}>
                    {fact}
                  </p>
                ))}
                <JsonDetails label="Research facts" value={source.extracted_facts} />
              </article>
            ))}
            {!detail.researchSources.length && <p className="admin-muted">No research has been captured yet.</p>}
          </div>
        </details>
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Assets and files</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {detail.readiness.assetNotes.map((note) => (
            <p className="admin-link-card" key={note}>{note}</p>
          ))}
        </div>
        {!!detail.siteAssets.length && (
          <details className="admin-details" style={{ marginTop: 18 }}>
            <summary>View asset evidence</summary>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <p className="admin-label">Captured asset candidates</p>
              <div className="admin-asset-grid">
                {detail.siteAssets.map((asset) => {
                  const metadata =
                    asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
                      ? asset.metadata
                      : {};
                  const previewUrl =
                    (typeof metadata.thumbnail_url === 'string' && metadata.thumbnail_url) ||
                    (typeof metadata.asset_url === 'string' && metadata.asset_url) ||
                    asset.source_url;
                  const assetTitle =
                    (typeof metadata.title === 'string' && metadata.title) ||
                    asset.source_label ||
                    asset.asset_type.replaceAll('_', ' ');
                  return (
                    <article className="admin-asset-card" key={asset.id}>
                      {previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={assetTitle} className="admin-asset-card__image" src={previewUrl} />
                      )}
                      <div className="admin-asset-card__body">
                        <div className="admin-chip-list">
                          <span className="admin-pill admin-pill--neutral">{asset.asset_type}</span>
                          <span className={asset.status === 'approved' ? 'admin-pill admin-pill--success' : 'admin-pill admin-pill--neutral'}>
                            {asset.status}
                          </span>
                        </div>
                        <p className="admin-asset-card__title">{assetTitle}</p>
                        <p className="admin-small">
                          {typeof metadata.source_type === 'string' ? metadata.source_type.replaceAll('_', ' ') : 'research asset'} ·{' '}
                          {typeof metadata.capture_method === 'string' ? metadata.capture_method.replaceAll('_', ' ') : 'captured'}
                        </p>
                        {typeof metadata.why_selected === 'string' && (
                          <p className="admin-muted" style={{ marginTop: 6 }}>
                            {metadata.why_selected}
                          </p>
                        )}
                        {asset.source_url && (
                          <a className="admin-btn admin-btn--ghost" href={asset.source_url} rel="noreferrer" target="_blank" style={{ marginTop: 8 }}>
                            Source <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </details>
        )}
        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          {detail.files.map((file) => (
            <div className="admin-file-card" key={file.id}>
              <p style={{ fontWeight: 800 }}>{file.file_name}</p>
              <p className="admin-muted">
                {file.file_role} · {file.content_type ?? 'Unknown type'} · {file.size_bytes ?? 0} bytes
              </p>
              {file.signed_url && (
                <a className="admin-btn admin-btn--secondary" href={file.signed_url} rel="noreferrer" target="_blank" style={{ marginTop: 10 }}>
                  Open file <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
          {!detail.files.length && <p className="admin-muted">No uploaded files yet.</p>}
        </div>
      </section>
    </div>
  );
}

function PacketTab({ detail }: { detail: AdminSiteDetail }) {
  const action = generateBuildPacket.bind(null, detail.slug);
  const packetText = detail.buildPacket?.packet_markdown || detail.buildBrief || '';

  return (
    <section className="admin-card admin-packet">
      <div className="admin-packet__header">
        <div>
          <div className="admin-card__header" style={{ marginBottom: 8 }}>
            <Bot size={19} />
            <h2 className="admin-card__title">Build brief</h2>
          </div>
          <p className="admin-muted">
            Internal builder handoff for the preview pipeline. This is the concise brief the system uses to shape and refresh the site.
          </p>
          {detail.buildPacket && (
            <p className="admin-small" style={{ marginTop: 8 }}>
              Last generated {formatDate(detail.buildPacket.created_at)} · {detail.buildPacket.model} · {buildBriefStatusLabel(detail)}
            </p>
          )}
        </div>
        <div className="admin-header-actions">
          <BuildPacketCopyButton text={packetText} />
          <form action={action}>
            <BuildPacketGenerateButton isReady={detail.packetState === 'ready' && Boolean(detail.researchAudit && detail.resolvedProfile && detail.researchReview.blockers.length === 0)} />
          </form>
        </div>
      </div>

      {detail.buildPacket?.status === 'failed' && (
        <div className="admin-alert">Generation failed: {detail.buildPacket.error_message ?? 'Unknown error'}</div>
      )}

      {detail.packetState === 'stale' && (
        <div className="admin-alert">This build brief is stale because the source request, intake, site, or file data changed after generation.</div>
      )}

      <textarea
        className="admin-textarea"
        readOnly
        value={packetText || 'Generate a build brief once research and the resolved site brief are ready.'}
      />

      {detail.buildPacket?.analysis_json && (
        <JsonDetails label="Structured AI analysis" value={detail.buildPacket.analysis_json} />
      )}
    </section>
  );
}

function TimelineTab({ detail }: { detail: AdminSiteDetail }) {
  return (
    <section className="admin-card">
      <h2 className="admin-card__title">Timeline</h2>
      <ol className="admin-timeline" style={{ marginTop: 14 }}>
        {detail.events.map((event) => (
          <li key={event.id ?? `${event.event_type}-${event.created_at}`}>
            <p style={{ fontWeight: 800 }}>{event.event_type.replaceAll('_', ' ')}</p>
            <p className="admin-muted">{event.message ?? event.actor_type ?? 'Event recorded'}</p>
            <p className="admin-small">{event.actor_type ?? 'system'} · {formatDate(event.created_at)}</p>
          </li>
        ))}
        {!detail.events.length && <li className="admin-muted">No events yet.</li>}
      </ol>
    </section>
  );
}

export default async function AdminSiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { slug } = await params;
  const tabParam = (await searchParams).tab;
  const activeTab = (Array.isArray(tabParam) ? tabParam[0] : tabParam) ?? 'overview';
  const detail = await getAdminSiteDetail(slug, { tab: activeTab });

  if (!detail) notFound();

  const title = detail.request?.restaurant_name ?? detail.site?.restaurant_name ?? slug;
  const city = detail.site?.city ?? detail.request?.city ?? 'City unknown';
  const previewUrl = detail.site?.live_url ?? detail.site?.staging_url ?? detail.site?.preview_url ?? `/preview/${detail.slug}`;
  const claimUrl = detail.site?.claim_url ?? `/claim/${detail.slug}`;
  const operation = currentOperation(detail);
  const reviewNeeded = detail.researchReview.overrideStatus === 'required';
  const reviewAvailable = detail.researchReview.overrideStatus === 'available';
  const packetGenerating = (operation.taskType === 'build_brief' || operation.taskType === 'build_packet') && isOperationActive(operation.state);
  const reviewHref = `/admin/sites/${detail.slug}/review`;
  const stageLabel = detail.workItem?.operatorStageLabel ?? 'Researching';
  const nextStepTitle = stageLabel;
  const nextStepDetail = detail.workItem?.operatorStatusLine ?? 'We are moving this project through the pipeline.';
  const studioHref = `/admin/sites/${detail.slug}/studio`;
  const operatorStage = detail.workItem?.operatorStage;

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <header className="admin-panel admin-detail-header">
          <Link className="admin-back" href="/admin">
            <ArrowLeft size={16} />
            Back to admin
          </Link>

          <div className="admin-detail-hero">
            <div>
              <span className="admin-pill admin-pill--neutral">{detail.workItem?.operatorStageLabel ?? 'Project'}</span>
              <h1 className="admin-detail-title">{title}</h1>
              <p className="admin-subtitle">
                {city} · {detail.slug} · Updated {formatDate(detail.workItem?.updatedAt ?? detail.site?.updated_at ?? detail.request?.updated_at)}
              </p>
            </div>
            <div className="admin-header-actions">
              <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(previewUrl)} rel="noreferrer" target="_blank">
                Preview <ExternalLink size={14} />
              </a>
              {detail.site && (
                <Link className="admin-btn admin-btn--secondary" href={studioHref}>
                  Prompt Studio
                </Link>
              )}
              <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(claimUrl)} rel="noreferrer" target="_blank">
                Claim <ExternalLink size={14} />
              </a>
              {detail.site?.staging_url && (
                <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(detail.site.staging_url)} rel="noreferrer" target="_blank">
                  Staging <ExternalLink size={14} />
                </a>
              )}
              {detail.site?.live_url && (
                <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(detail.site.live_url)} rel="noreferrer" target="_blank">
                  Live <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </header>

        <section className="admin-workflow-callout">
          <div>
            <p className="admin-label">Current stage</p>
            <h2 className="admin-workflow-callout__title">{nextStepTitle}</h2>
            <p className="admin-muted" style={{ marginTop: 8 }}>{nextStepDetail}</p>
            <div className="admin-workflow-steps" style={{ marginTop: 12 }}>
              <span className={`admin-chip${operatorStage === 'research_collection' || operatorStage === 'researching' ? ' is-active' : ''}`}>Research</span>
              <span className={`admin-chip${operatorStage === 'ai_reviewing' ? ' is-active' : ''}`}>AI review</span>
              <span className={`admin-chip${operatorStage === 'build_brief' ? ' is-active' : ''}`}>Build brief</span>
              <span className={`admin-chip${operatorStage === 'code_build' ? ' is-active' : ''}`}>Code build</span>
              <span className={`admin-chip${operatorStage === 'deploy' ? ' is-active' : ''}`}>Deploy</span>
              <span className={`admin-chip${operatorStage === 'qa' || operatorStage === 'building_preview' ? ' is-active' : ''}`}>QA</span>
              <span className={`admin-chip${operatorStage === 'preview_ready' ? ' is-active' : ''}`}>Prompt Studio</span>
              <span className={`admin-chip${operatorStage === 'published' ? ' is-active' : ''}`}>Published</span>
            </div>
          </div>
          <div className="admin-header-actions">
            {reviewNeeded ? (
              <Link className="admin-btn admin-btn--primary" href={reviewHref}>
                Fix blocker
              </Link>
            ) : operatorStage === 'preview_ready' || operatorStage === 'published' ? (
              <Link className="admin-btn admin-btn--primary" href={studioHref}>
                Open Prompt Studio
              </Link>
            ) : reviewAvailable ? (
              <Link className="admin-btn admin-btn--secondary" href={reviewHref}>
                Review AI choices
              </Link>
            ) : packetGenerating || ['build_brief', 'code_build', 'deploy', 'qa', 'building_preview'].includes(operatorStage ?? '') ? (
              <Link className="admin-btn admin-btn--secondary" href={`/admin/sites/${detail.slug}?tab=packet`}>
                Open Build Brief
              </Link>
            ) : ['research_collection', 'researching', 'ai_reviewing'].includes(operatorStage ?? '') ? (
              <Link className="admin-btn admin-btn--secondary" href={`/admin/sites/${detail.slug}?tab=assets`}>
                Open research
              </Link>
            ) : (
              <a className="admin-btn admin-btn--secondary" href={absoluteSiteUrl(previewUrl)} rel="noreferrer" target="_blank">
                Open preview
              </a>
            )}
          </div>
        </section>

        <nav className="admin-tabs" aria-label="Admin site sections">
          {TABS.map(([value, label]) => (
            <TabLink active={activeTab === value} key={value} slug={detail.slug} value={value}>
              <span>{label}</span>
              {value === 'assets' && reviewNeeded && <span className="admin-tab-badge">Help</span>}
              {value === 'assets' && !reviewNeeded && reviewAvailable && <span className="admin-tab-badge">Optional</span>}
              {value === 'packet' && packetGenerating && <span className="admin-tab-badge">Updating</span>}
            </TabLink>
          ))}
        </nav>

        {activeTab === 'intake' ? (
          <IntakeTab detail={detail} />
        ) : activeTab === 'assets' ? (
          <AssetsTab detail={detail} />
        ) : activeTab === 'packet' ? (
          <PacketTab detail={detail} />
        ) : activeTab === 'timeline' ? (
          <TimelineTab detail={detail} />
        ) : (
          <OverviewTab detail={detail} />
        )}
      </section>
    </main>
  );
}

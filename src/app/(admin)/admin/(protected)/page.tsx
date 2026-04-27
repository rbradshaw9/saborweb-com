import Link from 'next/link';
import type { CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, PlugZap, Search, Sparkles } from 'lucide-react';
import {
  filterAdminWorkItems,
  getAdminOpsData,
  type AdminWorkItem,
  type PipelineStage,
} from '@/lib/admin/dashboard';
import { requireAdminUser } from '@/lib/admin/auth';
import { ADD_ON_CATALOG } from '@/lib/platform/catalog';
import { signOutAdmin } from './actions';
import ManualProjectForm from './ManualProjectForm';
import { createManualProject } from './sites/[slug]/actions';

const QUEUES = [
  ['all', 'All'],
  ['needs-action', 'Needs action'],
  ['intake-incomplete', 'Intake incomplete'],
  ['ready-for-build', 'Ready for build'],
  ['preview-ready', 'Preview ready'],
  ['claim-payment', 'Claim/payment'],
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
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function operationTone(state: AdminWorkItem['currentOperationState']) {
  switch (state) {
    case 'succeeded':
      return 'admin-pill admin-pill--success';
    case 'failed':
    case 'blocked':
      return 'admin-pill admin-pill--warn';
    case 'queued':
      return 'admin-pill admin-pill--neutral';
    case 'running':
      return 'admin-pill admin-pill--ready';
    default:
      return 'admin-pill admin-pill--neutral';
  }
}

function stageClass(stage: PipelineStage) {
  switch (stage) {
    case 'Collecting evidence':
      return 'admin-pill admin-pill--neutral';
    case 'AI audit':
    case 'AI finished research':
    case 'Needs your help':
    case 'Generating packet':
    case 'Packet ready':
    case 'Build packet ready':
    case 'Ready for build':
    case 'Ready for admin review':
      return 'admin-pill admin-pill--ready';
    case 'Build queued':
    case 'Preview sent':
    case 'Viewed':
    case 'Preview ready':
    case 'Live/complete':
    case 'Paid/live':
      return 'admin-pill admin-pill--success';
    case 'Claim started':
    case 'Claim/payment active':
      return 'admin-pill admin-pill--money';
    case 'Needs info':
    case 'Request received':
    case 'Intake incomplete':
    case 'Waiting on owner':
      return 'admin-pill admin-pill--neutral';
    default:
      return 'admin-pill admin-pill--warn';
  }
}

function packetLabel(item: AdminWorkItem) {
  if (item.packetState === 'ready') return 'Build brief ready';
  if (item.packetState === 'stale') return 'Build brief stale';
  if (item.packetState === 'failed') return 'Build brief failed';
  return ['Ready for build', 'Resolved profile ready', 'Admin review required'].includes(item.pipelineStage) ? 'Needs build brief' : 'No build brief yet';
}

function queueHref(queue: string, search: string) {
  const params = new URLSearchParams();
  if (queue !== 'all') params.set('queue', queue);
  if (search) params.set('q', search);
  const query = params.toString();
  return query ? `/admin?${query}` : '/admin';
}

function dollarsFromCents(value: number) {
  if (!value) return '$0';
  return `$${(value / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function addOnName(key: string) {
  return ADD_ON_CATALOG.find((item) => item.key === key)?.name ?? key.replaceAll('_', ' ');
}

function SummaryCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: number;
  note: string;
  tone: 'warn' | 'ready' | 'wait' | 'success' | 'money';
}) {
  const Icon = tone === 'ready' ? Sparkles : tone === 'success' ? CheckCircle2 : tone === 'wait' ? Clock3 : AlertTriangle;
  const color =
    tone === 'success'
      ? '#197a4b'
      : tone === 'money'
        ? '#8a620c'
        : tone === 'ready'
          ? '#2f5d88'
          : '#d95f43';

  return (
    <article className="admin-card admin-metric" style={{ '--metric-color': color } as CSSProperties}>
      <div className="admin-metric__top">
        <p className="admin-metric__label">{title}</p>
        <Icon className="admin-metric__icon" size={18} />
      </div>
      <p className="admin-metric__value">{value}</p>
      <p className="admin-metric__note">{note}</p>
    </article>
  );
}

function WorkItemCard({ item }: { item: AdminWorkItem }) {
  const topMissing = item.outstandingItems.slice(0, 3);
  const hasOperation = item.currentOperationState !== 'idle' || Boolean(item.currentOperationLabel);
  const actionHref = item.primaryActionHref;
  const previewHref = item.stagingUrl ?? item.previewUrl;

  return (
    <article className={`admin-work-row ${item.urgency === 'high' ? 'is-high' : ''}`}>
      <div className="admin-work-main">
        <div>
          <div className="admin-chip-list">
            {item.isOrphanRequest && <span className="admin-pill admin-pill--warn">Request only</span>}
            {item.urgency === 'high' && <span className="admin-pill admin-pill--warn">Needs attention</span>}
          </div>
          <Link className="admin-work-title" href={`/admin/sites/${item.slug}`}>
            {item.restaurantName}
          </Link>
          <p className="admin-meta">
            {item.city || 'City unknown'} · {item.slug} · Updated {formatDate(item.updatedAt)}
          </p>
          <p className="admin-meta">
            {item.ownerName || 'Unknown owner'} · {item.ownerEmail || item.ownerPhone || 'No contact'}
          </p>
        </div>

        <div>
          <span className={stageClass(item.pipelineStage)}>{item.operatorStageLabel}</span>
          <p className="admin-next-action">{item.operatorStatusLine}</p>
          <p className="admin-small">
            Worker stage: {item.pipelineStage}
          </p>
          <p className="admin-small">
            Automation {item.automationMode.replaceAll('_', ' ')} · Risk {item.riskScore}
          </p>
        </div>

        <div className="admin-readiness">
          <div className="admin-progress" aria-label={`Build readiness ${item.completenessScore}%`}>
            <div className="admin-progress__track">
              <div className="admin-progress__bar" style={{ width: `${item.completenessScore}%` }} />
            </div>
            <span className="admin-progress__value">{item.completenessScore}%</span>
          </div>
          {hasOperation && (
            <div className="admin-run-progress">
              <div className="admin-run-progress__top">
                <p className="admin-label">Current operation</p>
                <span className={operationTone(item.currentOperationState)}>
                  {item.currentOperationState.replaceAll('_', ' ')}
                </span>
              </div>
              <p className="admin-run-progress__label">{item.currentOperationLabel ?? 'Waiting for next action'}</p>
              <div className="admin-progress admin-progress--operation" aria-label={`Current operation ${item.currentOperationPercent}%`}>
                <div className="admin-progress__track">
                  <div className="admin-progress__bar admin-progress__bar--operation" style={{ width: `${item.currentOperationPercent}%` }} />
                </div>
                <span className="admin-progress__value">{item.currentOperationPercent}%</span>
              </div>
              <p className="admin-small">
                {item.currentOperationUpdatedAt ? `Updated ${formatDate(item.currentOperationUpdatedAt)}` : 'Waiting for the worker to report back.'}
              </p>
            </div>
          )}
          <p className="admin-meta">{packetLabel(item)}</p>
          <p className="admin-small">
            Intake {item.intakeStatus} · {item.fileCount} files
          </p>
          <p className="admin-small">
            Add-ons {item.activeAddOns.length} · Agent spend {dollarsFromCents(item.agentCostCents)}
          </p>
        </div>

        <div className="admin-row-actions">
          <Link className="admin-btn admin-btn--primary" href={actionHref}>
            {item.primaryActionLabel}
          </Link>
          {(item.operatorStage === 'preview_ready' || item.operatorStage === 'published') && (
            <a className="admin-btn admin-btn--ghost" href={absoluteSiteUrl(previewHref)} rel="noreferrer" target="_blank">
              Preview <ExternalLink size={13} />
            </a>
          )}
          {item.liveUrl && (
            <a className="admin-btn admin-btn--ghost" href={absoluteSiteUrl(item.liveUrl)} rel="noreferrer" target="_blank">
              Live <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      <div className="admin-row-footer">
        <div className="admin-chip-list">
          {topMissing.map((missing) => (
            <span className="admin-chip" key={`${item.id}-${missing.label}`}>
              Missing: {missing.label}
            </span>
          ))}
          {!topMissing.length && <span className="admin-chip">No critical intake gaps</span>}
          {item.blockedAddOns.map((addOn) => (
            <span className="admin-chip" key={`${item.id}-${addOn.id}`}>
              {addOn.status === 'blocked' ? 'Blocked' : 'Needs access'}: {addOnName(addOn.add_on_key)}
            </span>
          ))}
          {item.latestAgentRun && (
            <span className="admin-chip">
              Agent {item.latestAgentRun.task_type.replaceAll('_', ' ')}: {item.latestAgentRun.status}
            </span>
          )}
        </div>
        <p className="admin-small">
          {item.latestEvent?.event_type?.replaceAll('_', ' ') ?? 'No events'} · {formatDate(item.latestEvent?.created_at)}
        </p>
      </div>
    </article>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string | string[]; q?: string | string[] }>;
}) {
  const user = await requireAdminUser();
  const { items, packetsAvailable } = await getAdminOpsData();
  const params = await searchParams;
  const queue = Array.isArray(params.queue) ? params.queue[0] : params.queue ?? 'all';
  const search = Array.isArray(params.q) ? params.q[0] : params.q ?? '';
  const filteredItems = filterAdminWorkItems(items, queue, search);
  const stageSummary = {
    needsHelp: items.filter((item) => item.operatorStage === 'needs_help').length,
    researching: items.filter((item) => ['research_collection', 'researching', 'ai_reviewing'].includes(item.operatorStage)).length,
    building: items.filter((item) => ['build_brief', 'code_build', 'deploy', 'qa', 'building_preview'].includes(item.operatorStage)).length,
    previewReady: items.filter((item) => item.operatorStage === 'preview_ready').length,
    published: items.filter((item) => item.operatorStage === 'published').length,
  };

  return (
    <main className="admin-page">
      <section className="admin-shell admin-shell--wide">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Restaurant Builder</p>
            <h1 className="admin-title">Projects</h1>
            <p className="admin-subtitle">
              Signed in as {user.email}. Add restaurants, let the system research and build, then use Prompt Studio to refine and publish.
            </p>
          </div>
          <form action={signOutAdmin} className="admin-header-actions">
            <Link className="admin-btn admin-btn--secondary" href="/admin/integrations">
              <PlugZap size={14} />
              Integrations
            </Link>
            <button className="admin-btn admin-btn--secondary">Sign out</button>
          </form>
        </header>

        <section className="admin-workflow-callout">
          <div>
            <p className="admin-label">How this works</p>
            <h2 className="admin-workflow-callout__title">1. Add a restaurant 2. We research and build 3. You refine and publish</h2>
            <p className="admin-muted" style={{ marginTop: 8 }}>
              The happy path is automatic. We only stop for human help when something truly blocks a usable preview.
            </p>
          </div>
          <div className="admin-chip-list">
            <span className="admin-chip is-active">Research</span>
            <span className="admin-chip">AI review</span>
            <span className="admin-chip">Build preview</span>
            <span className="admin-chip">Prompt Studio</span>
          </div>
        </section>

        {!packetsAvailable && (
          <div className="admin-alert">
            Dedicated build brief storage is not available yet. Fallback storage will be used until the migration is applied.
          </div>
        )}

        <div className="admin-metrics">
          <SummaryCard title="Needs help" value={stageSummary.needsHelp} note="True blockers only" tone="warn" />
          <SummaryCard title="Researching" value={stageSummary.researching} note="Finding facts, assets, and menu clues" tone="ready" />
          <SummaryCard title="Building preview" value={stageSummary.building} note="Build brief, preview build, or QA running" tone="wait" />
          <SummaryCard title="Preview ready" value={stageSummary.previewReady} note="Ready for Prompt Studio and publish" tone="success" />
          <SummaryCard title="Published" value={stageSummary.published} note="Live sites" tone="money" />
        </div>

          <ManualProjectForm action={createManualProject} />

        <section className="admin-panel admin-toolbar">
          <div className="admin-toolbar__top">
            <nav className="admin-segmented" aria-label="Admin queues">
              {QUEUES.map(([value, label]) => (
                <Link
                  className={`admin-segment ${queue === value || (queue === 'all' && value === 'all') ? 'is-active' : ''}`}
                  href={queueHref(value, search)}
                  key={value}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <form className="admin-search">
              {queue !== 'all' && <input name="queue" type="hidden" value={queue} />}
              <Search size={16} />
              <input
                className="admin-input"
                defaultValue={search}
                name="q"
                placeholder="Search restaurant, owner, slug, city..."
                type="search"
              />
            </form>
          </div>

          <div className="admin-list">
            {filteredItems.map((item) => (
              <WorkItemCard item={item} key={`${item.requestId}-${item.siteId ?? 'request'}`} />
            ))}
            {!filteredItems.length && (
              <p className="admin-muted" style={{ padding: '28px', textAlign: 'center' }}>
                No requests match this queue or search yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

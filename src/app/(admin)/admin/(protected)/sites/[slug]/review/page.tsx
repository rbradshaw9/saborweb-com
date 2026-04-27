import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Bot, CheckCircle2, CircleDot } from 'lucide-react';
import { getAdminSiteDetail } from '@/lib/admin/dashboard';
import { saveResearchReview } from '../actions';

function formatDate(value: string | null | undefined) {
  if (!value) return 'just now';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function reviewFieldName(field: string) {
  switch (field) {
    case 'restaurantName':
    case 'address':
    case 'phone':
    case 'hours':
      return `conflict_${field}`;
    case 'officialSite':
      return 'official_site_choice';
    case 'primaryWebPresence':
      return 'primary_web_presence_url';
    case 'menuDisplayMode':
      return 'menu_display_mode';
    case 'logo':
      return 'canonical_logo_choice';
    case 'photoStrategy':
      return 'photo_strategy';
    default:
      return field;
  }
}

function autopilotLabel(detail: Awaited<ReturnType<typeof getAdminSiteDetail>>) {
  if (!detail) return 'Review AI choices';
  if (detail.researchReview.overrideStatus === 'required') {
    return `Needs your help on ${detail.researchReview.blockers.length} item${detail.researchReview.blockers.length === 1 ? '' : 's'}`;
  }
  if (detail.packetState === 'ready') return 'Build brief ready';
  return 'AI picked the best available info';
}

export default async function AdminSiteReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getAdminSiteDetail(slug, { tab: 'review' });
  if (!detail?.site) notFound();

  const currentQuestion = detail.researchReview.currentQuestion;
  const currentQuestionIndex = currentQuestion
    ? detail.researchReview.reviewQueue.findIndex((card) => card.id === currentQuestion.id)
    : -1;
  const totalQuestions = detail.researchReview.reviewQueue.length;
  const packetGenerating =
    (detail.workItem?.latestAgentRun?.task_type === 'build_brief' || detail.workItem?.latestAgentRun?.task_type === 'build_packet') &&
    ['queued', 'running'].includes(detail.workItem?.latestAgentRun?.status ?? '');
  const reviewAction = saveResearchReview.bind(null, detail.slug);
  const redirectToSelf = `/admin/sites/${detail.slug}/review`;

  return (
    <main className="admin-page">
      <section className="admin-shell" style={{ display: 'grid', gap: 20, maxWidth: 860 }}>
        <header className="admin-panel admin-detail-header">
          <Link className="admin-back" href={`/admin/sites/${detail.slug}`}>
            <ArrowLeft size={16} />
            Back to project
          </Link>

          <div className="admin-detail-hero">
            <div>
              <span className={`admin-pill${detail.researchReview.overrideStatus === 'required' ? ' admin-pill--warn' : detail.packetState === 'ready' ? ' admin-pill--success' : ' admin-pill--ready'}`}>
                {autopilotLabel(detail)}
              </span>
              <h1 className="admin-detail-title" style={{ marginTop: 10 }}>Review AI Choices</h1>
              <p className="admin-subtitle">
                {detail.site.restaurant_name} · {detail.site.city ?? 'City unknown'} · Updated {formatDate(detail.workItem?.updatedAt ?? detail.site.updated_at)}
              </p>
            </div>
          </div>
        </header>

        <section className="admin-workflow-callout">
          <div>
            <p className="admin-label">How this works</p>
            <h2 className="admin-workflow-callout__title">
              {currentQuestion
                ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}`
                : detail.researchReview.overrideStatus === 'required'
                  ? 'A few things still need a human choice'
                  : 'Everything important already has an AI choice'}
            </h2>
            <p className="admin-muted" style={{ marginTop: 8 }}>
              {currentQuestion
                ? 'Keep the recommended option when it looks right. This is only for the handful of choices that benefit from a quick human glance.'
                : 'Autopilot is the default now. You can override anything here, but the project does not need a manual approval ceremony to keep moving.'}
            </p>
          </div>
          <div className="admin-chip-list">
            <span className={`admin-chip${detail.researchReview.overrideStatus === 'required' ? ' is-active' : ''}`}>Needs help</span>
            <span className={`admin-chip${packetGenerating ? ' is-active' : ''}`}>Generating brief</span>
            <span className={`admin-chip${detail.packetState === 'ready' ? ' is-active' : ''}`}>Build brief ready</span>
          </div>
        </section>

        <section className="admin-panel" style={{ display: 'grid', gap: 16 }}>
          <div className="admin-card__header">
            <Bot size={18} />
            <h2 className="admin-card__title">Restaurant snapshot</h2>
          </div>
          <p className="admin-muted" style={{ whiteSpace: 'pre-wrap' }}>
            {detail.researchAudit?.readableProfileSummary ?? 'We are still building the restaurant summary.'}
          </p>
          <div className="admin-chip-list">
            <span className="admin-pill admin-pill--neutral">Name: {detail.resolvedProfile?.restaurantName ?? detail.site.restaurant_name}</span>
            {detail.resolvedProfile?.address && <span className="admin-pill admin-pill--neutral">Address: {detail.resolvedProfile.address}</span>}
            {detail.resolvedProfile?.phone && <span className="admin-pill admin-pill--neutral">Phone: {detail.resolvedProfile.phone}</span>}
            <span className="admin-pill admin-pill--neutral">
              Menu: {detail.resolvedMenu?.status.replaceAll('_', ' ') ?? 'still resolving'}
            </span>
            <span className="admin-pill admin-pill--neutral">
              Logo: {detail.researchReview.canonicalLogo ? 'real asset' : detail.resolvedProfile?.logo.strategy?.replaceAll('_', ' ') ?? 'text mark'}
            </span>
          </div>
        </section>

        {currentQuestion ? (
          <form action={reviewAction} className="admin-panel" style={{ display: 'grid', gap: 16 }}>
            <input name="redirect_to" type="hidden" value={redirectToSelf} />
            <input name="question_id" type="hidden" value={currentQuestion.id} />
            <input name="wizard_step" type="hidden" value={currentQuestion.step} />

            <div className="admin-card__header">
              <CircleDot size={18} />
              <h2 className="admin-card__title">{currentQuestion.title}</h2>
            </div>
            <p className="admin-muted">{currentQuestion.explanation}</p>
            <div className="admin-link-card">
              <p style={{ fontWeight: 800 }}>Why we’re asking</p>
              <p className="admin-muted" style={{ marginTop: 8 }}>
                {currentQuestion.evidenceSummary}
              </p>
              {!!currentQuestion.sourcePills.length && (
                <div className="admin-chip-list" style={{ marginTop: 10 }}>
                  {currentQuestion.sourcePills.map((source) => (
                    <span className="admin-pill admin-pill--neutral" key={source}>{source}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {currentQuestion.choices.map((choice) => (
                <label className="admin-link-card" htmlFor={`${currentQuestion.id}-${choice.value}`} key={choice.value} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <input
                      defaultChecked={currentQuestion.selectedChoice === choice.value}
                      id={`${currentQuestion.id}-${choice.value}`}
                      name={reviewFieldName(currentQuestion.field)}
                      type="radio"
                      value={choice.value}
                    />
                    <div style={{ display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800 }}>{choice.label}</span>
                        {currentQuestion.recommendation === choice.value && (
                          <span className="admin-pill admin-pill--success">AI recommendation</span>
                        )}
                      </div>
                      <span className="admin-muted">{choice.description}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <label className="admin-select-label">
              Optional note for this choice
              <textarea
                className="admin-textarea"
                defaultValue={currentQuestion.note ?? ''}
                name="override_note"
                placeholder="Anything the build brief or builder should know about this choice?"
              />
            </label>

            <div className="admin-header-actions">
              {currentQuestionIndex > 0 ? (
                <button className="admin-btn admin-btn--secondary" name="question_nav" value="back">
                  Back
                </button>
              ) : (
                <Link className="admin-btn admin-btn--secondary" href={`/admin/sites/${detail.slug}`}>
                  Back to project
                </Link>
              )}
              <button className="admin-btn admin-btn--primary" name="question_nav" value="continue">
                Continue
              </button>
            </div>
          </form>
        ) : (
          <form action={reviewAction} className="admin-panel" style={{ display: 'grid', gap: 16 }}>
            <input name="redirect_to" type="hidden" value={detail.packetState === 'ready' ? `/admin/sites/${detail.slug}?tab=packet` : redirectToSelf} />
            <div className="admin-card__header">
              <CheckCircle2 size={18} />
              <h2 className="admin-card__title">
                {detail.researchReview.overrideStatus === 'required' ? 'Still blocked' : 'AI choices are ready'}
              </h2>
            </div>

            {detail.researchReview.blockers.length ? (
              <div className="admin-link-card">
                <p style={{ fontWeight: 800 }}>What still needs help</p>
                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  {detail.researchReview.blockers.map((blocker) => (
                    <p className="admin-muted" key={blocker}>{blocker}</p>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="admin-link-card">
                  <p style={{ fontWeight: 800 }}>What AI chose</p>
                  <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                    <p className="admin-muted">Main off-site CTA: {detail.researchReview.effectiveDecisions.primaryWebPresenceUrl ?? 'None yet'}</p>
                    <p className="admin-muted">Menu mode: {detail.researchReview.effectiveDecisions.menuDisplayMode?.replaceAll('_', ' ') ?? 'Not set'}</p>
                    <p className="admin-muted">Logo strategy: {detail.researchReview.effectiveDecisions.logoStrategy?.replaceAll('_', ' ') ?? 'Not set'}</p>
                    <p className="admin-muted">Photo strategy: {detail.researchReview.effectiveDecisions.photoStrategy?.replaceAll('_', ' ') ?? 'Not set'}</p>
                  </div>
                </div>

                <label className="admin-select-label">
                  Final build note
                  <textarea
                    className="admin-textarea"
                    defaultValue={detail.researchReview.state.finalBuildNote ?? ''}
                    name="final_build_note"
                    placeholder="Anything you want the build brief or builder to keep in mind?"
                  />
                </label>
              </>
            )}

            <div className="admin-header-actions">
              <Link className="admin-btn admin-btn--secondary" href={`/admin/sites/${detail.slug}`}>
                Back to project
              </Link>
              {detail.researchReview.blockers.length ? (
                <Link className="admin-btn admin-btn--primary" href={`/admin/sites/${detail.slug}`}>
                  Return to project
                </Link>
              ) : packetGenerating ? (
                <Link className="admin-btn admin-btn--primary" href={`/admin/sites/${detail.slug}?tab=packet`}>
                  Watch build brief
                </Link>
              ) : detail.packetState === 'ready' ? (
                <Link className="admin-btn admin-btn--primary" href={`/admin/sites/${detail.slug}?tab=packet`}>
                  Open build brief
                </Link>
              ) : (
                <button className="admin-btn admin-btn--primary" name="review_intent" value="approve">
                  Save overrides + queue build brief
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

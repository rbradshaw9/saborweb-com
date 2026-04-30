import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { PortalAuthorizationError, assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { submitPortalSupportRequest } from './actions';

const REQUEST_OPTIONS = [
  { value: 'support', label: 'General support' },
  { value: 'menu_hours', label: 'Menu or hours' },
  { value: 'copy', label: 'Copy or translation' },
  { value: 'photo', label: 'Photos' },
  { value: 'layout', label: 'Layout change' },
  { value: 'seo', label: 'Search visibility' },
  { value: 'integration', label: 'Integration' },
];

function statusMessage(searchParams: { submitted?: string | string[]; error?: string | string[] }) {
  const submitted = Array.isArray(searchParams.submitted) ? searchParams.submitted[0] : searchParams.submitted;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (submitted === '1') return { tone: 'success', text: 'Request sent. We will follow up soon.' };
  if (error === 'missing-fields') return { tone: 'error', text: 'Add a title and a few details before sending.' };
  if (error === 'save-failed') return { tone: 'error', text: 'Could not send the request. Try again.' };
  return null;
}

export default async function PortalSupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string | string[]; error?: string | string[] }>;
}) {
  const { slug } = await params;
  const user = await requirePortalUser(`/portal/sites/${slug}/support`);

  let access;
  try {
    access = await assertOwnsRestaurant(user.id, slug);
  } catch (error) {
    if (error instanceof PortalAuthorizationError && error.code === 'not_found') notFound();
    throw error;
  }

  const canEdit = access.membership.role === 'owner' || access.membership.role === 'manager';
  const message = statusMessage(await searchParams);

  return (
    <section className="portal-wrap portal-grid">
      <Link className="portal-button portal-button--ghost w-fit" href={`/portal/sites/${slug}`}>
        <ArrowLeft size={16} />
        Restaurant dashboard
      </Link>

      <div className="portal-card portal-card--padded portal-grid">
        <div>
          <p className="eyebrow">Support request</p>
          <h1 className="text-4xl">{access.site.restaurantName}</h1>
          <p className="portal-muted mt-3">Send details for anything that needs Sabor Web help.</p>
        </div>

        {message ? (
          <p className={message.tone === 'error' ? 'portal-error' : 'portal-success'}>{message.text}</p>
        ) : null}

        <form action={submitPortalSupportRequest} className="portal-form">
          <input name="slug" type="hidden" value={slug} />

          <label>
            Request type
            <select disabled={!canEdit} name="requestType" required>
              {REQUEST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input disabled={!canEdit} maxLength={120} name="title" placeholder="Example: Update our catering note" required type="text" />
          </label>

          <label>
            Details
            <textarea
              disabled={!canEdit}
              name="description"
              placeholder="Tell us what changed, where it should show up, and any timing details."
              required
              rows={7}
            />
          </label>

          <div className="portal-actions">
            <button className="portal-button portal-button--primary" disabled={!canEdit} type="submit">
              <Send size={16} />
              Send request
            </button>
            {!canEdit ? <span className="portal-pill">Read only</span> : null}
          </div>
        </form>
      </div>
    </section>
  );
}

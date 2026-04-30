import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { loadGoodstartContent } from '@/generated-sites/goodstart/load-content';
import { PortalAuthorizationError, assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { updateGoodstartHours } from './actions';

function statusMessage(searchParams: { saved?: string | string[]; error?: string | string[] }) {
  const saved = Array.isArray(searchParams.saved) ? searchParams.saved[0] : searchParams.saved;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (saved === '1') return { tone: 'success', text: 'Hours saved.' };
  if (error === 'invalid-hours') return { tone: 'error', text: 'Each open day needs an opening time before its closing time.' };
  if (error === 'load-failed') return { tone: 'error', text: 'Could not load this restaurant. Try again.' };
  if (error === 'save-failed') return { tone: 'error', text: 'Could not save changes. Try again.' };
  return null;
}

export default async function PortalHoursPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string | string[]; error?: string | string[] }>;
}) {
  const { slug } = await params;
  const user = await requirePortalUser(`/portal/sites/${slug}/hours`);

  let access;
  try {
    access = await assertOwnsRestaurant(user.id, slug);
  } catch (error) {
    if (error instanceof PortalAuthorizationError && error.code === 'not_found') notFound();
    throw error;
  }

  const content = await loadGoodstartContent(slug);
  const canEdit = access.membership.role === 'owner' || access.membership.role === 'manager';
  const message = statusMessage(await searchParams);
  const unsupported = slug !== 'goodstart';

  return (
    <section className="portal-wrap portal-grid">
      <Link className="portal-button portal-button--ghost w-fit" href={`/portal/sites/${slug}`}>
        <ArrowLeft size={16} />
        Restaurant dashboard
      </Link>

      <div className="portal-card portal-card--padded portal-grid">
        <div>
          <p className="eyebrow">Hours</p>
          <h1 className="text-4xl">{content.restaurant.name}</h1>
          <p className="portal-muted mt-3">Update the weekly schedule shown on the public site.</p>
        </div>

        {message ? (
          <p className={message.tone === 'error' ? 'portal-error' : 'portal-success'}>{message.text}</p>
        ) : null}

        {unsupported ? (
          <p className="portal-error">Hours editing is enabled for Goodstart first. This site will be editable after migration.</p>
        ) : null}

        <form action={updateGoodstartHours} className="portal-form">
          <input name="slug" type="hidden" value={slug} />

          <div className="portal-hours-list">
            {content.hours.map((row, index) => (
              <fieldset className="portal-hours-row" disabled={!canEdit || unsupported} key={row.day}>
                <legend>{row.day}</legend>

                <label className="portal-checkbox">
                  <input defaultChecked={Boolean(row.isClosed)} name={`closed-${index}`} type="checkbox" />
                  Closed
                </label>

                <label>
                  Opens
                  <input defaultValue={row.opens} name={`opens-${index}`} type="time" />
                </label>

                <label>
                  Closes
                  <input defaultValue={row.closes} name={`closes-${index}`} type="time" />
                </label>
              </fieldset>
            ))}
          </div>

          <div className="portal-actions">
            <button className="portal-button portal-button--primary" disabled={!canEdit || unsupported} type="submit">
              <Save size={16} />
              Save hours
            </button>
            {!canEdit ? <span className="portal-pill">Read only</span> : null}
          </div>
        </form>
      </div>
    </section>
  );
}

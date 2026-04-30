import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { loadGoodstartContent } from '@/generated-sites/goodstart/load-content';
import { PortalAuthorizationError, assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { updateGoodstartBasics } from './actions';

function fieldLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase());
}

function statusMessage(searchParams: { saved?: string | string[]; error?: string | string[] }) {
  const saved = Array.isArray(searchParams.saved) ? searchParams.saved[0] : searchParams.saved;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (saved === '1') return { tone: 'success', text: 'Restaurant basics saved.' };
  if (error === 'invalid-url') return { tone: 'error', text: 'Use full http or https links for maps and social profiles.' };
  if (error === 'load-failed') return { tone: 'error', text: 'Could not load this restaurant. Try again.' };
  if (error === 'save-failed') return { tone: 'error', text: 'Could not save changes. Try again.' };
  return null;
}

export default async function PortalSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string | string[]; error?: string | string[] }>;
}) {
  const { slug } = await params;
  const user = await requirePortalUser(`/portal/sites/${slug}/settings`);

  let access;
  try {
    access = await assertOwnsRestaurant(user.id, slug);
  } catch (error) {
    if (error instanceof PortalAuthorizationError && error.code === 'not_found') notFound();
    throw error;
  }

  const content = await loadGoodstartContent(slug);
  const restaurant = content.restaurant;
  const canEdit = access.membership.role === 'owner' || access.membership.role === 'manager';
  const message = statusMessage(await searchParams);
  const unsupported = slug !== 'goodstart';

  const fields = [
    'name',
    'alternateName',
    'cuisine',
    'phone',
    'address',
    'streetAddress',
    'locality',
    'postalCode',
    'region',
    'country',
    'mapsUrl',
    'facebookUrl',
    'instagramUrl',
  ] as const;

  return (
    <section className="portal-wrap portal-grid">
      <Link className="portal-button portal-button--ghost w-fit" href={`/portal/sites/${slug}`}>
        <ArrowLeft size={16} />
        Restaurant dashboard
      </Link>

      <div className="portal-card portal-card--padded portal-grid">
        <div>
          <p className="eyebrow">Restaurant basics</p>
          <h1 className="text-4xl">{restaurant.name}</h1>
          <p className="portal-muted mt-3">Update the core facts shown on the public site.</p>
        </div>

        {message ? (
          <p className={message.tone === 'error' ? 'portal-error' : 'portal-success'}>{message.text}</p>
        ) : null}

        {unsupported ? (
          <p className="portal-error">Basics editing is enabled for Goodstart first. This site will be editable after migration.</p>
        ) : null}

        <form action={updateGoodstartBasics} className="portal-form">
          <input name="slug" type="hidden" value={slug} />

          <div className="portal-form-grid">
            {fields.map((field) => (
              <label key={field}>
                {fieldLabel(field)}
                <input
                  defaultValue={restaurant[field]}
                  disabled={!canEdit || unsupported}
                  name={field}
                  required={['name', 'phone', 'address', 'locality'].includes(field)}
                  type={field.toLowerCase().includes('url') ? 'url' : 'text'}
                />
              </label>
            ))}
          </div>

          <div className="portal-actions">
            <button className="portal-button portal-button--primary" disabled={!canEdit || unsupported} type="submit">
              <Save size={16} />
              Save basics
            </button>
            {!canEdit ? <span className="portal-pill">Read only</span> : null}
          </div>
        </form>
      </div>
    </section>
  );
}

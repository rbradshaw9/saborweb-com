import { redirect } from 'next/navigation';
import { getPortalUser, safePortalNextPath } from '@/lib/portal/auth';
import { PortalLoginForm } from './PortalLoginForm';

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const nextPath = safePortalNextPath((await searchParams).next);
  const user = await getPortalUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <section className="portal-wrap">
      <div className="portal-grid mx-auto max-w-md">
        <div className="portal-grid">
          <p className="eyebrow">Customer portal</p>
          <h1 className="text-4xl">Sign in</h1>
          <p className="portal-muted">
            Manage your restaurant website, billing status, and support requests from one place.
          </p>
        </div>

        <div className="portal-card portal-card--padded">
          <PortalLoginForm nextPath={nextPath} />
        </div>
      </div>
    </section>
  );
}

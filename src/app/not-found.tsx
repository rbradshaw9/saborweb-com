import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="section-v2 section-v2--dark" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="section-v2__inner" style={{ textAlign: 'center', maxWidth: 760 }}>
          <p className="eyebrow">404</p>
          <h1>We could not find that page.</h1>
          <p style={{ color: 'var(--color-sw-muted)', marginTop: 16 }}>
            The link may have moved, or this restaurant preview may not be live yet.
          </p>
          <div className="button-row" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Link className="button button--primary" href="/brief-builder">
              Request a free preview
            </Link>
            <Link className="button button--secondary" href="/">
              Back to Sabor Web
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

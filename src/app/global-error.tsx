'use client';

import { useEffect } from 'react';
import { captureMonitoringException, initSentry } from '@/lib/monitoring/sentry';
import './globals.css';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    initSentry('client');
    captureMonitoringException(error, {
      tags: {
        area: 'global-error',
      },
      extra: {
        digest: error.digest ?? null,
      },
    });
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="admin-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <section className="admin-card" style={{ maxWidth: 520 }}>
            <h1 className="admin-card__title">Something went wrong</h1>
            <p className="admin-muted" style={{ marginTop: 10 }}>
              We captured the error so we can investigate it. Try loading the page again.
            </p>
            <button className="admin-btn admin-btn--primary" onClick={() => unstable_retry()} style={{ marginTop: 16 }}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

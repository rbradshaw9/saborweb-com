'use client';

import { useState } from 'react';
import { captureMonitoringException, initSentry, sentryEnabled } from '@/lib/monitoring/sentry';

export default function SentryExamplePage() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<'client' | 'server' | null>(null);

  const triggerClientError = () => {
    if (!sentryEnabled('client')) {
      setStatus('Sentry is not enabled yet. Add NEXT_PUBLIC_SENTRY_DSN or SENTRY_DSN first.');
      return;
    }

    initSentry('client');
    captureMonitoringException(new Error('SaborWeb Sentry client test error'), {
      tags: {
        area: 'sentry-test',
        runtime: 'client',
      },
      extra: {
        page: '/sentry-example-page',
      },
    });
    setStatus('Client-side test event sent to Sentry.');
  };

  const triggerServerError = async () => {
    setBusy('server');
    setStatus(null);
    try {
      const response = await fetch('/api/sentry-example-api', {
        method: 'POST',
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setStatus(payload?.message ?? `Server test completed with status ${response.status}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Server test request failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="admin-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section className="admin-card" style={{ maxWidth: 720, width: '100%' }}>
        <h1 className="admin-card__title">Sentry Test Page</h1>
        <p className="admin-muted" style={{ marginTop: 10 }}>
          Use this page to send a client-side and server-side test event to Sentry.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
          <button
            className="admin-btn admin-btn--primary"
            onClick={triggerClientError}
            disabled={busy !== null}
          >
            Trigger client test
          </button>
          <button
            className="admin-btn"
            onClick={triggerServerError}
            disabled={busy !== null}
          >
            {busy === 'server' ? 'Sending server test…' : 'Trigger server test'}
          </button>
        </div>

        <div className="admin-card admin-card--subtle" style={{ marginTop: 20 }}>
          <p className="admin-muted" style={{ margin: 0 }}>
            Expected result: you should see two new issues/events in Sentry named
            {' '}
            <code>SaborWeb Sentry client test error</code>
            {' '}
            and
            {' '}
            <code>SaborWeb Sentry server test error</code>.
          </p>
          {status ? (
            <p style={{ marginTop: 14, marginBottom: 0 }}>{status}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

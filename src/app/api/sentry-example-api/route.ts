import { NextResponse } from 'next/server';
import {
  addMonitoringBreadcrumb,
  captureMonitoringException,
  flushMonitoring,
  initSentry,
  sentryEnabled,
} from '@/lib/monitoring/sentry';

export async function POST() {
  if (!sentryEnabled('server')) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Sentry is not enabled yet. Add SENTRY_DSN to your environment first.',
      },
      { status: 503 },
    );
  }

  initSentry('server');

  addMonitoringBreadcrumb({
    category: 'sentry.test',
    message: 'Server-side Sentry test requested',
    data: {
      area: 'sentry-example-api',
    },
  });

  const error = new Error('SaborWeb Sentry server test error');
  captureMonitoringException(error, {
    tags: {
      area: 'sentry-test',
      runtime: 'server',
    },
    extra: {
      route: '/api/sentry-example-api',
    },
  });

  await flushMonitoring(2000);

  return NextResponse.json(
    {
      ok: false,
      message: 'Captured a server-side Sentry test event.',
    },
    { status: 500 },
  );
}

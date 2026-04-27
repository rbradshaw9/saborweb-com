import * as Sentry from '@sentry/nextjs';

type MonitoringLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

declare global {
  var __saborweb_sentry_initialized__: boolean | undefined;
}

function envNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sentryDsn(runtime: 'server' | 'client') {
  if (runtime === 'client') {
    return process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? null;
  }
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? null;
}

function sentryEnvironment() {
  return process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
}

export function sentryEnabled(runtime: 'server' | 'client' = 'server') {
  return Boolean(sentryDsn(runtime));
}

export function initSentry(runtime: 'server' | 'client') {
  if (globalThis.__saborweb_sentry_initialized__) return;

  const dsn = sentryDsn(runtime);
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: sentryEnvironment(),
    release: process.env.SENTRY_RELEASE,
    enabled: true,
    debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true',
    tracesSampleRate: envNumber(process.env.SENTRY_TRACES_SAMPLE_RATE, process.env.NODE_ENV === 'production' ? 0.2 : 1),
    profilesSampleRate: runtime === 'server' ? envNumber(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0) : 0,
    replaysSessionSampleRate: runtime === 'client' ? envNumber(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0) : 0,
    replaysOnErrorSampleRate: runtime === 'client' ? envNumber(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1) : 0,
    sendDefaultPii: false,
  });

  globalThis.__saborweb_sentry_initialized__ = true;
}

export function addMonitoringBreadcrumb(params: {
  category: string;
  message: string;
  level?: MonitoringLevel;
  data?: Record<string, unknown>;
}) {
  if (!globalThis.__saborweb_sentry_initialized__) return;
  Sentry.addBreadcrumb({
    category: params.category,
    message: params.message,
    level: params.level ?? 'info',
    data: params.data,
  });
}

export function captureMonitoringMessage(
  message: string,
  params?: { level?: MonitoringLevel; tags?: Record<string, string>; extra?: Record<string, unknown> },
) {
  if (!globalThis.__saborweb_sentry_initialized__) return;
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(params?.tags ?? {})) scope.setTag(key, value);
    if (params?.extra) scope.setContext('extra', params.extra);
    Sentry.captureMessage(message, params?.level ?? 'info');
  });
}

export function captureMonitoringException(
  error: unknown,
  params?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    contexts?: Record<string, Record<string, unknown>>;
  },
) {
  if (!globalThis.__saborweb_sentry_initialized__) return;
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(params?.tags ?? {})) scope.setTag(key, value);
    if (params?.extra) scope.setContext('extra', params.extra);
    for (const [key, value] of Object.entries(params?.contexts ?? {})) scope.setContext(key, value);
    Sentry.captureException(error);
  });
}

export async function flushMonitoring(timeout = 2000) {
  if (!globalThis.__saborweb_sentry_initialized__) return;
  await Sentry.flush(timeout);
}

export async function withMonitoringSpan<T>(
  params: {
    name: string;
    op: string;
    attributes?: Record<string, string | number | boolean | null | undefined>;
  },
  callback: () => Promise<T>,
) {
  if (!globalThis.__saborweb_sentry_initialized__) return callback();

  const attributes = Object.fromEntries(
    Object.entries(params.attributes ?? {}).filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined>;

  return Sentry.startSpan(
    {
      name: params.name,
      op: params.op,
      attributes,
    },
    callback,
  );
}

import type { Instrumentation } from 'next';
import { captureMonitoringException, flushMonitoring, initSentry } from '@/lib/monitoring/sentry';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initSentry('server');
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  initSentry('server');
  captureMonitoringException(error, {
    tags: {
      area: 'next.request',
      route_type: context.routeType,
      router_kind: context.routerKind,
    },
    contexts: {
      request: {
        path: request.path,
        method: request.method,
      },
      next_context: {
        routePath: context.routePath,
        renderSource: context.renderSource,
        revalidateReason: context.revalidateReason ?? null,
      },
    },
  });
  await flushMonitoring(2000);
};

import { addMonitoringBreadcrumb, initSentry } from '@/lib/monitoring/sentry';

initSentry('client');

export function onRouterTransitionStart(url: string, navigationType: 'push' | 'replace' | 'traverse') {
  addMonitoringBreadcrumb({
    category: 'navigation',
    message: `Navigation started: ${navigationType} ${url}`,
    data: {
      url,
      navigationType,
    },
  });
}

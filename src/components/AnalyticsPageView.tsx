'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';

export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    track(ANALYTICS_EVENTS.PAGE_VIEW, {
      page_path: pathname,
      page_location: typeof window === 'undefined' ? undefined : window.location.href,
      page_title: typeof document === 'undefined' ? undefined : document.title,
    });
  }, [pathname]);

  return null;
}

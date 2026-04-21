'use client';

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsPayloadValue =
  | AnalyticsValue
  | AnalyticsPayloadValue[]
  | { [key: string]: AnalyticsPayloadValue };
type AnalyticsProperties = Record<string, AnalyticsPayloadValue>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  PREVIEW_CTA_CLICKED: 'preview_cta_clicked',
  PACKAGE_SELECTED: 'select_item',
  CHECKOUT_STARTED: 'begin_checkout',
  PURCHASE: 'purchase',
  BRIEF_BUILDER_STARTED: 'brief_builder_started',
  BRIEF_BUILDER_STEP_COMPLETED: 'brief_builder_step_completed',
  BRIEF_BUILDER_RESUMED: 'brief_builder_resumed',
  BRIEF_BUILDER_SUBMITTED: 'brief_builder_submitted',
} as const;

function analyticsEnabled() {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true' && Boolean(process.env.NEXT_PUBLIC_GTM_ID);
}

function cleanProperties(properties: AnalyticsProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export function track(event: string, properties: AnalyticsProperties = {}) {
  if (!analyticsEnabled() || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    ...cleanProperties(properties),
  });
}

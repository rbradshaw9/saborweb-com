import type { ComponentType } from 'react';
import type { RenderLanguage, RenderViewMode } from '@/lib/site-rendering';
import GoodstartSite from './goodstart/Site';

export type GeneratedSiteComponentProps = {
  mode: RenderViewMode;
  lang: RenderLanguage;
  content?: unknown;
};

export type GeneratedSiteComponent = ComponentType<GeneratedSiteComponentProps>;

export const GENERATED_SITE_COMPONENTS: Record<string, GeneratedSiteComponent> = {
  'goodstart': GoodstartSite,
};

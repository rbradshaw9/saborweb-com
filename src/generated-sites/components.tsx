import type { ComponentType } from 'react';
import type { RenderLanguage, RenderViewMode } from '@/lib/site-rendering';

export type GeneratedSiteComponentProps = {
  mode: RenderViewMode;
  lang: RenderLanguage;
};

export type GeneratedSiteComponent = ComponentType<GeneratedSiteComponentProps>;

export const GENERATED_SITE_COMPONENTS: Record<string, GeneratedSiteComponent> = {};

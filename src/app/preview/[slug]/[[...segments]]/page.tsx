import { notFound } from 'next/navigation';
import GeneratedRestaurantSite from '@/components/GeneratedRestaurantSite';
import RestaurantSiteRenderer from '@/components/RestaurantSiteRenderer';
import { generatedSiteLanguage, loadGeneratedSiteManifest } from '@/lib/generated-sites';
import { loadSiteRenderContext, routeLanguage } from '@/lib/site-rendering';

export const dynamic = 'force-dynamic';

export default async function PreviewSitePage({
  params,
}: {
  params: Promise<{ slug: string; segments?: string[] }>;
}) {
  const { slug, segments } = await params;
  const generated = await loadGeneratedSiteManifest(slug);
  if (generated) {
    return <GeneratedRestaurantSite manifest={generated} mode="preview" lang={generatedSiteLanguage(segments)} />;
  }

  const context = await loadSiteRenderContext(slug, 'preview');

  if (!context?.renderPayload) notFound();

  const lang = routeLanguage(segments);
  return <RestaurantSiteRenderer payload={context.renderPayload} mode="preview" lang={lang} />;
}

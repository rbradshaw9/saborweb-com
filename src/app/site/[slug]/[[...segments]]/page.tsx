import { notFound } from 'next/navigation';
import GeneratedRestaurantSite from '@/components/GeneratedRestaurantSite';
import RestaurantSiteRenderer from '@/components/RestaurantSiteRenderer';
import { generatedSiteLanguage, loadGeneratedSiteManifest } from '@/lib/generated-sites';
import { loadSiteRenderContext, routeLanguage } from '@/lib/site-rendering';

export const dynamic = 'force-dynamic';

export default async function PublicRestaurantSitePage({
  params,
}: {
  params: Promise<{ slug: string; segments?: string[] }>;
}) {
  const { slug, segments } = await params;
  const generated = await loadGeneratedSiteManifest(slug);
  if (generated) {
    return <GeneratedRestaurantSite manifest={generated} mode="live" lang={generatedSiteLanguage(segments)} />;
  }

  const context = await loadSiteRenderContext(slug, 'public');

  if (!context?.renderPayload) notFound();

  const lang = routeLanguage(segments);
  return <RestaurantSiteRenderer payload={context.renderPayload} mode={context.mode} lang={lang} />;
}

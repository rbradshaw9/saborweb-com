import { notFound } from 'next/navigation';
import GeneratedRestaurantSite from '@/components/GeneratedRestaurantSite';
import RestaurantSiteRenderer from '@/components/RestaurantSiteRenderer';
import { generatedSiteLanguage, loadGeneratedSiteManifest } from '@/lib/generated-sites';
import { loadSiteRenderContext, routeLanguage } from '@/lib/site-rendering';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function slugForCustomHost(host: string) {
  const normalized = host.toLowerCase().replace(/^www\./, '');
  const supabase = getSupabaseAdmin();
  const domainLookup = await supabase
    .from('custom_domains')
    .select('restaurant_sites(slug)')
    .eq('domain', normalized)
    .in('status', ['verified', 'active'])
    .limit(1)
    .maybeSingle();

  const joined = domainLookup.data as unknown as { restaurant_sites?: { slug?: string } | null } | null;
  if (joined?.restaurant_sites?.slug) return joined.restaurant_sites.slug;

  const metadataLookup = await supabase
    .from('restaurant_sites')
    .select('slug')
    .contains('metadata', { custom_domain: { domain: normalized } })
    .limit(1)
    .maybeSingle();

  return typeof metadataLookup.data?.slug === 'string' ? metadataLookup.data.slug : null;
}

export default async function CustomDomainRestaurantSitePage({
  params,
}: {
  params: Promise<{ host: string; segments?: string[] }>;
}) {
  const { host, segments } = await params;
  const slug = await slugForCustomHost(host);
  if (!slug) notFound();

  const generated = await loadGeneratedSiteManifest(slug);
  if (generated) {
    return <GeneratedRestaurantSite manifest={generated} mode="live" lang={generatedSiteLanguage(segments)} />;
  }

  const context = await loadSiteRenderContext(slug, 'public');
  if (!context?.renderPayload) notFound();

  const lang = routeLanguage(segments);
  return <RestaurantSiteRenderer payload={context.renderPayload} mode={context.mode} lang={lang} />;
}

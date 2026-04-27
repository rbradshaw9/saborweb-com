import { notFound } from 'next/navigation';
import { GENERATED_SITE_COMPONENTS } from '@/generated-sites/components';
import { generatedSiteLanguage } from '@/lib/generated-sites';
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

  const GeneratedSite = GENERATED_SITE_COMPONENTS[slug];
  if (GeneratedSite) {
    return <GeneratedSite mode="live" lang={generatedSiteLanguage(segments)} />;
  }

  notFound();
}

import { notFound } from 'next/navigation';
import { GENERATED_SITE_COMPONENTS } from '@/generated-sites/components';
import { generatedSiteLanguage } from '@/lib/generated-sites';

export const dynamic = 'force-dynamic';

export default async function PublicRestaurantSitePage({
  params,
}: {
  params: Promise<{ slug: string; segments?: string[] }>;
}) {
  const { slug, segments } = await params;
  const GeneratedSite = GENERATED_SITE_COMPONENTS[slug];
  if (GeneratedSite) {
    return <GeneratedSite mode="live" lang={generatedSiteLanguage(segments)} />;
  }

  notFound();
}

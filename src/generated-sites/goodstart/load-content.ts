import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GOODSTART_DEFAULT_CONTENT } from './default-content';
import { normalizeGoodstartContent, type GoodstartContent } from './content';

type SiteManifestRow = {
  generated_site_manifest?: unknown;
};

function manifestContent(manifest: unknown) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return manifest;
  const record = manifest as Record<string, unknown>;
  return record.goodstartContent ?? record.content ?? record;
}

export async function loadGoodstartContent(slug: string): Promise<GoodstartContent> {
  if (slug !== 'goodstart') return GOODSTART_DEFAULT_CONTENT;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('restaurant_sites')
      .select('generated_site_manifest')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const row = data as SiteManifestRow | null;
    return normalizeGoodstartContent(manifestContent(row?.generated_site_manifest), GOODSTART_DEFAULT_CONTENT);
  } catch (error) {
    console.warn('[Goodstart] Falling back to default content.', error);
    return GOODSTART_DEFAULT_CONTENT;
  }
}

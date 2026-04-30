'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { GOODSTART_DEFAULT_CONTENT } from '@/generated-sites/goodstart/default-content';
import { normalizeGoodstartContent, type GoodstartRestaurant } from '@/generated-sites/goodstart/content';
import { requirePortalUser, assertOwnsRestaurant } from '@/lib/portal/auth';
import { recordPortalChangeRequest } from '@/lib/portal/change-requests';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function formString(formData: FormData, key: keyof GoodstartRestaurant) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalUrl(value: string, fallback: string) {
  if (!value) return fallback;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function phoneHrefFromDisplay(value: string, fallback: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`;
  if (digits.length > 7) return `tel:+${digits}`;
  return fallback;
}

function manifestContent(manifest: unknown) {
  const record = asRecord(manifest);
  return record.goodstartContent ?? record.content ?? record;
}

function cleanRestaurant(formData: FormData, fallback: GoodstartRestaurant): GoodstartRestaurant | null {
  const phone = formString(formData, 'phone') || fallback.phone;
  const mapsUrl = optionalUrl(formString(formData, 'mapsUrl'), fallback.mapsUrl);
  const facebookUrl = optionalUrl(formString(formData, 'facebookUrl'), fallback.facebookUrl);
  const instagramUrl = optionalUrl(formString(formData, 'instagramUrl'), fallback.instagramUrl);

  if (!mapsUrl || !facebookUrl || !instagramUrl) return null;

  return {
    name: formString(formData, 'name') || fallback.name,
    alternateName: formString(formData, 'alternateName') || fallback.alternateName,
    cuisine: formString(formData, 'cuisine') || fallback.cuisine,
    address: formString(formData, 'address') || fallback.address,
    streetAddress: formString(formData, 'streetAddress') || fallback.streetAddress,
    locality: formString(formData, 'locality') || fallback.locality,
    postalCode: formString(formData, 'postalCode') || fallback.postalCode,
    region: formString(formData, 'region') || fallback.region,
    country: formString(formData, 'country') || fallback.country,
    phone,
    phoneHref: phoneHrefFromDisplay(phone, fallback.phoneHref),
    mapsUrl,
    facebookUrl,
    instagramUrl,
  };
}

export async function updateGoodstartBasics(formData: FormData) {
  const slug = formData.get('slug');
  if (slug !== 'goodstart') redirect('/portal/sites?error=unsupported-editor');

  const user = await requirePortalUser('/portal/sites/goodstart/settings');
  const access = await assertOwnsRestaurant(user.id, slug, { access: 'edit' });

  const supabase = getSupabaseAdmin();
  const { data: site, error: siteError } = await supabase
    .from('restaurant_sites')
    .select('id, generated_site_manifest')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();

  if (siteError || !site) redirect('/portal/sites/goodstart/settings?error=load-failed');

  const currentManifest = asRecord(site.generated_site_manifest);
  const currentContent = normalizeGoodstartContent(manifestContent(currentManifest), GOODSTART_DEFAULT_CONTENT);
  const restaurant = cleanRestaurant(formData, currentContent.restaurant);
  if (!restaurant) redirect('/portal/sites/goodstart/settings?error=invalid-url');

  const nextContent = {
    ...currentContent,
    restaurant,
    updatedAt: new Date().toISOString(),
    source: 'portal-basics-editor',
  };

  const nextManifest = {
    ...currentManifest,
    goodstartContent: nextContent,
  };

  const { error: updateError } = await supabase
    .from('restaurant_sites')
    .update({
      restaurant_name: restaurant.name,
      city: restaurant.locality,
      generated_site_manifest: nextManifest,
    })
    .eq('id', site.id);

  if (updateError) redirect('/portal/sites/goodstart/settings?error=save-failed');

  await recordPortalChangeRequest({
    access,
    requestType: 'copy',
    title: 'Restaurant basics updated',
    description: 'Owner-edited restaurant basics were published from the customer portal.',
    payload: {
      editor: 'basics',
      fields: Object.keys(restaurant),
    },
  });

  revalidatePath('/portal/sites/goodstart');
  revalidatePath('/portal/sites/goodstart/settings');
  revalidatePath('/site/goodstart');
  revalidatePath('/preview/goodstart');
  redirect('/portal/sites/goodstart/settings?saved=1');
}

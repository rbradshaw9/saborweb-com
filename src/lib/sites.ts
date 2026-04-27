import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type RestaurantSite = {
  id: string;
  request_id: string | null;
  slug: string;
  restaurant_name: string;
  city: string | null;
  preview_type: 'native' | 'external';
  preview_url: string;
  external_preview_url: string | null;
  claim_url: string;
  staging_url: string | null;
  live_url: string | null;
  status: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_status: string;
  payment_status: string;
  selected_package: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  claimed_at: string | null;
  paid_at: string | null;
  launched_at: string | null;
};

export function siteHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

export function sitePreviewHref(site: Pick<RestaurantSite, 'live_url' | 'staging_url' | 'external_preview_url' | 'preview_url'>) {
  return siteHref(site.live_url ?? site.staging_url ?? site.external_preview_url ?? site.preview_url);
}

export async function getRestaurantSiteBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('restaurant_sites')
    .select(
      [
        'id',
        'request_id',
        'slug',
        'restaurant_name',
        'city',
        'preview_type',
        'preview_url',
        'external_preview_url',
        'claim_url',
        'staging_url',
        'live_url',
        'status',
        'owner_name',
        'owner_email',
        'owner_phone',
        'owner_status',
        'payment_status',
        'selected_package',
        'stripe_customer_id',
        'stripe_subscription_id',
        'stripe_checkout_session_id',
        'claimed_at',
        'paid_at',
        'launched_at',
      ].join(', ')
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[Restaurant Sites] Lookup failed:', error);
    throw new Error('Could not load restaurant site.');
  }

  return (data as RestaurantSite | null) ?? null;
}

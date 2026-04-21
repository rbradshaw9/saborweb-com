'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin/auth';
import { logSiteEvent } from '@/lib/site-events';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const SITE_STATUSES = new Set([
  'draft',
  'preview_building',
  'preview_ready',
  'claim_started',
  'claimed',
  'paid',
  'live',
  'archived',
]);

const OWNER_STATUSES = new Set(['unclaimed', 'claim_started', 'claimed']);
const PAYMENT_STATUSES = new Set(['unpaid', 'checkout_started', 'paid', 'failed', 'refunded', 'cancelled']);
const PACKAGE_KEYS = new Set(['presencia', 'visibilidad', 'crecimiento']);

function readAllowed(formData: FormData, key: string, allowed: Set<string>) {
  const value = String(formData.get(key) ?? '');
  return allowed.has(value) ? value : null;
}

export async function updateSiteStatus(slug: string, formData: FormData) {
  const user = await requireAdminUser();
  const status = readAllowed(formData, 'status', SITE_STATUSES);
  const ownerStatus = readAllowed(formData, 'owner_status', OWNER_STATUSES);
  const paymentStatus = readAllowed(formData, 'payment_status', PAYMENT_STATUSES);
  const selectedPackage = readAllowed(formData, 'selected_package', PACKAGE_KEYS);

  if (!status || !ownerStatus || !paymentStatus) {
    throw new Error('Invalid site status update.');
  }

  const supabase = getSupabaseAdmin();
  const { data: site, error: lookupError } = await supabase
    .from('restaurant_sites')
    .select('id, request_id')
    .eq('slug', slug)
    .single();

  if (lookupError || !site) {
    console.error('[Admin Site] Status lookup failed:', lookupError);
    throw new Error('Could not find site.');
  }

  const { error } = await supabase
    .from('restaurant_sites')
    .update({
      status,
      owner_status: ownerStatus,
      payment_status: paymentStatus,
      selected_package: selectedPackage,
    })
    .eq('id', site.id);

  if (error) {
    console.error('[Admin Site] Status update failed:', error);
    throw new Error('Could not update site status.');
  }

  await logSiteEvent({
    eventType: 'admin_site_status_updated',
    siteId: site.id,
    requestId: site.request_id,
    actorType: 'admin',
    actorId: user.id,
    message: `Admin updated ${slug} status`,
    metadata: {
      status,
      owner_status: ownerStatus,
      payment_status: paymentStatus,
      selected_package: selectedPackage,
      admin_email: user.email,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/sites/${slug}`);
}

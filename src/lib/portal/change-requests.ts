import 'server-only';

import type { PortalRestaurantAccess } from '@/lib/portal/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type PortalChangeRequestType = 'menu_hours' | 'copy' | 'photo' | 'layout' | 'seo' | 'integration' | 'support';

export async function recordPortalChangeRequest({
  access,
  requestType,
  title,
  description,
  payload,
}: {
  access: PortalRestaurantAccess;
  requestType: PortalChangeRequestType;
  title: string;
  description: string;
  payload: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('change_requests').insert({
    site_id: access.site.id,
    customer_account_id: access.customer.id,
    request_type: requestType,
    title,
    description,
    submitted_payload: {
      source: 'portal-editor',
      siteSlug: access.site.slug,
      membershipRole: access.membership.role,
      ...payload,
    },
    metadata: {
      submittedByEmail: access.customer.email,
      restaurantName: access.site.restaurantName,
    },
  });

  if (error) {
    console.warn('[portal:audit] Failed to record portal change request.', error);
  }
}

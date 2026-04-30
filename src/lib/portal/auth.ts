import 'server-only';

import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const PORTAL_AUTH_TIMEOUT_MS = 2500;

export type PortalRole = 'owner' | 'manager' | 'viewer';
export type PortalAccess = 'read' | 'edit';

export type PortalCustomerAccount = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  status: 'active' | 'limited' | 'disabled';
};

export type PortalMembership = {
  id: string;
  siteId: string;
  customerAccountId: string;
  role: PortalRole;
  status: 'invited' | 'active' | 'removed';
};

export type PortalSiteSummary = {
  id: string;
  slug: string;
  restaurantName: string;
  city: string | null;
  status: string;
  ownerStatus: string;
  paymentStatus: string;
  selectedPackage: string | null;
  previewUrl: string;
  liveUrl: string | null;
  stripeCustomerId: string | null;
  updatedAt: string;
  role: PortalRole;
};

export type PortalRestaurantAccess = {
  customer: PortalCustomerAccount;
  membership: PortalMembership;
  site: PortalSiteSummary;
};

export class PortalAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'forbidden',
    public readonly status = code === 'not_found' ? 404 : 403,
  ) {
    super(message);
    this.name = 'PortalAuthorizationError';
  }
}

async function getUserWithTimeout<T>(task: Promise<T>, timeoutMs: number) {
  return await Promise.race([
    task,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

function portalLoginHref(nextPath = '/portal/sites') {
  return `/portal/login?next=${encodeURIComponent(nextPath)}`;
}

function hasEditAccess(role: PortalRole) {
  return role === 'owner' || role === 'manager';
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapSiteSummary(site: Record<string, unknown>, role: PortalRole): PortalSiteSummary {
  return {
    id: String(site.id),
    slug: String(site.slug),
    restaurantName: String(site.restaurant_name),
    city: typeof site.city === 'string' ? site.city : null,
    status: String(site.status),
    ownerStatus: String(site.owner_status),
    paymentStatus: String(site.payment_status),
    selectedPackage: typeof site.selected_package === 'string' ? site.selected_package : null,
    previewUrl: String(site.preview_url),
    liveUrl: typeof site.live_url === 'string' ? site.live_url : null,
    stripeCustomerId: typeof site.stripe_customer_id === 'string' ? site.stripe_customer_id : null,
    updatedAt: String(site.updated_at),
    role,
  };
}

export async function getPortalUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await getUserWithTimeout(supabase.auth.getUser(), PORTAL_AUTH_TIMEOUT_MS);
    if (!result || typeof result !== 'object' || !('data' in result)) return null;

    const {
      data: { user },
      error,
    } = result as Awaited<ReturnType<typeof supabase.auth.getUser>>;

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requirePortalUser(nextPath = '/portal/sites') {
  const user = await getPortalUser();
  if (!user) redirect(portalLoginHref(nextPath));
  return user;
}

export function safePortalNextPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith('/portal') || candidate.startsWith('/portal/login')) {
    return '/portal/sites';
  }
  return candidate;
}

export async function getPortalCustomer(userId: string): Promise<PortalCustomerAccount | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('customer_accounts')
    .select('id, email, name, phone, status')
    .eq('auth_user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: String(data.id),
    email: String(data.email),
    name: typeof data.name === 'string' ? data.name : null,
    phone: typeof data.phone === 'string' ? data.phone : null,
    status: data.status as PortalCustomerAccount['status'],
  };
}

export async function listPortalSites(userId: string): Promise<PortalSiteSummary[]> {
  const customer = await getPortalCustomer(userId);
  if (!customer) return [];

  const supabase = getSupabaseAdmin();
  const { data: membershipRows, error: membershipError } = await supabase
    .from('project_memberships')
    .select('id, site_id, customer_account_id, role, status')
    .eq('customer_account_id', customer.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (membershipError) throw membershipError;
  const memberships = (membershipRows ?? []) as Array<Record<string, unknown>>;
  if (!memberships.length) return [];

  const roleBySiteId = new Map<string, PortalRole>();
  const siteIds = memberships.map((row) => {
    const siteId = String(row.site_id);
    roleBySiteId.set(siteId, row.role as PortalRole);
    return siteId;
  });

  const { data: siteRows, error: siteError } = await supabase
    .from('restaurant_sites')
    .select('id, slug, restaurant_name, city, status, owner_status, payment_status, selected_package, preview_url, live_url, stripe_customer_id, updated_at')
    .in('id', siteIds)
    .order('updated_at', { ascending: false });

  if (siteError) throw siteError;

  return ((siteRows ?? []) as Array<Record<string, unknown>>).map((site) =>
    mapSiteSummary(site, roleBySiteId.get(String(site.id)) ?? 'viewer'),
  );
}

export async function assertOwnsRestaurant(
  userId: string,
  slugOrSiteId: string,
  options: { access?: PortalAccess } = {},
): Promise<PortalRestaurantAccess> {
  const access = options.access ?? 'read';
  const customer = await getPortalCustomer(userId);
  if (!customer) {
    throw new PortalAuthorizationError('Customer account not found.', 'forbidden');
  }

  const supabase = getSupabaseAdmin();
  const siteQuery = supabase
    .from('restaurant_sites')
    .select('id, slug, restaurant_name, city, status, owner_status, payment_status, selected_package, preview_url, live_url, stripe_customer_id, updated_at')
    .limit(1);

  const { data: siteRow, error: siteError } = isUuid(slugOrSiteId)
    ? await siteQuery.eq('id', slugOrSiteId).maybeSingle()
    : await siteQuery.eq('slug', slugOrSiteId).maybeSingle();

  if (siteError) throw siteError;
  if (!siteRow) {
    throw new PortalAuthorizationError('Restaurant site not found.', 'not_found');
  }

  const { data: membershipRow, error: membershipError } = await supabase
    .from('project_memberships')
    .select('id, site_id, customer_account_id, role, status')
    .eq('site_id', siteRow.id)
    .eq('customer_account_id', customer.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membershipRow) {
    throw new PortalAuthorizationError('You do not have access to this restaurant.', 'forbidden');
  }

  const membership: PortalMembership = {
    id: String(membershipRow.id),
    siteId: String(membershipRow.site_id),
    customerAccountId: String(membershipRow.customer_account_id),
    role: membershipRow.role as PortalRole,
    status: membershipRow.status as PortalMembership['status'],
  };

  if (access === 'edit' && !hasEditAccess(membership.role)) {
    throw new PortalAuthorizationError('You do not have permission to edit this restaurant.', 'forbidden');
  }

  return {
    customer,
    membership,
    site: mapSiteSummary(siteRow as Record<string, unknown>, membership.role),
  };
}

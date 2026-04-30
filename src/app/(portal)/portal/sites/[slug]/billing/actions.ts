'use server';

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function cleanOrigin(value: string | undefined) {
  if (!value) return null;

  const withProtocol = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return null;
  }
}

function isAllowedPortalHost(host: string) {
  const hostname = host.split(':')[0]?.toLowerCase();
  return Boolean(
    hostname === 'app.saborweb.com' ||
      hostname === 'saborweb.com' ||
      hostname === 'www.saborweb.com' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname?.endsWith('.vercel.app'),
  );
}

async function getPortalReturnUrl(slug: string) {
  const configuredPortalOrigin = cleanOrigin(process.env.NEXT_PUBLIC_PORTAL_URL);
  if (configuredPortalOrigin) return `${configuredPortalOrigin}/portal/sites/${slug}/billing`;

  const headersList = await headers();
  const forwardedHost = headersList.get('x-forwarded-host') ?? headersList.get('host');
  if (forwardedHost && isAllowedPortalHost(forwardedHost)) {
    const forwardedProto = headersList.get('x-forwarded-proto') ?? (forwardedHost.startsWith('localhost') ? 'http' : 'https');
    return `${forwardedProto}://${forwardedHost}/portal/sites/${slug}/billing`;
  }

  const siteOrigin = cleanOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? 'https://saborweb.com';
  return `${siteOrigin}/portal/sites/${slug}/billing`;
}

export async function createStripeBillingPortalSession(formData: FormData) {
  const slug = formString(formData, 'slug');
  if (!slug) redirect('/portal/sites?error=missing-site');

  const user = await requirePortalUser(`/portal/sites/${slug}/billing`);
  const access = await assertOwnsRestaurant(user.id, slug);

  if (access.membership.role !== 'owner') {
    redirect(`/portal/sites/${slug}/billing?error=owner-required`);
  }

  if (!access.site.stripeCustomerId) {
    redirect(`/portal/sites/${slug}/billing?error=missing-customer`);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    redirect(`/portal/sites/${slug}/billing?error=stripe-not-configured`);
  }

  let sessionUrl: string | null = null;
  let errorCode: string | null = null;

  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2026-03-25.dahlia',
    });
    const session = await stripe.billingPortal.sessions.create({
      customer: access.site.stripeCustomerId,
      return_url: await getPortalReturnUrl(slug),
    });
    sessionUrl = session.url;
  } catch (error) {
    errorCode = 'portal-unavailable';
    console.error('[portal:billing] Failed to create Stripe Customer Portal session.', error);
  }

  if (!sessionUrl) redirect(`/portal/sites/${slug}/billing?error=${errorCode ?? 'portal-unavailable'}`);
  redirect(sessionUrl);
}

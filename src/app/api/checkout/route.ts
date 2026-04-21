import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDomainSetupAddonPrice, getServicePackage, getStripePrices } from '@/lib/packages';
import type { PackageKey } from '@/lib/packages';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getGaClientId(req: NextRequest) {
  const cookieValue = req.cookies.get('_ga')?.value;
  if (!cookieValue) return '';

  const parts = cookieValue.split('.');
  if (parts.length < 4) return '';

  return parts.slice(-2).join('.');
}

export async function GET(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  const pkgKey = req.nextUrl.searchParams.get('pkg')?.toLowerCase() ?? null;
  const pkg = getServicePackage(pkgKey);

  if (!pkg) {
    return NextResponse.json(
      { error: 'Invalid package. Use pkg=presencia, visibilidad, or crecimiento.' },
      { status: 400 }
    );
  }

  let prices: { setupPrice: string; monthlyPrice: string };
  try {
    prices = getStripePrices(pkg.key as PackageKey);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin).replace(/\/$/, '');
  const clientSlug =
    req.nextUrl.searchParams.get('client_slug') ??
    req.nextUrl.searchParams.get('client') ??
    'unknown';
  const previewRequestId = req.nextUrl.searchParams.get('request_id') ?? '';
  const siteId = req.nextUrl.searchParams.get('site_id') ?? '';
  const gaClientId = getGaClientId(req);
  const includeDomainAddon = pkg.key === 'presencia' && req.nextUrl.searchParams.get('domain_addon') === '1';
  const domainAddonPrice = includeDomainAddon ? getDomainSetupAddonPrice() : null;

  if (siteId || clientSlug !== 'unknown') {
    const supabase = getSupabaseAdmin();
    const checkoutPatch = {
      status: 'claim_started',
      owner_status: 'claim_started',
      payment_status: 'checkout_started',
      selected_package: pkg.key,
    };
    const query = siteId
      ? supabase.from('restaurant_sites').update(checkoutPatch).eq('id', siteId)
      : supabase.from('restaurant_sites').update(checkoutPatch).eq('slug', clientSlug);
    const { error } = await query;
    if (error) {
      console.error('[Checkout] Site checkout status update failed:', error);
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: prices.setupPrice, quantity: 1 },
        ...(domainAddonPrice ? [{ price: domainAddonPrice, quantity: 1 }] : []),
        { price: prices.monthlyPrice, quantity: 1 },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          package: pkg.key,
          package_name: pkg.name,
          client_slug: clientSlug,
          preview_request_id: previewRequestId,
          site_id: siteId,
          ga_client_id: gaClientId,
          domain_addon: includeDomainAddon ? 'true' : 'false',
        },
      },
      client_reference_id: siteId || previewRequestId || clientSlug,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      success_url: `${origin}/thank-you?pkg=${pkg.key}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: clientSlug !== 'unknown' ? `${origin}/claim/${clientSlug}` : `${origin}/services`,
      custom_text: {
        submit: {
          message: 'Setup is charged today. Monthly service begins 30 days after checkout.',
        },
      },
      metadata: {
        package: pkg.key,
        package_name: pkg.name,
        client_slug: clientSlug,
        preview_request_id: previewRequestId,
        site_id: siteId,
        ga_client_id: gaClientId,
        domain_addon: includeDomainAddon ? 'true' : 'false',
      },
    });

    return NextResponse.redirect(session.url ?? `${origin}/services`, 303);
  } catch (error) {
    console.error('[Checkout Error]', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

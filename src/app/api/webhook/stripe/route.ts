import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getServicePackage } from '@/lib/packages';

function getClientProjects() {
  const raw = process.env.VERCEL_CLIENT_PROJECTS_JSON;
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
  } catch {
    return {};
  }
}

function getProjectId(clientSlug: string) {
  const normalized = clientSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return process.env[`VERCEL_PROJECT_${normalized}`] ?? getClientProjects()[clientSlug] ?? null;
}

function getDeployHook(clientSlug: string) {
  const normalized = clientSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return process.env[`DEPLOY_HOOK_${normalized}`] ?? null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function cleanGa4Params(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function getStripeObjectId(value: string | { id?: string } | null) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.id;
}

function getGa4ClientId(session: Stripe.Checkout.Session) {
  return session.metadata?.ga_client_id || `stripe.${session.id}`;
}

async function vercelRequest(path: string, method: string, body?: object) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new Error('Missing VERCEL_API_TOKEN');

  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Vercel API error: ${JSON.stringify(data)}`);
  return data;
}

async function disablePreviewMode(projectId: string) {
  await vercelRequest(`/v10/projects/${projectId}/env?upsert=true`, 'POST', {
    key: 'NEXT_PUBLIC_PREVIEW_MODE',
    value: 'false',
    type: 'plain',
    target: ['production', 'preview'],
    comment: 'Auto-disabled by Sabor Web payment webhook',
  });
}

async function triggerRedeploy(deployHookUrl: string) {
  const res = await fetch(deployHookUrl, { method: 'POST' });
  if (!res.ok) throw new Error(`Deploy hook failed: ${res.status}`);
}

async function sendPaymentEmail(session: Stripe.Checkout.Session, clientSlug: string, packageName: string, autoLive: boolean) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'N/A';
  const customerEmail = session.customer_details?.email ?? 'N/A';

  await resend.emails.send({
    from: 'Sabor Web Payments <noreply@saborweb.com>',
    to: [notifyEmail],
    subject: `New client payment - ${clientSlug} - ${packageName}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px;color:#17130f">
        <h2 style="color:#ba4f32;margin:0 0 8px">New payment received</h2>
        <p style="color:#756b63;margin:0 0 24px">Sabor Web Stripe webhook</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#756b63;width:150px">Client</td><td>${clientSlug}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Plan</td><td>${packageName}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Amount</td><td>${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Customer</td><td>${customerEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#756b63">Auto go-live</td><td>${autoLive ? 'Triggered' : 'Not configured'}</td></tr>
        </table>
      </div>
    `,
  });
}

async function sendGa4PurchaseEvent(session: Stripe.Checkout.Session) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const packageKey = session.metadata?.package ?? '';
  const servicePackage = getServicePackage(packageKey);
  const packageName = session.metadata?.package_name ?? servicePackage?.name ?? 'Unknown';
  const currency = session.currency?.toUpperCase() ?? 'USD';
  const value = session.amount_total ? session.amount_total / 100 : servicePackage?.setup ?? 0;
  const customerId = getStripeObjectId(session.customer);

  const params = cleanGa4Params({
    transaction_id: session.id,
    affiliation: 'Stripe Checkout',
    currency,
    value,
    engagement_time_msec: 1,
    package_key: packageKey,
    package_name: packageName,
    setup_fee: servicePackage?.setup,
    monthly_value: servicePackage?.monthly,
    client_slug: session.metadata?.client_slug ?? session.metadata?.client,
    preview_request_id: session.metadata?.preview_request_id,
    site_id: session.metadata?.site_id,
    payment_type: 'setup_now_subscription_after_30_days',
    items: [
      cleanGa4Params({
        item_id: packageKey || session.id,
        item_name: packageName,
        item_category: 'service_plan',
        price: value,
        quantity: 1,
      }),
    ],
  });

  const url = new URL('https://www.google-analytics.com/mp/collect');
  url.searchParams.set('measurement_id', measurementId);
  url.searchParams.set('api_secret', apiSecret);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: getGa4ClientId(session),
      user_id: customerId || undefined,
      events: [{ name: 'purchase', params }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GA4 Measurement Protocol error ${res.status}: ${detail}`);
  }
}

async function markRestaurantSiteClaimed(session: Stripe.Checkout.Session) {
  const siteId = session.metadata?.site_id ?? '';
  const clientSlug = session.metadata?.client_slug ?? session.metadata?.client ?? '';
  if (!siteId && !clientSlug) return;

  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

  const patch = {
    status: 'paid',
    owner_status: 'claimed',
    payment_status: 'paid',
    selected_package: session.metadata?.package ?? null,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_checkout_session_id: session.id,
    claimed_at: new Date().toISOString(),
    paid_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  const query = siteId
    ? supabase.from('restaurant_sites').update(patch).eq('id', siteId)
    : supabase.from('restaurant_sites').update(patch).eq('slug', clientSlug);
  const { error } = await query;

  if (error) {
    console.error('[Webhook] Failed to mark restaurant site claimed:', error);
  }
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', getErrorMessage(error));
    return NextResponse.json({ error: `Webhook Error: ${getErrorMessage(error)}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const packageName = session.metadata?.package_name ?? 'Unknown';
    const clientSlug = session.metadata?.client_slug ?? session.metadata?.client ?? 'unknown';
    const projectId = clientSlug !== 'unknown' ? getProjectId(clientSlug) : null;
    const deployHookUrl = clientSlug !== 'unknown' ? getDeployHook(clientSlug) : null;

    let autoLive = false;

    await markRestaurantSiteClaimed(session);

    try {
      await sendGa4PurchaseEvent(session);
    } catch (error) {
      console.error('[Webhook] GA4 purchase tracking failed:', error);
    }

    if (projectId) {
      try {
        await disablePreviewMode(projectId);
        autoLive = true;
      } catch (error) {
        console.error(`[Webhook] Failed to update Vercel env for ${clientSlug}:`, error);
      }

      if (deployHookUrl) {
        try {
          await triggerRedeploy(deployHookUrl);
        } catch (error) {
          console.error(`[Webhook] Redeploy failed for ${clientSlug}:`, error);
        }
      }
    }

    try {
      await sendPaymentEmail(session, clientSlug, packageName, autoLive);
    } catch (error) {
      console.error('[Webhook] Email failed:', error);
    }
  }

  return NextResponse.json({ received: true });
}

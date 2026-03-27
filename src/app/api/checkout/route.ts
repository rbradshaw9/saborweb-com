import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

/*
  Billing model:
    - Day 0:   Customer pays the one-time setup fee (e.g. $597 for Presencia).
    - Day 30+: Monthly subscription begins ($97/month). This is driven by
               trial_period_days: 30 in subscription_data below.

  Stripe checkout shows:
    "Website Build — Presencia"   $597.00   (due today)
    "Monthly Plan — Presencia"    $97.00/month   starting [date]
    ────────────────────────────────────────
    Due today                     $597.00
*/
const PACKAGES: Record<string, { setupPrice: string; monthlyPrice: string; name: string }> = {
  presencia: {
    setupPrice:   'price_1TFHY8IhTLSI9ce8OyHA3E41',  // Website Build — Presencia    $597 one-time
    monthlyPrice: 'price_1TFHY9IhTLSI9ce8dNcKm4Wm',  // Monthly Plan — Presencia     $97/mo
    name: 'Presencia',
  },
  visibilidad: {
    setupPrice:   'price_1TFHY9IhTLSI9ce8wGs7otlx',  // Website Build — Visibilidad  $897 one-time
    monthlyPrice: 'price_1TFHYAIhTLSI9ce8PxXfDPRk',  // Monthly Plan — Visibilidad   $247/mo
    name: 'Visibilidad',
  },
  crecimiento: {
    setupPrice:   'price_1TFHYAIhTLSI9ce8QoRIAuiM',  // Website Build — Crecimiento  $1,247 one-time
    monthlyPrice: 'price_1TFHYBIhTLSI9ce89Z8NKQDU',  // Monthly Plan — Crecimiento   $597/mo
    name: 'Crecimiento',
  },
};


export async function GET(req: NextRequest) {
  const pkg = req.nextUrl.searchParams.get('pkg')?.toLowerCase();

  if (!pkg || !PACKAGES[pkg]) {
    return NextResponse.json({ error: 'Invalid package. Use pkg=presencia, visibilidad, or crecimiento.' }, { status: 400 });
  }

  const { setupPrice, monthlyPrice, name } = PACKAGES[pkg];
  const origin = req.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: setupPrice,   quantity: 1 },  // one-time setup fee — billed on first invoice only
        { price: monthlyPrice, quantity: 1 },  // recurring monthly subscription
      ],
      subscription_data: {
        // Monthly subscription doesn't bill until 30 days after setup fee is paid.
        // The customer sees "Due today: $[setup]" and "Starting [date+30]" for the monthly.
        trial_period_days: 30,
        metadata: { package: pkg, package_name: name },
      },
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      success_url: `${origin}/thank-you?pkg=${pkg}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/services`,
      metadata: { package: pkg, package_name: name },
    });

    return NextResponse.redirect(session.url!, 303);
  } catch (err) {
    console.error('[Checkout Error]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create checkout session', detail: message }, { status: 500 });
  }
}

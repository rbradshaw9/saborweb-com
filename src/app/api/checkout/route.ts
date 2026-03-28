import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripe is initialized inside the handler to avoid module-level crash
// when STRIPE_SECRET_KEY is not set at build time.

/*
  Billing model:
    - Day 0:   Customer pays the one-time setup fee (e.g. $597 for Cornerstone).
    - Day 30+: Monthly subscription begins ($97/month). This is driven by
               trial_period_days: 30 in subscription_data below.

  Stripe checkout shows:
    "Website Build — Cornerstone"   $597.00   (due today)
    "Monthly Plan — Cornerstone"    $97.00/month   starting [date]
    ────────────────────────────────────────
    Due today                     $597.00
*/
const PACKAGES: Record<string, { setupPrice: string; monthlyPrice: string; name: string }> = {
  presencia: {
    setupPrice:   'price_1TFHY8IhTLSI9ce8OyHA3E41',  // Website Build — Cornerstone  $597 one-time
    monthlyPrice: 'price_1TFHY9IhTLSI9ce8dNcKm4Wm',  // Monthly Plan — Cornerstone   $97/mo
    name: 'Cornerstone',
  },
  visibilidad: {
    setupPrice:   'price_1TFHY9IhTLSI9ce8wGs7otlx',  // Website Build — Spotlight    $897 one-time
    monthlyPrice: 'price_1TFHYAIhTLSI9ce8PxXfDPRk',  // Monthly Plan — Spotlight     $247/mo
    name: 'Spotlight',
  },
  crecimiento: {
    setupPrice:   'price_1TFHYAIhTLSI9ce8QoRIAuiM',  // Website Build — Full House   $1,247 one-time
    monthlyPrice: 'price_1TFHYBIhTLSI9ce89Z8NKQDU',  // Monthly Plan — Full House    $597/mo
    name: 'Full House',
  },
};


export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const pkg = req.nextUrl.searchParams.get('pkg')?.toLowerCase();
  const client = req.nextUrl.searchParams.get('client') ?? 'unknown';

  if (!pkg || !PACKAGES[pkg]) {
    return NextResponse.json({ error: 'Invalid package. Use pkg=presencia, visibilidad, or crecimiento.' }, { status: 400 });
  }

  const { setupPrice, monthlyPrice, name } = PACKAGES[pkg];
  const origin = 'https://saborweb.com';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: setupPrice,   quantity: 1 },
        { price: monthlyPrice, quantity: 1 },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: { package: pkg, package_name: name, client },
      },
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      success_url: `${origin}/thank-you?pkg=${pkg}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/services`,
      metadata: { package: pkg, package_name: name, client },
    });

    return NextResponse.redirect(session.url!, 303);
  } catch (err: any) {
    console.error('[Checkout Error]', JSON.stringify({
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      message: err?.message,
      raw: err?.raw,
    }));
    return NextResponse.json({
      error: 'Failed to create checkout session',
      detail: err?.message,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
    }, { status: 500 });
  }
}

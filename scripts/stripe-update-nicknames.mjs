#!/usr/bin/env node
/**
 * Updates price nicknames in the Sabor Web Stripe account so checkout clearly
 * shows "Monthly Subscription" vs "One-time Setup Fee".
 * Run: node scripts/stripe-update-nicknames.mjs
 */

import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  { apiVersion: '2026-03-25.dahlia' }
);

const UPDATES = [
  // Presencia
  { id: 'price_1TFH8dIhTLSI9ce8A8fu4RcS', nickname: 'Presencia – One-time Setup Fee' },
  { id: 'price_1TFH8dIhTLSI9ce8avGZ9q6P', nickname: 'Presencia – Monthly Hosting & Support' },
  // Visibilidad
  { id: 'price_1TFH8eIhTLSI9ce8X0UNj0lv', nickname: 'Visibilidad – One-time Setup Fee' },
  { id: 'price_1TFH8eIhTLSI9ce8heXcuY2a', nickname: 'Visibilidad – Monthly Hosting & Marketing' },
  // Crecimiento
  { id: 'price_1TFH8fIhTLSI9ce8eTmKoybS', nickname: 'Crecimiento – One-time Setup Fee' },
  { id: 'price_1TFH8fIhTLSI9ce8jUgfM492', nickname: 'Crecimiento – Monthly Full-Service Plan' },
];

console.log('\n🏷️  Updating Stripe price nicknames…\n');

for (const { id, nickname } of UPDATES) {
  await stripe.prices.update(id, { nickname });
  console.log(`  ✓ ${id} → "${nickname}"`);
}

console.log('\n✅ Done. Stripe checkout will now show clear monthly/setup labels.\n');

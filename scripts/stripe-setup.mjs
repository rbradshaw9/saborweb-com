#!/usr/bin/env node
/**
 * One-time setup: creates Sabor Web products + prices in the new Stripe account.
 * Run: node scripts/stripe-setup.mjs
 * Outputs price IDs to paste into src/app/api/checkout/route.ts
 */

import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  { apiVersion: '2026-03-25.dahlia' }
);

const PACKAGES = [
  {
    key: 'presencia',
    name: 'Presencia',
    description: 'Professional 4–5 page restaurant website with hosting, SSL, Google Business Profile setup, WhatsApp button, and 30 days of support.',
    setupAmount:   59700,  // $597
    monthlyAmount:  9700,  // $97
  },
  {
    key: 'visibilidad',
    name: 'Visibilidad',
    description: 'Everything in Presencia plus Sanity CMS, 30+ local directory listings, 2× monthly GMB posts, monthly rank report.',
    setupAmount:   89700,  // $897
    monthlyAmount: 24700,  // $247
  },
  {
    key: 'crecimiento',
    name: 'Crecimiento',
    description: 'Everything in Visibilidad plus 4× GMB posts/month, review monitoring and responses, priority 24h support, quarterly site audit.',
    setupAmount:  124700,  // $1,247
    monthlyAmount: 59700,  // $597
  },
];

console.log('\n🍽️  Sabor Web — Stripe Account Setup\n');

const results = {};

for (const pkg of PACKAGES) {
  console.log(`Creating ${pkg.name}...`);

  // Product
  const product = await stripe.products.create({
    name: pkg.name,
    description: pkg.description,
    metadata: { sabor_package: pkg.key },
  });

  // One-time setup fee
  const setupPrice = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: pkg.setupAmount,
    metadata: { type: 'setup', package: pkg.key },
  });

  // Monthly recurring
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: pkg.monthlyAmount,
    recurring: { interval: 'month' },
    metadata: { type: 'monthly', package: pkg.key },
  });

  results[pkg.key] = {
    productId: product.id,
    setupPriceId: setupPrice.id,
    monthlyPriceId: monthlyPrice.id,
  };

  console.log(`  ✓ Product:       ${product.id}`);
  console.log(`  ✓ Setup price:   ${setupPrice.id}  ($${pkg.setupAmount / 100})`);
  console.log(`  ✓ Monthly price: ${monthlyPrice.id}  ($${pkg.monthlyAmount / 100}/mo)`);
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Paste this into src/app/api/checkout/route.ts:\n');
console.log(`const PACKAGES = {
  presencia: {
    setupPrice:   '${results.presencia.setupPriceId}',
    monthlyPrice: '${results.presencia.monthlyPriceId}',
    name: 'Presencia',
  },
  visibilidad: {
    setupPrice:   '${results.visibilidad.setupPriceId}',
    monthlyPrice: '${results.visibilidad.monthlyPriceId}',
    name: 'Visibilidad',
  },
  crecimiento: {
    setupPrice:   '${results.crecimiento.setupPriceId}',
    monthlyPrice: '${results.crecimiento.monthlyPriceId}',
    name: 'Crecimiento',
  },
};`);

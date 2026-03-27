#!/usr/bin/env node
/**
 * Recreates Stripe products/prices with clear, distinct names for the invoice.
 *
 * Two separate products per package:
 *   "Website Build — Presencia"    → one-time setup fee
 *   "Monthly Plan — Presencia"     → recurring subscription
 *
 * Run: node scripts/stripe-recreate-products.mjs
 * Outputs: new price IDs to paste into checkout/route.ts
 */

import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  { apiVersion: '2026-03-25.dahlia' }
);

const TIERS = [
  {
    key:          'presencia',
    setupName:    'Website Build — Presencia',
    setupDesc:    '4–5 page restaurant website, custom design, Google Business Profile setup, mobile-first, SSL hosting included.',
    setupAmount:  59700,   // $597 one-time
    monthlyName:  'Monthly Plan — Presencia',
    monthlyDesc:  'Monthly website hosting, SSL certificate, WhatsApp integration, and 30-day rolling support.',
    monthlyAmount: 9700,  // $97/month
  },
  {
    key:          'visibilidad',
    setupName:    'Website Build — Visibilidad',
    setupDesc:    'Everything in Presencia plus Sanity CMS setup, 30+ local directory citations, and local SEO foundation.',
    setupAmount:  89700,   // $897 one-time
    monthlyName:  'Monthly Plan — Visibilidad',
    monthlyDesc:  'Monthly hosting + SEO management, 2x Google Business posts, keyword ranking reports, and 1 content update.',
    monthlyAmount: 24700, // $247/month
  },
  {
    key:          'crecimiento',
    setupName:    'Website Build — Crecimiento',
    setupDesc:    'Full premium build with CMS, deep local SEO, 4x Google Business posts setup, and review management system.',
    setupAmount:  124700,  // $1,247 one-time
    monthlyName:  'Monthly Plan — Crecimiento',
    monthlyDesc:  'Monthly full-service management: hosting, SEO, 4x posts, review monitoring & responses, priority support.',
    monthlyAmount: 59700, // $597/month
  },
];

console.log('\n🏗️  Creating clean Stripe products & prices…\n');

const output = {};

for (const tier of TIERS) {
  // --- Setup product ---
  const setupProduct = await stripe.products.create({
    name:        tier.setupName,
    description: tier.setupDesc,
    metadata:    { package: tier.key, type: 'setup' },
  });

  const setupPrice = await stripe.prices.create({
    product:     setupProduct.id,
    currency:    'usd',
    unit_amount: tier.setupAmount,
    nickname:    `${tier.setupName} (one-time)`,
    metadata:    { package: tier.key, type: 'setup' },
  });

  console.log(`  ✓ ${tier.setupName}  →  ${setupPrice.id}  ($${tier.setupAmount / 100} one-time)`);

  // --- Monthly product ---
  const monthlyProduct = await stripe.products.create({
    name:        tier.monthlyName,
    description: tier.monthlyDesc,
    metadata:    { package: tier.key, type: 'monthly' },
  });

  const monthlyPrice = await stripe.prices.create({
    product:     monthlyProduct.id,
    currency:    'usd',
    unit_amount: tier.monthlyAmount,
    recurring:   { interval: 'month' },
    nickname:    `${tier.monthlyName} (monthly)`,
    metadata:    { package: tier.key, type: 'monthly' },
  });

  console.log(`  ✓ ${tier.monthlyName}  →  ${monthlyPrice.id}  ($${tier.monthlyAmount / 100}/mo)\n`);

  output[tier.key] = {
    setupPrice:   setupPrice.id,
    monthlyPrice: monthlyPrice.id,
  };
}

console.log('\n✅  DONE. Update src/app/api/checkout/route.ts with these IDs:\n');
console.log(JSON.stringify(output, null, 2));
console.log();

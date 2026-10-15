// One-off setup: create the MangeQR subscription Products + recurring EUR Prices
// in Stripe (test mode). Idempotent — it looks up existing products/prices by a
// `mangeqr_key` metadata tag and reuses them instead of creating duplicates.
//
// Run:  node scripts/stripe-setup.mjs
// Reads STRIPE_SECRET from .env. Prints the 4 price ids to paste into .env.
//
// Prices mirror config/index.ts TIERS: Pro 35/350 EUR, Premium 49/490 EUR.

import Stripe from 'stripe';
import { readFileSync } from 'node:fs';

// Minimal .env loader (avoid adding a dependency).
function loadEnv() {
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch {
    /* .env optional */
  }
}
loadEnv();

const secret = process.env.STRIPE_SECRET;
if (!secret) {
  console.error('STRIPE_SECRET missing in .env');
  process.exit(1);
}
if (!secret.startsWith('sk_test_')) {
  console.error(
    `Refusing to run: STRIPE_SECRET is not a TEST key (starts with "${secret.slice(0, 8)}"). Use sk_test_ for setup.`
  );
  process.exit(1);
}

const stripe = new Stripe(secret, { apiVersion: '2024-12-18.acacia' });

// Each price we need: a stable metadata key, the product name, EUR amount in
// cents, and the billing interval.
const PLANS = [
  { key: 'pro_monthly', product: 'MangeQR Pro', amount: 3500, interval: 'month' },
  { key: 'pro_yearly', product: 'MangeQR Pro', amount: 35000, interval: 'year' },
  { key: 'premium_monthly', product: 'MangeQR Premium', amount: 4900, interval: 'month' },
  { key: 'premium_yearly', product: 'MangeQR Premium', amount: 49000, interval: 'year' },
];

// Cache products by name so both intervals share one product.
const productCache = new Map();

async function getOrCreateProduct(name) {
  if (productCache.has(name)) return productCache.get(name);
  // Search existing products by name (test mode search API).
  const existing = await stripe.products.list({ active: true, limit: 100 });
  let product = existing.data.find((p) => p.name === name);
  if (!product) {
    product = await stripe.products.create({
      name,
      metadata: { mangeqr: 'subscription' },
    });
    console.log(`  created product ${name} (${product.id})`);
  }
  productCache.set(name, product);
  return product;
}

async function getOrCreatePrice(plan) {
  const product = await getOrCreateProduct(plan.product);
  // Look up an existing price tagged with our key.
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const found = prices.data.find(
    (pr) => pr.metadata?.mangeqr_key === plan.key
  );
  if (found) return found;

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: plan.amount,
    recurring: { interval: plan.interval },
    metadata: { mangeqr_key: plan.key },
  });
  console.log(`  created price ${plan.key} (${price.id})`);
  return price;
}

const ENV_VAR = {
  pro_monthly: 'STRIPE_PRICE_PRO_MONTHLY',
  pro_yearly: 'STRIPE_PRICE_PRO_YEARLY',
  premium_monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY',
  premium_yearly: 'STRIPE_PRICE_PREMIUM_YEARLY',
};

console.log('Setting up MangeQR subscription products/prices (EUR, test mode)…');
const result = {};
for (const plan of PLANS) {
  const price = await getOrCreatePrice(plan);
  result[ENV_VAR[plan.key]] = price.id;
}

console.log('\nDone. Add these to .env:\n');
for (const [k, v] of Object.entries(result)) {
  console.log(`${k}="${v}"`);
}

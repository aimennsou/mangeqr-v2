/**
 * Dictionary parity check.
 *
 * `TranslationKey` is derived from the `fr` block, so TypeScript catches a key
 * that is missing from `fr` but NOT one that is missing from `ar` / `en` (a
 * `Dict` is just `Record<string, string>`). A missing key silently falls back to
 * French at runtime, which is exactly the bug that is hard to spot on an Arabic
 * page. This script fails loudly instead.
 *
 * Usage: node scripts/check-i18n-parity.mjs
 */
import { readFileSync } from 'node:fs';

const SOURCE = 'lib/i18n/dictionaries.ts';
const src = readFileSync(SOURCE, 'utf8');

/** Extract the top-level `"key":` names declared inside each locale block. */
function keysOf(locale) {
  const start = src.indexOf(`const ${locale}: Dict = {`);
  if (start === -1) throw new Error(`Could not find the '${locale}' block`);
  const end = src.indexOf('\n};', start);
  const body = src.slice(start, end);
  return [...body.matchAll(/^ {2}"([^"]+)":/gm)].map((m) => m[1]);
}

const locales = ['fr', 'ar', 'en'];
const keys = Object.fromEntries(locales.map((l) => [l, keysOf(l)]));

let failed = false;

// Duplicate keys within a block: the later value silently wins.
for (const locale of locales) {
  const seen = new Set();
  const dupes = new Set();
  for (const k of keys[locale]) {
    if (seen.has(k)) dupes.add(k);
    seen.add(k);
  }
  if (dupes.size) {
    failed = true;
    console.error(`[${locale}] duplicate keys: ${[...dupes].join(', ')}`);
  }
}

// fr is the source of truth; ar/en must match it exactly in both directions.
const fr = new Set(keys.fr);
for (const locale of ['ar', 'en']) {
  const other = new Set(keys[locale]);
  const missing = [...fr].filter((k) => !other.has(k));
  const extra = [...other].filter((k) => !fr.has(k));
  if (missing.length) {
    failed = true;
    console.error(
      `[${locale}] missing ${missing.length} key(s) present in fr:\n  ${missing.join('\n  ')}`
    );
  }
  if (extra.length) {
    failed = true;
    console.error(
      `[${locale}] has ${extra.length} key(s) not in fr:\n  ${extra.join('\n  ')}`
    );
  }
}

console.log(
  `counts — fr: ${keys.fr.length}, ar: ${keys.ar.length}, en: ${keys.en.length}`
);

if (failed) {
  console.error('\ni18n parity check FAILED');
  process.exit(1);
}
console.log('i18n parity check passed');

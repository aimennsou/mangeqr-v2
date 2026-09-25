/**
 * Find source files that nothing imports.
 *
 * Zero dependencies on purpose — this is a one-shot audit aid, not a build step.
 *
 * Method: collect every .ts/.tsx under the source roots, then for each file look
 * for any OTHER file that references it, either through the `@/` alias or through
 * a relative specifier that resolves to it. Next.js special files (page, layout,
 * route, middleware, metadata routes, …) are entry points by convention and are
 * never "orphans", so they're excluded from the report but still scanned as
 * importers.
 *
 * Caveats: this is a textual resolver, not the TypeScript one. It will not see
 * dynamic `import(variable)` or files referenced only from JSON/config. Treat the
 * output as candidates to verify, not as a delete list.
 *
 * Usage: node scripts/find-orphan-modules.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname, basename, resolve } from 'node:path';

const ROOTS = [
  'app',
  'components',
  'lib',
  'hooks',
  'helpers',
  'data',
  'actions',
  'config',
  'schemas',
  'types',
];

/** Filenames Next.js treats as entry points (never imported explicitly). */
const NEXT_ENTRY = new Set([
  'page.tsx',
  'page.ts',
  'layout.tsx',
  'layout.ts',
  'route.ts',
  'route.tsx',
  'template.tsx',
  'loading.tsx',
  'error.tsx',
  'global-error.tsx',
  'not-found.tsx',
  'middleware.ts',
  'sitemap.ts',
  'robots.ts',
  'manifest.ts',
  'opengraph-image.tsx',
  'twitter-image.tsx',
  'icon.tsx',
  'apple-icon.tsx',
  'default.tsx',
  'instrumentation.ts',
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Root-level modules that are entry points AND importers: auth.ts, middleware.ts,
 * routes.ts, auth.config.ts, tailwind.config.ts, … Without scanning these as
 * importers the report produces false positives (e.g. data/account.ts is imported
 * only by auth.ts).
 */
function rootLevelModules() {
  try {
    return readdirSync('.', { withFileTypes: true })
      .filter(
        (e) =>
          e.isFile() &&
          /\.(ts|tsx)$/.test(e.name) &&
          !/\.d\.ts$/.test(e.name)
      )
      .map((e) => e.name);
  } catch {
    return [];
  }
}

const files = ROOTS.flatMap((r) => walk(r));
// Scanned for imports, but never reported as orphans themselves.
const extraImporters = rootLevelModules();

const sources = new Map(); // path -> text
for (const f of [...files, ...extraImporters]) {
  try {
    sources.set(f, readFileSync(f, 'utf8'));
  } catch {
    /* unreadable */
  }
}

/** Every import/require/export-from specifier in a file. */
function specifiersOf(text) {
  const out = [];
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) out.push(m[1]);
  }
  return out;
}

// Resolve every specifier in the project to an absolute file path, building the
// set of files that ARE imported by something.
const imported = new Set();
const cwd = process.cwd();

/** Try the candidate path with each extension / index form. */
function tryResolve(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];
  for (const c of candidates) {
    try {
      if (statSync(c).isFile()) return relative(cwd, c).replace(/\\/g, '/');
    } catch {
      /* not this one */
    }
  }
  return null;
}

for (const [file, text] of sources) {
  for (const spec of specifiersOf(text)) {
    let base = null;
    if (spec.startsWith('@/')) {
      base = resolve(cwd, spec.slice(2));
    } else if (spec.startsWith('.')) {
      base = resolve(dirname(resolve(cwd, file)), spec);
    } else {
      continue; // bare package specifier
    }
    const hit = tryResolve(base);
    if (hit) imported.add(hit);
  }
}

const orphans = files
  .map((f) => f.replace(/\\/g, '/'))
  .filter((f) => !imported.has(f))
  .filter((f) => !NEXT_ENTRY.has(basename(f)))
  .sort();

if (orphans.length === 0) {
  console.log('No orphan modules found.');
} else {
  console.log(`${orphans.length} candidate orphan module(s) — VERIFY before deleting:\n`);
  for (const o of orphans) console.log('  ' + o);
}

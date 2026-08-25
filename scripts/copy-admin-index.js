/**
 * @file copy-admin-index.js
 * @description Post-build step for the admin bundle.
 *
 * `vite build --config vite.admin.config.ts` emits dist/index-admin.html
 * (its declared entry), not dist/index.html. When the admin app is deployed
 * as its own Vercel project, Vercel's static server (and our SPA rewrite in
 * vercel.json, which sends every path to /index.html) expects an
 * index.html at the output root. This copies the built admin HTML there
 * so the admin project is self-contained — no per-project vercel.json
 * override needed, same rewrite rule works for both deployments.
 */
import { copyFileSync, existsSync } from 'node:fs';

const src = 'dist/index-admin.html';
const dest = 'dist/index.html';

if (!existsSync(src)) {
  console.error(`[copy-admin-index] Expected ${src} to exist after build — did the admin build output change?`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`[copy-admin-index] Copied ${src} → ${dest}`);

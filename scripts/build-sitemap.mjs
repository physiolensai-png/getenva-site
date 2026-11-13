#!/usr/bin/env node
/* Generates public/sitemap.xml from the pages in public/.
 *
 * Every top-level public/*.html page is listed unless it carries
 * <meta name="robots" content="noindex">. The URL is the page's canonical
 * link, and lastmod is the date of its last commit (today for a page with
 * uncommitted edits). Runs automatically before `firebase deploy` through
 * the predeploy hook in firebase.json.
 *
 *   node scripts/build-sitemap.mjs          write the file
 *   node scripts/build-sitemap.mjs --check  exit 1 if the committed file is out of date
 */
import path from 'node:path';
import { listPages, lastModified, writeIfChanged, escapeXml, PUBLIC } from './lib/site.mjs';

const check = process.argv.includes('--check');
const pages = listPages();

const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
for (const p of pages) {
  lines.push('  <url>', `    <loc>${escapeXml(p.url)}</loc>`, `    <lastmod>${lastModified(p.file)}</lastmod>`, '  </url>');
}
lines.push('</urlset>', '');

const out = path.join(PUBLIC, 'sitemap.xml');
const result = writeIfChanged(out, lines.join('\n'), { check });
console.log(`sitemap.xml: ${result} (${pages.length} URLs)`);
if (result === 'stale') {
  console.error('public/sitemap.xml is out of date. Run: node scripts/build-sitemap.mjs');
  process.exit(1);
}

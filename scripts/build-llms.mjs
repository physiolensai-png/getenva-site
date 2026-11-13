#!/usr/bin/env node
/* Generates the Markdown layer of the site for AI crawlers and assistants:
 *
 *   public/<page>.md     clean Markdown version of each public page
 *   public/llms.txt      site summary (scripts/llms-header.md) plus grouped links
 *   public/llms-full.txt the summary followed by every page's Markdown
 *
 * The summary text is hand-written in scripts/llms-header.md. Page titles,
 * descriptions and content come from the HTML, so editing a page and
 * re-running this script keeps everything in step. Runs automatically before
 * `firebase deploy` through the predeploy hook in firebase.json.
 *
 *   node scripts/build-llms.mjs          write the files
 *   node scripts/build-llms.mjs --check  exit 1 if any committed output is out of date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listPages, lastModified, writeIfChanged, PUBLIC, SITE } from './lib/site.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes('--check');

// Short names for the link list. A page missing here still gets published,
// under "Other pages", using its H1.
const NAMES = {
  index: 'Home',
  intelligence: 'Enva Intelligence',
  meals: 'Meals',
  workouts: 'Workouts',
  'your-data': 'Your data',
  widgets: 'Widgets',
  about: 'About',
  support: 'Support and FAQ',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
};
const GROUPS = [
  { title: 'Product', slugs: ['index', 'intelligence', 'meals', 'workouts', 'your-data', 'widgets'] },
  { title: 'Company', slugs: ['about', 'support'] },
  { title: 'Legal', slugs: ['privacy', 'terms'] },
];

const pages = listPages();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const results = [];
const record = (file, result) => results.push({ file: path.relative(PUBLIC, file), result });

const yaml = (s) => JSON.stringify(s); // a JSON string is valid YAML

function pageMarkdown(p) {
  const lastmod = lastModified(p.file);
  const front = [
    '---',
    `title: ${yaml(p.page.title)}`,
    `description: ${yaml(p.page.description)}`,
    `url: ${p.url}`,
    `markdown_url: ${mdUrl(p)}`,
    'site: Enva',
    `last_modified: ${lastmod}`,
    '---',
  ].join('\n');
  return { lastmod, text: `${front}\n\n${p.page.markdown}\n` };
}

function mdUrl(p) {
  return p.slug === 'index' ? `${SITE}/index.md` : `${SITE}/${p.slug}.md`;
}

// 1. One .md per page.
const rendered = new Map();
for (const p of pages) {
  const md = pageMarkdown(p);
  rendered.set(p.slug, md);
  const out = path.join(PUBLIC, `${p.slug}.md`);
  record(out, writeIfChanged(out, md.text, { check }));
}

// 2. llms.txt: summary plus grouped links with one-line descriptions.
const header = fs.readFileSync(path.join(HERE, 'llms-header.md'), 'utf8').trim();
const listed = new Set();
const linkLine = (p) => {
  listed.add(p.slug);
  const name = NAMES[p.slug] || p.page.h1 || p.slug;
  const desc = (p.page.description || '').trim();
  return `- [${name}](${mdUrl(p)})${desc ? ': ' + desc : ''}`;
};
const sections = [];
for (const g of GROUPS) {
  const items = g.slugs.filter((s) => bySlug.has(s)).map((s) => linkLine(bySlug.get(s)));
  if (items.length) sections.push(`## ${g.title}\n\n${items.join('\n')}`);
}
const other = pages.filter((p) => !listed.has(p.slug));
if (other.length) {
  console.warn(`build-llms: ${other.map((p) => p.slug).join(', ')} not in NAMES/GROUPS; listed under "Other pages"`);
  sections.push(`## Other pages\n\n${other.map(linkLine).join('\n')}`);
}
sections.push(['## Optional', '', `- [Full site as one Markdown file](${SITE}/llms-full.txt): every page below, concatenated.`, `- [Sitemap](${SITE}/sitemap.xml): all public HTML pages with last-modified dates.`].join('\n'));
const llms = `${header}\n\n${sections.join('\n\n')}\n`;
const llmsOut = path.join(PUBLIC, 'llms.txt');
record(llmsOut, writeIfChanged(llmsOut, llms, { check }));

// 3. llms-full.txt: the summary, then every page in site order.
const full = [header];
for (const p of pages) {
  full.push('---', `Source: ${p.url}`, '', rendered.get(p.slug).text.replace(/^---[\s\S]*?---\n\n/, '').trim());
}
const fullOut = path.join(PUBLIC, 'llms-full.txt');
record(fullOut, writeIfChanged(fullOut, full.join('\n\n') + '\n', { check }));

for (const r of results) console.log(`${r.result.padEnd(9)} ${r.file}`);
if (results.some((r) => r.result === 'stale')) {
  console.error('Generated Markdown is out of date. Run: node scripts/build-llms.mjs');
  process.exit(1);
}

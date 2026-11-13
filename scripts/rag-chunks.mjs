#!/usr/bin/env node
/* Crawls getenva.ai (or reads public/ locally), strips the nav, footer and
 * forms, converts each page to Markdown and splits it into section chunks of
 * roughly 300 to 800 tokens. Writes one JSON object per line, ready to embed
 * into a vector database.
 *
 *   node scripts/rag-chunks.mjs                        crawl https://getenva.ai via its sitemap
 *   node scripts/rag-chunks.mjs --local                read public/*.html instead of fetching
 *   node scripts/rag-chunks.mjs --out build/chunks.jsonl --min 300 --max 800
 *
 * Each line:
 *   {
 *     "id": "your-data#3",              page slug and chunk index
 *     "url": "https://getenva.ai/your-data",
 *     "page_title": "...",               the page <title>
 *     "page_description": "...",         the page meta description
 *     "section": "Health Score",         heading of the first section in the chunk
 *     "heading_path": ["Your numbers, scored against you.", "One number for how this week is going."],
 *     "text": "Page: ...\nSection: ...\n\n## One number ...",   Markdown with page and section context on top
 *     "tokens": 412,                     estimate, about four characters per token
 *     "last_modified": "2026-11-12",     from git locally, or the Last-Modified header when crawling
 *     "chunk_index": 3, "chunk_count": 6
 *   }
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractPage, estimateTokens } from './lib/html-to-markdown.mjs';
import { listPages, lastModified, ROOT, SITE } from './lib/site.mjs';

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const k = args.indexOf(name);
  return k >= 0 && args[k + 1] !== undefined ? args[k + 1] : dflt;
};
const LOCAL = args.includes('--local');
const BASE = flag('--base', SITE).replace(/\/$/, '');
const OUT = path.resolve(ROOT, flag('--out', 'build/enva-chunks.jsonl'));
const MIN = Number(flag('--min', 300));
const MAX = Number(flag('--max', 800));
const DELAY_MS = Number(flag('--delay', 250));
const UA = 'EnvaRagCrawler/1.0 (+https://getenva.ai/support)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xml,text/plain' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return { text: await res.text(), lastModified: res.headers.get('last-modified') };
}

/** Pages as [{ url, html, lastModified }], from the sitemap or from public/. */
async function loadPages() {
  if (LOCAL) {
    return listPages().map((p) => ({ url: p.url, html: p.html, lastModified: lastModified(p.file) }));
  }
  const { text: sitemap } = await fetchText(`${BASE}/sitemap.xml`);
  const urls = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error(`No <loc> entries in ${BASE}/sitemap.xml`);
  const pages = [];
  for (const url of urls) {
    const { text, lastModified: lm } = await fetchText(url);
    pages.push({ url, html: text, lastModified: lm ? new Date(lm).toISOString().slice(0, 10) : null });
    console.error(`fetched ${url} (${text.length} bytes)`);
    await sleep(DELAY_MS);
  }
  return pages;
}

function slugOf(url) {
  const p = new URL(url).pathname.replace(/^\/|\/$/g, '');
  return p || 'index';
}

/**
 * Group consecutive sections into chunks of MIN..MAX tokens.
 * A section larger than MAX is split on paragraph boundaries. Once a chunk has
 * reached MIN tokens it closes at the next substantial H2 so chunks follow the
 * page's own structure; a short closing section (the waitlist call to action,
 * a contact line) rides along with the chunk before it when it fits.
 */
function chunkSections(sections) {
  const pieces = [];
  for (const s of sections) {
    if (estimateTokens(s.markdown) <= MAX) { pieces.push(s); continue; }
    const paras = s.markdown.split(/\n\n+/);
    let buf = [];
    let part = 0;
    const flush = () => {
      if (!buf.length) return;
      const headingLine = /^#{1,6} /.test(buf[0]) ? '' : `${'#'.repeat(s.level || 2)} ${s.heading}${part ? ' (continued)' : ''}\n\n`;
      pieces.push({ ...s, markdown: headingLine + buf.join('\n\n') });
      buf = [];
      part++;
    };
    for (const para of paras) {
      if (buf.length && estimateTokens(buf.join('\n\n') + '\n\n' + para) > MAX) flush();
      buf.push(para);
    }
    flush();
  }

  const chunks = [];
  let cur = [];
  const size = (arr) => estimateTokens(arr.map((s) => s.markdown).join('\n\n'));
  const close = () => { if (cur.length) chunks.push(cur); cur = []; };
  for (const s of pieces) {
    const substantial = estimateTokens(s.markdown) >= MIN / 2;
    if (cur.length && size([...cur, s]) > MAX) close();
    else if (cur.length && s.level > 0 && s.level <= 2 && size(cur) >= MIN && substantial) close();
    cur.push(s);
  }
  close();
  return chunks;
}

const pages = await loadPages();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const lines = [];
let total = 0;
for (const { url, html, lastModified: lm } of pages) {
  const page = extractPage(html, { pageUrl: url, includeImages: false });
  if (page.noindex) continue;
  const slug = slugOf(url);
  const chunks = chunkSections(page.sections);
  chunks.forEach((sections, i) => {
    const first = sections.find((s) => s.heading) || sections[0];
    const body = sections.map((s) => s.markdown).join('\n\n');
    const context = `Page: ${page.title}\nSection: ${first.path.length ? first.path.join(' > ') : page.title}\nURL: ${url}`;
    const text = `${context}\n\n${body}`;
    lines.push(JSON.stringify({
      id: `${slug}#${i}`,
      url,
      page_title: page.title,
      page_description: page.description,
      section: first.heading || page.title,
      heading_path: first.path,
      text,
      tokens: estimateTokens(text),
      last_modified: lm,
      chunk_index: i,
      chunk_count: chunks.length,
    }));
  });
  total += chunks.length;
  console.error(`${slug}: ${chunks.length} chunks`);
}
fs.writeFileSync(OUT, lines.join('\n') + '\n');
console.error(`wrote ${total} chunks from ${pages.length} pages to ${path.relative(process.cwd(), OUT)}`);

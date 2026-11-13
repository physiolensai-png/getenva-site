#!/usr/bin/env node
/* Keeps two page details in step with the files, so nobody has to remember them.
 *
 *   1. Dates. Each indexable page's schema carries "dateModified", and the
 *      privacy policy and terms show a visible "Last updated: <date>". The date
 *      is the page's last commit (today when it has uncommitted edits), the
 *      same rule the sitemap uses for <lastmod>.
 *   2. Image size. Every <img> that points at a local file gets width and
 *      height attributes read from the file, so the browser reserves the space
 *      before the image loads (no layout shift).
 *
 * Runs before `firebase deploy` through the predeploy hook in firebase.json.
 *
 *   node scripts/stamp-pages.mjs          write the changes
 *   node scripts/stamp-pages.mjs --check  exit 1 if any page is out of date
 */
import fs from 'node:fs';
import path from 'node:path';
import { listPages, lastModified, writeIfChanged, PUBLIC } from './lib/site.mjs';

const check = process.argv.includes('--check');

// Pages that show the date on the page itself, with the matching sentence in
// the policy: "we will update the 'Last updated' date at the top of this page".
const VISIBLE_DATE_PAGES = new Set(['privacy', 'terms']);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/* ---------- image dimensions ---------- */

function imageSize(file) {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png' && buf.toString('latin1', 1, 4) === 'PNG') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  if (ext === '.webp' && buf.toString('latin1', 8, 12) === 'WEBP') {
    const kind = buf.toString('latin1', 12, 16);
    if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (kind === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  if (ext === '.svg') {
    const head = buf.toString('utf8', 0, 2000);
    const vb = head.match(/viewBox="\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/);
    if (vb) return { w: Math.round(parseFloat(vb[1])), h: Math.round(parseFloat(vb[2])) };
    const w = head.match(/<svg[^>]*\swidth="([\d.]+)(?:px)?"/);
    const h = head.match(/<svg[^>]*\sheight="([\d.]+)(?:px)?"/);
    if (w && h) return { w: Math.round(parseFloat(w[1])), h: Math.round(parseFloat(h[1])) };
  }
  return null;
}

function stampImages(html, pageFile, warnings) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    const hasW = /\swidth=/.test(tag);
    const hasH = /\sheight=/.test(tag);
    if (hasW && hasH) return tag;
    const src = tag.match(/\ssrc="([^"]+)"/);
    if (!src || /^(https?:)?\/\//.test(src[1]) || src[1].startsWith('data:')) return tag;
    if (hasW !== hasH) {
      warnings.push(`${path.basename(pageFile)}: ${src[1]} has only one of width/height; left alone`);
      return tag;
    }
    const clean = src[1].split(/[?#]/)[0];
    const target = clean.startsWith('/') ? path.join(PUBLIC, clean) : path.join(path.dirname(pageFile), clean);
    if (!fs.existsSync(target)) {
      warnings.push(`${path.basename(pageFile)}: ${src[1]} not found; size not set`);
      return tag;
    }
    const size = imageSize(target);
    if (!size) {
      warnings.push(`${path.basename(pageFile)}: could not read the size of ${src[1]}`);
      return tag;
    }
    return tag.replace(/^<img\b/, `<img width="${size.w}" height="${size.h}"`);
  });
}

/* ---------- dates ---------- */

function stampDates(html, page, iso) {
  let out = html;
  // Schema: the first WebPage-like node in the first JSON-LD block.
  const ld = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  for (const block of ld) {
    const node = /"@type":"(WebPage|AboutPage|FAQPage|ContactPage|CollectionPage)",/;
    if (!node.test(block)) continue;
    const next = /"dateModified":"[^"]*"/.test(block)
      ? block.replace(/"dateModified":"[^"]*"/, `"dateModified":"${iso}"`)
      : block.replace(node, (m) => `${m}"dateModified":"${iso}",`);
    out = out.replace(block, () => next);
    break;
  }
  if (VISIBLE_DATE_PAGES.has(page.slug)) {
    out = out.replace(/(<p class="meta">Last updated: )[^<]*(<\/p>)/, `$1${longDate(iso)}$2`);
  }
  return out;
}

/* ---------- run ---------- */

const warnings = [];
let stale = 0;
for (const page of listPages({ includeNoindex: true })) {
  let html = stampImages(page.html, page.file, warnings);
  if (!page.page.noindex) {
    // Dates come from the file as it will be committed: edits made by this
    // script do not count as a content change on their own.
    html = stampDates(html, page, lastModified(page.file));
  }
  const result = writeIfChanged(page.file, html, { check });
  if (result === 'stale') {
    stale++;
    console.error(`${page.relFile} is out of date`);
  } else if (result !== 'unchanged') {
    console.log(`${page.relFile}: ${result}`);
  }
}
for (const w of warnings) console.warn(`warning: ${w}`);
if (stale) {
  console.error('Run: node scripts/stamp-pages.mjs');
  process.exit(1);
}
console.log(check ? 'pages: up to date' : 'pages: stamped');

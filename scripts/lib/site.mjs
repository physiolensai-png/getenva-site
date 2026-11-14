/* Shared helpers for the build scripts: where the site lives, which pages are
 * public, when each one last changed, and a write that reports what it did.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extractPage } from './html-to-markdown.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PUBLIC = path.join(ROOT, 'public');
export const SITE = 'https://getenva.ai';

// Pages in the order the site presents them (nav, then footer-only pages).
// Anything not listed sorts after these, alphabetically.
export const NAV_ORDER = ['index', 'intelligence', 'meals', 'workouts', 'your-data', 'widgets', 'about', 'support', 'privacy', 'terms'];

/** Every top-level public/*.html page, parsed. Pages marked noindex are skipped unless asked for. */
export function listPages({ includeNoindex = false } = {}) {
  const pages = [];
  for (const name of fs.readdirSync(PUBLIC).sort()) {
    if (!name.endsWith('.html')) continue;
    const file = path.join(PUBLIC, name);
    const html = fs.readFileSync(file, 'utf8');
    const slug = name.replace(/\.html$/, '');
    const page = extractPage(html, { baseUrl: SITE + '/', publicDir: PUBLIC });
    if (page.noindex && !includeNoindex) continue;
    const url = page.canonical || (slug === 'index' ? SITE + '/' : `${SITE}/${slug}`);
    pages.push({ slug, file, relFile: path.relative(ROOT, file), html, url, page });
  }
  return sortPages(pages);
}

export function sortPages(pages) {
  const rank = (slug) => {
    const k = NAV_ORDER.indexOf(slug);
    return k < 0 ? NAV_ORDER.length : k;
  };
  return [...pages].sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
}

/** ISO date of the file's last commit; today when it has uncommitted changes; mtime outside git. */
export function lastModified(file) {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (dirty) return today();
    const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (committed) return committed;
  } catch { /* not a git checkout, or git missing */ }
  return localDate(fs.statSync(file).mtime);
}

/** A date as YYYY-MM-DD in the machine's own time zone, matching the date git records for a commit. */
function localDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today() {
  return localDate(new Date());
}

/** Writes only when the content differs. Returns 'created' | 'updated' | 'unchanged' | 'stale' (check mode). */
export function writeIfChanged(file, content, { check = false } = {}) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === content) return 'unchanged';
  if (check) return 'stale';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return current === null ? 'created' : 'updated';
}

export function escapeXml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

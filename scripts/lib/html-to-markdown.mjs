/* HTML to Markdown for getenva.ai pages. No dependencies.
 *
 * Parses the site's hand-written HTML into a small tree, drops the chrome
 * (nav, footer, forms, scripts, decoration) and renders the rest as Markdown.
 * Used by build-llms.mjs (the .md pages, llms.txt, llms-full.txt) and by
 * rag-chunks.mjs (section chunks for a vector database).
 *
 * The parser is deliberately small. It handles well-formed HTML plus the
 * usual omissions (unclosed <p> and <li>), which is all this site needs.
 */
import fs from 'node:fs';
import path from 'node:path';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT = new Set(['script', 'style', 'pre', 'textarea']);
const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'body', 'dd', 'details', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'html', 'li', 'main', 'nav', 'ol',
  'p', 'picture', 'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
  'video', 'audio', 'iframe', 'canvas', 'svg', 'noscript', 'template', 'head', 'title', 'button', 'select', 'textarea',
]);
// Opening one of these closes an open <p>.
const P_CLOSERS = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul',
]);

// Elements that never carry page content.
const DROP_TAGS = new Set([
  'script', 'style', 'svg', 'template', 'noscript', 'button', 'input', 'select', 'textarea', 'option', 'label',
  'video', 'audio', 'source', 'track', 'iframe', 'canvas', 'nav', 'footer', 'head', 'title', 'meta', 'link', 'base',
]);
// Site chrome and decoration, by class. 'when' and 'cap' are media captions,
// orphaned once the video or image slot they label is dropped.
const DROP_CLASSES = new Set(['menu', 'menu-btn', 'success-msg', 'toc', 'key', 'cta', 'btn', 'qa-list', 'form', 'when', 'cap']);
// [parent class, child class]: decoration that only makes sense inside its parent.
const DROP_IN_PARENT = [['way', 'n']]; // the 1 2 3 badges on the About page promises

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  deg: '°', times: '×', middot: '·', bull: '•', laquo: '«', raquo: '»', sup2: '²',
  sup3: '³', frac12: '½', frac14: '¼', frac34: '¾', larr: '←', rarr: '→', uarr: '↑',
  darr: '↓', plusmn: '±', micro: 'µ', para: '¶', sect: '§', euro: '€', pound: '£',
  yen: '¥', cent: '¢', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ntilde: 'ñ',
  uuml: 'ü', ouml: 'ö', auml: 'ä', szlig: 'ß', shy: '', zwj: '', zwnj: '',
};

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(cp); } catch { return m; }
    }
    if (e in NAMED_ENTITIES) return NAMED_ENTITIES[e];
    const lower = e.toLowerCase();
    return lower in NAMED_ENTITIES ? NAMED_ENTITIES[lower] : m;
  });
}

/* ------------------------------------------------------------------ parser */

export function parseHTML(html) {
  const root = { type: 'root', tag: '#root', attrs: {}, children: [], parent: null };
  let cur = root;
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) { addText(cur, html.slice(i)); break; }
    if (lt > i) addText(cur, html.slice(i, lt));
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end < 0 ? n : end + 3;
      continue;
    }
    if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
      const end = html.indexOf('>', lt);
      i = end < 0 ? n : end + 1;
      continue;
    }
    const gt = findTagEnd(html, lt);
    if (gt < 0) { addText(cur, html.slice(lt)); break; }
    const raw = html.slice(lt + 1, gt);
    i = gt + 1;
    if (raw[0] === '/') {
      cur = closeTag(cur, raw.slice(1).trim().toLowerCase());
      continue;
    }
    const m = /^([a-zA-Z][\w:-]*)([\s\S]*)$/.exec(raw);
    if (!m) { addText(cur, '<' + raw + '>'); continue; }
    const name = m[1].toLowerCase();
    let rest = m[2];
    let selfClosing = false;
    if (/\/\s*$/.test(rest)) { selfClosing = true; rest = rest.replace(/\/\s*$/, ''); }
    cur = implicitClose(cur, name);
    const el = { type: 'el', tag: name, attrs: parseAttrs(rest), children: [], parent: cur };
    cur.children.push(el);
    if (RAW_TEXT.has(name)) {
      const re = new RegExp('</' + name + '\\s*>', 'ig');
      re.lastIndex = i;
      const close = re.exec(html);
      const body = html.slice(i, close ? close.index : n);
      if (body) el.children.push({ type: 'text', text: body, raw: true, parent: el });
      i = close ? close.index + close[0].length : n;
      continue;
    }
    if (VOID.has(name) || selfClosing) continue;
    cur = el;
  }
  return root;
}

function addText(parent, text) {
  if (!text) return;
  text = decodeEntities(text).replace(/[ \t\r\n\f]+/g, ' ');
  const last = parent.children[parent.children.length - 1];
  if (last && last.type === 'text' && !last.raw) { last.text += text; return; }
  parent.children.push({ type: 'text', text, raw: false, parent });
}

function findTagEnd(s, start) {
  let quote = null;
  for (let j = start + 1; j < s.length; j++) {
    const c = s[j];
    if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return j;
  }
  return -1;
}

function parseAttrs(s) {
  const attrs = {};
  const re = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(s))) attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

function implicitClose(cur, name) {
  if (name === 'li') {
    for (let c = cur; c && c.type === 'el' && c.tag !== 'ul' && c.tag !== 'ol'; c = c.parent) {
      if (c.tag === 'li') return c.parent;
    }
    return cur;
  }
  if (name === 'dt' || name === 'dd') {
    for (let c = cur; c && c.type === 'el' && c.tag !== 'dl'; c = c.parent) {
      if (c.tag === 'dt' || c.tag === 'dd') return c.parent;
    }
    return cur;
  }
  if (name === 'option' && cur.tag === 'option') return cur.parent;
  if (P_CLOSERS.has(name) && cur.tag === 'p') return cur.parent;
  return cur;
}

function closeTag(cur, name) {
  for (let c = cur; c && c.type === 'el'; c = c.parent) {
    if (c.tag === name) return c.parent;
  }
  return cur; // stray closing tag: ignore it
}

/* ------------------------------------------------------------- tree helpers */

export function findFirst(node, pred) {
  if (node.type === 'el' && pred(node)) return node;
  for (const ch of node.children || []) {
    if (ch.type !== 'el') continue;
    const hit = findFirst(ch, pred);
    if (hit) return hit;
  }
  return null;
}

export function findAll(node, pred, out = []) {
  for (const ch of node.children || []) {
    if (ch.type !== 'el') continue;
    if (pred(ch)) out.push(ch);
    else findAll(ch, pred, out);
  }
  return out;
}

export function textContent(node) {
  if (node.type === 'text') return node.raw ? decodeEntities(node.text.replace(/<[^>]+>/g, '')) : node.text;
  return (node.children || []).map(textContent).join('');
}

const classesOf = (el) => (el.attrs.class || '').split(/\s+/).filter(Boolean);
const hasClass = (el, c) => el.type === 'el' && classesOf(el).includes(c);
const isBlock = (el) => BLOCK.has(el.tag);

function nextElementSibling(el) {
  const sibs = el.parent ? el.parent.children : [];
  for (let k = sibs.indexOf(el) + 1; k < sibs.length; k++) if (sibs[k].type === 'el') return sibs[k];
  return null;
}

function shouldDrop(el, ctx) {
  if (el.type !== 'el') return false;
  if (DROP_TAGS.has(el.tag)) return true;
  if (el.attrs['aria-hidden'] === 'true') return true;
  if (classesOf(el).some((c) => DROP_CLASSES.has(c))) return true;
  const parent = el.parent && el.parent.type === 'el' ? el.parent : null;
  if (parent && DROP_IN_PARENT.some(([pc, cc]) => hasClass(el, cc) && hasClass(parent, pc))) return true;
  return Boolean(ctx.drop && ctx.drop(el));
}

// Neighbouring sibling that is not whitespace, or null.
function neighbour(el, step) {
  const sibs = el.parent ? el.parent.children : [];
  for (let k = sibs.indexOf(el) + step; k >= 0 && k < sibs.length; k += step) {
    const s = sibs[k];
    if (s.type === 'text' && !s.text.trim()) continue;
    return s;
  }
  return null;
}

// Two inline elements with no text between them render with no gap in HTML,
// but back-to-back Markdown markers (**a***b*) break, and this site stacks
// such spans as blocks with CSS. A single space keeps both readable.
function joinInline(prev, piece, prevWasElement) {
  if (prevWasElement && piece && prev && !/\s$/.test(prev) && !/^\s/.test(piece)) return ' ' + piece;
  return piece;
}

// Text that follows a bold or italic label with no gap ("<b>You type</b>Chicken")
// is a block label in the site's CSS; give it the space it has on screen.
function joinText(prev, text, prevWasElement) {
  if (prevWasElement && /\*$/.test(prev) && /^[\p{L}\p{N}$(]/u.test(text)) return ' ' + text;
  return text;
}

/* ---------------------------------------------------------------- renderer */

function cleanInline(s) {
  return s.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
}

function wrap(t, marker) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(t);
  if (!m[2]) return t;
  return m[1] + marker + m[2] + marker + m[3];
}

export function absUrl(href, ctx) {
  try {
    const u = new URL(href, ctx.pageUrl || ctx.baseUrl || 'https://getenva.ai/');
    if (u.protocol === 'mailto:' || u.protocol === 'tel:') return u.href;
    if (ctx.siteOrigin && u.origin === ctx.siteOrigin) {
      let p = u.pathname.replace(/\.html$/, '');
      if (p === '/index') p = '/';
      u.pathname = p;
    }
    return u.href;
  } catch {
    return href;
  }
}

function renderInlineChildren(el, ctx) {
  let s = '';
  let prevWasElement = false;
  for (const ch of el.children) {
    if (ch.type === 'text') { if (!ch.raw) s += joinText(s, ch.text, prevWasElement); prevWasElement = false; continue; }
    if (shouldDrop(ch, ctx)) continue;
    const piece = isBlock(ch) ? '\n' + renderBlockEl(ch, ctx).join('\n') + '\n' : renderInline(ch, ctx);
    s += joinInline(s, piece, prevWasElement);
    if (piece) prevWasElement = true;
  }
  return s;
}

function renderInline(el, ctx) {
  switch (el.tag) {
    case 'br': return '\n';
    case 'img': return renderImg(el, ctx);
    case 'a': return renderLink(el, ctx);
    case 'strong': case 'b': return wrap(renderInlineChildren(el, ctx), '**');
    case 'em': case 'i': return wrap(renderInlineChildren(el, ctx), '*');
    case 'code': case 'kbd': case 'samp': {
      const t = renderInlineChildren(el, ctx).trim();
      return t ? '`' + t + '`' : '';
    }
    case 'sup': { // footnote markers read as citations: survival.[1,2]
      const t = renderInlineChildren(el, ctx).trim();
      return /^[\d,\s]+$/.test(t) ? `[${t.replace(/\s+/g, '')}]` : t;
    }
    default: return renderInlineChildren(el, ctx);
  }
}

function renderLink(el, ctx) {
  const text = cleanInline(renderInlineChildren(el, ctx)).replace(/\n+/g, ' ');
  const href = el.attrs.href || '';
  if (!text) return '';
  if (!href || href.startsWith('#') || /^javascript:/i.test(href)) {
    // An in-page link that stands on its own ("Jump to form") is navigation;
    // one inside a sentence keeps its text.
    const prev = neighbour(el, -1);
    const next = neighbour(el, 1);
    const standalone = (!prev || (prev.type === 'el' && isBlock(prev))) && (!next || (next.type === 'el' && isBlock(next)));
    return standalone ? '' : text;
  }
  return `[${text}](${absUrl(href, ctx)})`;
}

function renderImg(el, ctx) {
  if (!ctx.includeImages) return '';
  const alt = (el.attrs.alt || '').trim();
  const src = (el.attrs.src || '').split('#')[0];
  if (!alt || !src) return '';
  const p = el.parent;
  if (p && p.type === 'el' && p.tag === 'a' && (p.attrs.href === '/' || p.attrs.href === './')) return ''; // site logo
  if (p && p.type === 'el' && hasClass(p, 'lg')) return ''; // brand logo in the "works with" strip; the name is rendered instead
  const bare = src.split('?')[0];
  if (ctx.publicDir && !/^https?:/i.test(bare) && !fs.existsSync(path.join(ctx.publicDir, bare.replace(/^\//, '')))) {
    return ''; // placeholder slot whose file has not been added yet
  }
  return `![${alt.replace(/[[\]]/g, '')}](${absUrl(bare, ctx)})`;
}

function heading(level, text, ctx) {
  ctx.sectionLevel = level;
  ctx.headings.push({ level, text });
  return '#'.repeat(level) + ' ' + text;
}

// Renders the children of a container: inline runs become paragraphs, block
// children are rendered in place. Returns an array of Markdown blocks.
function renderBlocks(node, ctx) {
  const out = [];
  let buf = '';
  let prevWasElement = false;
  const flush = () => {
    const t = cleanInline(buf);
    if (t) out.push(t.replace(/\n/g, '  \n'));
    buf = '';
    prevWasElement = false;
  };
  for (const ch of node.children) {
    if (ch.type === 'text') { if (!ch.raw) buf += joinText(buf, ch.text, prevWasElement); prevWasElement = false; continue; }
    if (shouldDrop(ch, ctx)) continue;
    if (isBlock(ch)) { flush(); out.push(...renderBlockEl(ch, ctx)); continue; }
    const piece = renderInline(ch, ctx);
    buf += joinInline(buf, piece, prevWasElement);
    if (piece) prevWasElement = true;
  }
  flush();
  return out;
}

function renderBlockEl(el, ctx) {
  const tag = el.tag;
  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    const text = cleanInline(renderInlineChildren(el, ctx)).replace(/\n+/g, ' ');
    if (!text) return [];
    const blocks = [heading(level, text, ctx)];
    if (level === 1 && ctx.kicker) { // the hero eyebrow reads as a subtitle under the H1
      blocks.push('*' + ctx.kicker + '*');
      ctx.kicker = '';
    }
    return blocks;
  }
  switch (tag) {
    case 'ul': case 'ol': {
      const s = renderList(el, ctx);
      return s ? [s] : [];
    }
    case 'blockquote': {
      const inner = renderBlocks(el, ctx).join('\n\n');
      return inner ? [inner.split('\n').map((l) => (l ? '> ' + l : '>')).join('\n')] : [];
    }
    case 'pre': {
      const t = textContent(el).replace(/^\n+|\n+$/g, '');
      return t ? ['```\n' + t + '\n```'] : [];
    }
    case 'hr': return ['---'];
    case 'table': return renderTable(el, ctx);
    case 'details': return renderDetails(el, ctx);
    case 'figure': return renderFigure(el, ctx);
    case 'figcaption': {
      const t = cleanInline(renderInlineChildren(el, ctx)).replace(/\n+/g, ' ');
      return t ? ['*' + t + '*'] : [];
    }
    case 'dt': {
      const t = cleanInline(renderInlineChildren(el, ctx)).replace(/\n+/g, ' ');
      return t ? ['**' + t + '**'] : [];
    }
    default: return renderContainer(el, ctx);
  }
}

// Generic containers (div, section, header, p, ...) plus the site's own
// component classes that need a specific shape in Markdown.
function renderContainer(el, ctx) {
  if (el.attrs.role === 'img' && el.attrs['aria-label']) { // a diagram: its label is the sentence it draws
    const t = cleanInline(el.attrs['aria-label']);
    return t ? [t] : [];
  }
  if (hasClass(el, 'eyebrow')) {
    const t = cleanInline(renderInlineChildren(el, ctx)).replace(/\n+/g, ' ');
    const next = nextElementSibling(el);
    if (next && next.tag === 'h1') { ctx.kicker = t; return []; } // emitted after the H1 instead
    return t ? ['**' + t + '**'] : [];
  }
  if (hasClass(el, 'strip')) { // "Works with" logo strip: label plus a comma-separated list of names
    const groups = [];
    for (const n of findAll(el, (x) => hasClass(x, 'lbl') || hasClass(x, 'lg'))) {
      const t = cleanInline(textContent(n));
      if (!t) continue;
      if (hasClass(n, 'lbl')) groups.push({ label: t, names: [] });
      else {
        if (!groups.length) groups.push({ label: '', names: [] });
        groups[groups.length - 1].names.push(t);
      }
    }
    const lines = groups.filter((g) => g.names.length).map((g) => (g.label ? `**${g.label}:** ` : '') + g.names.join(', '));
    return lines.length ? lines : renderBlocks(el, ctx);
  }
  if (hasClass(el, 'cc-top')) { // chat card header: keep only the "From the app" / "Sample data" label
    const em = el.children.find((c) => c.type === 'el' && c.tag === 'em');
    const t = em ? cleanInline(renderInlineChildren(em, ctx)) : '';
    return t ? ['*' + t + '*'] : [];
  }
  if (hasClass(el, 'cc-q')) {
    const t = cleanInline(renderInlineChildren(el, ctx)).replace(/\n+/g, ' ');
    return t ? ['**Q:** ' + t] : [];
  }
  if (hasClass(el, 'cc-a')) {
    const blocks = renderBlocks(el, ctx);
    if (blocks.length) blocks[0] = '**A:** ' + blocks[0];
    return blocks;
  }
  if (hasClass(el, 'plan')) { // pricing card: one line instead of three stacked fragments
    const parts = renderBlocks(el, ctx).map((s) => s.replace(/\s*\n\s*/g, ' '));
    return parts.length ? [parts.join(', ')] : [];
  }
  return renderBlocks(el, ctx);
}

function renderList(el, ctx) {
  const ordered = el.tag === 'ol';
  let n = parseInt(el.attrs.start || '1', 10) || 1;
  const items = [];
  for (const li of el.children) {
    if (li.type !== 'el' || li.tag !== 'li' || shouldDrop(li, ctx)) continue;
    const blocks = renderBlocks(li, ctx);
    if (!blocks.length) continue;
    const marker = ordered ? `${n}. ` : '- ';
    const indent = ' '.repeat(marker.length);
    const lines = blocks.join('\n\n').split('\n');
    items.push(lines.map((ln, k) => (k === 0 ? marker + ln : ln ? indent + ln : ln)).join('\n'));
    n++;
  }
  return items.join('\n');
}

function renderDetails(el, ctx) {
  const summary = el.children.find((c) => c.type === 'el' && c.tag === 'summary');
  const title = summary ? cleanInline(renderInlineChildren(summary, ctx)).replace(/\n+/g, ' ') : '';
  const out = [];
  const level = Math.min(6, (ctx.sectionLevel || 1) + 1);
  if (title) {
    // Sibling <details> all sit one level under the enclosing heading, so
    // record the heading without moving sectionLevel.
    ctx.headings.push({ level, text: title });
    out.push('#'.repeat(level) + ' ' + title);
  }
  const rest = { type: 'el', tag: 'div', attrs: {}, children: el.children.filter((c) => c !== summary), parent: el };
  return out.concat(renderBlocks(rest, ctx));
}

function renderFigure(el, ctx) {
  const caption = el.children.find((c) => c.type === 'el' && c.tag === 'figcaption');
  const body = { type: 'el', tag: 'div', attrs: {}, children: el.children.filter((c) => c !== caption), parent: el };
  const out = renderBlocks(body, ctx);
  if (caption) out.push(...renderBlockEl(caption, ctx));
  return out;
}

function renderTable(el, ctx) {
  const rows = [];
  const walk = (n) => {
    for (const ch of n.children || []) {
      if (ch.type !== 'el') continue;
      if (ch.tag === 'tr') {
        const cells = ch.children
          .filter((c) => c.type === 'el' && (c.tag === 'td' || c.tag === 'th'))
          .map((c) => cleanInline(renderInlineChildren(c, ctx)).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|'));
        if (cells.length) rows.push(cells);
      } else walk(ch);
    }
  };
  walk(el);
  if (!rows.length) return [];
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => [...r, ...Array(width - r.length).fill('')];
  const line = (r) => '| ' + pad(r).join(' | ') + ' |';
  return [[line(rows[0]), '| ' + Array(width).fill('---').join(' | ') + ' |', ...rows.slice(1).map(line)].join('\n')];
}

/* ---------------------------------------------------------------- sections */

export function splitSections(markdown) {
  const sections = [];
  const stack = [];
  let cur = { level: 0, heading: '', path: [], lines: [] };
  for (const line of markdown.split('\n')) {
    const m = /^(#{1,6}) (.+)$/.exec(line);
    if (m) {
      sections.push(cur);
      const level = m[1].length;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, heading: m[2] });
      cur = { level, heading: m[2], path: stack.map((s) => s.heading), lines: [line] };
    } else {
      cur.lines.push(line);
    }
  }
  sections.push(cur);
  return sections
    .map((s) => ({ level: s.level, heading: s.heading, path: s.path, markdown: s.lines.join('\n').trim() }))
    .filter((s) => s.markdown);
}

// Rough token estimate (about four characters per token for English prose).
export function estimateTokens(s) {
  return Math.ceil(s.length / 4);
}

/* -------------------------------------------------------------------- page */

/**
 * Extract metadata and Markdown from one HTML page.
 * opts.pageUrl       canonical URL of the page (defaults to its <link rel=canonical>)
 * opts.baseUrl       site root, used when the page has no canonical
 * opts.includeImages render <img alt> as Markdown images (default true)
 * opts.publicDir     local public/ folder; images whose file is missing are skipped
 * opts.drop          optional (el) => boolean to drop extra elements
 */
export function extractPage(html, opts = {}) {
  const root = parseHTML(html);
  const head = findFirst(root, (n) => n.tag === 'head') || root;
  const meta = (name) => {
    const m = findFirst(head, (n) => n.tag === 'meta' && (n.attrs.name || '').toLowerCase() === name);
    return m ? m.attrs.content || '' : '';
  };
  const prop = (p) => {
    const m = findFirst(head, (n) => n.tag === 'meta' && (n.attrs.property || '').toLowerCase() === p);
    return m ? m.attrs.content || '' : '';
  };
  const titleEl = findFirst(head, (n) => n.tag === 'title');
  const canonEl = findFirst(head, (n) => n.tag === 'link' && (n.attrs.rel || '').toLowerCase() === 'canonical');
  const htmlEl = findFirst(root, (n) => n.tag === 'html');
  const canonical = canonEl ? canonEl.attrs.href || '' : '';
  const pageUrl = opts.pageUrl || canonical || opts.baseUrl || '';
  let siteOrigin = '';
  try { siteOrigin = new URL(pageUrl).origin; } catch { /* no usable URL */ }

  const ctx = {
    pageUrl, baseUrl: opts.baseUrl, siteOrigin,
    includeImages: opts.includeImages !== false,
    publicDir: opts.publicDir, drop: opts.drop,
    headings: [], sectionLevel: 0, kicker: '',
  };
  const body = findFirst(root, (n) => n.tag === 'body') || root;
  const markdown = renderBlocks(body, ctx).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  const h1 = ctx.headings.find((h) => h.level === 1);
  return {
    title: titleEl ? cleanInline(textContent(titleEl)) : '',
    description: meta('description'),
    canonical,
    lang: htmlEl ? htmlEl.attrs.lang || '' : '',
    noindex: /noindex/i.test(meta('robots')),
    ogImage: prop('og:image'),
    h1: h1 ? h1.text : '',
    headings: ctx.headings,
    markdown,
    sections: splitSections(markdown),
  };
}

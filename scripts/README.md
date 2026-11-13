# Build scripts

The site is static HTML with no build step. These scripts generate the few
files that are derived from the pages, so they never drift from the HTML.
They need Node 20 (the same Node the Firebase CLI uses) and nothing else.

| Script | Writes | When it runs |
| --- | --- | --- |
| `stamp-pages.mjs` | `dateModified` in each page's schema, the "Last updated" line on `privacy` and `terms`, and `width`/`height` on every local `<img>` | `firebase deploy` (predeploy hook, runs first), or by hand |
| `build-sitemap.mjs` | `public/sitemap.xml` | `firebase deploy` (predeploy hook), or by hand |
| `build-llms.mjs` | `public/llms.txt`, `public/llms-full.txt`, `public/<page>.md` | `firebase deploy` (predeploy hook), or by hand |
| `rag-chunks.mjs` | `build/enva-chunks.jsonl` (ignored by git) | by hand, when you want chunks for a vector database |

Run the build scripts after editing any page, then commit the output with
the page. This is the routine every time the website changes:

```
node scripts/stamp-pages.mjs
node scripts/build-sitemap.mjs
node scripts/build-llms.mjs
```

`stamp-pages.mjs` is what keeps dates honest. A page's date is its last commit
(today while it has uncommitted edits), so editing a page and running the
script moves that page's `dateModified`, its sitemap `<lastmod>`, and, for the
privacy policy and terms, the visible "Last updated" line, all to the same
day. That matches what both policies promise: a non-material change updates
the date at the top. Changing only `v2.css` or a shared script does not move
any page's date, because no page file changed. New `<img>` tags need no sizes
typed in; the script reads them from the image file.

All three accept `--check`, which exits 1 when the committed output is out of date
instead of writing it.

## How pages are discovered

Every top-level `public/*.html` file is a page. A page with
`<meta name="robots" content="noindex">` (the 404 page, OAuth callbacks) is
left out of the sitemap and the Markdown layer. The URL comes from the page's
`<link rel="canonical">`, and `last_modified` from the file's last commit
(today, if it has uncommitted edits).

## The Markdown layer

`scripts/lib/html-to-markdown.mjs` turns a page into Markdown. It drops the
nav, footer, forms, buttons, scripts, the colour legend and the table of
contents on the legal pages, and keeps headings, copy, lists, links, FAQ
questions (as headings) and image alt text. `firebase.json` serves `.md` files
as `text/markdown` with `X-Robots-Tag: noindex`, so search engines index the
HTML page rather than its Markdown twin while AI agents can fetch either.

`scripts/llms-header.md` is the hand-written summary at the top of
`llms.txt` and `llms-full.txt`. Keep it in step with the site: pricing,
supported devices, the privacy stance and the contact addresses all live
there.

New pages are picked up automatically. Give each one a short name and a group
in `NAMES` and `GROUPS` in `build-llms.mjs`; until then it is listed under
"Other pages" and the script prints a warning.

## RAG chunks

```
node scripts/rag-chunks.mjs                 # crawl https://getenva.ai through its sitemap
node scripts/rag-chunks.mjs --local         # read public/ instead of fetching
node scripts/rag-chunks.mjs --out build/chunks.jsonl --min 300 --max 800
```

One JSON object per line with `id`, `url`, `page_title`, `section`,
`heading_path`, `text` and a `tokens` estimate (about four characters per
token). Chunks follow the page's own headings: small sections are merged up to
`--max`, sections over `--max` are split on paragraphs, and a chunk that has
reached `--min` closes at the next H2.

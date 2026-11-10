# Retired pages (November 2026)

These pages were taken down when the site moved to the version 2 design. They are not deployed:
this folder sits outside `public/`, so Firebase Hosting never uploads it.

Each old URL now redirects (301) to the home page. See `redirects` in `firebase.json`.

| File | Old URL |
| --- | --- |
| fitness.html | /fitness |
| hyrox.html | /hyrox (also /Hyrox, /HYROX) |
| envahealthscore.html | /envahealthscore (also /metrics, /health-score) |
| biological-age.html | /biological-age |
| sleep-recovery.html | /sleep-recovery |
| recovery-actions.html | /recovery-actions |
| nutrition.html | /nutrition (redirected to /meals earlier) |

The images these pages used are still in `public/screens/`. To restore a page, move it back into `public/`,
remove its redirect, and add it to `public/sitemap.xml`. Git history also keeps every earlier version.

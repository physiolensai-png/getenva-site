# App screenshots for getenva.ai

Drop PNG files into this folder using the exact names below. Each slot on the
site already points at its filename. A missing file falls back to the CSS
placeholder automatically (the `<img>` has `onerror="this.remove()"`), so you
can add them one at a time and nothing breaks in between.

Format: **PNG**, no rounded corners or device frame baked in (the site draws the
frame). Export at 2x the display size or larger; the browser scales down.

## Home page (`index.html`)

### Hero devices (full-screen captures, keep the whole screen)

| File | What it shows | Shape / target |
| --- | --- | --- |
| `home-hero-iphone.png` | App home / Today view: Health Score up top, key metrics below | Portrait, full iPhone screen, native res (e.g. 1179x2556). Cropped to `9 / 19.5`. |
| `home-hero-watch.png` | Watch face or main glance: the score ring | Square-ish, full Apple Watch screen (e.g. 410x502). Cropped to `1 / 1.22`. |

### Overview cards (tight crop of one UI element, not the whole phone)

Landscape, **16:10**, target **1200x750**. Crop to just the widget named.

| File | Crop to |
| --- | --- |
| `home-nutrition.png` | Today's nutrition: calorie ring + macro split |
| `home-fitness.png` | A workout's zone breakdown with heart-rate recovery |
| `home-recovery-actions.png` | The daily recovery checklist (a few items, some checked) |
| `home-sleep-recovery.png` | Sleep stages bar + Recovery gauge |
| `home-health-score.png` | Health Score pillar breakdown (Readiness / Load / Trajectory bars) |
| `home-biological-age.png` | Biological Age domain confidence breakdown |

## Not screenshot slots (leave as-is)

The hero readout cards on `nutrition.html`, `fitness.html`,
`recovery-actions.html`, `sleep-recovery.html`, `envahealthscore.html`, and
`biological-age.html` are intentional CSS mockups, not image slots. Say the
word if you want any of them converted to real screenshots and I will wire
them the same way (naming would be `nutrition-readout.png`, etc.).

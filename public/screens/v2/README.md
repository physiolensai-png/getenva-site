# Home v2 media

Drop files here with these exact names. `index.html` points at every one.
A missing file shows a dashed placeholder with its name, so add them one at a time.

Capture raw screens, no device frame and no rounded corners baked in. The page draws the frame.
Same device, same demo data, same appearance for every capture. Export PNG at native resolution.

## Phone screenshots (portrait, about 1179 x 2556)

| File | Where | What to show |
| --- | --- | --- |
| `hero-phone.png` | Hero | Enva Intelligence chat that crosses a workout, sleep and a lab value in one answer |
| `score-health.png` | Score | Health Score screen with the pillar breakdown |
| `score-biological-age.png` | Score | Biological Age with confidence and the markers behind it |
| `labs.png` | What goes in | Blood Work card after an Apple Health Records import |
| `ai-plan.png` | Intelligence | Chat building a workout plan |
| `ai-meal.png` | Intelligence | Chat suggesting a high protein, low fat meal with a log button |
| `ai-connected.png` | Intelligence | Chat answering across watch, food log and labs in one reply |

## Apple Watch screenshots (about 410 x 502)

| File | What to show |
| --- | --- |
| `hero-watch.png` | Today's score and rings |
| `watch-start.png` | Workout picker tiles |
| `watch-live.png` | Live workout, big heart rate |
| `watch-summary.png` | Finished workout summary |

## Video (silent, loops, H.264 MP4)

Portrait 1170 x 2532, 8 to 12 seconds, under 8 MB each. Trim the status bar clock to 9:41.

| File | Poster (shown before it plays) | What to show |
| --- | --- | --- |
| `food.mp4` | `food-poster.jpg` | Logging a meal end to end (scan or describe, then the day totals move) |
| `training.mp4` | `training-poster.jpg` | Logging a workout or importing a class, then the day total moving |

## Logos (optional, SVG, one color)

Put brand marks in `screens/v2/logos/`: `apple-watch.svg`, `apple-health.svg`, `apple-health-records.svg`, `oura.svg`, `peloton.svg`, `orangetheory.svg`. Until a file exists the page shows the name as text. Follow each company's brand rules for using its mark (Apple has an official "Works with Apple Health" badge).

## Build 9 reshoot checklist

Build 9 changed the UI after Build 8 (18 commits on DEV, 11/5 and 11/6). Shoot everything once, after the UI is frozen and device-tested. Same device, dark mode, 9:41 clock, same demo data.

Reshoot (the screen changed):
- [ ] `score-health.png` (glass backdrop, gauge hero, personal normal range, verdict headline)
- [ ] `score-biological-age.png` (glass backdrop, gauge hero, estimate framing)
- [ ] `food.mp4` and `food-poster.jpg` (confirm serving, real serving sizes, water, Meals page)
- [ ] `training.mp4` and `training-poster.jpg` (Liquid Glass workout cards)
- [ ] `hero-watch.png` (score ring, new corner padding)
- [ ] `watch-start.png` (new +8 oz water button beside Workout)
- [ ] `watch-summary.png`
- [ ] `watch-live.png` (confirm nothing changed, then shoot)

Probably fine, but check against the new build first (chat, labs):
- [ ] `hero-phone.png`
- [ ] `ai-plan.png`
- [ ] `ai-meal.png`
- [ ] `ai-connected.png`
- [ ] `labs.png`

Note: this list comes from commit titles only. Open each screen in the new build before deciding.

## Checks before launch
- Oura appears in "Works with". Make sure Oura data shows up in real use first.
- Delete `<meta name="robots" content="noindex">` in `home-v2.html` when it replaces `index.html`.

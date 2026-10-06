# Deployment

getenva.ai is a static site on Firebase Hosting (`enva-ai-6afde` project),
with two small serverless functions in `functions/` for form delivery. This
project migrated off Vercel in October 2026 — see git history on
`public/waitlist.js`, `firebase.json`, and the `functions/` directory for
the full story if you need the reasoning behind any of this.

## One-time machine setup

- **Node 20**, via `nvm` — not whatever Node version is globally installed.
  The Firebase CLI's local function-discovery step has had real, reproducible
  failures on newer Node majors (v24) that go away under Node 20.
  ```
  nvm install 20
  nvm use 20
  ```
  Run `nvm use 20` fresh in every new terminal tab/window — it doesn't persist.

- **Firebase CLI**: `npm install -g firebase-tools`, then `firebase login`
  with the Google account that owns the `enva-ai-6afde` project.

- **Clone the repo outside `~/Desktop` and `~/Documents`.** iCloud Drive's
  "Desktop & Documents" sync actively syncs `.git` internals and has
  corrupted this repo's git objects before (`fatal: bad object`, `did not
  send all necessary objects`). `~/App_Development` or similar is fine.

## Deploying the site (static files)

```
firebase deploy --only hosting
```

Safe to run any time — uploads `public/` and applies the redirects/headers/
rewrites in `firebase.json`. Doesn't touch functions.

## Deploying the functions

**Always scope the deploy to the specific function(s) you're touching.**
This Firebase project also runs several unrelated Cloud Functions that
belong to the main app (`joinWaitlist`, `generateChat`, `generateInsight`,
`lookupFood`, `parseDocument`, `reportBug`, `logChatFeedback`,
`generateCompletion`, `seedPrompts`) — their source isn't in this repo.

Running bare `firebase deploy --only functions` treats this repo's
`functions/` folder as the *entire* desired state and will prompt to
**delete** every one of those functions, since it can't see their source.
If you ever see that prompt, answer **`N`** — always.

```
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..
firebase deploy --only functions:contactForm,functions:notifyWaitlistSignup
```

The `rm -rf node_modules && npm install` before deploying has reliably
fixed a recurring, otherwise-unexplained local failure
(`Cannot determine backend specification. Timeout after 10000`) — something
in a stale/partially-installed `node_modules` seems to break the Firebase
CLI's local discovery step. If a deploy fails with that exact error, redo
the clean install before troubleshooting anything else.

A Firestore-triggered function's first-ever deploy in a project can fail
once with an Eventarc permissions error ("we need a little bit longer to
finish setting everything up") — this is expected; wait ~5 minutes and
retry the same scoped deploy command.

## Secrets

`functions/index.js` needs `RESEND_API_KEY` (a Resend API key with
sending-only scope) to send email:

```
firebase functions:secrets:set RESEND_API_KEY
```

Optional overrides via env vars: `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`
(both default sensibly — see the comments in `functions/index.js`).

`getenva.ai` is a verified sending domain in Resend (DNS records live in
Cloudflare). The default sender, `contact@getenva.ai`, can deliver to any
recipient. Don't revert to the unverified `onboarding@resend.dev` sandbox
address — it can only deliver to the email the Resend account was signed
up with, which silently breaks delivery to `hello@getenva.ai`.

## What the two functions do

- **`contactForm`** (HTTP, rewritten from `/api/contact` by Firebase
  Hosting) — receives the support page's contact form submission, emails it
  to `hello@getenva.ai`. Replaces a function of the same name that existed
  in this project but was permanently broken (its Cloud Run image pointed
  at a different function's build artifact).

- **`notifyWaitlistSignup`** (Firestore trigger on `waitlist/{docId}`) —
  fires whenever `joinWaitlist` (external to this repo) writes a new
  document, and emails a notification to `hello@getenva.ai`. It's a pure
  read-only reaction to that collection; it never touches `joinWaitlist`
  itself. Because `joinWaitlist` uses the subscriber's email as the
  document ID, this only fires once per distinct email — a repeat signup
  overwrites the existing doc rather than creating a new one, so it won't
  re-notify.

## DNS (Cloudflare)

`getenva.ai`'s DNS is managed in Cloudflare. The hosting-related records are:

| Type | Name | Value |
|---|---|---|
| A | getenva.ai | 199.36.158.100 (Firebase Hosting) |
| TXT | getenva.ai | hosting-site=enva-ai-6afde (Firebase ownership verification) |

Proxy status on the `A` record must be **DNS only** (grey cloud) — Firebase
needs to see the real client IP directly to issue/renew its SSL
certificate.

Everything else in that DNS zone is unrelated and must not be touched when
working on hosting:
- `MX → smtp.google.com` — real email delivery (Google Workspace). Breaking
  this breaks all @getenva.ai email, not just this site.
- `rsend.getenva.ai` / `send.getenva.ai` CNAMEs, the SPF TXT record, and
  both `_domainkey` DKIM TXT records (`google._domainkey`,
  `resend._domainkey`) — email deliverability/verification for Google
  Workspace and Resend.
- `google-site-verification` TXT record.

## Data

Waitlist signups live in Firestore, collection `waitlist`, one document per
subscriber keyed by their email address. Fields: `email`, `source` (which
page they signed up from), `createdAt`. Browse/export directly in the
[Firebase console](https://console.firebase.google.com/project/enva-ai-6afde/firestore)
— no code needed to pull a list.

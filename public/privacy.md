---
title: "Privacy Policy | Enva"
description: "How Enva handles your health data: what stays on your device, what we collect, who we share it with, and the choices you control."
url: https://getenva.ai/privacy
markdown_url: https://getenva.ai/privacy.md
site: Enva
last_modified: 2026-11-13
---

# Privacy Policy

*Legal*

Last updated: November 13, 2026

Let's be straightforward with each other.

Most privacy policies are written to give companies the legal cover to do whatever they want with your data. Ours is written to explain exactly how little of your data we actually touch.

At Enva, we believe your health and fitness data belongs to you. This Privacy Policy explains how **Olympus Hills Ventures LLC** ("Company," "we," "our," or "us") handles information when you use [getenva.ai](https://getenva.ai/) (the "Site") and the Enva mobile application (the "Mobile App") (collectively, the "Services").

By using Enva, you agree to this Privacy Policy and our [Terms of Service](https://getenva.ai/terms). If you don't agree, please do not use the Services.

## 1. The Golden Rule: Your Raw Health Data Stays on Your Phone

We designed Enva so that we don't have to secure your sensitive health data on our servers — because we don't collect raw records in the first place.

- **Local storage.** When you connect Enva to Apple Health or other third-party integrations, that health and fitness data (like your heart rate, sleep metrics, and workout history) is imported and processed **locally on your device**. Individual timestamped records — discrete heart rate samples, GPS tracks, raw sleep stage events — never leave your phone.
- **Computed summaries, not raw records.** When AI features are enabled, Enva computes aggregate metrics from your data (like your weekly training load or your average sleep score) and sends that computed summary to our AI service to generate a response. The distinction matters: summaries are sent, raw records are not.
- **One exception: Garmin.** Garmin delivers your data by sending it to a server, not by letting your phone request it. If you connect a Garmin account, your Garmin data passes through our backend on its way to your phone. We keep it only until your phone has received it, as described in Section 2F.

## 2. Information We Actually Collect (And Why)

While your health data stays on your phone, we do collect a limited amount of information to keep the app running, offer customer support, and figure out how to improve the product.

**A. Information you provide directly**

- **Account and contact info:** If you create an account or email us for support, we collect your name, email address, and the contents of your message.
- **Payment information:** We do not collect or see your credit card information. Subscriptions are handled entirely through the Apple App Store, subject to Apple's privacy policy.

**B. Information collected automatically (app analytics)**

- **Usage data:** We collect anonymized, non-personally identifiable data about how you use the app (for example, which screens you visit, what features you use, and session frequency). This data does not contain health information.
- **Device data:** Basic information like your device model, iOS version, and app version — used for crash analysis and compatibility.
- **Analytics vendor:** We use PostHog for product analytics. Analytics is opt-in: you are asked during onboarding and can change your preference in Settings. PostHog receives an anonymous rotating session ID — not your name, email, or Apple ID. No health data is included.

**C. Bug reports and crash diagnostics**

- **MetricKit:** If the app crashes or hangs, Apple's MetricKit framework produces a diagnostic report (crash or hang type, technical stack traces, app version, OS version, device model). The app forwards that report to our backend on Google Cloud. No health data is included.
- **Report a Bug:** If you submit a bug report through Settings → Report a Bug, we collect your written description, up to 30 recent in-app events (a breadcrumb log of actions, not health records), your device model and OS version, and optionally a screenshot you choose to attach. This is sent to our backend and retained for up to 12 months for debugging purposes.

**D. AI-generated inferences**

When you use AI features, Enva computes inferences from your health data — such as a recovery score, a training load estimate, or a wellness insight — entirely on your device. These inferences may be included in the computed summary sent to our AI service (see §3), but the underlying raw health records are not transmitted.

**E. AI feedback and support tickets**

- **Thumbs up or down:** When you rate an AI response, Enva records which part of the app it was given in, which version of the prompt produced it, and your anonymous device ID. It does not include your question, the reply, or any health data. Ratings are kept for up to 90 days.
- **Support tickets:** After a thumbs-down you can open a ticket. If you tap Send, we receive what you wrote, an optional reason, your device model, iOS and app version, language and time zone, and recent in-app events (a breadcrumb log of actions, not health records). The ticket is stored and emailed to support@getenva.ai, and is kept for up to 12 months. A screenshot is included only if you attach one. It is emailed to support and is not stored in our database. The app never takes one on its own.

## 2F. Accounts and data you connect

Enva can connect to other health and fitness services, each only with your permission. Any sign-in information for a connected service, such as a password or an access token, is stored in the iOS Keychain on your iPhone. It stays in the iOS Keychain. For a service that needs a secret the app cannot hold, such as Oura, your sign-in code passes through our backend once so that it can complete the sign-in. Our backend does not store or log it. Garmin works differently, as described below. You can disconnect any service at any time, which removes that sign-in information from your device.

Data from connected services, including Apple Health, is processed on your device in the same way as the rest of your health data (see Section 1). It is never used for advertising or marketing, never sold, and never shared with data brokers.

If you log food or water in Enva, Enva can also write those entries to Apple Health, only with your permission. Delete All Data in Enva does not remove anything from Apple Health, including entries Enva wrote there. You can delete those in the Health app under Sharing, then Apps, then Enva.

**Garmin.** If you connect a Garmin account, Enva receives the Garmin Connect data you choose to share: sleep, heart rate variability, resting heart rate, stress, Body Battery, steps, and activities. Garmin sends this data to our backend on Google Cloud, which holds it only so that your phone can collect it. We delete each record from our servers once your phone has received it, and we delete anything your phone has not collected within 30 days. After that it is stored and processed on your device like the rest of your health data.

- **How we use it.** Only to show you your own sleep, recovery, and training insights in Enva. We do not sell it, license it, share it with data brokers, or use it for advertising or marketing.
- **Who handles it.** Google Cloud (backend hosting and temporary storage) and, only if you have turned on Garmin data for Enva Intelligence, Anthropic (AI processing, see Section 3). No one else receives it.
- **What you control in Garmin.** Garmin Connect lets you choose which categories of data you share with Enva, and you can revoke Enva's access there at any time.
- **Disconnect and delete.** Disconnecting Garmin in Enva (Settings, Connected Accounts), or removing Enva in Garmin Connect, stops new data and deletes any Garmin data we still hold, along with your Garmin sign-in tokens on our servers. Delete All Data in Enva removes Garmin data stored on your device. To ask us to delete anything else, email [privacy@getenva.ai](mailto:privacy@getenva.ai).
- **Access, correction and export.** What Enva shows you is visible in the app. Your original Garmin data stays with Garmin, so ask Garmin for a copy or to correct it.

## 3. Enva Intelligence — How AI Features Work

Enva Intelligence is opt-in. If you choose not to enable it during onboarding, no health data ever leaves your device for AI processing. You can also disable it at any time after onboarding by going to **Settings → Enva Intelligence** in the app. Disabling the feature stops all future AI transmissions; it does not delete insights already generated or your local conversation history. If you do enable it, here is exactly what happens:

**What is sent — tiered by feature:**

- **All AI features** include a biometric baseline: recent HRV, resting heart rate, sleep score, recovery score, VO₂ Max estimate, and training load metrics — all as computed aggregates, never as raw timestamped records.
- **Body and Insights features** additionally include: weight, BMI, and body fat percentage (if you've entered them), and nutrition macro totals.
- **AI Chat** additionally includes: blood work values you've imported, goal notes you've typed, and the messages in your current conversation.
- **Workout analysis** additionally includes: session notes you've typed for that workout.
- **Recipes and meals** include what you type or paste to use them: a description of a meal, a pasted recipe, the ingredients you have, how long you have, and any foods to avoid. Screenshots of recipes are read on your phone first, and only the text is sent. Our backend uses this only to produce the result. It does not store it or write it to its logs.

**How the data travels — two paths:**

- **Most features.** The context block is sent from the app to our backend (Google Cloud, us-central1 region), which forwards it to our AI service provider to generate your response. The backend does not keep your health context. It keeps two short-lived items: the insight it just generated, for up to a day so that reopening a screen is instant, and, if a generated reply fails a safety check, a copy of that reply for up to 30 days so we can fix the prompt.
- **Photos and documents.** If you import a photo or file, such as a body scan, a lab report or a workout screenshot, the image or its text is sent from your phone to our backend, which passes it to our AI service provider to read it. It is not stored on our backend after the result comes back.

**Device identity.** Your app is associated with an anonymous Firebase device ID — a stable per-install identifier used for AI quota tracking and to associate your conversation history within the app. This ID is not linked to your name, Apple ID, or email address. It is stored in your device's Keychain and survives app updates but is reset on reinstall.

**What our AI service provider does not do.** Your data is not retained by our AI service provider after your response is generated, and is not used to train AI models. For details, refer to our AI service provider's data processing terms.

**AI transparency statement: Garmin data.** Garmin data is included in an AI request only if you turn on **Settings, Enva Intelligence, Use Garmin data**, which is off by default. When it is on, computed summaries from your Garmin data (for example, your average sleep or Body Battery) can be part of the context sent to our AI service provider, Anthropic, to generate your response. Raw Garmin records are not sent. You can turn this off at any time, and it stops all future use of Garmin data in AI requests. Garmin data, and anything derived from it, is never used to train, evaluate, or improve AI models, by us or by our AI service provider.

**Conversation history.** Your AI chat history is stored locally on your device. It is not stored on our servers. If you delete the app, your conversation history is gone.

**Reproductive health.** Reproductive health data (menstrual cycle, fertility metrics) is not included in any AI context block by default. It stays on your device unless you explicitly type it into a chat message.

## 4. How We Share Your Information

We do not sell your personal information. Ever.

We only share the limited data we collect (like your email or anonymized analytics) in the following scenarios:

- **Service providers:** With trusted vendors who help us operate the Services, including:

  - **Google Cloud** — backend infrastructure and Firebase services (anonymous device authentication and the backend that routes AI requests). Governed by Google Cloud's Data Processing Addendum.
  - **PostHog** — product analytics (opt-in only; receives an anonymous session ID and event names, no health data).
  - **Apple** — subscription billing via the App Store and MetricKit crash diagnostics.
  - **Anthropic**: our AI service provider. Processes computed health summaries on our behalf to generate AI responses when you have enabled Enva Intelligence, and processes Garmin summaries only if you have also turned on Garmin data for AI. See §3 for details.
- **Legal compliance:** If we are legally required to do so by a valid court order, subpoena, or law enforcement request. We will notify you of any compelled disclosure to the extent permitted by law.
- **Business transfers:** If Olympus Hills Ventures LLC is acquired, merged, or sold, your contact and analytics data (but not your on-device health data) may be transferred as a business asset. Any successor will be bound to treat your data under terms no less protective than this policy.

## 5. Security and Data Retention

We use commercially reasonable security measures, including AES-256 encryption at rest and TLS in transit, to protect the limited data we do hold.

- **Health data on-device:** Stored in an encrypted SwiftData database protected by iOS file protection. You control retention — when you delete the Enva app, your local data is permanently deleted.
- **Garmin data in transit:** Held on our servers only until your phone has collected it, then deleted, and in any case deleted within 30 days.
- **Bug reports:** Retained for up to 12 months and then deleted.
- **AI feedback:** Ratings are kept for up to 90 days and support tickets for up to 12 months, then deleted.
- **Generated insights and rejected replies:** A generated insight is kept for up to a day. A reply that fails a safety check is kept for up to 30 days.
- **PostHog analytics:** Retained in anonymized, aggregated form. No health data is included.
- **Crash reports (MetricKit):** Retained for up to 12 months and then deleted.
- **Subscription and contact data:** Retained as long as your account is active or as required by law.

## 6. Children's Privacy

Enva is intended for users who are **18 years of age or older**. You must be at least 18 to create an account and use the Services. We do not knowingly collect personal information from anyone under 18. If we learn that a user under 18 has accessed the Services, we will terminate that account and delete any associated data promptly. If you believe a minor has used Enva, please contact us at [privacy@getenva.ai](mailto:privacy@getenva.ai).

## 7. U.S. State Privacy Rights

Many U.S. states have enacted comprehensive consumer privacy laws. If you are a resident of California, Utah, Colorado, Virginia, Texas, Washington, or another state with applicable privacy legislation, you have specific rights regarding your personal data.

Because we do not store your raw health data on our servers, these rights primarily apply to the data we do hold: your email address, support correspondence, analytics profile, and any bug report or feedback data.

Your health and workout data lives on your phone. You can see everything you entered in Enva, and everything you connected from Apple Health, Peloton or Orangetheory, in the app. That data is yours. These are your rights, and how they work here:

- **Right to know or access:** Everything you entered or connected is visible in the app, and you can save what you entered as a backup file from Settings (Backup and Restore), on any plan, at no charge. For the limited data we hold (your email address, support messages, bug and feedback reports, and the device ID if you give it to us), email us and we will tell you what we have. We can only find data linked to an email address or device ID you provide.
- **Right to delete:** Your health data is on your phone, and you can erase it at any time with Settings, Delete All Data, or by deleting the app. We hold very little else (see Section 2). If you email [privacy@getenva.ai](mailto:privacy@getenva.ai), we will delete anything we can find linked to your email address or device ID, or tell you we have nothing.
- **Right to correct:** You can edit or remove any entry in the app. For the data we hold, ask us.
- **Right to opt out of sale or sharing:** We do not sell or share your personal data for targeted advertising. This right is satisfied by our practices.
- **Right to data portability:** The backup file holds what you entered yourself in Enva: manually logged workouts, strength sets, nutrition, supplements and blood work. Data from Apple Health, Peloton, Orangetheory and other connected services stays with those services, so ask them for a copy of it. We do not charge for any of this, and we do not make privacy requests depend on your subscription plan.

**Scores and calculations.** Enva calculates scores and estimates from your data on your device, such as the Enva Health Score, recovery, and VO2 Max estimates, and shows them to you in the app. We do not keep them on our servers. The methods behind them are proprietary, so the backup file and our responses to requests do not include our formulas or how they are built. Some calculated values may be saved with your records on your device and may appear in a backup file. We will honor your rights as applicable law requires.

**Washington My Health MY Data Act (MHMDA) and similar state health data laws.** Enva processes certain health data as defined under state-level health privacy statutes, including biometric and fitness data. We collect and process this data only with your authorization, use it only to provide the Services, and do not sell it. To the extent state law grants additional rights with respect to health data, we honor those rights. Requests can be submitted to [hello@getenva.ai](mailto:hello@getenva.ai).

To exercise any of these rights, email us at [privacy@getenva.ai](mailto:privacy@getenva.ai). We will respond within 45 days. We will not discriminate against you for exercising your privacy rights.

**Website analytics.** To understand how many people visit getenva.ai and which pages they read, we use Cloudflare Web Analytics. It does not use cookies and does not track you across other websites. It collects page-view information such as the page visited, referring site, country and browser type. It is not used in the Enva mobile app. When you join the waitlist, we also save the website that referred you and any campaign tags in the link you used (for example, which post it came from), alongside your email address, so we can see which channels bring people to Enva.

**"Do Not Track" and Global Privacy Control.** We do not track users across third-party websites. We honor Global Privacy Control (GPC) signals for website analytics.

## 8. International Users

Enva currently operates only in the United States. The app and website are intended for people located in the United States, and we do not offer Enva in the European Economic Area, the United Kingdom, or Switzerland.

If you use Enva or contact us from outside the United States, the limited data we hold (your email address, support messages, and bug and feedback reports) is processed in the United States, and U.S. law applies to how we handle it. If we later offer Enva in other countries, we will update this policy before we do, including how people there can exercise their rights.

Questions about your data can be sent to [privacy@getenva.ai](mailto:privacy@getenva.ai).

## 9. Third-Party Links

Enva may contain links to other websites or services, like Apple Health or research articles. We don't control those third parties, and this Privacy Policy does not apply to them. Please read their privacy policies before sharing your data.

## 10. Changes to this Policy

We may update this Privacy Policy from time to time. For non-material changes (typo corrections, clarifications that do not affect your rights), we will update the "Last updated" date at the top of this page. For material changes — changes that affect what data we collect, how we use it, or who we share it with — we will provide at least 30 days' notice through a prominent in-app notice before the change takes effect. Your continued use of Enva after the effective date of a material change constitutes your acceptance of the updated policy.

## 11. Contact Us

If you have any questions, concerns, or requests regarding your privacy, please reach out to us:

**Olympus Hills Ventures LLC**  
7533 S Center View Ct # R  
West Jordan, Utah 84084  
Privacy requests: [privacy@getenva.ai](mailto:privacy@getenva.ai)  
Everything else: [support@getenva.ai](mailto:support@getenva.ai)  
Website: [getenva.ai](https://getenva.ai/)

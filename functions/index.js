// Enva — support page contact form delivery.
//
// The form used to just open a mailto: link and hope the visitor's own mail
// client sent it, with no way to know whether it actually did. This function
// gives it a real, verifiable delivery path: it emails the submission to
// CONTACT_TO_EMAIL via Resend and only reports success once Resend accepts
// it. Firebase Hosting rewrites /api/contact to this function (see
// firebase.json), so the front end never needs to know it moved off Vercel.
//
// Deployed as "contactForm" deliberately — a function by that name already
// existed in this project but its Cloud Run image reference was broken
// (pointed at the join_waitlist image), so it never actually ran. Deploying
// this file under the same name replaces it with a working implementation
// instead of leaving an orphaned, undeployable function behind.
//
// Requires the RESEND_API_KEY secret (firebase functions:secrets:set
// RESEND_API_KEY). Optional env overrides: CONTACT_TO_EMAIL,
// CONTACT_FROM_EMAIL (use a verified sender on your own domain in
// production — the default onboarding@resend.dev address only delivers to
// the email the Resend account was signed up with).

const { onRequest } = require('firebase-functions/v2/https');

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'hello@getenva.ai';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Enva Contact Form <onboarding@resend.dev>';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.contactForm = onRequest(
  { region: 'us-central1', cors: true, secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      res.status(405).json({ ok: false, error: 'method not allowed' });
      return;
    }

    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    // Honeypot field: real visitors never fill this in.
    if (body.company) {
      res.status(200).json({ ok: true });
      return;
    }

    if (!name || !EMAIL.test(email) || !message) {
      res.status(400).json({ ok: false, error: 'invalid input' });
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('contactForm: RESEND_API_KEY is not configured');
      res.status(500).json({ ok: false, error: 'not configured' });
      return;
    }

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TO_EMAIL],
          reply_to: email,
          subject: 'Enva support' + (topic ? ' — ' + topic.slice(0, 80) : ''),
          text: name + ' <' + email + '>\n\n' + message
        })
      });

      if (!resendRes.ok) {
        console.error('contactForm: Resend rejected the email', resendRes.status, await resendRes.text());
        res.status(502).json({ ok: false, error: 'delivery failed' });
        return;
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('contactForm: failed to send email', err);
      res.status(502).json({ ok: false, error: 'delivery failed' });
    }
  }
);

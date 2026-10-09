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
// RESEND_API_KEY). Optional env overrides: CONTACT_TO_EMAIL (support@),
// WAITLIST_NOTIFY_EMAIL (hello@),
// CONTACT_FROM_EMAIL. getenva.ai is verified in Resend, so the default
// sender below works for any recipient.
//
// notifyWaitlistSignup, below, is a second, independent function: it fires
// whenever joinWaitlist (an existing function this repo doesn't own) writes
// a new document to the "waitlist" Firestore collection, and emails a
// notification to WAITLIST_NOTIFY_EMAIL (hello@getenva.ai). It never touches joinWaitlist itself.

const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'support@getenva.ai';
const WAITLIST_NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL || 'hello@getenva.ai';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Enva <hello@getenva.ai>';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function sendEmail({ to, subject, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      reply_to: replyTo,
      subject,
      text
    })
  });

  if (!resendRes.ok) {
    throw new Error('Resend rejected the email: ' + resendRes.status + ' ' + (await resendRes.text()));
  }
}

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

    try {
      await sendEmail({
        to: TO_EMAIL,
        subject: 'Enva support' + (topic ? ' — ' + topic.slice(0, 80) : ''),
        text: name + ' <' + email + '>\n\n' + message,
        replyTo: email
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('contactForm: failed to send email', err);
      res.status(502).json({ ok: false, error: 'delivery failed' });
    }
  }
);

// Fires whenever joinWaitlist writes a new signup to Firestore. Document ID
// is the subscriber's email (joinWaitlist uses it as the key), so a repeat
// signup overwrites the same doc rather than creating a new one — meaning
// this only fires once per distinct email, not once per submission.
exports.notifyWaitlistSignup = onDocumentCreated(
  { document: 'waitlist/{docId}', region: 'us-central1', secrets: ['RESEND_API_KEY'] },
  async (event) => {
    const data = event.data ? event.data.data() : {};
    const email = data.email || event.params.docId;
    const source = data.source || 'unknown';

    try {
      await sendEmail({
        to: WAITLIST_NOTIFY_EMAIL,
        subject: 'New waitlist signup: ' + email,
        text: 'Email: ' + email + '\nSource: ' + source
      });
    } catch (err) {
      console.error('notifyWaitlistSignup: failed to send email', err);
    }
  }
);

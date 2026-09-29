// Enva — support page contact form delivery.
//
// The form used to just open a mailto: link and hope the visitor's own mail
// client sent it, with no way to know whether it actually did. This function
// gives it a real, verifiable delivery path: it emails the submission to
// CONTACT_EMAIL via Resend and only reports success once Resend accepts it.
//
// Requires RESEND_API_KEY in the Vercel project's environment variables.
// Optional overrides: CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL (use a verified
// sender on your own domain in production — the default onboarding@resend.dev
// address only delivers to the email the Resend account was signed up with).

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'hello@getenva.ai';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Enva Contact Form <onboarding@resend.dev>';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  // Honeypot field: real visitors never fill this in.
  if (body.company) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !EMAIL.test(email) || !message) {
    return res.status(400).json({ ok: false, error: 'invalid input' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('contact: RESEND_API_KEY is not configured');
    return res.status(500).json({ ok: false, error: 'not configured' });
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
      console.error('contact: Resend rejected the email', resendRes.status, await resendRes.text());
      return res.status(502).json({ ok: false, error: 'delivery failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: failed to send email', err);
    return res.status(502).json({ ok: false, error: 'delivery failed' });
  }
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

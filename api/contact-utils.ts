import type { ServerResponse } from 'node:http';
import { readJsonBody, sendJson, type ApiRequest } from './request-utils.js';

/**
 * POST /api/contact — emails a contact form submission to Josh through Resend.
 * Shared by the Vercel function (api/contact.ts) and the Vite dev middleware.
 *
 * Request body: { name, email, message }
 * Response: JSON { message } with 200 once sent, 400 for missing fields, 503 when
 * RESEND_API_KEY is unset (nothing is sent), 500 when Resend rejects the email.
 */

const RESEND_URL = 'https://api.resend.com/emails';
const TO = 'joshuahawksworth@me.com';

export type ContactFields = { name: string; email: string; message: string };

/** The trimmed fields of a submission, or null when any is missing or not a string. */
export function parseContact(input: unknown): ContactFields | null {
  if (!input || typeof input !== 'object') return null;
  const { name, email, message } = input as Record<string, unknown>;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return null;
  }
  const fields = { name: name.trim(), email: email.trim(), message: message.trim() };
  return fields.name && fields.email && fields.message ? fields : null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The Resend payload for a submission; visitor text is escaped before it goes into the HTML. */
export function contactEmail({ name, email, message }: ContactFields) {
  return {
    from: 'Portfolio Contact <onboarding@resend.dev>',
    to: TO,
    reply_to: email,
    subject: `Portfolio Contact from ${name}`,
    html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
  };
}

/**
 * Answers one /api/contact request. `apiKey` is RESEND_API_KEY; without it the route answers
 * 503 and sends nothing, so local development never emails Josh by accident.
 */
export async function handleContact(
  req: ApiRequest,
  res: ServerResponse,
  apiKey: string | undefined,
  fetchImpl: typeof fetch = fetch
) {
  if (req.method !== 'POST') return sendJson(res, 405, { message: 'Method not allowed' });

  const fields = parseContact(await readJsonBody(req));
  if (!fields) return sendJson(res, 400, { message: 'Missing required fields' });

  const key = apiKey?.trim();
  if (!key) {
    return sendJson(res, 503, {
      error: 'contact_unconfigured',
      message: 'Contact form is not configured (RESEND_API_KEY is unset); nothing was sent.',
    });
  }

  try {
    const response = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(contactEmail(fields)),
    });
    if (!response.ok) throw new Error(`Resend answered ${response.status}`);
    return sendJson(res, 200, { message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return sendJson(res, 500, { message: 'Failed to send email' });
  }
}

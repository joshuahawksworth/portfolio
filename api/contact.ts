import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleContact } from './contact-utils.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleContact(req, res, process.env.RESEND_API_KEY);
}

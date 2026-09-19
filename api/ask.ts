import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAsk } from './ask-utils.js';

export const config = { maxDuration: 30 };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleAsk(req, res, process.env.ANTHROPIC_API_KEY);
}

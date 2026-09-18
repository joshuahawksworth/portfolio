import type { IncomingMessage, ServerResponse } from 'node:http';

/** A Node request, plus the pre-parsed `body` Vercel attaches when its helpers are enabled. */
export type ApiRequest = IncomingMessage & { body?: unknown };

/**
 * The JSON body of a request, or null when it is missing or malformed. Uses the parsed body
 * when the platform provided one, and reads the stream otherwise (Vercel with
 * NODEJS_HELPERS=0, and the Vite dev middleware).
 */
export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  const raw = req.body;
  if (raw !== undefined && raw !== null && raw !== '') {
    if (typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

export function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

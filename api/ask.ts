import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { jobsContent, type JobContent } from '../src/data/experienceContent.js';

/**
 * POST /api/ask — streams a Claude reply for the "Ask Josh" portfolio assistant.
 *
 * Request body: { messages: [{ role: 'user' | 'assistant', content: string }] }
 * Response: text/plain streamed in chunks (the assistant's reply), or a JSON
 * error such as { error: 'assistant_unconfigured' } when ANTHROPIC_API_KEY is unset.
 */

export const config = { maxDuration: 30 };

const MODEL = 'claude-opus-5';
const MAX_TOKENS = 700;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 2000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const CONTACT = {
  email: 'joshuahawksworth@me.com',
  github: 'github.com/joshuahawksworth',
  linkedin: 'linkedin.com/in/joshuahawksworth',
  location: 'Manchester, UK',
};

type ChatRole = 'user' | 'assistant';

// ── Portfolio data ────────────────────────────────────────────────────────────
// experienceContent.ts is pure text (no image imports), so Node can load it directly.
const SYSTEM_PROMPT = buildSystemPrompt(jobsContent);

// ── System prompt ─────────────────────────────────────────────────────────────
function serialiseJobs(jobs: JobContent[]): string {
  if (jobs.length === 0) return '(Experience details are unavailable right now.)';
  return jobs
    .map((job) => {
      const projects = job.projects
        .map(
          (p) =>
            `  - ${p.name}: ${p.description}${p.externalProjectLink ? ` (${p.externalProjectLink})` : ''}`
        )
        .join('\n');
      return [
        `### ${job.role} at ${job.company} (${job.period})`,
        `Skills: ${job.skills.join(', ')}`,
        `Summary: ${job.summary}`,
        'Responsibilities:',
        ...job.responsibilities.map((r) => `  - ${r}`),
        'Projects:',
        projects,
      ].join('\n');
    })
    .join('\n\n');
}

function buildSystemPrompt(jobs: JobContent[]): string {
  const allSkills = Array.from(new Set(jobs.flatMap((job) => job.skills)));
  return `You are Josh's portfolio assistant, embedded in the "Ask Josh" app on Joshua Hawksworth's interactive macOS-style portfolio website. You answer questions from visitors (recruiters, hiring managers, fellow developers) about Josh's experience, skills, projects and how to get in touch.

## About Josh
- Name: Joshua Hawksworth. Senior full stack developer based in ${CONTACT.location}.
- Specialises in React, React Native and TypeScript across web and mobile, with backend experience in Node, PHP/Laravel and cloud tooling.
- Contact: email ${CONTACT.email}, GitHub ${CONTACT.github}, LinkedIn ${CONTACT.linkedin}.

## Skills mentioned across roles
${allSkills.join(', ')}

## Work experience (most recent first)
${serialiseJobs(jobs)}

## How to answer
- Be concise and friendly. Prefer short paragraphs or bullet lists; most answers should be under 150 words.
- Only use the facts above. Never invent employers, dates, clients, metrics or technologies. If something isn't covered, say you don't know and suggest contacting Josh directly.
- Refer to Josh in the third person ("Josh has…", "Josh built…").
- When it helps, suggest opening the relevant portfolio app in the dock: Experience (full role details), Skills (tech stack), Contact (send Josh a message) or GitHub (code).
- Politely decline requests unrelated to Josh's work (general coding help, trivia, other people, anything sensitive) in one sentence and steer back to what you can help with.
- Use plain markdown only: **bold** and "-" bullet lists. No headings, tables or code blocks.`;
}

// ── Request helpers ───────────────────────────────────────────────────────────
async function readBody(req: VercelRequest): Promise<unknown> {
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

function normaliseMessages(input: unknown): Anthropic.MessageParam[] | null {
  if (!input || typeof input !== 'object') return null;
  const raw = (input as { messages?: unknown }).messages;
  if (!Array.isArray(raw)) return null;

  const cleaned: Anthropic.MessageParam[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const text = content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (text) cleaned.push({ role: role as ChatRole, content: text });
  }

  const recent = cleaned.slice(-MAX_MESSAGES);
  while (recent.length > 0 && recent[0].role !== 'user') recent.shift();
  if (recent.length === 0 || recent[recent.length - 1].role !== 'user') return null;
  return recent;
}

const rateStore = globalThis as typeof globalThis & { __askRateLimit?: Map<string, number[]> };

function isRateLimited(ip: string): boolean {
  if (!rateStore.__askRateLimit) rateStore.__askRateLimit = new Map();
  const store = rateStore.__askRateLimit;
  const now = Date.now();
  const recent = (store.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    store.set(ip, recent);
    return true;
  }
  recent.push(now);
  store.set(ip, recent);
  if (store.size > 5000) {
    for (const [key, times] of store) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) store.delete(key);
    }
  }
  return false;
}

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return first?.trim() || req.socket?.remoteAddress || 'unknown';
}

function sendJson(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Anthropic-Key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  // Visitors may bring their own key (never logged or stored); otherwise use the site's.
  const headerKey = req.headers['x-anthropic-key'];
  const visitorKey = (Array.isArray(headerKey) ? headerKey[0] : headerKey)?.trim();
  if (visitorKey && !/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(visitorKey)) {
    return sendJson(res, 401, { error: 'invalid_key' });
  }
  const apiKey = visitorKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: 'assistant_unconfigured' });

  if (isRateLimited(clientIp(req))) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_WINDOW_MS / 1000)));
    return sendJson(res, 429, { error: 'rate_limited' });
  }

  const messages = normaliseMessages(await readBody(req));
  if (!messages) return sendJson(res, 400, { error: 'invalid_messages' });

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 });
  const system = SYSTEM_PROMPT;
  let wroteAnything = false;

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
    });

    stream.on('text', (delta) => {
      if (!wroteAnything) {
        wroteAnything = true;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.flushHeaders();
      }
      res.write(delta);
    });

    const final = await stream.finalMessage();

    if (!wroteAnything) {
      const fallback =
        final.stop_reason === 'refusal'
          ? "I can't help with that one, but I'm happy to talk about Josh's experience, skills or projects."
          : "I didn't manage to put together a reply — please try asking again.";
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end(fallback);
    }
    return res.end();
  } catch (err) {
    console.error('ask: Claude request failed', err);
    if (wroteAnything) {
      return res.end('\n\n_(The reply was cut short — please try again.)_');
    }
    if (
      err instanceof Anthropic.AuthenticationError ||
      err instanceof Anthropic.PermissionDeniedError
    ) {
      return sendJson(res, visitorKey ? 401 : 503, {
        error: visitorKey ? 'invalid_key' : 'assistant_unavailable',
      });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return sendJson(res, 429, { error: 'rate_limited' });
    }
    if (err instanceof Anthropic.APIError) {
      return sendJson(res, 502, { error: 'assistant_error' });
    }
    return sendJson(res, 500, { error: 'assistant_error' });
  }
}

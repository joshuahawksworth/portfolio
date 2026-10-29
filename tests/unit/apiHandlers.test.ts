import { Readable } from 'node:stream';
import type { ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { handleAsk, normaliseMessages } from '../../api/ask-utils';
import { contactEmail, handleContact, parseContact } from '../../api/contact-utils';
import type { ApiRequest } from '../../api/request-utils';

function request(method: string, body?: unknown, headers: Record<string, string> = {}): ApiRequest {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  return Object.assign(req, { method, headers, socket: { remoteAddress: '127.0.0.1' } }) as never;
}

function response() {
  const headers: Record<string, string> = {};
  let text = '';
  const res = {
    statusCode: 200,
    setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = v),
    end: (chunk?: string) => void (text += chunk ?? ''),
  };
  return {
    res: res as unknown as ServerResponse,
    status: () => res.statusCode,
    json: () => JSON.parse(text) as Record<string, unknown>,
    headers,
  };
}

const VALID = { name: 'Ada', email: 'ada@example.com', message: 'Hello\nthere' };

describe('/api/contact', () => {
  it('answers 503 and sends nothing when RESEND_API_KEY is absent', async () => {
    const fetchImpl = vi.fn();
    const out = response();
    await handleContact(request('POST', VALID), out.res, undefined, fetchImpl);
    expect(out.status()).toBe(503);
    expect(out.json().error).toBe('contact_unconfigured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects missing fields and other methods', async () => {
    const missing = response();
    await handleContact(request('POST', { name: 'Ada' }), missing.res, 'key', vi.fn());
    expect(missing.status()).toBe(400);

    const get = response();
    await handleContact(request('GET'), get.res, 'key', vi.fn());
    expect(get.status()).toBe(405);
  });

  it('sends the email through Resend with the key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const out = response();
    await handleContact(request('POST', VALID), out.res, 're_key', fetchImpl);
    expect(out.status()).toBe(200);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_key');
    expect(JSON.parse(init.body).reply_to).toBe('ada@example.com');
  });

  it('reports a Resend failure as 500', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 422 }));
    const out = response();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await handleContact(request('POST', VALID), out.res, 're_key', fetchImpl);
    expect(out.status()).toBe(500);
  });

  it('uses a pre-parsed body when the platform provides one', async () => {
    const req = Object.assign(request('POST'), { body: VALID });
    const out = response();
    await handleContact(req, out.res, undefined, vi.fn());
    expect(out.status()).toBe(503);
  });

  it('parses and escapes the submission', () => {
    expect(parseContact({ name: ' ', email: 'a@b.c', message: 'hi' })).toBeNull();
    expect(parseContact({ name: 1, email: 'a@b.c', message: 'hi' })).toBeNull();
    const html = contactEmail({ name: '<b>Ada</b>', email: 'a@b.c', message: 'x\ny' }).html;
    expect(html).toContain('&lt;b&gt;Ada&lt;/b&gt;');
    expect(html).toContain('x<br>y');
  });
});

describe('/api/ask', () => {
  it('answers 503 assistant_unconfigured without a site or visitor key', async () => {
    const out = response();
    await handleAsk(request('POST', { messages: [{ role: 'user', content: 'Hi' }] }), out.res, '');
    expect(out.status()).toBe(503);
    expect(out.json().error).toBe('assistant_unconfigured');
  });

  it('rejects a malformed visitor key before calling Anthropic', async () => {
    const out = response();
    const req = request('POST', { messages: [] }, { 'x-anthropic-key': 'nope' });
    await handleAsk(req, out.res, undefined);
    expect(out.status()).toBe(401);
  });

  it('only accepts POST', async () => {
    const out = response();
    await handleAsk(request('GET'), out.res, 'key');
    expect(out.status()).toBe(405);
  });

  it('keeps a conversation that starts and ends with the user', () => {
    expect(normaliseMessages({ messages: [{ role: 'assistant', content: 'Hi' }] })).toBeNull();
    expect(
      normaliseMessages({
        messages: [
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: ' Who is Josh? ' },
        ],
      })
    ).toEqual([{ role: 'user', content: 'Who is Josh?' }]);
  });
});

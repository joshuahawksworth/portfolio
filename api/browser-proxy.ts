import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  FETCH_TIMEOUT_MS,
  STRIP_HEADERS,
  errorPage,
  isBlockedTarget,
  processHtml,
} from './browser-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).send('Missing url');

  let target: string;
  try {
    target = decodeURIComponent(url);
    new URL(target);
  } catch {
    return res.status(400).send('Invalid URL');
  }

  if (isBlockedTarget(new URL(target))) {
    return res
      .status(403)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .send(
        errorPage(
          target,
          "This site can't be reached",
          'Only public http and https addresses can be opened here.',
          'ERR_BLOCKED_BY_CLIENT'
        )
      );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    // Sites behind a bot wall or a hard error would render as a broken page; show why.
    if (upstream.status >= 400 && contentType.includes('text/html')) {
      const reason =
        upstream.status === 403 || upstream.status === 401
          ? 'The site refused this request. Many sites block embedded browsers or need you to sign in.'
          : upstream.status === 404
            ? 'The page could not be found on the site.'
            : upstream.status === 429
              ? 'The site is asking for a pause before more requests.'
              : 'The site returned an error instead of the page.';
      return res
        .status(200)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(
          errorPage(
            target,
            `${new URL(target).hostname} sent back an error`,
            reason,
            `HTTP ${upstream.status}`
          )
        );
    }

    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (!STRIP_HEADERS.has(k) && k !== 'set-cookie' && k !== 'content-length') {
        try {
          res.setHeader(key, value);
        } catch {
          /* skip */
        }
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');

    if (contentType.includes('text/html')) {
      // Follow redirects to their final address so relative links resolve correctly.
      const finalUrl = upstream.url || target;
      const html = processHtml(await upstream.text(), finalUrl);
      return res
        .status(upstream.status)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(html);
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buf);
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .send(
        errorPage(
          target,
          aborted
            ? `${new URL(target).hostname} took too long to respond`
            : "This site can't be reached",
          aborted
            ? 'The page did not answer within 12 seconds. It may be slow, or it may not allow embedded browsers.'
            : 'The address could not be resolved or the connection was refused.',
          aborted ? 'ERR_TIMED_OUT' : 'ERR_CONNECTION_REFUSED'
        )
      );
  }
}

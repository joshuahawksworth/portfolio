import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { searchWeb } from './api/search-utils';
import {
  FETCH_TIMEOUT_MS,
  STRIP_HEADERS,
  errorPage,
  isBlockedTarget,
  processHtml,
} from './api/browser-utils';

function browserProxyPlugin(): Plugin {
  return {
    name: 'browser-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/browser-proxy', async (req, res) => {
        try {
          const qs = req.url?.split('?')[1] ?? '';
          const raw = new URLSearchParams(qs).get('url');
          if (!raw) {
            res.statusCode = 400;
            res.end('Missing url');
            return;
          }

          const target = decodeURIComponent(raw);
          if (isBlockedTarget(new URL(target))) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(
              errorPage(
                target,
                "This site can't be reached",
                'Only public http and https addresses can be opened here.',
                'ERR_BLOCKED_BY_CLIENT'
              )
            );
            return;
          }

          const upstream = await fetch(target, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
          });

          const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';

          if (upstream.status >= 400 && ct.includes('text/html')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(
              errorPage(
                target,
                `${new URL(target).hostname} sent back an error`,
                'The site refused this request or returned an error instead of the page.',
                `HTTP ${upstream.status}`
              )
            );
            return;
          }

          upstream.headers.forEach((v, k) => {
            if (
              !STRIP_HEADERS.has(k.toLowerCase()) &&
              k.toLowerCase() !== 'set-cookie' &&
              k.toLowerCase() !== 'content-length'
            ) {
              try {
                res.setHeader(k, v);
              } catch {
                /* skip */
              }
            }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (ct.includes('text/html')) {
            const html = processHtml(await upstream.text(), upstream.url || target);
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          } else {
            const buf = Buffer.from(await upstream.arrayBuffer());
            res.statusCode = upstream.status;
            res.end(buf);
          }
        } catch (err) {
          const target = decodeURIComponent(
            new URLSearchParams(req.url?.split('?')[1] ?? '').get('url') ?? ''
          );
          const timedOut = err instanceof Error && err.name === 'TimeoutError';
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(
            errorPage(
              target || 'about:blank',
              timedOut ? 'The site took too long to respond' : "This site can't be reached",
              timedOut
                ? 'The page did not answer within 12 seconds. It may be slow, or it may not allow embedded browsers.'
                : 'The address could not be resolved or the connection was refused.',
              timedOut ? 'ERR_TIMED_OUT' : 'ERR_NAME_NOT_RESOLVED'
            )
          );
        }
      });
      server.middlewares.use('/api/search', async (req, res) => {
        try {
          const qs = req.url?.split('?')[1] ?? '';
          const query = new URLSearchParams(qs).get('q')?.trim() ?? '';
          if (query.length < 2) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Search query is too short' }));
            return;
          }

          const results = await searchWeb(query);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ query, results }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), browserProxyPlugin()],
});

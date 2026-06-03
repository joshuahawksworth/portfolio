import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { searchWeb } from './api/search-utils';

const STRIP = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'frame-options',
  'x-xss-protection',
  'transfer-encoding',
  'content-encoding',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
  'origin-agent-cluster',
]);

interface DevLeaderboardRow {
  name: string;
  score: number;
  created_at: string;
}

function topDevScores(rows: DevLeaderboardRow[]) {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, 10);
}

function readJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Injected at the very top of <head> so it runs before any site script.
// Intercepts link clicks AND form submissions AND history.pushState/replaceState
// and relays the destination URL to the parent frame for proxy navigation.
const NAV_RELAY = `<script>
(function(){
  // Wrap history API so cross-origin SecurityErrors (e.g. Google calling
  // replaceState with a google.com URL while our iframe origin is localhost)
  // are caught silently instead of crashing the page before it renders.
  var _push=history.pushState, _rep=history.replaceState;
  history.pushState=function(s,t,u){try{_push.call(history,s,t,u);}catch(e){}};
  history.replaceState=function(s,t,u){try{_rep.call(history,s,t,u);}catch(e){}};

  function relay(url){
    try{var abs=new URL(url,document.baseURI).href;window.parent.postMessage({type:'__browse__',url:abs},'*');}catch(e){}
  }
  // Link clicks (capture phase — fires before site handlers)
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(a){var h=a.getAttribute('href');
      if(h&&h[0]!=='#'&&h.indexOf('javascript:')!==0&&a.target!=='_blank'){
        e.preventDefault();e.stopImmediatePropagation();relay(h);
      }
    }
  },true);
  // GET form submissions (e.g. Google search box)
  document.addEventListener('submit',function(e){
    var f=e.target;
    if((f.method||'get').toLowerCase()!=='get')return;
    e.preventDefault();e.stopImmediatePropagation();
    try{
      var u=new URL(f.action||document.baseURI);
      new FormData(f).forEach(function(v,k){u.searchParams.set(k,String(v));});
      relay(u.href);
    }catch(ex){}
  },true);
})();
</script>`;

function processHtml(html: string, target: string): string {
  // Strip inline CSP meta tags that would block our injected scripts
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*\/?>/gi, '');
  // Inject base + relay at the very top of <head>
  const inject = `<base href="${target}">${NAV_RELAY}`;
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => `${m}${inject}`);
  } else {
    html = inject + html;
  }
  return html;
}

function browserProxyPlugin(): Plugin {
  const devLeaderboardRows: DevLeaderboardRow[] = [];

  return {
    name: 'browser-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/leaderboard', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(topDevScores(devLeaderboardRows)));
          return;
        }

        if (req.method === 'POST') {
          const body = (await readJsonBody(req)) as { name?: unknown; score?: unknown };
          const name = String(body.name ?? '')
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 3);
          const score = Number(body.score);

          if (name.length < 3 || !Number.isInteger(score) || score < 1) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Invalid score submission' }));
            return;
          }

          devLeaderboardRows.push({ name, score, created_at: new Date().toISOString() });
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });

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
          new URL(target);

          const upstream = await fetch(target, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
          });

          const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';

          upstream.headers.forEach((v, k) => {
            if (!STRIP.has(k.toLowerCase())) {
              try {
                res.setHeader(k, v);
              } catch {
                /* skip */
              }
            }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (ct.includes('text/html')) {
            const html = processHtml(await upstream.text(), target);
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          } else {
            const buf = Buffer.from(await upstream.arrayBuffer());
            res.statusCode = upstream.status;
            res.end(buf);
          }
        } catch (err) {
          res.statusCode = 502;
          res.end(`Proxy error: ${err}`);
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

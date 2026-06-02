import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const STRIP = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'frame-options',
  'x-xss-protection',
  'transfer-encoding',
  'content-encoding',   // Node fetch decompresses automatically; forwarding this causes ERR_CONTENT_DECODING_FAILED
]);

const NAV_RELAY = `<script>
(function(){
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(a){var href=a.getAttribute('href');
      if(href&&href.indexOf('#')!==0&&href.indexOf('javascript:')!==0&&a.target!=='_blank'){
        try{var abs=new URL(href,document.baseURI).href;
          e.preventDefault();window.parent.postMessage({type:'__browse__',url:abs},'*');
        }catch(ex){}}
    }
  },true);
})();
</script>`;

function browserProxyPlugin(): Plugin {
  return {
    name: 'browser-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/browser-proxy', async (req, res) => {
        try {
          const qs = req.url?.split('?')[1] ?? '';
          const raw = new URLSearchParams(qs).get('url');
          if (!raw) { res.statusCode = 400; res.end('Missing url'); return; }

          const target = decodeURIComponent(raw);
          new URL(target); // validate

          const upstream = await fetch(target, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
            },
            redirect: 'follow',
          });

          const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';

          upstream.headers.forEach((v, k) => {
            if (!STRIP.has(k.toLowerCase())) {
              try { res.setHeader(k, v); } catch { /* skip */ }
            }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (ct.includes('text/html')) {
            let html = await upstream.text();
            const base = `<base href="${target}">`;
            html = /<head[^>]*>/i.test(html)
              ? html.replace(/<head[^>]*>/i, m => `${m}${base}`)
              : base + html;
            html = /<\/body>/i.test(html)
              ? html.replace(/<\/body>/i, `${NAV_RELAY}</body>`)
              : html + NAV_RELAY;

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
    },
  };
}

export default defineConfig({
  plugins: [react(), browserProxyPlugin()],
});

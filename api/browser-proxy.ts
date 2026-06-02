import type { VercelRequest, VercelResponse } from '@vercel/node';

const STRIP_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'frame-options',
  'x-xss-protection',
  'transfer-encoding',
  'content-encoding',   // Node fetch decompresses automatically; forwarding this causes ERR_CONTENT_DECODING_FAILED
]);

// Injected into every proxied HTML page:
// 1. Intercepts link clicks and relays them to the parent frame
// 2. Disables history.pushState so the parent controls navigation
const NAV_RELAY = `<script>
(function(){
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(a){
      var href=a.getAttribute('href');
      if(href&&href.indexOf('#')!==0&&href.indexOf('javascript:')!==0&&a.target!=='_blank'){
        try{
          var abs=new URL(href,document.baseURI).href;
          e.preventDefault();
          window.parent.postMessage({type:'__browse__',url:abs},'*');
        }catch(ex){}
      }
    }
  },true);
})();
</script>`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).send('Missing url parameter');

  let target: string;
  try {
    target = decodeURIComponent(url);
    new URL(target); // validate
  } catch {
    return res.status(400).send('Invalid URL');
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    // Forward safe headers
    upstream.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        try { res.setHeader(key, value); } catch { /* skip invalid */ }
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.includes('text/html')) {
      let html = await upstream.text();

      // Inject <base> so relative URLs resolve against the real origin
      const base = `<base href="${target}">`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, m => `${m}${base}`);
      } else {
        html = `${base}${html}`;
      }

      // Inject nav relay before </body> (or append)
      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${NAV_RELAY}</body>`);
      } else {
        html += NAV_RELAY;
      }

      return res
        .status(upstream.status)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(html);
    }

    // Non-HTML: stream buffer through
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buf);
  } catch (err) {
    return res.status(502).send(`Proxy error: ${err}`);
  }
}

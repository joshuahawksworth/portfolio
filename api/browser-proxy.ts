import type { VercelRequest, VercelResponse } from '@vercel/node';

const STRIP_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'frame-options',
  'x-xss-protection',
  'transfer-encoding',
  'content-encoding',
]);

const NAV_RELAY = `<script>
(function(){
  var _push=history.pushState,_rep=history.replaceState;
  history.pushState=function(s,t,u){try{_push.call(history,s,t,u);}catch(e){}};
  history.replaceState=function(s,t,u){try{_rep.call(history,s,t,u);}catch(e){}};
  function relay(url){
    try{var abs=new URL(url,document.baseURI).href;window.parent.postMessage({type:'__browse__',url:abs},'*');}catch(e){}
  }
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(a){var h=a.getAttribute('href');
      if(h&&h[0]!=='#'&&h.indexOf('javascript:')!==0&&a.target!=='_blank'){
        e.preventDefault();e.stopImmediatePropagation();relay(h);
      }
    }
  },true);
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
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*\/?>/gi, '');
  const inject = `<base href="${target}">${NAV_RELAY}`;
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, m => `${m}${inject}`)
    : inject + html;
}

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

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    upstream.headers.forEach((value, key) => {
      if (!STRIP_HEADERS.has(key.toLowerCase())) {
        try { res.setHeader(key, value); } catch { /* skip */ }
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.includes('text/html')) {
      const html = processHtml(await upstream.text(), target);
      return res.status(upstream.status)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(html);
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buf);
  } catch (err) {
    return res.status(502).send(`Proxy error: ${err}`);
  }
}

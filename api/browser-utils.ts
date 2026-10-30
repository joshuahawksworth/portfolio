/**
 * Shared by the /api/browser-proxy route and the Vite dev middleware: header stripping,
 * the in-page navigation relay, and the Chrome-style error page.
 */
export const STRIP_HEADERS = new Set([
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

export const NAV_RELAY = `<script>
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
      if(h&&h[0]!=='#'&&h.indexOf('javascript:')!==0&&h.indexOf('mailto:')!==0&&h.indexOf('tel:')!==0){
        e.preventDefault();e.stopImmediatePropagation();relay(h);
      }
    }
  },true);
  // window.open and meta-refresh redirects stay inside the browser window too.
  window.open=function(u){if(u)relay(String(u));return null;};
  document.addEventListener('DOMContentLoaded',function(){
    var m=document.querySelector('meta[http-equiv="refresh" i]');
    if(m){var c=(m.getAttribute('content')||'').match(/url\\s*=\\s*['"]?([^'"]+)/i);if(c)relay(c[1]);}
  });
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

export function processHtml(html: string, target: string): string {
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*\/?>/gi, '');
  // Links that would escape the frame open inside the browser window instead.
  html = html.replace(/\starget=["']?_(blank|top|parent)["']?/gi, '');
  const inject = `<base href="${target}">${NAV_RELAY}`;
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (m) => `${m}${inject}`)
    : inject + html;
}

export const FETCH_TIMEOUT_MS = 12_000;

/**
 * Web apps the proxy cannot show: their HTML arrives, but the scripts then call the site's
 * own APIs from this origin and are refused, so the page sits on its loading skeleton; some
 * (Reddit) also wall off data-centre fetches outright. Matched on the host and its subdomains.
 */
const APP_ONLY: Record<string, string> = {
  'youtube.com': 'YouTube',
  'reddit.com': 'Reddit',
  'x.com': 'X',
  'twitter.com': 'X',
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'tiktok.com': 'TikTok',
  'linkedin.com': 'LinkedIn',
  'mail.google.com': 'Gmail',
};

/** The web app's name when the target is one the proxy cannot render, else null. */
export function appOnlyName(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  for (const [domain, name] of Object.entries(APP_ONLY)) {
    if (host === domain || host.endsWith(`.${domain}`)) return name;
  }
  return null;
}

/** The video id of a YouTube watch, Shorts or youtu.be address, else null. */
export function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const id =
    host === 'youtu.be'
      ? url.pathname.slice(1)
      : host === 'youtube.com'
        ? (url.pathname === '/watch' && url.searchParams.get('v')) ||
          url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1]
        : null;
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** YouTube's own embed player filling the frame: the one YouTube page built to run elsewhere. */
export function youtubePlayerPage(id: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>YouTube</title>
<style>html,body{margin:0;height:100%;background:#0f0f0f}iframe{display:block;width:100%;height:100%;border:0}</style>
</head><body><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="YouTube video player"
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></body></html>`;
}

/**
 * A page to send instead of fetching the target, or null to fetch it: YouTube videos get the
 * embed player, app-only sites a straight answer rather than a skeleton that never fills.
 */
export function shortcutPage(target: string): string | null {
  const url = new URL(target);
  const video = youtubeVideoId(url);
  if (video) return youtubePlayerPage(video);
  const name = appOnlyName(url);
  if (name) {
    return errorPage(
      target,
      `${name} can't run inside this browser`,
      `${name} is a web app that only works in a full browser: its pages load here but it refuses to talk to a site it isn't running on. Open it in a new tab instead.`,
      'ERR_APP_ONLY'
    );
  }
  return null;
}

export function isBlockedTarget(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  const host = url.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    host === '[::1]'
  );
}

/** A small Chrome-style error page rendered inside the frame, with the reason and a way out. */
export function errorPage(target: string, title: string, detail: string, code: string): string {
  const esc = (v: string) =>
    v.replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c
    );
  const host = (() => {
    try {
      return new URL(target).hostname;
    } catch {
      return target;
    }
  })();
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#202124;background:#fff}
  main{max-width:560px;margin:14vh auto 0;padding:0 28px}
  .face{font-size:44px;line-height:1;margin-bottom:22px;color:#5f6368}
  h1{font-size:22px;font-weight:400;margin:0 0 12px}
  p{margin:0 0 10px;color:#5f6368}
  code{font:12px ui-monospace,Menlo,Consolas,monospace;color:#5f6368}
  .actions{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}
  a.btn{display:inline-block;padding:8px 18px;border-radius:4px;background:#1a73e8;color:#fff;text-decoration:none;font-weight:500}
  a.btn.secondary{background:transparent;color:#1a73e8;border:1px solid #dadce0}
</style></head><body><main>
  <div class="face">:(</div>
  <h1>${esc(title)}</h1>
  <p>${esc(detail)}</p>
  <p><code>${esc(code)}</code></p>
  <div class="actions">
    <a class="btn" href="${esc(target)}" target="_blank" rel="noopener noreferrer">Open ${esc(host)} in a new tab</a>
    <a class="btn secondary" href="javascript:location.reload()">Try again</a>
  </div>
</main></body></html>`;
}

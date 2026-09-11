/**
 * Postman, pointed at the APIs behind this site. Requests are sent for real from the
 * browser with fetch, so anything with CORS enabled (GitHub's API, Open-Meteo, this
 * site's own /api routes) answers; anything else gets the honest CORS explanation.
 */
import { useState } from 'react';
import styles from './PostmanApp.module.css';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Request {
  id: string;
  name: string;
  method: Method;
  url: string;
  body?: string;
  headers?: Record<string, string>;
}

interface Collection {
  name: string;
  requests: Request[];
}

const COLLECTIONS: Collection[] = [
  {
    name: 'Portfolio API',
    requests: [
      {
        id: 'p1',
        name: 'Search the web (Chrome app)',
        method: 'GET',
        url: '/api/search?q=react+native',
      },
      {
        id: 'p2',
        name: 'Ask Claude (guest)',
        method: 'POST',
        url: '/api/ask',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          { messages: [{ role: 'user', content: 'What has Josh built with React Native?' }] },
          null,
          2
        ),
      },
    ],
  },
  {
    name: 'GitHub',
    requests: [
      {
        id: 'g1',
        name: 'Profile',
        method: 'GET',
        url: 'https://api.github.com/users/joshuahawksworth',
      },
      {
        id: 'g2',
        name: 'Repositories',
        method: 'GET',
        url: 'https://api.github.com/users/joshuahawksworth/repos?sort=pushed',
      },
      {
        id: 'g3',
        name: 'Portfolio commits',
        method: 'GET',
        url: 'https://api.github.com/repos/joshuahawksworth/portfolio/commits?per_page=5',
      },
    ],
  },
  {
    name: 'Open-Meteo',
    requests: [
      {
        id: 'w1',
        name: 'Manchester weather (desktop widget)',
        method: 'GET',
        url: 'https://api.open-meteo.com/v1/forecast?latitude=53.48&longitude=-2.24&current=temperature_2m,weather_code',
      },
    ],
  },
];

interface Response {
  status: number;
  statusText: string;
  ms: number;
  size: number;
  headers: [string, string][];
  body: string;
  json?: unknown;
}

function pretty(text: string): { body: string; json?: unknown } {
  try {
    const json = JSON.parse(text) as unknown;
    return { body: JSON.stringify(json, null, 2), json };
  } catch {
    return { body: text };
  }
}

function colourJson(src: string): string {
  return src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/("(?:[^"\\]|\\.)*")(\s*:)?/g, (_m, str: string, colon?: string) =>
      colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`
    )
    .replace(/\b(true|false|null)\b/g, '<span class="b">$1</span>')
    .replace(/(^|[\s,[])(-?\d+(?:\.\d+)?)(?=[,\s\]}]|$)/gm, '$1<span class="n">$2</span>');
}

export default function PostmanApp() {
  const [selected, setSelected] = useState<Request>(COLLECTIONS[1].requests[0]);
  const [method, setMethod] = useState<Method>(selected.method);
  const [url, setUrl] = useState(selected.url);
  const [body, setBody] = useState(selected.body ?? '');
  const [reqTab, setReqTab] = useState<'params' | 'headers' | 'body'>('params');
  const [resTab, setResTab] = useState<'body' | 'headers'>('body');
  const [response, setResponse] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set(COLLECTIONS.map((c) => c.name)));

  function pick(r: Request) {
    setSelected(r);
    setMethod(r.method);
    setUrl(r.url);
    setBody(r.body ?? '');
    setReqTab(r.body ? 'body' : 'params');
    setResponse(null);
    setError(null);
  }

  async function send() {
    if (sending) return;
    setSending(true);
    setError(null);
    setResponse(null);
    const started = performance.now();
    try {
      const headers: Record<string, string> = { ...(selected.headers ?? {}) };
      const res = await fetch(url, {
        method,
        headers,
        body: method === 'GET' || method === 'DELETE' ? undefined : body,
      });
      const text = await res.text();
      const { body: shown, json } = pretty(text);
      setResponse({
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        ms: Math.round(performance.now() - started),
        size: new Blob([text]).size,
        headers: [...res.headers.entries()],
        body: shown,
        json,
      });
    } catch (err) {
      const isCors = /^https?:/i.test(url) && !url.startsWith(window.location.origin);
      setError(
        isCors
          ? `Could not get any response. The browser blocked this request (CORS): ${new URL(url).host} does not allow calls from other origins. The desktop Postman app sends from outside the browser, so it works there. ${String((err as Error).message)}`
          : `Could not get any response: ${String((err as Error).message)}`
      );
    } finally {
      setSending(false);
    }
  }

  const params = (() => {
    try {
      const u = new URL(url, window.location.origin);
      return [...u.searchParams.entries()];
    } catch {
      return [];
    }
  })();

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <span className={styles.workspace}>
          <span className={styles.wsDot} /> My Workspace
        </span>
        <span className={styles.topFill} />
        <span className={styles.topMeta}>Browser edition · signed in as joshuahawksworth</span>
      </div>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sideHead}>Collections</div>
          {COLLECTIONS.map((c) => (
            <div key={c.name}>
              <button
                type="button"
                className={styles.collection}
                onClick={() =>
                  setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.name)) next.delete(c.name);
                    else next.add(c.name);
                    return next;
                  })
                }
              >
                <span className={styles.chev}>{open.has(c.name) ? '⌄' : '›'}</span>
                {c.name}
              </button>
              {open.has(c.name) &&
                c.requests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`${styles.request} ${selected.id === r.id ? styles.requestActive : ''}`}
                    onClick={() => pick(r)}
                  >
                    <span className={`${styles.method} ${styles[`m_${r.method}`]}`}>
                      {r.method}
                    </span>
                    <span className={styles.requestName}>{r.name}</span>
                  </button>
                ))}
            </div>
          ))}
        </aside>

        <main className={styles.main}>
          <div className={styles.tabStrip}>
            <span className={styles.tab}>
              <span className={`${styles.method} ${styles[`m_${method}`]}`}>{method}</span>
              {selected.name}
            </span>
          </div>

          <div className={styles.urlRow}>
            <select
              className={styles.methodSelect}
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
            >
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as Method[]).map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input
              className={styles.urlInput}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              spellCheck={false}
            />
            <button type="button" className={styles.sendBtn} onClick={send} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>

          <div className={styles.reqTabs}>
            {(['params', 'headers', 'body'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.reqTab} ${reqTab === t ? styles.reqTabActive : ''}`}
                onClick={() => setReqTab(t)}
              >
                {t === 'params'
                  ? `Params${params.length ? ` (${params.length})` : ''}`
                  : t === 'headers'
                    ? 'Headers'
                    : 'Body'}
              </button>
            ))}
          </div>
          <div className={styles.reqPanel}>
            {reqTab === 'params' &&
              (params.length === 0 ? (
                <div className={styles.hint}>No query parameters.</div>
              ) : (
                <table className={styles.kv}>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(([k, v]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            {reqTab === 'headers' && (
              <table className={styles.kv}>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries({
                    Accept: '*/*',
                    'User-Agent': 'PostmanRuntime (browser)',
                    ...(selected.headers ?? {}),
                  }).map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {reqTab === 'body' && (
              <textarea
                className={styles.bodyInput}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={method === 'GET' ? 'GET requests have no body.' : '{ "json": true }'}
                spellCheck={false}
              />
            )}
          </div>

          <div className={styles.resHead}>
            <span className={styles.resTitle}>Response</span>
            {response && (
              <span className={styles.resMeta}>
                <span className={response.status < 400 ? styles.ok : styles.bad}>
                  {response.status} {response.statusText}
                </span>
                <span>{response.ms} ms</span>
                <span>
                  {response.size < 1024
                    ? `${response.size} B`
                    : `${(response.size / 1024).toFixed(1)} KB`}
                </span>
              </span>
            )}
            <span className={styles.topFill} />
            {response && (
              <span className={styles.resTabs}>
                <button
                  type="button"
                  className={resTab === 'body' ? styles.resTabActive : ''}
                  onClick={() => setResTab('body')}
                >
                  Body
                </button>
                <button
                  type="button"
                  className={resTab === 'headers' ? styles.resTabActive : ''}
                  onClick={() => setResTab('headers')}
                >
                  Headers ({response.headers.length})
                </button>
              </span>
            )}
          </div>
          <div className={styles.resPanel}>
            {error ? (
              <div className={styles.error}>{error}</div>
            ) : !response ? (
              <div className={styles.hint}>
                {sending
                  ? 'Sending request…'
                  : 'Hit Send to get a response. Requests go straight from your browser.'}
              </div>
            ) : resTab === 'headers' ? (
              <table className={styles.kv}>
                <tbody>
                  {response.headers.map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <pre
                className={styles.json}
                dangerouslySetInnerHTML={{ __html: colourJson(response.body) }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

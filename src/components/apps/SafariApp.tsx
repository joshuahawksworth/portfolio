import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SafariApp.module.css';

const HOME = 'https://www.google.com';

function proxyUrl(url: string) {
  return `/api/browser-proxy?url=${encodeURIComponent(url)}`;
}

function isSearchQuery(input: string): boolean {
  const t = input.trim();
  if (!t) return false;
  if (t.startsWith('http://') || t.startsWith('https://')) return false;
  // Has a dot and no spaces — treat as URL
  if (/^[^\s]+\.[^\s]{2,}(\/.*)? *$/.test(t)) return false;
  return true;
}

export default function SafariApp({ props }: { props?: Record<string, unknown> }) {
  const start = (props?.url as string | undefined) ?? HOME;
  const [stack,    setStack]    = useState<string[]>([start]);
  const [idx,      setIdx]      = useState(0);
  const [inputUrl, setInputUrl] = useState(start);
  const [loading,  setLoading]  = useState(true);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);

  // Always-fresh refs so the message listener never has a stale closure
  const stackRef   = useRef(stack);
  const idxRef     = useRef(idx);
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  useEffect(() => { stackRef.current = stack; }, [stack]);
  useEffect(() => { idxRef.current   = idx;   }, [idx]);

  const currentUrl = stack[idx];

  useEffect(() => { setInputUrl(currentUrl); setSearchNotice(null); }, [currentUrl]);

  const navigate = useCallback((raw: string) => {
    let url = raw.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    const cur = idxRef.current;
    setStack(prev => [...prev.slice(0, cur + 1), url]);
    setIdx(cur + 1);
    setLoading(true);
    setSearchNotice(null);
  }, []);

  // Register once; only handle messages from THIS instance's iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== '__browse__') return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const url: string = e.data.url ?? '';
      if (!url || url === stackRef.current[idxRef.current]) return;
      navigate(url);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  function goBack()    { if (idx > 0)                   { setIdx(i => i - 1); setLoading(true); } }
  function goForward() { if (idx < stack.length - 1)    { setIdx(i => i + 1); setLoading(true); } }
  function reload()    { setLoading(true); setStack(s => [...s]); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputUrl.trim();
    if (isSearchQuery(input)) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
      setSearchNotice(input);
    } else {
      navigate(input);
    }
  }

  return (
    <div className={styles.root}>
      {/* Browser chrome */}
      <div className={styles.chrome}>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={goBack}    disabled={idx <= 0}               aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8L10 13"/></svg>
          </button>
          <button className={styles.navBtn} onClick={goForward} disabled={idx >= stack.length - 1} aria-label="Forward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 3L11 8L6 13"/></svg>
          </button>
          <button className={styles.navBtn} onClick={reload} aria-label="Reload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={loading ? styles.spin : ''}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>

        <form className={styles.urlForm} onSubmit={handleSubmit}>
          <div className={styles.urlBar}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={styles.lockIcon}>
              <rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/>
            </svg>
            <input
              className={styles.urlInput}
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              onFocus={e => e.target.select()}
              spellCheck={false}
              placeholder="Search Google or enter website name"
            />
          </div>
        </form>

        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className={styles.newTabBtn} title="Open in new tab">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9"/><path d="M10 2h4v4"/><path d="M14 2L8 8"/>
          </svg>
        </a>
      </div>

      {loading && !searchNotice && (
        <div className={styles.loadingBar}><div className={styles.loadingFill}/></div>
      )}

      <div className={styles.viewport}>
        {searchNotice ? (
          <div className={styles.searchNotice}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="rgba(66,133,244,0.15)" stroke="rgba(66,133,244,0.4)" strokeWidth="1.5"/>
              <path d="M31 31L38 38" stroke="rgba(66,133,244,0.6)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="22" cy="22" r="9" fill="none" stroke="rgba(66,133,244,0.6)" strokeWidth="2.5"/>
            </svg>
            <div className={styles.searchNoticeTitle}>Searching Google…</div>
            <div className={styles.searchNoticeQuery}>"{searchNotice}"</div>
            <p className={styles.searchNoticeHint}>
              Results opened in a new tab. Websites can't be embedded here due to browser security restrictions.
            </p>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(searchNotice)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.searchNoticeBtn}
            >
              Open results in new tab →
            </a>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={`${currentUrl}-${idx}`}
            src={proxyUrl(currentUrl)}
            className={styles.iframe}
            title="Browser"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  );
}

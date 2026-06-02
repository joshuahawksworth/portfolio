import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SafariApp.module.css';

const HOME = 'https://www.apple.com/safari/';

function proxyUrl(url: string) {
  return `/api/browser-proxy?url=${encodeURIComponent(url)}`;
}

export default function SafariApp({ props: _ }: { props?: Record<string, unknown> }) {
  const [historyStack, setHistoryStack] = useState<string[]>([HOME]);
  const [histIdx,      setHistIdx]      = useState(0);
  const [inputUrl,     setInputUrl]     = useState(HOME);
  const [loading,      setLoading]      = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = historyStack[histIdx];

  // Update address bar when history changes
  useEffect(() => { setInputUrl(currentUrl); }, [currentUrl]);

  // Listen for navigation messages relayed from the injected script inside the iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== '__browse__') return;
      const url: string = e.data.url;
      if (!url || url === currentUrl) return;
      navigate(url);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl, histIdx, historyStack]);

  const navigate = useCallback((url: string) => {
    let full = url.trim();
    if (!full.startsWith('http://') && !full.startsWith('https://')) {
      full = 'https://' + full;
    }
    setHistoryStack(prev => {
      const trimmed = prev.slice(0, histIdx + 1);
      return [...trimmed, full];
    });
    setHistIdx(prev => prev + 1);
    setLoading(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histIdx]);

  function goBack() {
    if (histIdx > 0) { setHistIdx(h => h - 1); setLoading(true); }
  }
  function goForward() {
    if (histIdx < historyStack.length - 1) { setHistIdx(h => h + 1); setLoading(true); }
  }
  function reload() {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = proxyUrl(currentUrl);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(inputUrl);
  }

  const canBack    = histIdx > 0;
  const canForward = histIdx < historyStack.length - 1;

  return (
    <div className={styles.root}>
      {/* ── Browser chrome ── */}
      <div className={styles.chrome}>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={goBack} disabled={!canBack} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10 3L5 8L10 13"/>
            </svg>
          </button>
          <button className={styles.navBtn} onClick={goForward} disabled={!canForward} aria-label="Forward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 3L11 8L6 13"/>
            </svg>
          </button>
          <button className={styles.navBtn} onClick={reload} aria-label="Reload">
            <svg
              width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              className={loading ? styles.navBtnSpin : ''}
            >
              <path d="M13.5 2.5A7 7 0 1 0 14 8"/><path d="M14 2.5V6h-3.5"/>
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
              placeholder="Search or enter website name"
            />
          </div>
        </form>

        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.newTabBtn}
          title="Open in new tab"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9"/><path d="M10 2h4v4"/><path d="M14 2L8 8"/>
          </svg>
        </a>
      </div>

      {/* ── Loading bar ── */}
      {loading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingFill}/>
        </div>
      )}

      {/* ── Browser viewport ── */}
      <div className={styles.viewport}>
        <iframe
          ref={iframeRef}
          key={currentUrl}
          src={proxyUrl(currentUrl)}
          className={styles.iframe}
          title="Browser"
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}

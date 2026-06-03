import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import styles from './SafariApp.module.css';

const HOME = 'search://home';
const SEARCH_PREFIX = 'search://query/';

interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

function proxyUrl(url: string) {
  return `/api/browser-proxy?url=${encodeURIComponent(url)}`;
}

function searchEntry(query: string) {
  return `${SEARCH_PREFIX}${encodeURIComponent(query.trim())}`;
}

function isSearchEntry(value: string) {
  return value === HOME || value.startsWith(SEARCH_PREFIX);
}

function searchQueryFromEntry(value: string): string {
  if (!value.startsWith(SEARCH_PREFIX)) return '';
  return decodeURIComponent(value.slice(SEARCH_PREFIX.length));
}

function isSearchQuery(input: string): boolean {
  const t = input.trim();
  if (!t) return false;
  if (t.startsWith('http://') || t.startsWith('https://')) return false;
  // Has a dot and no spaces — treat as URL
  if (/^[^\s]+\.[^\s]{2,}(\/.*)? *$/.test(t)) return false;
  return true;
}

async function fetchSearch(query: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  const data = (await response.json()) as { results?: SearchResult[] };
  return Array.isArray(data.results) ? data.results : [];
}

function SearchHome({ onSearch }: { onSearch: (query: string) => void }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <div className={styles.searchHome}>
      <div className={styles.searchLogo} aria-label="Google Search">
        <span style={{ color: '#4285f4' }}>G</span>
        <span style={{ color: '#ea4335' }}>o</span>
        <span style={{ color: '#fbbc05' }}>o</span>
        <span style={{ color: '#4285f4' }}>g</span>
        <span style={{ color: '#34a853' }}>l</span>
        <span style={{ color: '#ea4335' }}>e</span>
      </div>
      <form className={styles.searchHomeForm} onSubmit={handleSubmit}>
        <input
          className={styles.searchHomeInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Google"
          autoFocus={!isMobile}
        />
        <button className={styles.searchHomeButton} type="submit">
          Search
        </button>
      </form>
      <p className={styles.searchHomeHint}>Type a search or enter a full website address above.</p>
    </div>
  );
}

function SearchResults({ query, onOpen }: { query: string; onOpen: (url: string) => void }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setResults([]);

    fetchSearch(query)
      .then((nextResults) => {
        if (cancelled) return;
        setResults(nextResults);
        setStatus('done');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className={styles.resultsPage}>
      <div className={styles.resultsHeader}>
        <div className={styles.resultsLogo} aria-hidden="true">
          G
        </div>
        <div>
          <h2>Search results</h2>
          <p>Results for "{query}"</p>
        </div>
      </div>

      {status === 'loading' && <p className={styles.resultsStatus}>Searching the web...</p>}
      {status === 'error' && (
        <p className={styles.resultsStatus}>Search failed. Try a different query or enter a URL.</p>
      )}
      {status === 'done' && results.length === 0 && (
        <p className={styles.resultsStatus}>No results found. Try a more specific search.</p>
      )}

      {results.length > 0 && (
        <ol className={styles.resultList}>
          {results.map((result) => (
            <li key={result.url} className={styles.resultItem}>
              <button className={styles.resultTitle} onClick={() => onOpen(result.url)}>
                {result.title}
              </button>
              <div className={styles.resultUrl}>{result.displayUrl}</div>
              {result.snippet && <p className={styles.resultSnippet}>{result.snippet}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function SafariApp({ props }: { props?: Record<string, unknown> }) {
  const start = (props?.url as string | undefined) ?? HOME;
  const [stack, setStack] = useState<string[]>([start]);
  const [idx, setIdx] = useState(0);
  const [inputUrl, setInputUrl] = useState(start);
  const [loading, setLoading] = useState(true);

  // Always-fresh refs so the message listener never has a stale closure
  const stackRef = useRef(stack);
  const idxRef = useRef(idx);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  const currentUrl = stack[idx];
  const showingSearch = isSearchEntry(currentUrl);
  const searchQuery = searchQueryFromEntry(currentUrl);
  const externalUrl = showingSearch
    ? searchQuery
      ? `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
      : 'https://www.google.com'
    : currentUrl;

  useEffect(() => {
    setInputUrl(showingSearch ? searchQuery : currentUrl);
  }, [currentUrl, searchQuery, showingSearch]);
  useEffect(() => {
    if (showingSearch) setLoading(false);
  }, [showingSearch, currentUrl]);

  const pushStack = useCallback((value: string) => {
    const cur = idxRef.current;
    setStack((prev) => [...prev.slice(0, cur + 1), value]);
    setIdx(cur + 1);
  }, []);

  const navigate = useCallback(
    (raw: string) => {
      let url = raw.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      pushStack(url);
      setLoading(true);
    },
    [pushStack]
  );

  const search = useCallback(
    (query: string) => {
      pushStack(searchEntry(query));
      setLoading(false);
    },
    [pushStack]
  );

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

  function goBack() {
    if (idx > 0) {
      setIdx((i) => i - 1);
      setLoading(true);
    }
  }
  function goForward() {
    if (idx < stack.length - 1) {
      setIdx((i) => i + 1);
      setLoading(true);
    }
  }
  function reload() {
    setLoading(true);
    setStack((s) => [...s]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputUrl.trim();
    if (isSearchQuery(input)) {
      search(input);
    } else {
      navigate(input);
    }
  }

  return (
    <div className={styles.root}>
      {/* Browser chrome */}
      <div className={styles.chrome}>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={goBack} disabled={idx <= 0} aria-label="Back">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M10 3L5 8L10 13" />
            </svg>
          </button>
          <button
            className={styles.navBtn}
            onClick={goForward}
            disabled={idx >= stack.length - 1}
            aria-label="Forward"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 3L11 8L6 13" />
            </svg>
          </button>
          <button className={styles.navBtn} onClick={reload} aria-label="Reload">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? styles.spin : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        <form className={styles.urlForm} onSubmit={handleSubmit}>
          <div className={styles.urlBar}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className={styles.lockIcon}
            >
              <rect x="3" y="7" width="10" height="8" rx="1.5" />
              <path d="M5 7V5a3 3 0 016 0v2" />
            </svg>
            <input
              className={styles.urlInput}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onFocus={(e) => e.target.select()}
              spellCheck={false}
              placeholder="Search Google or enter website name"
            />
          </div>
        </form>

        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.newTabBtn}
          title="Open in new tab"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9" />
            <path d="M10 2h4v4" />
            <path d="M14 2L8 8" />
          </svg>
        </a>
      </div>

      {loading && !showingSearch && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingFill} />
        </div>
      )}

      <div className={styles.viewport}>
        {showingSearch && searchQuery ? (
          <SearchResults query={searchQuery} onOpen={navigate} />
        ) : showingSearch ? (
          <SearchHome onSearch={search} />
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

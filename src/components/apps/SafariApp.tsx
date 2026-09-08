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

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
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

interface SearchResponse {
  query: string;
  page: number;
  results: SearchResult[];
  provider?: 'google' | 'duckduckgo';
  totalResults?: string;
  searchTime?: string;
  error?: 'unconfigured' | 'blocked' | 'failed';
}

const RESULTS_PER_PAGE = 10;
const MAX_PAGES = 10;

async function fetchSearch(query: string, page = 1): Promise<SearchResponse> {
  const pageParam = page > 1 ? `&page=${page}` : '';
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}${pageParam}`);
  if (!response.ok) throw new Error(`search ${response.status}`);
  const data = (await response.json()) as Partial<SearchResponse>;
  return {
    query,
    page,
    results: Array.isArray(data.results) ? data.results : [],
    provider: data.provider,
    totalResults: data.totalResults,
    searchTime: data.searchTime,
    error: data.error,
  };
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

/** The Google wordmark, drawn so it needs no image and no web font. */
function GoogleLogo({ height = 30, className }: { height?: number; className?: string }) {
  const letters: [string, string][] = [
    ['G', '#4285f4'],
    ['o', '#ea4335'],
    ['o', '#fbbc05'],
    ['g', '#4285f4'],
    ['l', '#34a853'],
    ['e', '#ea4335'],
  ];
  return (
    <svg
      className={className}
      viewBox="0 0 272 92"
      height={height}
      width={(272 / 92) * height}
      role="img"
      aria-label="Google"
    >
      <text
        x="6"
        y="72"
        fontFamily="'Product Sans', 'Google Sans', Arial, Helvetica, sans-serif"
        fontSize="86"
        fontWeight="500"
        letterSpacing="-4"
      >
        {letters.map(([ch, fill], i) => (
          <tspan key={i} fill={fill}>
            {ch}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

/** Google shows "https://host › path › segments" under the site name. */
function breadcrumb(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((seg) => decodeURIComponent(seg));
    const shown = parts.length > 3 ? [parts[0], '…', parts[parts.length - 1]] : parts;
    return [`${parsed.protocol}//${parsed.hostname}`, ...shown].join(' › ');
  } catch {
    return url;
  }
}

function siteName(url: string): string {
  const host = hostOf(url);
  const label = host.split('.').slice(0, -1).join('.') || host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Favicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const host = hostOf(url);
  if (failed) {
    return (
      <span className={styles.serpFaviconFallback} aria-hidden="true">
        {host.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className={styles.serpFavicon}
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`}
      alt=""
      width={18}
      height={18}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const SERP_TABS = ['All', 'Images', 'Videos', 'News', 'Maps', 'Shopping', 'More'];

function SearchResults({
  query,
  onOpen,
  onSearch,
}: {
  query: string;
  onOpen: (url: string) => void;
  onSearch: (query: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(query);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [attempt, setAttempt] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
    setDraft(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchSearch(query, page)
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setStatus('done');
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setStatus('error');
      });
    topRef.current?.scrollTo?.({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [query, page, attempt]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (next && next !== query) onSearch(next);
  }

  const results = data?.results ?? [];
  const error = status === 'error' ? 'failed' : data?.error;
  const stats =
    data?.totalResults && data?.searchTime
      ? `About ${data.totalResults} results (${data.searchTime} seconds)`
      : results.length > 0
        ? `Page ${page} of results`
        : '';
  const canPaginate = results.length === RESULTS_PER_PAGE || page > 1;
  const lastPage = Math.min(MAX_PAGES, results.length === RESULTS_PER_PAGE ? page + 4 : page);
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

  return (
    <div ref={topRef} className={styles.serp}>
      <header className={styles.serpHeader}>
        <div className={styles.serpTop}>
          <button
            type="button"
            className={styles.serpLogoBtn}
            onClick={() => onSearch('')}
            aria-label="Google home"
          >
            <GoogleLogo height={30} />
          </button>
          <form className={styles.serpForm} onSubmit={submit} role="search">
            <input
              className={styles.serpInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Search"
              autoComplete="off"
              spellCheck={false}
            />
            {draft && (
              <button
                type="button"
                className={styles.serpClear}
                onClick={() => setDraft('')}
                aria-label="Clear"
              >
                ×
              </button>
            )}
            <button type="submit" className={styles.serpSubmit} aria-label="Google Search">
              <SearchIcon />
            </button>
          </form>
        </div>
        <nav className={styles.serpTabs} aria-label="Search type">
          {SERP_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.serpTab} ${tab === 'All' ? styles.serpTabActive : ''}`}
              aria-current={tab === 'All' ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
          <button type="button" className={`${styles.serpTab} ${styles.serpTools}`}>
            Tools
          </button>
        </nav>
      </header>

      <main className={styles.serpMain}>
        {status === 'loading' && (
          <div className={styles.serpSkeleton} role="status" aria-label="Searching">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.serpSkeletonItem}>
                <span style={{ width: '38%' }} />
                <span style={{ width: '62%' }} />
                <span style={{ width: '90%' }} />
              </div>
            ))}
          </div>
        )}

        {status !== 'loading' && stats && <p className={styles.serpStats}>{stats}</p>}

        {status !== 'loading' && error === 'unconfigured' && (
          <div className={styles.serpNotice}>
            <h2>Search isn't set up on this site yet</h2>
            <p>
              Google can't be embedded in another website, so results have to come from the Google
              Programmable Search API. Add <code>GOOGLE_SEARCH_KEY</code> and{' '}
              <code>GOOGLE_SEARCH_CX</code> to the deployment and this page fills with real Google
              results.
            </p>
            <p>In the meantime you can still type a full web address in the bar above.</p>
          </div>
        )}
        {status !== 'loading' && (error === 'blocked' || error === 'failed') && (
          <div className={styles.serpNotice}>
            <h2>Something went wrong</h2>
            <p>Google couldn't answer this search right now. Give it a moment and try again.</p>
            <button
              type="button"
              className={styles.serpRetry}
              onClick={() => setAttempt((a) => a + 1)}
            >
              Try again
            </button>
          </div>
        )}
        {status === 'done' && !error && results.length === 0 && (
          <div className={styles.serpNotice}>
            <p>
              Your search - <b>{query}</b> - did not match any documents.
            </p>
            <p>Suggestions:</p>
            <ul>
              <li>Make sure that all words are spelled correctly.</li>
              <li>Try different keywords.</li>
              <li>Try more general keywords.</li>
            </ul>
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <ol className={styles.serpResults}>
            {results.map((result) => (
              <li key={result.url} className={styles.serpResult}>
                <button
                  type="button"
                  className={styles.serpSource}
                  onClick={() => onOpen(result.url)}
                  title={result.url}
                >
                  <Favicon url={result.url} />
                  <span className={styles.serpSite}>
                    <span className={styles.serpSiteName}>{siteName(result.url)}</span>
                    <span className={styles.serpCrumb}>{breadcrumb(result.url)}</span>
                  </span>
                </button>
                <h3 className={styles.serpTitle}>
                  <button type="button" onClick={() => onOpen(result.url)}>
                    {result.title}
                  </button>
                </h3>
                {result.snippet && <p className={styles.serpSnippet}>{result.snippet}</p>}
              </li>
            ))}
          </ol>
        )}

        {status === 'done' && canPaginate && (
          <nav className={styles.serpPager} aria-label="Pagination">
            <div className={styles.serpPagerLogo} aria-hidden="true">
              <span style={{ color: '#4285f4' }}>G</span>
              {pages.map((p) => (
                <span key={p} style={{ color: p === page ? '#ea4335' : '#fbbc05' }}>
                  o
                </span>
              ))}
              <span style={{ color: '#4285f4' }}>g</span>
              <span style={{ color: '#34a853' }}>l</span>
              <span style={{ color: '#ea4335' }}>e</span>
            </div>
            <div className={styles.serpPages}>
              {page > 1 && (
                <button type="button" onClick={() => setPage(page - 1)}>
                  ‹ Previous
                </button>
              )}
              {pages.map((p) =>
                p === page ? (
                  <span key={p} className={styles.serpPageCurrent} aria-current="page">
                    {p}
                  </span>
                ) : (
                  <button key={p} type="button" onClick={() => setPage(p)}>
                    {p}
                  </button>
                )
              )}
              {results.length === RESULTS_PER_PAGE && page < MAX_PAGES && (
                <button type="button" onClick={() => setPage(page + 1)}>
                  Next ›
                </button>
              )}
            </div>
          </nav>
        )}
      </main>

      <footer className={styles.serpFooter}>
        <div className={styles.serpFooterRegion}>United Kingdom</div>
        <div className={styles.serpFooterLinks}>
          <span>Help</span>
          <span>Send feedback</span>
          <span>Privacy</span>
          <span>Terms</span>
          {data?.provider === 'duckduckgo' && <span>Results via DuckDuckGo</span>}
        </div>
      </footer>
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
        {loading && !showingSearch && (
          <div className={styles.loadingOverlay} role="status" aria-live="polite">
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <span className={styles.loadingText}>Loading {hostOf(currentUrl)}…</span>
          </div>
        )}
        {showingSearch && searchQuery ? (
          <SearchResults query={searchQuery} onOpen={navigate} onSearch={search} />
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

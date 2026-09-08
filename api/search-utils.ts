/**
 * Web search for the in-app Chrome.
 *
 * Google itself can't be embedded (it forbids framing and captchas data-centre IPs), so the
 * results page is ours. Results come from, in order:
 *   1. Google Programmable Search (real Google results) when GOOGLE_SEARCH_KEY and
 *      GOOGLE_SEARCH_CX are set — https://programmablesearchengine.google.com
 *   2. DuckDuckGo's HTML endpoints (no key, but data-centre IPs are sometimes refused)
 */

export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

export type SearchProvider = 'google' | 'duckduckgo';

/** Why a search came back empty, so the page can say something useful. */
export type SearchError =
  | 'unconfigured' // no Google key and DuckDuckGo refused us
  | 'blocked' // the provider rejected the request (captcha / 403 / 429)
  | 'failed'; // network error or timeout

export interface SearchResponse {
  query: string;
  page: number;
  results: SearchResult[];
  provider?: SearchProvider;
  /** Human-friendly totals, e.g. "About 1,230,000 results (0.42 seconds)". */
  totalResults?: string;
  searchTime?: string;
  error?: SearchError;
}

export const RESULT_LIMIT = 10;
export const MAX_PAGE = 10;
const SEARCH_TIMEOUT_MS = 8000;
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* ── Shared helpers ─────────────────────────────────────────────────────── */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ''));
}

function unwrapDuckDuckGoUrl(value: string): string {
  const decoded = decodeEntities(value);
  try {
    const parsed = new URL(decoded, 'https://duckduckgo.com');
    const wrapped = parsed.searchParams.get('uddg');
    return wrapped ? decodeURIComponent(wrapped) : parsed.href;
  } catch {
    return decoded;
  }
}

export function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === '/' ? '' : decodeURIComponent(parsed.pathname);
    return `${parsed.hostname.replace(/^www\./, '')}${path}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function clampPage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(MAX_PAGE, Math.max(1, Math.floor(page)));
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Google Programmable Search ─────────────────────────────────────────── */
interface GoogleItem {
  title?: string;
  link?: string;
  displayLink?: string;
  snippet?: string;
  htmlSnippet?: string;
}

interface GoogleResponse {
  items?: GoogleItem[];
  searchInformation?: { formattedTotalResults?: string; formattedSearchTime?: string };
  error?: { code?: number; message?: string };
}

export function parseGoogleResults(data: GoogleResponse): SearchResult[] {
  const seen = new Set<string>();
  return (data.items ?? [])
    .map((item) => {
      const url = item.link ?? '';
      if (!/^https?:\/\//.test(url) || seen.has(url)) return null;
      seen.add(url);
      return {
        title: decodeEntities(item.title ?? url),
        url,
        displayUrl: displayUrl(url),
        snippet: decodeEntities(item.snippet ?? stripTags(item.htmlSnippet ?? '')),
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice(0, RESULT_LIMIT);
}

export function googleConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GOOGLE_SEARCH_KEY && env.GOOGLE_SEARCH_CX);
}

async function searchGoogle(
  query: string,
  page: number,
  env: NodeJS.ProcessEnv
): Promise<SearchResponse | null> {
  const params = new URLSearchParams({
    key: env.GOOGLE_SEARCH_KEY ?? '',
    cx: env.GOOGLE_SEARCH_CX ?? '',
    q: query,
    num: String(RESULT_LIMIT),
    start: String((page - 1) * RESULT_LIMIT + 1),
    hl: 'en',
    safe: 'active',
  });
  try {
    const upstream = await fetchWithTimeout(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
      { headers: { Accept: 'application/json' } }
    );
    const data = (await upstream.json()) as GoogleResponse;
    if (!upstream.ok || data.error) {
      console.error('search: Google Programmable Search failed', upstream.status, data.error);
      return null;
    }
    return {
      query,
      page,
      provider: 'google',
      results: parseGoogleResults(data),
      totalResults: data.searchInformation?.formattedTotalResults,
      searchTime: data.searchInformation?.formattedSearchTime,
    };
  } catch (err) {
    console.error('search: Google Programmable Search errored', err);
    return null;
  }
}

/* ── DuckDuckGo (lite + html) ───────────────────────────────────────────── */
/** duckduckgo.com/lite: results are `<a class="result-link">` followed by a `result-snippet` cell. */
export function parseSearchResults(html: string): SearchResult[] {
  const blocks = html.split(/<a[^>]+class=['"]result-link['"][^>]*>/g);
  const links = [
    ...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]+class=['"]result-link['"][^>]*>/g),
  ];
  const seen = new Set<string>();

  return links
    .map((linkMatch, index) => {
      const block = blocks[index + 1] ?? '';
      const titleMatch = block.match(/^([\s\S]*?)<\/a>/);
      if (!titleMatch) return null;

      const url = unwrapDuckDuckGoUrl(linkMatch[1]);
      if (!/^https?:\/\//.test(url) || seen.has(url)) return null;
      seen.add(url);

      const snippetMatch = block.match(/class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/);
      return {
        title: stripTags(titleMatch[1]),
        url,
        displayUrl: displayUrl(url),
        snippet: snippetMatch ? stripTags(snippetMatch[1]) : '',
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice(0, RESULT_LIMIT);
}

/** html.duckduckgo.com/html: `<a class="result__a">` titles and `result__snippet` blocks. */
export function parseDuckDuckGoHtml(html: string): SearchResult[] {
  const seen = new Set<string>();
  const blocks = html.split(/<div[^>]+class=["'][^"']*\bresult\b[^"']*["']/g).slice(1);
  return blocks
    .map((block) => {
      const link = block.match(
        /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/
      );
      const linkAlt = block.match(
        /<a[^>]+href=["']([^"']+)["'][^>]+class=["'][^"']*result__a[^"']*["'][^>]*>([\s\S]*?)<\/a>/
      );
      const match = link ?? linkAlt;
      if (!match) return null;
      const url = unwrapDuckDuckGoUrl(match[1]);
      if (!/^https?:\/\//.test(url) || seen.has(url)) return null;
      seen.add(url);
      const snippet = block.match(
        /class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/(a|div)>/
      );
      return {
        title: stripTags(match[2]),
        url,
        displayUrl: displayUrl(url),
        snippet: snippet ? stripTags(snippet[1]) : '',
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice(0, RESULT_LIMIT);
}

function looksBlocked(status: number, html: string): boolean {
  return (
    status === 403 ||
    status === 429 ||
    /anomaly-modal|bots use DuckDuckGo too|challenge-form|unusual traffic/i.test(html)
  );
}

async function searchDuckDuckGo(query: string, page: number): Promise<SearchResponse> {
  const offset = (page - 1) * RESULT_LIMIT;
  const headers = {
    'User-Agent': BROWSER_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
  };
  const attempts: { url: string; parse: (html: string) => SearchResult[] }[] = [
    {
      url: `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}${offset ? `&s=${offset}&dc=${offset + 1}` : ''}`,
      parse: parseSearchResults,
    },
    {
      url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}${offset ? `&s=${offset}&dc=${offset + 1}` : ''}`,
      parse: parseDuckDuckGoHtml,
    },
  ];

  let error: SearchError = 'failed';
  for (const attempt of attempts) {
    try {
      const upstream = await fetchWithTimeout(attempt.url, { headers });
      const html = await upstream.text();
      if (looksBlocked(upstream.status, html)) {
        error = 'blocked';
        continue;
      }
      if (!upstream.ok) continue;
      const results = attempt.parse(html);
      if (results.length > 0) return { query, page, provider: 'duckduckgo', results };
    } catch (err) {
      console.error('search: DuckDuckGo request errored', err);
    }
  }
  return { query, page, provider: 'duckduckgo', results: [], error };
}

/* ── Entry point ────────────────────────────────────────────────────────── */
export async function searchWeb(
  query: string,
  pageInput = 1,
  env: NodeJS.ProcessEnv = process.env
): Promise<SearchResponse> {
  const page = clampPage(pageInput);
  if (googleConfigured(env)) {
    const google = await searchGoogle(query, page, env);
    if (google) return google;
  }
  const ddg = await searchDuckDuckGo(query, page);
  // Without a Google key, a refusal from DuckDuckGo means "set one up", not "try again".
  if (ddg.error && !googleConfigured(env) && ddg.error === 'blocked') {
    return { ...ddg, error: 'unconfigured' };
  }
  return ddg;
}

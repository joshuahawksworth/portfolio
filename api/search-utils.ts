/**
 * Web search for the in-app Chrome.
 *
 * Google itself can't be embedded (it forbids framing and captchas data-centre IPs), so the
 * results page is ours. Results come from, in order:
 *   1. Brave Search API when BRAVE_SEARCH_KEY is set — https://brave.com/search/api
 *      (its own index; a monthly free credit, card required)
 *   2. Tavily when TAVILY_API_KEY is set — https://tavily.com (free tier, no card)
 *   3. Google Programmable Search when GOOGLE_SEARCH_KEY and GOOGLE_SEARCH_CX are set. Only
 *      engines created before 20 January 2026 can search the whole web, and those stop on
 *      1 January 2027; kept for anyone who still has one.
 *   4. Bing's HTML results page (no key; refuses most hosting-provider addresses)
 *   5. DuckDuckGo's HTML endpoints (no key; refuses data-centre addresses)
 */

export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

export type SearchProvider = 'google' | 'brave' | 'tavily' | 'bing' | 'duckduckgo';

/** Why a search came back empty, so the page can say something useful. */
export type SearchError =
  | 'unconfigured' // no Google key and every keyless provider refused us
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
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
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

/* ── Brave Search API (keyed; its own index) ────────────────────────────── */
interface BraveResponse {
  web?: { results?: { title?: string; url?: string; description?: string }[] };
  query?: { more_results_available?: boolean };
}

export function braveConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BRAVE_SEARCH_KEY);
}

export function parseBraveResults(data: BraveResponse): SearchResult[] {
  const seen = new Set<string>();
  return (data.web?.results ?? [])
    .map((item) => {
      const url = item.url ?? '';
      if (!/^https?:\/\//.test(url) || seen.has(url)) return null;
      seen.add(url);
      return {
        title: stripTags(item.title ?? url),
        url,
        displayUrl: displayUrl(url),
        snippet: stripTags(item.description ?? ''),
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice(0, RESULT_LIMIT);
}

async function searchBrave(
  query: string,
  page: number,
  env: NodeJS.ProcessEnv
): Promise<SearchResponse | null> {
  const params = new URLSearchParams({
    q: query,
    count: String(RESULT_LIMIT),
    offset: String(page - 1),
    country: 'GB',
    safesearch: 'moderate',
  });
  try {
    const upstream = await fetchWithTimeout(
      `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': env.BRAVE_SEARCH_KEY ?? '',
        },
      }
    );
    if (!upstream.ok) {
      console.error('search: Brave Search failed', upstream.status);
      return null;
    }
    const data = (await upstream.json()) as BraveResponse;
    return { query, page, provider: 'brave', results: parseBraveResults(data) };
  } catch (err) {
    console.error('search: Brave Search errored', err);
    return null;
  }
}

/* ── Tavily (keyed; no card needed for the free tier) ───────────────────── */
interface TavilyResponse {
  results?: { title?: string; url?: string; content?: string }[];
}

export function tavilyConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.TAVILY_API_KEY);
}

export function parseTavilyResults(data: TavilyResponse, page = 1): SearchResult[] {
  const seen = new Set<string>();
  return (data.results ?? [])
    .map((item) => {
      const url = item.url ?? '';
      if (!/^https?:\/\//.test(url) || seen.has(url)) return null;
      seen.add(url);
      return {
        title: stripTags(item.title ?? url),
        url,
        displayUrl: displayUrl(url),
        snippet: stripTags(item.content ?? '').slice(0, 220),
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice((page - 1) * RESULT_LIMIT, page * RESULT_LIMIT);
}

async function searchTavily(
  query: string,
  page: number,
  env: NodeJS.ProcessEnv
): Promise<SearchResponse | null> {
  try {
    // Tavily has no paging, so the first two pages come from one 20-result request.
    const upstream = await fetchWithTimeout('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TAVILY_API_KEY ?? ''}`,
      },
      body: JSON.stringify({ query, max_results: 20, search_depth: 'basic' }),
    });
    if (!upstream.ok) {
      console.error('search: Tavily failed', upstream.status);
      return null;
    }
    const data = (await upstream.json()) as TavilyResponse;
    return { query, page, provider: 'tavily', results: parseTavilyResults(data, page) };
  } catch (err) {
    console.error('search: Tavily errored', err);
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

/**
 * Bing (and sometimes DuckDuckGo) answer a suspected bot from a data-centre address with a
 * normal-looking page whose results belong to someone else's query. Pages like that are
 * worse than an error, so a result set has to mention the query somewhere before it counts.
 */
export function looksRelevant(query: string, results: SearchResult[]): boolean {
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3);
  if (terms.length === 0 || results.length === 0) return results.length > 0;
  return results.some((r) => {
    const hay = `${r.title} ${r.snippet} ${r.url}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  });
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
      if (results.length > 0 && !looksRelevant(query, results)) {
        error = 'blocked';
        continue;
      }
      if (results.length > 0) return { query, page, provider: 'duckduckgo', results };
    } catch (err) {
      console.error('search: DuckDuckGo request errored', err);
    }
  }
  return { query, page, provider: 'duckduckgo', results: [], error };
}

/* ── Bing (HTML results page) ───────────────────────────────────────────── */
/**
 * Bing wraps every result link in a redirect, bing.com/ck/a?…&u=a1<base64url>&…; the real
 * address is the base64url payload after the "a1" prefix.
 */
export function unwrapBingUrl(value: string): string {
  const decoded = decodeEntities(value);
  try {
    const parsed = new URL(decoded, 'https://www.bing.com');
    const wrapped = parsed.searchParams.get('u');
    if (parsed.hostname.endsWith('bing.com') && wrapped?.startsWith('a1')) {
      const b64 = wrapped.slice(2).replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(b64, 'base64').toString('utf8');
    }
    return parsed.href;
  } catch {
    return decoded;
  }
}

/** bing.com/search: each result is `<li class="b_algo">` with an `<h2><a>` title and a `b_caption` snippet. */
export function parseBingResults(html: string): SearchResult[] {
  const seen = new Set<string>();
  return html
    .split(/<li[^>]+class=["']b_algo["'][^>]*>/g)
    .slice(1)
    .map((block) => {
      const link = block.match(/<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/);
      if (!link) return null;
      const url = unwrapBingUrl(link[1]);
      if (!/^https?:\/\//.test(url) || seen.has(url)) return null;
      seen.add(url);
      const snippet = block.match(
        /class=["'][^"']*b_caption[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/
      );
      return {
        title: stripTags(link[2]),
        url,
        displayUrl: displayUrl(url),
        snippet: snippet ? stripTags(snippet[1]) : '',
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice(0, RESULT_LIMIT);
}

async function searchBing(query: string, page: number): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    first: String((page - 1) * RESULT_LIMIT + 1),
    setlang: 'en',
    cc: 'GB',
  });
  try {
    const upstream = await fetchWithTimeout(`https://www.bing.com/search?${params.toString()}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });
    const html = await upstream.text();
    if (looksBlocked(upstream.status, html) || !upstream.ok) {
      return { query, page, provider: 'bing', results: [], error: 'blocked' };
    }
    const results = parseBingResults(html);
    if (results.length > 0 && !looksRelevant(query, results)) {
      return { query, page, provider: 'bing', results: [], error: 'blocked' };
    }
    return { query, page, provider: 'bing', results };
  } catch (err) {
    console.error('search: Bing request errored', err);
    return { query, page, provider: 'bing', results: [], error: 'failed' };
  }
}

/* ── Entry point ────────────────────────────────────────────────────────── */
export async function searchWeb(
  query: string,
  pageInput = 1,
  env: NodeJS.ProcessEnv = process.env
): Promise<SearchResponse> {
  const page = clampPage(pageInput);
  if (braveConfigured(env)) {
    const brave = await searchBrave(query, page, env);
    if (brave) return brave;
  }
  if (tavilyConfigured(env)) {
    const tavily = await searchTavily(query, page, env);
    if (tavily) return tavily;
  }
  if (googleConfigured(env)) {
    const google = await searchGoogle(query, page, env);
    if (google) return google;
  }
  const bing = await searchBing(query, page);
  if (bing.results.length > 0) return bing;
  const ddg = await searchDuckDuckGo(query, page);
  if (ddg.results.length > 0) return ddg;
  // Both keyless providers refused us: without a Google key that means "set one up", not
  // "try again". A genuinely empty query (no hits anywhere) is reported as such.
  const refused = bing.error === 'blocked' || ddg.error === 'blocked';
  const keyed = braveConfigured(env) || tavilyConfigured(env) || googleConfigured(env);
  if (refused && !keyed) return { ...ddg, error: 'unconfigured' };
  if (!bing.error) return bing;
  return ddg;
}

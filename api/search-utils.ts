export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

const RESULT_LIMIT = 8;
const SEARCH_TIMEOUT_MS = 8000;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
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

function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

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

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      }
    );

    if (!upstream.ok) return [];
    return parseSearchResults(await upstream.text());
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

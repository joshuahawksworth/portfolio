import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  displayUrl,
  googleConfigured,
  parseDuckDuckGoHtml,
  parseGoogleResults,
  parseSearchResults,
  searchWeb,
} from '../../api/search-utils';

const GOOGLE_ENV = { GOOGLE_SEARCH_KEY: 'key', GOOGLE_SEARCH_CX: 'cx' } as NodeJS.ProcessEnv;
const NO_ENV = {} as NodeJS.ProcessEnv;

const googleJson = {
  searchInformation: { formattedTotalResults: '1,230,000', formattedSearchTime: '0.42' },
  items: [
    {
      title: 'React &amp; TypeScript',
      link: 'https://react.dev/learn/typescript',
      displayLink: 'react.dev',
      snippet: 'TypeScript is a popular way to add type definitions to JavaScript.',
    },
    { title: 'Dup', link: 'https://react.dev/learn/typescript', snippet: 'again' },
    { title: 'Not a link', link: 'javascript:alert(1)', snippet: '' },
  ],
};

const liteHtml = `
<table><tr><td>
<a rel="nofollow" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fguide&amp;rut=abc" class='result-link'>Example <b>Guide</b></a>
</td></tr><tr><td class='result-snippet'>A helpful &amp; short guide.</td></tr></table>`;

const htmlVariant = `
<div class="result results_links results_links_deep web-result ">
  <div class="links_main links_deep result__body">
    <h2 class="result__title"><a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org%2Fdocs&amp;rut=x">Example Docs</a></h2>
    <a class="result__snippet" href="https://example.org/docs">Documentation for <b>everything</b>.</a>
  </div>
</div>`;

afterEach(() => vi.unstubAllGlobals());

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  const spy = vi.fn(async (input: RequestInfo | URL) => handler(String(input)));
  vi.stubGlobal('fetch', spy);
  return spy;
}

describe('search parsers', () => {
  it('parses Google Programmable Search JSON, dropping duplicates and bad links', () => {
    const results = parseGoogleResults(googleJson);
    expect(results).toEqual([
      {
        title: 'React & TypeScript',
        url: 'https://react.dev/learn/typescript',
        displayUrl: 'react.dev/learn/typescript',
        snippet: 'TypeScript is a popular way to add type definitions to JavaScript.',
      },
    ]);
  });

  it('parses DuckDuckGo lite and html markup', () => {
    expect(parseSearchResults(liteHtml)).toEqual([
      {
        title: 'Example Guide',
        url: 'https://example.com/guide',
        displayUrl: 'example.com/guide',
        snippet: 'A helpful & short guide.',
      },
    ]);
    expect(parseDuckDuckGoHtml(htmlVariant)).toEqual([
      {
        title: 'Example Docs',
        url: 'https://example.org/docs',
        displayUrl: 'example.org/docs',
        snippet: 'Documentation for everything.',
      },
    ]);
  });

  it('formats display urls the way Google does', () => {
    expect(displayUrl('https://www.example.com/')).toBe('example.com');
    expect(displayUrl('https://example.com/a/b/')).toBe('example.com/a/b');
    expect(googleConfigured(GOOGLE_ENV)).toBe(true);
    expect(googleConfigured(NO_ENV)).toBe(false);
  });
});

describe('searchWeb', () => {
  it('uses Google when configured and reports totals and the page', async () => {
    const spy = stubFetch(() => Response.json(googleJson));
    const res = await searchWeb('react typescript', 2, GOOGLE_ENV);
    expect(res.provider).toBe('google');
    expect(res.page).toBe(2);
    expect(res.totalResults).toBe('1,230,000');
    expect(res.results).toHaveLength(1);
    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.hostname).toBe('www.googleapis.com');
    expect(url.searchParams.get('q')).toBe('react typescript');
    expect(url.searchParams.get('start')).toBe('11');
    expect(url.searchParams.get('cx')).toBe('cx');
  });

  it('falls back to DuckDuckGo when Google errors', async () => {
    stubFetch((url) =>
      url.includes('googleapis')
        ? Response.json({ error: { code: 429, message: 'quota' } }, { status: 429 })
        : new Response(liteHtml, { status: 200, headers: { 'content-type': 'text/html' } })
    );
    const res = await searchWeb('guide', 1, GOOGLE_ENV);
    expect(res.provider).toBe('duckduckgo');
    expect(res.results[0].url).toBe('https://example.com/guide');
    expect(res.error).toBeUndefined();
  });

  it('tries the html endpoint when lite is empty', async () => {
    stubFetch((url) =>
      url.includes('lite.duckduckgo')
        ? new Response('<html></html>', { status: 200 })
        : new Response(htmlVariant, { status: 200 })
    );
    const res = await searchWeb('docs', 1, NO_ENV);
    expect(res.results[0].url).toBe('https://example.org/docs');
  });

  it('says search is unconfigured when DuckDuckGo refuses and there is no Google key', async () => {
    stubFetch(
      () =>
        new Response('<div class="anomaly-modal">bots use DuckDuckGo too</div>', { status: 403 })
    );
    const res = await searchWeb('anything', 1, NO_ENV);
    expect(res.results).toEqual([]);
    expect(res.error).toBe('unconfigured');
  });

  it('reports a plain failure on network errors', async () => {
    stubFetch(() => {
      throw new Error('ECONNRESET');
    });
    const res = await searchWeb('anything', 1, NO_ENV);
    expect(res.error).toBe('failed');
  });
});

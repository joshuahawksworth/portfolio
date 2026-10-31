import { describe, expect, it } from 'vitest';
import { appOnlyName, processHtml, shortcutPage, youtubeVideoId } from '../../api/browser-utils';

describe('browser proxy shortcuts', () => {
  it('finds the video id in every YouTube address shape', () => {
    for (const u of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    ]) {
      expect(youtubeVideoId(new URL(u))).toBe('dQw4w9WgXcQ');
    }
    expect(youtubeVideoId(new URL('https://www.youtube.com/'))).toBeNull();
    expect(youtubeVideoId(new URL('https://www.youtube.com/watch?v=not-an-id'))).toBeNull();
    expect(youtubeVideoId(new URL('https://example.com/watch?v=dQw4w9WgXcQ'))).toBeNull();
  });

  it('names app-only sites by host or subdomain and leaves ordinary sites alone', () => {
    expect(appOnlyName(new URL('https://www.reddit.com/r/reactnative'))).toBe('Reddit');
    expect(appOnlyName(new URL('https://old.reddit.com/'))).toBe('Reddit');
    expect(appOnlyName(new URL('https://mail.google.com/'))).toBe('Gmail');
    expect(appOnlyName(new URL('https://www.google.com/'))).toBeNull();
    expect(appOnlyName(new URL('https://notreddit.com/'))).toBeNull();
  });

  it('sends the embed player for a video, an explanation for an app, nothing otherwise', () => {
    expect(shortcutPage('https://youtu.be/dQw4w9WgXcQ')).toContain(
      'youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    const reddit = shortcutPage('https://www.reddit.com/')!;
    expect(reddit).toContain("Reddit can't run inside this browser");
    expect(reddit).toContain('Open www.reddit.com in a new tab');
    expect(shortcutPage('https://www.youtube.com/')).toContain("YouTube can't run");
    expect(shortcutPage('https://en.wikipedia.org/wiki/React_Native')).toBeNull();
  });
});

describe('processHtml', () => {
  it('injects the final address as the base when the page has none', () => {
    const out = processHtml(
      '<html><head><title>x</title></head><body></body></html>',
      'https://a.test/b/'
    );
    expect(out).toContain('<head><base href="https://a.test/b/">');
  });

  it("resolves a page's own relative base instead of overriding it", () => {
    const out = processHtml(
      '<!doctype html><html><head><base href="/bsz/"><script src="mode.js"></script></head></html>',
      'https://vel.gg/bsz'
    );
    expect(out).toContain('<base href="https://vel.gg/bsz/">');
    expect(out.match(/<base/g)).toHaveLength(1);
  });
});

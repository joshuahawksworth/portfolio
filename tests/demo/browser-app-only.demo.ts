import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot, typeSlowly } from './demo-helpers';

/**
 * Sites that are web apps (YouTube, Reddit, X…) used to sit on a loading skeleton or a bare
 * error inside the browser. Now the proxy answers straight away: an app-only site gets a
 * plain explanation with a way to open it for real, and a YouTube video link gets YouTube's
 * own embed player. Stills on macOS.
 */
screenshotsOnly();

test.describe('Brave: app-only sites', () => {
  onlyOn('desktop');

  test('Reddit explains itself; a YouTube link plays in the embed player', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    const address = page.getByPlaceholder('Search Brave or type a URL');
    const frame = page.frameLocator('iframe[title], iframe').first();

    await address.click();
    await typeSlowly(page, 'reddit.com');
    await page.keyboard.press('Enter');
    await expect(frame.getByText("Reddit can't run inside this browser")).toBeVisible({
      timeout: 15_000,
    });
    await beat(page);
    await shot(page, 'Reddit: a straight answer instead of a 403');

    await address.click();
    await page.keyboard.press('ControlOrMeta+A');
    await typeSlowly(page, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 20);
    await page.keyboard.press('Enter');
    await expect(
      frame.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')
    ).toBeAttached({
      timeout: 15_000,
    });
    await beat(page, 3_000);
    await shot(page, 'YouTube video: the official embed player');
  });
});

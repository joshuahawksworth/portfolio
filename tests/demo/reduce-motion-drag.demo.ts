import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * Video: with Reduce Motion on, a window still follows the pointer exactly while it is
 * dragged. The previous reduce-motion rule gave every element a 0.12 s transition, and the
 * window's position is set by JavaScript on every mouse move, so it eased after the pointer
 * like dragging through honey; only declared transitions are shortened now.
 */

const SETTINGS_KEY = 'portfolio.settings.v1';

test.describe('Reduce Motion and window dragging', () => {
  onlyOn('desktop');

  test('macOS: a dragged window stays under the pointer with Reduce Motion on', async ({
    page,
  }) => {
    await page.addInitScript((key: string) => {
      window.localStorage.setItem(key, JSON.stringify({ platform: 'apple', reduceMotion: true }));
    }, SETTINGS_KEY);
    await enterPortfolio(page);
    await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
    await beat(page);

    const win = page.locator('[data-window]').first();
    // The window's own box declares no transition, so nothing eases its position.
    expect(await win.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');

    const titleBar = win.locator('[class*="_titleBar_"]').first();
    const grab = await titleBar.boundingBox();
    expect(grab).not.toBeNull();
    const start = await win.boundingBox();
    const x0 = grab!.x + grab!.width / 2 + 100;
    const y0 = grab!.y + grab!.height / 2;
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    const path: [number, number][] = [
      [60, 30],
      [140, 70],
      [220, 110],
      [300, 150],
      [360, 120],
      [420, 60],
    ];
    for (const [dx, dy] of path) {
      await page.mouse.move(x0 + dx, y0 + dy, { steps: 6 });
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
      const now = await win.boundingBox();
      // Where the pointer is, the window is: no easing, no lag.
      expect(Math.abs(now!.x - start!.x - dx)).toBeLessThanOrEqual(2);
      expect(Math.abs(now!.y - start!.y - dy)).toBeLessThanOrEqual(2);
      await beat(page, 400);
    }
    await page.mouse.up();
    await beat(page, 1_500);
  });
});

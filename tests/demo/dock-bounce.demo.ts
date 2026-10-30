import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * The Dock bounce runs like macOS's: the icon keeps hopping (about an icon's height, a beat
 * on the ground between hops) until the app is up, then lands and stops as the window
 * appears. A first launch is a cold start of a few hops; relaunching the same app is quick.
 * Video, since the point is the motion and its timing.
 */
test.describe('Dock launch bounce', () => {
  onlyOn('desktop');

  test('macOS: Ask Claude bounces until it opens, then relaunches quickly', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    const dockItem = page.getByRole('button', { name: 'Ask Claude' }).first();
    const window = page.locator('[data-window]', { hasText: 'Ask Claude' });

    await dockItem.click();
    await expect(window).toBeVisible({ timeout: 10_000 });
    await beat(page, 1_500);

    await window.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(window).toBeHidden();
    await beat(page);
    await dockItem.click();
    await expect(window).toBeVisible({ timeout: 10_000 });
    await beat(page, 1_500);
  });
});

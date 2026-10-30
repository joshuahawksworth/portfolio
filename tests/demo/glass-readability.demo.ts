import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * macOS windows blur what is behind them heavily enough that their own text reads over another
 * window or a busy wallpaper. Stills of the Trash over About Josh on the default and the Golden
 * Gate wallpapers.
 */
screenshotsOnly();

test.describe('window glass readability', () => {
  onlyOn('desktop');

  for (const wallpaper of ['beach', 'gold'] as const) {
    test(`macOS: Trash over About Josh on the ${wallpaper} wallpaper`, async ({ page }) => {
      await page.addInitScript((w: string) => {
        window.localStorage.setItem(
          'portfolio.settings.v1',
          JSON.stringify({ platform: 'apple', wallpaper: { macos: w } })
        );
      }, wallpaper);
      await enterPortfolio(page);
      await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: 'Trash', exact: true }).first().dblclick();
      await expect(page.getByText('Put Back All')).toBeVisible();
      await beat(page);
      await shot(page, `macOS Trash over About Josh on ${wallpaper}`);
    });
  }
});

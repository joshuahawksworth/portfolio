import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * The Waves live wallpaper and the Windows desktop icon styling. Stills: Windows 11 with the
 * live wallpaper and a selected icon (two-line label, translucent selection pane), and macOS
 * with the same wallpaper from its own picker.
 */
screenshotsOnly();

test.describe('Waves wallpaper and Windows icons', () => {
  onlyOn('desktop');

  test('Windows 11: live Waves wallpaper with a selected desktop icon', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'portfolio.settings.v1',
        JSON.stringify({ platform: 'windows', wallpaper: { windows: 'waves' } })
      );
    });
    await enterPortfolio(page);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10_000 });
    const icon = page.getByRole('button', { name: /GitHub Desktop/ }).first();
    await icon.click();
    await beat(page);
    await shot(page, 'Windows 11 Waves wallpaper and selected icon');
  });

  test('macOS: live Waves wallpaper', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'portfolio.settings.v1',
        JSON.stringify({ platform: 'apple', wallpaper: { macos: 'waves' } })
      );
    });
    await enterPortfolio(page);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10_000 });
    await beat(page, 2_000);
    await shot(page, 'macOS Waves wallpaper');
  });
});

import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * The Android home screen on a photograph instead of the drawn gradient, with At a Glance
 * showing a drawn weather icon rather than an emoji; the same icon in the Windows taskbar
 * and the macOS weather widget.
 */
screenshotsOnly();

test.describe('Android wallpaper and weather icon', () => {
  onlyOn('pixel');

  test('Android: photo wallpaper and At a Glance weather icon', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await expect(page.getByRole('button', { name: 'At a glance' })).toBeVisible({
      timeout: 10_000,
    });
    await beat(page, 2_000);
    await shot(page, 'Android home on the Shore photo');
  });
});

test.describe('Weather icon on the desktops', () => {
  onlyOn('desktop');

  test('Windows 11 taskbar and macOS widget weather icons', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await expect(page.getByRole('button', { name: /^Weather:/ })).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await shot(page, 'Windows 11 taskbar weather');

    await enterPortfolio(page, 'apple');
    await expect(page.getByRole('button', { name: /Weather in Manchester/ })).toBeVisible({
      timeout: 10_000,
    });
    await beat(page);
    await shot(page, 'macOS weather widget');
  });
});

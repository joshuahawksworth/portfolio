import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/** The battery glyph now carries its percentage: a still of each system bar proves it. */
screenshotsOnly();

test.describe('battery percentage on the glyph', () => {
  onlyOn('desktop');

  test('macOS menu bar battery shows 100 on the battery', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    const battery = page.getByRole('button', { name: 'Battery 100%' });
    await expect(battery).toBeVisible({ timeout: 10_000 });
    await expect(battery.locator('svg text').first()).toHaveText('100');
    await beat(page);
    await shot(page, 'macOS menu bar with the percentage on the battery');
  });
});

test.describe('battery percentage on the phone', () => {
  onlyOn('pixel');

  test('iOS status bar battery shows 100 on the battery', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    const battery = page.locator('svg[data-battery-level]').first();
    await expect(battery).toBeVisible({ timeout: 10_000 });
    await expect(battery.locator('text').first()).toHaveText('100');
    await beat(page);
    await shot(page, 'iOS status bar with the percentage on the battery');
  });
});

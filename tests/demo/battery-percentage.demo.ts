import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/** The battery now shows its percentage as each platform does: a still of each bar proves it. */
screenshotsOnly();

test.describe('battery percentage on the glyph', () => {
  onlyOn('desktop');

  test('macOS menu bar shows 100% beside the battery', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    const battery = page.getByRole('button', { name: 'Battery 100%' });
    await expect(battery).toBeVisible({ timeout: 10_000 });
    await expect(battery).toHaveText('100%');
    await beat(page);
    await shot(page, 'macOS menu bar with the percentage beside the battery');
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

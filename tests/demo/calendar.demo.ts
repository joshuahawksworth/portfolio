import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * A Calendar app on both desktops: Day / Week / Month / Year views, the roles' start and end
 * months as events, a mini month in the sidebar. On macOS the date widget opens it and the
 * Dock shows the live Calendar icon; on Windows it is pinned to the taskbar. Stills.
 */
screenshotsOnly();

test.describe('Calendar', () => {
  onlyOn('desktop');

  test('macOS: the date widget opens Calendar; Month and Year views', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    // The browser the desktop opens on overlaps the widgets; close it first.
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();
    await beat(page);
    await page.getByRole('button', { name: /open Calendar/ }).click();
    await expect(page.getByRole('tab', { name: 'Month' })).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await shot(page, 'macOS Calendar: month view, opened from the date widget');
    await page.getByRole('tab', { name: 'Year' }).click();
    await beat(page);
    await shot(page, 'macOS Calendar: year view');
  });

  test('Windows: Calendar from the taskbar; Week view', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await page
      .locator('[class*="_taskbar_"]')
      .getByRole('button', { name: 'Calendar', exact: true })
      .click();
    await expect(page.getByRole('tab', { name: 'Month' })).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await shot(page, 'Windows Calendar: month view');
    await page.getByRole('tab', { name: 'Week' }).click();
    await beat(page);
    await shot(page, 'Windows Calendar: week view');
  });
});

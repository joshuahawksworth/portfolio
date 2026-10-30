import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Settings reads like the real thing on each desktop: on macOS a toolbar with back / forward
 * arrows and the pane title, sentence-case group headings and the platform cards standing on
 * their own (no second frame around them); on Windows the big page title and the account at
 * the top of the navigation. Stills, Platform and General / System on both.
 */
screenshotsOnly();

test.describe('Settings, native pass', () => {
  onlyOn('desktop');

  for (const [platform, general] of [
    ['apple', 'General'],
    ['windows', 'System'],
  ] as const) {
    test(`${platform}: Platform and ${general}`, async ({ page }) => {
      await enterPortfolio(page, platform);
      await page
        .locator('[class*="_wrapper_"], [class*="_taskbar_"]')
        .getByRole('button', { name: /Settings/ })
        .first()
        .click();
      await expect(page.getByRole('radio', { name: /macOS/ })).toBeVisible({ timeout: 10_000 });
      await beat(page);
      await shot(page, `${platform} Settings: Platform cards without a second frame`);
      await page.getByRole('button', { name: general, exact: true }).click();
      await beat(page);
      await shot(page, `${platform} Settings: ${general}`);
      if (platform === 'apple') {
        await page.getByRole('main').getByRole('button', { name: 'Back', exact: true }).click();
        await expect(page.getByRole('radio', { name: /macOS/ })).toBeVisible();
        await beat(page);
      }
    });
  }
});

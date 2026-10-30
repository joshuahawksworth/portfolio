import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * The browser is Brave now: Brave's lion in the dock and on the home screens, "Brave Browser"
 * in the title, and the start page is Brave Search's. Stills on macOS, Windows and Android.
 */
screenshotsOnly();

test.describe('Brave Browser on the desktop', () => {
  onlyOn('desktop');

  for (const platform of ['apple', 'windows'] as const) {
    test(`${platform}: Brave Browser start page`, async ({ page }) => {
      await enterPortfolio(page, platform);
      await page
        .getByRole('button', { name: /Brave Browser/ })
        .first()
        .click();
      await expect(page.getByAltText('Brave Search')).toBeVisible({ timeout: 10_000 });
      await beat(page);
      await shot(page, `${platform} Brave Browser start page`);
    });
  }
});

test.describe('Brave on a phone', () => {
  onlyOn('pixel');

  test('Android: Brave start page', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await page.getByRole('button', { name: 'Brave', exact: true }).first().click();
    await expect(page.getByAltText('Brave Search')).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await shot(page, 'Android Brave start page');
  });
});

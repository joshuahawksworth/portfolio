import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * The desktop now opens on Brave Browser showing a plain one-page version of the portfolio
 * instead of the About Josh window. Stills of the first screen on both platforms, plus the
 * projects section further down the page.
 */
screenshotsOnly();

for (const platform of ['apple', 'windows'] as const) {
  test.describe(`landing on ${platform}`, () => {
    onlyOn('desktop');

    test(`${platform}: Brave opens on the plain portfolio site`, async ({ page }) => {
      await enterPortfolio(page, platform);
      const heading = page.getByRole('heading', { name: 'Joshua Hawksworth', level: 1 });
      await expect(heading).toBeVisible({ timeout: 10_000 });
      await expect(page.getByPlaceholder('Search Google or enter website name')).toHaveValue(
        'https://hawksworth.dev/classic'
      );
      await beat(page);
      await shot(page, `${platform} desktop opens on the plain site`);

      await page.getByRole('button', { name: 'Projects' }).click();
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
      await beat(page);
      await shot(page, `${platform} plain site projects section`);
    });
  });
}

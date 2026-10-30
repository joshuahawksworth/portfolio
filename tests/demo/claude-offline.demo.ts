import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Ask Claude opens straight onto the chat (no sign-in sheet, no API key) and answers from the
 * portfolio data. Stills on both platforms: the empty state, then a reply.
 */
screenshotsOnly();

for (const platform of ['apple', 'windows'] as const) {
  test.describe(`Ask Claude on ${platform}`, () => {
    onlyOn('desktop');

    test(`${platform}: opens without a sign-in step and answers offline`, async ({ page }) => {
      await enterPortfolio(page, platform);
      await page.getByRole('button', { name: 'Ask Claude' }).first().click();
      await expect(page.getByText('Where should we begin?')).toBeVisible({ timeout: 10_000 });
      expect(await page.getByRole('dialog').count()).toBe(0);
      await beat(page);
      await shot(page, `${platform} Ask Claude opens on the chat`);

      await page.getByRole('button', { name: "Summarise Josh's experience" }).click();
      await expect(page.getByText(/Arcus FM/).first()).toBeVisible({ timeout: 10_000 });
      await beat(page, 2_500);
      await shot(page, `${platform} Ask Claude answers from the portfolio`);
    });
  });
}

import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Ask Claude opens straight onto the chat (no sign-in sheet, no API key) and answers from the
 * portfolio data, dressed like the Claude app: ivory, serif greeting, the Claude composer and
 * sidebar. Stills on both desktop platforms (empty state, then a reply) and on the phone (the
 * docked composer and the drawer).
 */
screenshotsOnly();

for (const platform of ['apple', 'windows'] as const) {
  test.describe(`Ask Claude on ${platform}`, () => {
    onlyOn('desktop');

    test(`${platform}: opens without a sign-in step and answers offline`, async ({ page }) => {
      await enterPortfolio(page, platform);
      await page.getByRole('button', { name: 'Ask Claude' }).first().click();
      await expect(page.getByText(/^Good (morning|afternoon|evening), Joshua$/)).toBeVisible({
        timeout: 10_000,
      });
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

test.describe('Ask Claude on a phone', () => {
  onlyOn('pixel');

  test('Android: the Claude phone layout, then the drawer', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await page
      .getByRole('button', { name: /Ask Claude$/ })
      .first()
      .click();
    await expect(page.getByText(/^Good (morning|afternoon|evening), Joshua$/)).toBeVisible({
      timeout: 10_000,
    });
    await beat(page);
    await shot(page, 'Phone: greeting, suggestions and the docked composer');
    await page.getByRole('button', { name: 'Open sidebar' }).click();
    await beat(page);
    await shot(page, 'Phone: the sidebar drawer');
  });
});

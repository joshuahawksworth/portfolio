import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Windows desktop icons in the shell's own style: two-line labels, the layered text shadow,
 * and hover and selection as pale translucent panes. One still with an icon selected.
 */
screenshotsOnly();

test.describe('Windows desktop icons', () => {
  onlyOn('desktop');

  test('Windows 11: desktop icons with one selected', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    const icon = page.getByRole('button', { name: /GitHub Desktop/ }).first();
    await expect(icon).toBeVisible({ timeout: 10_000 });
    await icon.click();
    await beat(page);
    await shot(page, 'Windows 11 desktop icons with GitHub Desktop selected');
  });
});

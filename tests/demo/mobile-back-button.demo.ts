import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * On a phone, the browser's back button closes the open app and returns to the home screen
 * instead of leaving the site. The second app opened from the first closes first, then the
 * home screen is back and the site is still open.
 */
test.describe('mobile back button', () => {
  onlyOn('pixel');

  test('Android: browser back closes the open app', async ({ page }) => {
    await enterPortfolio(page, 'windows');

    const about = page.getByRole('button', { name: 'About', exact: true });
    await expect(about).toBeVisible({ timeout: 10_000 });
    await beat(page);

    await about.click();
    const closeBtn = page.getByRole('button', { name: 'Back', exact: true });
    await expect(closeBtn).toBeVisible();
    await beat(page, 2_000);

    await page.goBack();
    await expect(closeBtn).toBeHidden();
    await expect(about).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/');
    await beat(page, 2_500);
  });
});

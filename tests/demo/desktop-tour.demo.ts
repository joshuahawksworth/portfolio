import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * Example demo. Each PR that changes something a reviewer should see move adds its own
 * `<name>.demo.ts` next to this one; the pr-demo-video workflow records every demo the PR
 * touches and attaches the clips to the PR description.
 */

test.describe('desktop tour', () => {
  onlyOn('desktop');

  test('macOS desktop: Finder and Keyboard Shortcuts', async ({ page }) => {
    await enterPortfolio(page, 'apple');

    await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
    await beat(page);

    await page.getByRole('button', { name: 'Finder', exact: true }).click();
    await beat(page, 2_000);

    await page.getByRole('button', { name: 'Help' }).click();
    await beat(page);
    await page.getByRole('menuitem', { name: /Keyboard Shortcuts/i }).click();
    await beat(page, 2_500);
  });
});

test.describe('phone tour', () => {
  onlyOn('pixel');

  test('Android home screen: open About', async ({ page }) => {
    await enterPortfolio(page, 'windows');

    const about = page.getByRole('button', { name: 'About', exact: true });
    await expect(about).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await about.click();
    await beat(page, 2_500);
  });
});

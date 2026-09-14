import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Example screenshot demo. Use this shape when the change is static and a still says it all;
 * copy desktop-tour.demo.ts instead when the reviewer needs to see something move.
 */
screenshotsOnly();

test.describe('desktop at rest', () => {
  onlyOn('desktop');

  test('macOS desktop after login', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await shot(page, 'macOS desktop after login');
  });
});

test.describe('phone at rest', () => {
  onlyOn('pixel');

  test('Android home screen after unlock', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await expect(page.getByRole('button', { name: 'About', exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await beat(page);
    await shot(page, 'Android home screen after unlock');
  });
});

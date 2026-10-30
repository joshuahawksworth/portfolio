import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, shot } from './demo-helpers';

/**
 * Phone apps open full screen with no sheet header: the status bar sits above the app and
 * the OS's own way out below it. Android keeps the three-button navigation bar; iOS keeps the
 * home indicator, and a swipe up from the bottom edge goes home. Video, because the exit is
 * the point.
 */
test.describe('phone apps without a sheet header', () => {
  onlyOn('pixel');

  test('Android: About under the status bar, Back on the navigation bar leaves', async ({
    page,
  }) => {
    await enterPortfolio(page, 'windows');
    const about = page.getByRole('button', { name: 'About', exact: true });
    await about.click();
    const back = page.getByRole('button', { name: 'Back', exact: true });
    await expect(back).toBeVisible();
    await beat(page, 2_000);
    await shot(page, 'Android About with the navigation bar and no header');
    await back.click();
    await expect(about).toBeVisible();
    await beat(page, 1_500);

    // The Termux disc carries its own label, so the button's name is "Termux Terminal"
    await page.getByRole('button', { name: /Terminal$/ }).click();
    await beat(page, 2_000);
    await shot(page, 'Android Terminal with white bars on its dark canvas');
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await beat(page, 1_000);
  });

  test('iOS: About under the status bar, swipe up on the home indicator leaves', async ({
    page,
  }) => {
    await enterPortfolio(page, 'apple');
    const about = page.getByRole('button', { name: 'About', exact: true });
    await about.click();
    await beat(page, 2_000);
    await shot(page, 'iOS About with the home indicator and no header');

    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width / 2, vp.height - 8);
    await page.mouse.down();
    await page.mouse.move(vp.width / 2, vp.height - 140, { steps: 10 });
    await page.mouse.up();
    await expect(about).toBeVisible({ timeout: 5_000 });
    await beat(page, 1_500);
  });
});

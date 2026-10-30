import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * DOOM opens in an ordinary window and DOSBox boots straight into the game; on a phone it
 * takes the whole screen with translucent controls and the system bars laid over it, and
 * Home leaves it. Video, because the point is the launch and the exit.
 */
test.describe('DOOM on the desktop', () => {
  onlyOn('desktop');

  test('macOS: DOOM boots into the game inside a standard window', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    await page.getByRole('button', { name: 'DOOM', exact: true }).first().dblclick();
    // The controls line only appears once DOSBox has drawn its first frame.
    await expect(page.getByText(/W A S D move/)).toBeVisible({ timeout: 30_000 });
    await beat(page, 2_500);
    await page.keyboard.press('Enter');
    await beat(page, 3_000);
  });
});

test.describe('DOOM on a phone', () => {
  onlyOn('pixel');

  test('Android: DOOM full screen with touch controls, then Home to leave', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    const doom = page.getByRole('button', { name: 'DOOM', exact: true }).first();
    await doom.scrollIntoViewIfNeeded();
    await beat(page);
    await doom.click();
    const fire = page.getByRole('button', { name: 'Fire' });
    await expect(fire).toBeVisible();
    // The picture fades in once DOSBox has drawn its first frame.
    await expect(page.locator('canvas')).toHaveCSS('opacity', '1', { timeout: 30_000 });
    await beat(page, 2_500);
    const enter = page.getByRole('button', { name: 'Enter' });
    await enter.dispatchEvent('pointerdown');
    await enter.dispatchEvent('pointerup');
    await beat(page, 3_000);

    // Leave the game the Android way: Home on the navigation bar, which stays over the game.
    const home = page.getByRole('button', { name: 'Home' });
    await expect(home).toBeVisible();
    await home.click();
    await expect(doom).toBeVisible({ timeout: 5_000 });
    await beat(page, 1_500);
  });
});

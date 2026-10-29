import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * DOOM opens in an ordinary window and DOSBox boots straight into the game; on a phone the
 * game gets on-screen controls under the picture. Video, because the point is the launch.
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

  test('Android: DOOM runs with touch controls', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    const doom = page.getByRole('button', { name: 'DOOM', exact: true }).first();
    await doom.scrollIntoViewIfNeeded();
    await beat(page);
    await doom.click();
    const fire = page.getByRole('button', { name: 'Fire' });
    await expect(fire).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mute' })).toBeVisible({ timeout: 30_000 });
    await beat(page, 2_500);
    const enter = page.getByRole('button', { name: 'Enter' });
    await enter.dispatchEvent('pointerdown');
    await enter.dispatchEvent('pointerup');
    await beat(page, 3_000);
  });
});

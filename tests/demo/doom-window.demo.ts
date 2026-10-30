import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn } from './demo-helpers';

/**
 * DOOM opens in an ordinary window and DOSBox boots straight into the game: its Dock icon
 * appears and bounces the moment it is launched and stops once the game draws. The controls
 * line slides into a drawer after a while; the controller button in the corner brings it
 * back, and the speaker button opens the sound drawer with the volume slider and Mute. None
 * of these buttons keeps focus, so Enter stays with the game. On a phone it takes the whole
 * screen with translucent controls and the system bars laid over it, and Home leaves it.
 * Video, because the point is the launch and the exit.
 */
test.describe('DOOM on the desktop', () => {
  onlyOn('desktop');

  test('macOS: DOOM boots into the game inside a standard window', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    // The browser the desktop opens on overlaps the right-hand icons; close it first.
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();
    await beat(page);
    await page.getByRole('button', { name: 'DOOM', exact: true }).first().dblclick();
    // Feedback at once: DOOM joins the Dock and bounces while DOSBox boots.
    const dockDoom = page.locator('[class*="_wrapper_"]').getByRole('button', { name: 'DOOM' });
    await expect(dockDoom).toBeVisible({ timeout: 2_000 });
    // The controls line appears once DOSBox has drawn its first frame.
    await expect(page.getByText(/W A S D move/)).toBeVisible({ timeout: 60_000 });
    await beat(page, 2_500);
    await page.keyboard.press('Enter');
    await beat(page, 3_000);
    // The line lives in a drawer: the controller button in the corner hides and shows it.
    await page.getByRole('button', { name: 'Hide controls' }).click();
    await expect(page.getByRole('button', { name: 'Show controls' })).toBeVisible();
    await beat(page, 1_500);
    await page.getByRole('button', { name: 'Show controls' }).click();
    await expect(page.getByRole('button', { name: 'Hide controls' })).toBeVisible();
    await beat(page, 1_500);

    // The sound drawer: volume and Mute behind the speaker button
    await page.getByRole('button', { name: 'Sound', exact: true }).click();
    await expect(page.getByRole('slider', { name: 'Volume' })).toBeVisible();
    await page.getByRole('slider', { name: 'Volume' }).fill('0.3');
    await beat(page);
    await page.getByRole('button', { name: 'Mute' }).click();
    // Enter goes to the game, not back to the button that was just clicked
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Unmute' })).toBeVisible();
    await beat(page, 1_500);
  });
});

test.describe('DOOM on a phone', () => {
  onlyOn('pixel');

  test('Android: DOOM full screen with touch controls, then Home to leave', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    // The disc carries its own label, so the button's name is "DOOM DOOM"
    const doom = page.getByRole('button', { name: /DOOM$/ }).first();
    await doom.scrollIntoViewIfNeeded();
    await beat(page);
    await doom.click();
    const fire = page.getByRole('button', { name: 'Fire' });
    await expect(fire).toBeVisible();
    // The picture fades in once DOSBox has drawn its first frame; a shared CI runner can take
    // a while to boot the emulator.
    await expect(page.locator('canvas')).toHaveCSS('opacity', '1', { timeout: 60_000 });
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

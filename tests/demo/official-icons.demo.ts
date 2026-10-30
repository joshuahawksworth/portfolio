import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * The drawn imitations are gone: the Android launcher shows the Google apps' own icons
 * (Files, Gmail, Maps, Calculator, Docs, Settings…), Termux, and DOOM at full size; At a
 * Glance and the Windows taskbar show Google's weather icons; the Start menu's Microsoft
 * Store is Microsoft's. Stills, since nothing moves.
 */
screenshotsOnly();

test.describe('official icons on Android', () => {
  onlyOn('pixel');

  test('Pixel home screen, both pages', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await expect(page.getByRole('button', { name: 'Gmail Gmail' })).toBeVisible();
    await beat(page);
    await shot(page, 'Android home: the real Files, Gmail, Maps, Calculator and Docs icons');
    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width - 40, vp.height / 2);
    await page.mouse.down();
    await page.mouse.move(40, vp.height / 2, { steps: 12 });
    await page.mouse.up();
    await beat(page);
    await shot(page, 'Android page two: Settings and DOOM at full size');
  });
});

test.describe('official icons on Windows', () => {
  onlyOn('desktop');

  test('Start menu with the Microsoft Store, taskbar weather', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await beat(page);
    await page.getByRole('button', { name: /All apps/ }).click();
    await beat(page);
    await shot(
      page,
      'Windows Start menu: every app with its own icon, Google weather on the taskbar'
    );
  });
});

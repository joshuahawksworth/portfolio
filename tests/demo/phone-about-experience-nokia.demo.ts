import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Phone fixes from Joshua's screenshots: About's Location pin and Skills brackets read
 * properly and the socials are icon-only buttons; a swipe across a role in Work Experience
 * moves to the next one; Snake runs on a Nokia 3310 with a large LCD and a spaced numeric
 * keypad where 2 4 6 8 steer. Stills on Android.
 */
screenshotsOnly();

test.describe('phone: About, Experience and the Nokia', () => {
  onlyOn('pixel');

  test('About has clean glyphs and icon-only socials', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await page.getByRole('button', { name: 'About', exact: true }).click();
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
    await beat(page);
    await shot(page, 'Android About: Location pin, Skills brackets, icon socials');
  });

  test('Experience: a swipe moves to the next role', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await page.getByRole('button', { name: 'Experience', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Arcus FM' })).toBeVisible();
    await beat(page);
    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width - 30, vp.height / 2);
    await page.mouse.down();
    await page.mouse.move(40, vp.height / 2 + 4, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByRole('heading', { name: 'CMap Software' })).toBeVisible();
    await beat(page);
    await shot(page, 'Android Experience: swiped from Arcus FM to CMap Software');
  });

  test('Snake on a Nokia 3310', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width - 40, vp.height / 2);
    await page.mouse.down();
    await page.mouse.move(40, vp.height / 2, { steps: 12 });
    await page.mouse.up();
    await beat(page);
    await page.getByRole('button', { name: /Snake$/ }).click();
    await expect(page.getByRole('button', { name: 'Up' })).toBeVisible();
    await beat(page, 1_500);
    await shot(page, 'Android Snake: Nokia 3310 with a large LCD and numeric keypad');
  });
});

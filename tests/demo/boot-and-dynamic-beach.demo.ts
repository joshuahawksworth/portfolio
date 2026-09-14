import { expect, test, type Page } from '@playwright/test';
import { sunTimesFor } from '../../src/lib/dynamicWallpaper';
import { beat, onlyOn, shot } from './demo-helpers';

/**
 * Video: the boot screens and the login cross-fade still play with Reduce Motion switched
 * on (the setting used to snap the macOS bar to full, freeze the Windows spinner and flash
 * the page colour between screens). Stills: The Beach at dawn, dusk and night, the frames a
 * dynamic wallpaper now cross-fades through.
 */

const SETTINGS_KEY = 'portfolio.settings.v1';

/** Boot on a fixed platform with the site's own Reduce Motion setting on. */
async function bootWithReduceMotion(page: Page, platform: 'apple' | 'windows') {
  await page.addInitScript(
    ({ key, os }: { key: string; os: string }) => {
      window.localStorage.setItem(key, JSON.stringify({ platform: os, reduceMotion: true }));
    },
    { key: SETTINGS_KEY, os: platform }
  );
  await page.goto('/');
}

/** Boot straight to the macOS desktop with the clock fixed at a time of day. */
async function desktopAt(page: Page, time: Date) {
  await page.clock.install({ time });
  await page.addInitScript((key: string) => {
    window.localStorage.setItem(key, JSON.stringify({ platform: 'apple' }));
  }, SETTINGS_KEY);
  await page.goto('/');
  await expect(page.getByText('Joshua Hawksworth').first()).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Enter');
  await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
  await beat(page, 2_000);
}

test.describe('boot animations with Reduce Motion on', () => {
  onlyOn('desktop');

  test('macOS boot bar fills, then the login cross-fades into the desktop', async ({ page }) => {
    await bootWithReduceMotion(page, 'apple');
    // The bar is driven by the clock: it grows between two samples taken mid-boot, rather
    // than sitting empty or snapping to full.
    const bar = page.locator('[data-boot-os="macos"] [class*="barFill"]');
    await expect(bar).toBeVisible();
    const widthAt = () => bar.evaluate((el) => parseFloat(el.style.width));
    await expect.poll(widthAt).toBeGreaterThan(5);
    const first = await widthAt();
    expect(first).toBeLessThan(95);
    await page.waitForTimeout(400);
    expect(await widthAt()).toBeGreaterThan(first);

    await expect(page.getByText('Joshua Hawksworth').first()).toBeVisible({ timeout: 15_000 });
    await beat(page);
    await page.keyboard.press('Enter');
    await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
    await beat(page, 2_000);
  });

  test('Windows boot spinner keeps turning', async ({ page }) => {
    await bootWithReduceMotion(page, 'windows');
    const dot = page.locator('[data-boot-os="windows"] [class*="winDot"]').first();
    await expect(dot).toBeVisible();
    await page.waitForTimeout(1_200);
    const first = await dot.evaluate((el) => el.style.transform);
    await page.waitForTimeout(500);
    const later = await dot.evaluate((el) => el.style.transform);
    expect(later).not.toBe(first);

    // The Windows lock screen shows the clock first; any key brings up the sign-in.
    await expect(page.locator('[class*="winLock"]')).toBeVisible({ timeout: 15_000 });
    await beat(page);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await beat(page);
    await page.keyboard.press('Enter');
    await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 10_000 });
    await beat(page, 2_000);
  });
});

test.describe('The Beach through the day', () => {
  onlyOn('desktop');

  // The frames follow that day's sunrise and sunset, so pick the moments relative to them.
  const day = new Date(2026, 8, 14);
  const { sunrise, sunset } = sunTimesFor(day);
  const at = (hours: number) => new Date(day.getTime() + hours * 3_600_000);

  for (const [caption, time] of [
    ['The Beach at dawn', at(sunrise + 0.02)],
    ['The Beach at dusk', at(sunset - 0.05)],
    ['The Beach at night', at(sunset + 3)],
  ] as const) {
    test(caption, async ({ page }) => {
      await desktopAt(page, time);
      const frame = caption.split(' ').pop()!;
      const layer = page.locator(`[data-frame="${frame}"]`);
      // The frame is (all but) fully in: the fades are gradual, so allow the last few percent.
      await expect
        .poll(() => layer.evaluate((el) => parseFloat(getComputedStyle(el).opacity)))
        .toBeGreaterThan(0.9);
      await shot(page, caption);
    });
  }
});

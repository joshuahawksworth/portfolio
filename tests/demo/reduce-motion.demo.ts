import { expect, test, type Page } from '@playwright/test';
import { beat, onlyOn } from './demo-helpers';

/**
 * Video: with Reduce Motion on, the shell still moves. Transitions and one-shot animations
 * are short rather than absent (the Dock still magnifies, My Flaws still hops away), and
 * activity indicators keep their own timing (the Terminal cursor still blinks). Reduce Motion
 * used to flatten all of it to a thousandth of a millisecond, which read as the app being broken.
 */

const SETTINGS_KEY = 'portfolio.settings.v1';

async function enterWithReduceMotion(page: Page, platform: 'apple' | 'windows') {
  await page.addInitScript(
    ({ key, os }: { key: string; os: string }) => {
      window.localStorage.setItem(key, JSON.stringify({ platform: os, reduceMotion: true }));
    },
    { key: SETTINGS_KEY, os: platform }
  );
  await page.goto('/');
  await expect(page.getByText(/Joshua|Swipe up to unlock/).first()).toBeVisible({
    timeout: 15_000,
  });
  await beat(page);
  await page.keyboard.press('Enter');
  await beat(page);
}

/** Computed duration of the first transition / animation on an element, in seconds. */
function durationOf(page: Page, selector: string, prop: 'transition' | 'animation') {
  return page
    .locator(selector)
    .first()
    .evaluate((el, p) => parseFloat(getComputedStyle(el).getPropertyValue(`${p}-duration`)), prop);
}

test.describe('Reduce Motion keeps the shell moving', () => {
  onlyOn('desktop');

  test('macOS: the Dock magnifies, My Flaws hops, the Terminal cursor blinks', async ({ page }) => {
    await enterWithReduceMotion(page, 'apple');
    expect(await page.evaluate(() => document.documentElement.dataset.reduceMotion)).toBe('on');

    // Dock icons still glide up under the pointer (a short transition, not a snap).
    const dockIcons = page.locator('[class*="_panel_"] [class*="_iconBtn_"]');
    await dockIcons.first().hover();
    await beat(page);
    await dockIcons.nth(4).hover();
    await beat(page);
    expect(
      await durationOf(page, '[class*="_panel_"] [class*="_iconBtn_"]', 'transition')
    ).toBeGreaterThan(0.05);

    // My Flaws runs away from the pointer, and is seen to move rather than teleport. The
    // pointer is moved by hand: a hover() would wait for an icon that never stays put.
    const flaws = page.getByText('My Flaws', { exact: true }).first();
    for (let i = 0; i < 2; i++) {
      const before = await flaws.boundingBox();
      expect(before).not.toBeNull();
      await page.mouse.move(before!.x + before!.width / 2, before!.y - 20);
      await beat(page);
      const after = await flaws.boundingBox();
      expect(after).not.toEqual(before);
    }

    // The Terminal cursor keeps blinking at its own pace.
    await page
      .getByRole('button', { name: /Terminal/i })
      .first()
      .click();
    await beat(page, 2_000);
    expect(await durationOf(page, '[data-essential-motion][class*="cursor"]', 'animation')).toBe(1);
    expect(
      await page
        .locator('[data-essential-motion][class*="cursor"]')
        .evaluate((el) => getComputedStyle(el).animationIterationCount)
    ).toBe('infinite');
    await beat(page);
  });
});

test.describe('Reduce Motion on the phone', () => {
  onlyOn('pixel');

  test('Android: My Flaws still pops away when tapped', async ({ page }) => {
    await enterWithReduceMotion(page, 'windows');
    const flaws = page.getByText('My Flaws', { exact: true }).first();
    await flaws.scrollIntoViewIfNeeded();
    await beat(page);
    const before = await flaws.boundingBox();
    await flaws.tap();
    await beat(page);
    const after = await flaws.boundingBox();
    expect(after).not.toEqual(before);
    expect(await durationOf(page, '[class*="tricksterItem"]', 'animation')).toBeGreaterThan(0.05);
    await flaws.tap();
    await beat(page, 1_500);
  });
});

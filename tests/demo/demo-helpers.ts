import { expect, test, type Page } from '@playwright/test';

/**
 * Helpers for PR demo recordings. Demos are watched by a reviewer, so every step pauses long
 * enough to be seen; nothing here is meant to be fast.
 */

export type Platform = 'apple' | 'windows';

/** How long a viewer needs to register a change on screen. */
export const BEAT_MS = 1_200;

/** Let the viewer take in the current frame. */
export async function beat(page: Page, ms = BEAT_MS) {
  await page.waitForTimeout(ms);
}

/** Type like a person rather than pasting, so the reviewer can follow along. */
export async function typeSlowly(page: Page, text: string, delay = 60) {
  await page.keyboard.type(text, { delay });
}

/**
 * Boot the portfolio and get past the lock/login screen. Pass a platform to force Apple or
 * Windows/Android regardless of the device profile; omit it to take the default for the
 * project (macOS on desktop, Android on the Pixel profile, because first visits choose the
 * platform that matches the device).
 */
export async function enterPortfolio(page: Page, platform?: Platform) {
  if (platform) {
    // Same key and shape as src/lib/settingsStore.ts; only the platform is pinned, every
    // other setting keeps its default.
    await page.addInitScript((os: Platform) => {
      window.localStorage.setItem('portfolio.settings.v1', JSON.stringify({ platform: os }));
    }, platform);
  }
  await page.goto('/');
  await expect(page.getByText(/Joshua|Swipe up to unlock/).first()).toBeVisible({
    timeout: 15_000,
  });
  await beat(page);
  await page.keyboard.press('Enter');
  await beat(page);
}

/**
 * Call once at the top of a spec whose change is static (a layout, a colour, a panel at rest):
 * the run records no video and the PR gets the stills taken with `shot` instead. A spec that
 * shows something moving keeps the default, video on, and may still take shots.
 */
export function screenshotsOnly() {
  test.use({ video: 'off' });
}

/**
 * Capture the current screen as a named still for the PR. The caption becomes the file name
 * and the label in the PR description, so say what the reviewer should look at.
 */
export async function shot(page: Page, caption: string, opts: { fullPage?: boolean } = {}) {
  const info = test.info();
  // Written to a file rather than attached inline so the JSON report carries a path the
  // converter can copy.
  const file = info.outputPath(`shot-${caption.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  await info.attach(`shot:${caption}`, { path: file, contentType: 'image/png' });
}

/** Skip a test unless it runs on the given project, keeping the demo files declarative. */
export function onlyOn(project: 'desktop' | 'pixel') {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== project, `Recorded on the ${project} project only.`);
  });
}

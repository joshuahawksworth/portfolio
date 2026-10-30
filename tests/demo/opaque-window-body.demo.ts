import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Only a window's title bar is glass; its body is opaque, so an app over the dark Brave
 * landing page no longer shows the page through its content. Stills on both desktop
 * platforms with Skills and Ask Claude stacked over the browser.
 */
screenshotsOnly();

for (const platform of ['apple', 'windows'] as const) {
  test.describe(`opaque window bodies on ${platform}`, () => {
    onlyOn('desktop');

    test(`${platform}: Skills and Ask Claude over the browser`, async ({ page }) => {
      await enterPortfolio(page, platform);
      // Launch from the Dock / taskbar: the desktop icon sits under the browser window and
      // the decoy site has a "Skills" link of its own.
      const launcher = page.locator('[class*="_wrapper_"], [class*="_taskbar_"]');
      await launcher.getByRole('button', { name: 'Skills', exact: true }).click();
      await expect(page.locator('[data-window]', { hasText: 'Skills & Tech' })).toBeVisible();
      await beat(page);
      await launcher.getByRole('button', { name: 'Ask Claude', exact: true }).click();
      await expect(page.locator('[data-window]', { hasText: 'Ask Claude' })).toBeVisible({
        timeout: 10_000,
      });
      await beat(page, 1_500);
      await shot(page, `${platform}: window bodies are opaque over the browser, title bars glass`);
    });
  });
}

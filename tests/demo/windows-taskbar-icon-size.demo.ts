import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * The shared artwork (GitHub, Ask Claude, About) used the macOS 82% inset on every
 * platform, so those three read smaller than the Fluent tiles beside them in the Windows
 * taskbar. They now take the Fluent 86% inset, and the Invertocat fills more of its tile.
 * Stills: nothing moves.
 */
screenshotsOnly();

test.describe('Windows taskbar icon size', () => {
  onlyOn('desktop');

  test('GitHub, Ask Claude and About match the Fluent icons', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    await expect(page.getByRole('button', { name: 'About', exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await beat(page);
    await shot(page, 'Windows taskbar: the shared icons sit at the same size as the Fluent set');
  });

  test('the macOS dock is unchanged', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    await expect(page.getByRole('button', { name: 'About', exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await beat(page);
    await shot(page, 'macOS dock: still the 82% inset');
  });
});

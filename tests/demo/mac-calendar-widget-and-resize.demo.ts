import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * Two macOS details: the Calendar widget's heading reads "Sun Nov" over the day like the
 * real one, and a window's top edge cannot be dragged under the menu bar. Stills.
 */
screenshotsOnly();

test.describe('macOS Calendar widget and resize limit', () => {
  onlyOn('desktop');

  test('the widget names the day and month; resizing stops at the menu bar', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    const win = page.locator('[data-window]').first();
    await expect(win).toBeVisible();
    // Drag the window's top edge well above the menu bar
    const box = (await win.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y - 1);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 150, { steps: 10 });
    await page.mouse.move(box.x + box.width / 2, -40, { steps: 10 });
    await page.mouse.up();
    await beat(page);
    const after = (await win.boundingBox())!;
    expect(after.y).toBeGreaterThanOrEqual(29);
    expect(after.y + after.height).toBeCloseTo(box.y + box.height, 0);
    await shot(page, 'macOS: the window stopped at the menu bar');
    // Close the browser so the widgets show
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();
    await beat(page);
    await expect(page.getByRole('button', { name: /open Calendar/ })).toHaveText(
      /^[A-Z][a-z]{2} [A-Z][a-z]{2}\d+Open to new roles$/
    );
    await shot(page, 'macOS: the Calendar widget reads like the real one');
  });
});

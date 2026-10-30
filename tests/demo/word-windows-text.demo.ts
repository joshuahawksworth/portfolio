import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, screenshotsOnly, shot } from './demo-helpers';

/**
 * On Windows the Word page's Markdown view used to fade to white: the WinUI text-box style
 * painted the transparent typing layer over the coloured text, solid once focused. The page
 * now reads black on white, focused or not. Stills.
 */
screenshotsOnly();

test.describe('Word on Windows', () => {
  onlyOn('desktop');

  test('the Markdown page stays legible, focused too', async ({ page }) => {
    await enterPortfolio(page, 'windows');
    // Word's desktop shortcut sits on the left, clear of the browser window
    await page.getByRole('button', { name: 'Word', exact: true }).first().dblclick();
    const input = page.locator('[class*="mdInput"]');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await beat(page);
    await shot(page, 'Windows Word: the Markdown page reads black on white');
    await input.click();
    await beat(page);
    await shot(page, 'Windows Word: still legible with the page focused');
  });
});

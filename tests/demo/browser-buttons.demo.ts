import { expect, test } from '@playwright/test';
import { beat, enterPortfolio, onlyOn, typeSlowly } from './demo-helpers';

/**
 * Every control in the browser's chrome does its job: Reload fetches the page again (it used
 * to only spin) and redraws the decoy portfolio site from the top, and on a results page the
 * Images / Videos / News tabs lead to Brave Search's own pages. Video: the point is the
 * reload happening.
 */
test.describe('Brave: the buttons work', () => {
  onlyOn('desktop');

  test('Reload loads the page again; result tabs link out', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    // The decoy site the desktop opens on: Reload shows a load and redraws it
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('status')).toBeHidden({ timeout: 5_000 });
    await beat(page, 1_500);

    const address = page.getByPlaceholder('Search Brave or type a URL');
    await address.click();
    await typeSlowly(page, 'en.wikipedia.org/wiki/React_Native', 20);
    await page.keyboard.press('Enter');
    const frame = page.locator('iframe[title="Browser"]');
    await expect(frame).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('status')).toBeHidden({ timeout: 30_000 });
    await beat(page, 1_500);

    const before = await frame.evaluate((el) =>
      (el as HTMLIFrameElement).contentWindow?.performance.now()
    );
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('status')).toBeHidden({ timeout: 30_000 });
    const after = await frame.evaluate((el) =>
      (el as HTMLIFrameElement).contentWindow?.performance.now()
    );
    expect(after).not.toBeUndefined();
    expect(before).not.toBeUndefined();
    await beat(page, 1_500);

    await address.click();
    await page.keyboard.press('ControlOrMeta+A');
    await typeSlowly(page, 'react native');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: /^Images/ })).toHaveAttribute(
      'href',
      'https://search.brave.com/images?q=react%20native'
    );
    await beat(page, 2_000);
  });
});

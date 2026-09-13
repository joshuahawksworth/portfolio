import { expect, test, type Page } from '@playwright/test';

type Platform = 'apple' | 'windows';

/**
 * Boot on a fixed platform. First visits otherwise pick the platform that matches the device,
 * and Playwright's Desktop Chrome profile reports Windows, which would land the desktop test on
 * the Windows lock screen instead of the macOS login it asserts against.
 */
async function enterPortfolio(page: Page, platform: Platform) {
  // Same key and shape as src/lib/settingsStore.ts; only the platform is pinned.
  await page.addInitScript((os: Platform) => {
    window.localStorage.setItem('portfolio.settings.v1', JSON.stringify({ platform: os }));
  }, platform);
  await page.goto('/');
  // The boot screen runs for about four seconds before the macOS login (which shows the user's
  // name) or the Android lock screen appears; a cold dev server adds a few more.
  await expect(page.getByText(/Joshua|Swipe up to unlock/).first()).toBeVisible({
    timeout: 20_000,
  });
  await page.keyboard.press('Enter');
}

test('desktop shell boots, opens menus, and captures a visual artifact', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile-chrome',
    'Desktop shell is covered by desktop projects.'
  );

  await enterPortfolio(page, 'apple');

  await expect(page.getByText('About Josh').first()).toBeVisible({ timeout: 4_000 });
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('menuitem', { name: /Keyboard Shortcuts/i })).toBeVisible();

  await testInfo.attach('desktop-shell.png', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

test('mobile shell renders app icons and captures a visual artifact', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Mobile shell is covered by mobile project.'
  );

  await enterPortfolio(page, 'windows');

  await expect(page.getByRole('button', { name: 'About', exact: true })).toBeVisible({
    timeout: 4_000,
  });
  await expect(page.getByRole('button', { name: /Chrome/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Snake/i })).toBeVisible();

  await testInfo.attach('mobile-shell.png', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

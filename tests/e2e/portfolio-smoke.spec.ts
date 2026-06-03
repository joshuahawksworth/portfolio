import { expect, test, type Page } from '@playwright/test';

async function enterPortfolio(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Joshua')).toBeVisible({ timeout: 7_000 });
  await page.keyboard.press('Enter');
}

test('desktop shell boots, opens menus, and captures a visual artifact', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile-chrome',
    'Desktop shell is covered by desktop projects.'
  );

  await enterPortfolio(page);

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

  await enterPortfolio(page);

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

import { test } from '@playwright/test';
import { beat, enterPortfolio, screenshotsOnly, shot } from './demo-helpers';

/** Apple's own frames of The Beach: the macOS desktop and the iOS home screen at rest. */
screenshotsOnly();

test.describe('The Beach, Apple frames', () => {
  test('macOS and iOS on The Beach', async ({ page }) => {
    await enterPortfolio(page, 'apple');
    await beat(page, 2_000);
    await shot(page, `${test.info().project.name} on The Beach`);
  });
});

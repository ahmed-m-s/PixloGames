import { expect, test } from '@playwright/test';

test.describe('public game journey', () => {
  test('homepage renders with primary discovery paths', async ({ page }) => {
    await page.goto('/');

    const primaryNavigation = page.getByLabel('Primary navigation');

    await expect(
      page.getByRole('heading', {
        name: /play free browser games instantly/i
      })
    ).toBeVisible();
    await expect(primaryNavigation.getByRole('link', { name: /^games$/i })).toBeVisible();
    await expect(primaryNavigation.getByRole('link', { name: /submit game/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /trending now/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /pixlo originals/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /quick plays/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /great on mobile/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /new releases/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /browse by category/i })).toBeVisible();

    await page.getByRole('link', { name: /^browse games$/i }).click();

    await expect(page).toHaveURL(/\/games$/);
    await expect(
      page.getByRole('heading', { name: /browse games built for instant play/i })
    ).toBeVisible();
  });

  test('browse page renders game cards and discovery controls', async ({ page }) => {
    await page.goto('/games');

    await expect(
      page.getByRole('heading', { name: /browse games built for instant play/i })
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: /pixlo originals/i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /tic tac toe/i }).first()).toBeVisible();
  });

  test('game detail can start an embedded HTML5 game', async ({ page }) => {
    await page.goto('/games/endless-runner');

    await expect(page.locator('h1').filter({ hasText: /^Endless Runner$/ })).toBeVisible();
    await expect(page.getByTestId('game-player')).toBeVisible();
    await expect(
      page.getByTestId('game-player').getByRole('button', { name: /^fullscreen$/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /^play now$/i }).click();

    const frame = page.getByTestId('game-player-frame');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('src', /\/games\/endless-runner\/index\.html/);
    await expect(
      page.getByTestId('game-player').getByRole('button', { name: /^fullscreen$/i })
    ).toBeVisible();
  });

  test('search surfaces relevant games', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('searchbox', { name: /search games/i }).fill('memory');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=memory/);
    await expect(page.getByRole('heading', { name: /games matching "memory"/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /memory match/i }).first()).toBeVisible();
  });
});

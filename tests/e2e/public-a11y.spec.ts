import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type A11yRoute = {
  name: string;
  path: string;
  landmark: RegExp;
};

const publicA11yRoutes: A11yRoute[] = [
  {
    name: 'homepage',
    path: '/',
    landmark: /play free browser games instantly/i
  },
  {
    name: 'games browse',
    path: '/games',
    landmark: /browse games built for instant play/i
  },
  {
    name: 'endless runner detail',
    path: '/games/endless-runner',
    landmark: /^endless runner$/i
  },
  {
    name: 'search results',
    path: '/search?q=memory',
    landmark: /games matching "memory"/i
  }
];

async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude('[data-testid="game-player-frame"]')
    .analyze();
  const meaningfulViolations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? '')
  );

  expect(
    meaningfulViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target).slice(0, 6)
    }))
  ).toEqual([]);
}

test.describe('runtime accessibility smoke', () => {
  for (const route of publicA11yRoutes) {
    test(`${route.name} has no serious axe violations`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: route.landmark }).first()).toBeVisible();

      await expectNoSeriousA11yViolations(page);
    });
  }

  test('primary public controls expose stable accessible names', async ({ page }) => {
    await page.goto('/games/endless-runner');

    const main = page.getByRole('main');
    const player = page.getByTestId('game-player');

    await expect(page.getByLabel('Primary navigation')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: /search games/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /^play now$/i })).toBeVisible();
    await expect(player.getByRole('button', { name: /^play$/i })).toBeVisible();
    await expect(player.getByRole('button', { name: /^fullscreen$/i })).toBeVisible();
  });
});

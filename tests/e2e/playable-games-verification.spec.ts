import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test';

type LocalPackageBasePath = '/games' | '/playable-games';

type PlayableGamePackage = {
  embedPath: string;
  publicBasePath: LocalPackageBasePath;
  slug: string;
};

const packageRoots: Array<{ diskPath: string; publicBasePath: LocalPackageBasePath }> = [
  {
    diskPath: path.join(process.cwd(), 'public', 'games'),
    publicBasePath: '/games'
  },
  {
    diskPath: path.join(process.cwd(), 'public', 'playable-games'),
    publicBasePath: '/playable-games'
  }
];

const keyboardSmokeKeys: Record<string, string> = {
  '2048': 'ArrowRight',
  'brick-breaker': 'Space',
  'endless-runner': 'ArrowUp',
  'flappy-flight': 'ArrowUp',
  'number-merge': 'ArrowRight',
  'panda-mart': 'ArrowRight',
  snake: 'ArrowRight'
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readPlayableGamePackages(): PlayableGamePackage[] {
  return packageRoots
    .flatMap(({ diskPath, publicBasePath }) => {
      if (!existsSync(diskPath)) {
        return [];
      }

      return readdirSync(diskPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => existsSync(path.join(diskPath, entry.name, 'index.html')))
        .map((entry) => ({
          embedPath: `${publicBasePath}/${entry.name}/index.html`,
          publicBasePath,
          slug: entry.name
        }));
    })
    .sort(
      (a, b) => a.slug.localeCompare(b.slug) || a.publicBasePath.localeCompare(b.publicBasePath)
    );
}

async function expectStartOverlayInactive(startScreen: Locator) {
  await expect
    .poll(async () => {
      const className = (await startScreen.getAttribute('class')) ?? '';

      return className.includes('hidden') || !className.includes('is-visible');
    })
    .toBe(true);
}

async function launchGame(page: Page, gamePackage: PlayableGamePackage) {
  await test.step('open game detail page', async () => {
    await page.goto(`/games/${gamePackage.slug}`);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('game-player')).toBeVisible();
    await expect(page.getByRole('button', { name: /^play now$/i })).toBeVisible();
  });

  await test.step('launch the shared player', async () => {
    await expect(
      page.getByTestId('game-player').getByRole('button', { name: /^fullscreen$/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /^play now$/i }).click();

    const frame = page.getByTestId('game-player-frame');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute(
      'src',
      new RegExp(`${escapeRegExp(gamePackage.embedPath)}(?:\\?autostart=1)?`)
    );
    await expect(
      page.getByTestId('game-player').getByRole('button', { name: /^fullscreen$/i })
    ).toBeVisible();
    await expect(page.getByTestId('game-player')).not.toContainText(
      /frame could not load|preview frame could not load|fullscreen is not available/i
    );
  });

  const gameFrame = page.frameLocator('[data-testid="game-player-frame"]');
  const startScreen = gameFrame.locator('#startScreen');
  const root = gameFrame.locator('#board, #gameCanvas, #tubeBoard').first();

  await test.step('confirm the embedded game is ready', async () => {
    await expectStartOverlayInactive(startScreen);
    await expect(root).toBeVisible();
  });

  return { gameFrame, root };
}

async function runGenericInputCheck(
  page: Page,
  gameFrame: FrameLocator,
  root: Locator,
  slug: string
) {
  const clickablePlaySurface = gameFrame
    .locator('#board [data-index], #board button, #tubeBoard [data-index], #tubeBoard button')
    .first();

  await test.step('exercise a minimal in-game input path', async () => {
    if (await clickablePlaySurface.isVisible()) {
      await clickablePlaySurface.click();
    } else {
      await root.click({
        position: {
          x: 24,
          y: 24
        }
      });
    }

    const keyboardKey = keyboardSmokeKeys[slug];

    if (keyboardKey) {
      await page.keyboard.press(keyboardKey);
    }

    await expect(root).toBeVisible();
    await expect(page.getByTestId('game-player-frame')).toBeVisible();
  });
}

async function runGameSpecificCheck(
  page: Page,
  gameFrame: FrameLocator,
  root: Locator,
  slug: string
) {
  if (slug === 'memory-match') {
    await test.step('flip a memory card', async () => {
      await gameFrame.locator('#board [data-index]').first().click();
      await expect(gameFrame.locator('#board .is-flipped').first()).toBeVisible();
    });
    return;
  }

  if (slug === 'tic-tac-toe') {
    await test.step('play and reset a tic tac toe turn', async () => {
      await gameFrame.locator('#board [data-index]').first().click();
      await expect(gameFrame.locator('#turnLabel')).toHaveText('O');
      await gameFrame.locator('#resetButton').click();
      await expect(gameFrame.locator('#turnLabel')).toHaveText('X');
    });
    return;
  }

  if (slug === 'color-sort') {
    await test.step('make one color-sort move and reset the puzzle', async () => {
      await gameFrame.locator('#tubeBoard [data-index="0"]').click();
      await gameFrame.locator('#tubeBoard [data-index="4"]').click();
      await expect(gameFrame.locator('#moves')).toHaveText('1');
      await gameFrame.locator('#resetButton').click();
      await expect(gameFrame.locator('#moves')).toHaveText('0');
    });
    return;
  }

  await runGenericInputCheck(page, gameFrame, root, slug);
}

const playableGamePackages = readPlayableGamePackages();

test.describe('playable local game packages', () => {
  test('discovers at least one local playable package', async () => {
    expect(playableGamePackages.length).toBeGreaterThan(0);
  });

  for (const gamePackage of playableGamePackages) {
    test(`${gamePackage.slug} launches from ${gamePackage.publicBasePath}`, async ({ page }) => {
      const { gameFrame, root } = await launchGame(page, gamePackage);

      await runGameSpecificCheck(page, gameFrame, root, gamePackage.slug);
    });
  }
});

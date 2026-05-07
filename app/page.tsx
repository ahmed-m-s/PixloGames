import type { Metadata } from 'next';
import Link from 'next/link';
import { GameSection } from '@/components/home/game-section';
import { PixloOriginals } from '@/components/home/pixlo-originals';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { categories } from '@/data/games';
import { isPlayableLocalGame } from '@/lib/catalog-semantics';
import { getHomepageData } from '@/lib/content-selectors';
import { dedupeGamesById, pickHomepageLane } from '@/lib/homepage-surfacing';
import { createPageMetadata } from '@/lib/metadata';
import type { Game, GameCategory } from '@/types/game';

export const metadata: Metadata = createPageMetadata(
  'Play Free Browser Games Instantly',
  'Play quick, free HTML5 browser games on PixloGames with no downloads, no login, and mobile-friendly Pixlo Originals.',
  {
    path: '/'
  }
);

const trendingPrioritySlugs = [
  'panda-mart',
  'endless-runner',
  'memory-match',
  'block-puzzle',
  'number-merge',
  'snake',
  'color-sort',
  'brick-breaker',
  'flappy-flight',
  '2048',
  'tic-tac-toe'
];

const originalsPrioritySlugs = [
  'panda-mart',
  'endless-runner',
  'memory-match',
  'block-puzzle',
  'number-merge',
  'flappy-flight',
  'color-sort',
  '2048',
  'snake',
  'brick-breaker'
];

const quickPlayPrioritySlugs = [
  'tic-tac-toe',
  '2048',
  'snake',
  'color-sort',
  'memory-match',
  'flappy-flight',
  'brick-breaker'
];

const mobilePrioritySlugs = [
  'panda-mart',
  'memory-match',
  'block-puzzle',
  'number-merge',
  'color-sort',
  '2048',
  'snake',
  'tic-tac-toe'
];

function categoryHref(categoryName: GameCategory) {
  const category = categories.find((candidate) => candidate.name === categoryName);

  return category ? `/categories/${category.slug}` : '/categories';
}

const categoryShortcuts = [
  {
    label: 'Arcade',
    href: categoryHref('Arcade'),
    description: 'Fast score chasing and classic reflex loops.'
  },
  {
    label: 'Puzzle',
    href: categoryHref('Puzzle'),
    description: 'Logic games with clean rules and quick wins.'
  },
  {
    label: 'Runner',
    href: '/games?tag=runner',
    description: 'Jump, dodge, and chase one more run.'
  },
  {
    label: 'Management',
    href: categoryHref('Management'),
    description: 'Upgrade shops, resources, and tiny systems.'
  },
  {
    label: 'Casual',
    href: '/games?tag=casual',
    description: 'Easy starts for relaxed browser sessions.'
  },
  {
    label: 'Action',
    href: categoryHref('Action'),
    description: 'Immediate pressure, movement, and reaction play.'
  }
];

function isPixloOriginal(game: Game) {
  return game.sourceOrigin === 'first_party' && isPlayableLocalGame(game);
}

function orderGamesByPreferredSlugs(
  games: Game[],
  preferredSlugs: string[],
  fallbackGames: Game[]
) {
  const sourceGames = dedupeGamesById([...games, ...fallbackGames]);
  const gamesBySlug = new Map(sourceGames.map((game) => [game.slug, game]));
  const preferredGames = preferredSlugs
    .map((slug) => gamesBySlug.get(slug))
    .filter((game): game is Game => Boolean(game));
  const preferredIds = new Set(preferredGames.map((game) => game.id));
  const remainingGames = sourceGames.filter((game) => !preferredIds.has(game.id));

  return [...preferredGames, ...remainingGames];
}

export default async function HomePage() {
  const { quickPlayGames, touchFriendlyGames, newGames, trendingGames, homepageEligibleGames } =
    await getHomepageData();
  const allOriginals = orderGamesByPreferredSlugs(
    homepageEligibleGames.filter(isPixloOriginal),
    originalsPrioritySlugs,
    []
  );
  const trendingNow = orderGamesByPreferredSlugs(
    trendingGames,
    trendingPrioritySlugs,
    homepageEligibleGames
  ).slice(0, 10);
  const pixloOriginals = allOriginals.slice(0, 5);
  const homepageSeenGameIds = new Set<string>([
    ...trendingNow.map((game) => game.id),
    ...pixloOriginals.map((game) => game.id)
  ]);
  const quickPlays = pickHomepageLane(
    orderGamesByPreferredSlugs(quickPlayGames, quickPlayPrioritySlugs, homepageEligibleGames),
    homepageSeenGameIds,
    {
      limit: 5,
      minVisible: 5
    }
  );
  const mobilePicks = pickHomepageLane(
    orderGamesByPreferredSlugs(touchFriendlyGames, mobilePrioritySlugs, homepageEligibleGames),
    homepageSeenGameIds,
    {
      limit: 6,
      minVisible: 4
    }
  );
  const newReleasePicks = pickHomepageLane(newGames, homepageSeenGameIds, {
    limit: 4,
    minVisible: 4
  });

  return (
    <main>
      <PageContainer className="space-y-5 pb-8 pt-3 sm:space-y-7 sm:pb-10 sm:pt-4 lg:space-y-8 lg:pb-12">
        {trendingNow.length > 0 ? (
          <GameSection
            title="Trending Now"
            games={trendingNow}
            dense
            homepageGrid
            titleTone="brand"
            variant="homepage"
            actionHref="/games?sort=trending"
          />
        ) : null}
        {pixloOriginals.length > 0 ? <PixloOriginals games={pixloOriginals} /> : null}
        {quickPlays.length > 0 ? (
          <GameSection
            eyebrow="Quick plays"
            title="Quick Plays"
            games={quickPlays}
            dense
            homepageGrid
            variant="homepage"
            actionHref="/games?tag=casual"
          />
        ) : null}
        {mobilePicks.length > 0 ? (
          <GameSection
            eyebrow="Touch-friendly"
            title="Great on Mobile"
            games={mobilePicks}
            dense
            homepageGrid
            variant="homepage"
            actionHref="/games?mobile=1"
          />
        ) : null}
        {newReleasePicks.length > 0 ? (
          <GameSection
            eyebrow="Fresh drops"
            title="New Releases"
            games={newReleasePicks}
            dense
            homepageGrid
            variant="homepage"
            actionHref="/games?sort=newest&new=1"
          />
        ) : null}

        <section aria-labelledby="browse-by-category-title">
          <SectionHeader
            description="Pick a familiar style and get to a playable game quickly."
            eyebrow="Browse"
            title="Browse by Category"
            titleId="browse-by-category-title"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryShortcuts.map((category) => (
              <Link
                className="rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
                href={category.href}
                key={category.label}
              >
                <h3 className="font-display text-lg font-bold text-foreground">{category.label}</h3>
                <p className="mt-2 text-sm leading-5 text-muted">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="free-browser-games-title"
          className="border-t border-white/10 pt-6"
        >
          <h2
            className="font-display text-xl font-bold text-foreground"
            id="free-browser-games-title"
          >
            Free browser games on PixloGames
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            PixloGames is a free browser games platform for instant HTML5 play. Browse Pixlo
            Originals, quick puzzle games, arcade classics, and mobile-friendly picks without
            downloading an app or creating an account.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}

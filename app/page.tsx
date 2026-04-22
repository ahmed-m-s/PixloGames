import type { Metadata } from 'next';
import { GameSection } from '@/components/home/game-section';
import { HeroSection } from '@/components/home/hero-section';
import { PixloOriginals } from '@/components/home/pixlo-originals';
import { PageContainer } from '@/components/ui/page-container';
import { getHomepageData } from '@/lib/content-selectors';
import { createPageMetadata } from '@/lib/metadata';
import type { Game } from '@/types/game';

export const metadata: Metadata = createPageMetadata(
  'Play HTML5 Browser Games Instantly',
  'Discover fast, premium HTML5 browser games across racing, action, puzzle, arcade, multiplayer, sports, and adventure.',
  {
    path: '/'
  }
);

function dedupeGames(games: Game[]) {
  const seen = new Set<string>();

  return games.filter((game) => {
    if (seen.has(game.id)) {
      return false;
    }

    seen.add(game.id);
    return true;
  });
}

function pickHomepageLane(
  games: Game[],
  seenGameIds: Set<string>,
  {
    limit,
    minVisible = Math.min(3, limit)
  }: {
    limit: number;
    minVisible?: number;
  }
) {
  const sourceGames = dedupeGames(games);
  const picked = sourceGames.filter((game) => !seenGameIds.has(game.id)).slice(0, limit);

  if (picked.length < minVisible) {
    const pickedIds = new Set(picked.map((game) => game.id));
    const fallbackGames = sourceGames
      .filter((game) => !pickedIds.has(game.id))
      .slice(0, minVisible - picked.length);

    picked.push(...fallbackGames);
  }

  picked.forEach((game) => seenGameIds.add(game.id));

  return picked;
}

export default async function HomePage() {
  const { allGames, quickPlayGames, touchFriendlyGames, newGames, homepageEligibleGames } =
    await getHomepageData();
  const allOriginals = homepageEligibleGames
    .filter((game) => game.sourceOrigin === 'first_party' && game.hasRealEmbed)
    .sort((a, b) => b.featuredPriority - a.featuredPriority);
  const popularGames = [...homepageEligibleGames].sort((a, b) => b.plays - a.plays).slice(0, 8);
  const heroGame = allOriginals[0] ?? allGames[0];
  const homepageSeenGameIds = new Set<string>(heroGame ? [heroGame.id] : []);
  const heroSideGames = pickHomepageLane(
    [...allOriginals.slice(1), ...quickPlayGames, ...touchFriendlyGames, ...popularGames],
    homepageSeenGameIds,
    {
      limit: 2,
      minVisible: 2
    }
  );
  const pixloOriginals = pickHomepageLane(allOriginals, homepageSeenGameIds, {
    limit: 2,
    minVisible: 2
  });
  const quickPlays = pickHomepageLane(quickPlayGames, homepageSeenGameIds, {
    limit: 3,
    minVisible: 3
  });
  const mobilePicks = pickHomepageLane(touchFriendlyGames, homepageSeenGameIds, {
    limit: 3,
    minVisible: 3
  });
  const newReleasePicks = pickHomepageLane(newGames, homepageSeenGameIds, {
    limit: 3,
    minVisible: 3
  });

  return (
    <main>
      {heroGame ? (
        <HeroSection
          heroGame={heroGame}
          originalCount={allOriginals.length}
          sideGames={heroSideGames}
        />
      ) : null}
      <PageContainer className="space-y-8 pb-12 pt-7 sm:space-y-10 sm:pb-14 sm:pt-9 lg:space-y-12 lg:pb-16 lg:pt-12">
        {pixloOriginals.length > 0 ? <PixloOriginals games={pixloOriginals} /> : null}
        {quickPlays.length > 0 ? (
          <GameSection
            eyebrow="Quick plays"
            title="Start a round in seconds"
            description="Fast-loading games with simple controls, short loops, and easy replay when you only have a few minutes."
            games={quickPlays}
            dense
            actionHref="/games?tag=casual"
          />
        ) : null}
        {mobilePicks.length > 0 ? (
          <GameSection
            eyebrow="Touch-friendly"
            title="Great on mobile"
            description="Tap, swipe, and simple touch controls make these picks comfortable on phones, tablets, and laptops."
            games={mobilePicks}
            dense
            actionHref="/games?mobile=1"
          />
        ) : null}
        {newReleasePicks.length > 0 ? (
          <GameSection
            eyebrow="Fresh drops"
            title="New Releases"
            description="Recently added HTML5 games prepared for quick starts, clear controls, and mobile-friendly sessions."
            games={newReleasePicks}
            dense
            actionHref="/games?sort=newest&new=1"
          />
        ) : null}
      </PageContainer>
    </main>
  );
}

'use client';

import { GameCard } from '@/components/game/game-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LibraryLoading } from '@/components/ui/library-loading';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { useFavorites } from '@/hooks/use-favorites';

export function FavoritesView() {
  const { favoriteGames, hasLoaded } = useFavorites();

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="sun">Saved</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Favorites
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Keep your go-to games close and build a personal library that survives refreshes.
          </p>
          <p className="mt-5 text-sm font-bold text-foreground">
            {favoriteGames.length} {favoriteGames.length === 1 ? 'game' : 'games'} saved
          </p>
        </section>

        {!hasLoaded ? (
          <LibraryLoading />
        ) : favoriteGames.length === 0 ? (
          <EmptyState
            actionHref="/search"
            actionLabel="Find games"
            description="Tap the favorite button on any game card or game page to save it here."
            title="No favorites yet"
          />
        ) : (
          <ResponsiveGrid dense>
            {favoriteGames.map((game) => (
              <GameCard game={game} key={game.id} variant="compact" />
            ))}
          </ResponsiveGrid>
        )}
      </PageContainer>
    </main>
  );
}

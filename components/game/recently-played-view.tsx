'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { GameCard } from '@/components/game/game-card';
import { LibraryLoading } from '@/components/ui/library-loading';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { formatPlayedAt } from '@/lib/format';

export function RecentlyPlayedView() {
  const { recentlyPlayedGames, recentlyPlayedItems, hasLoaded, clearRecentlyPlayed } =
    useRecentlyPlayed();

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill tone="aqua">History</Pill>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                Recently Played
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Return to the newest games you opened, ordered from latest session first.
              </p>
              <p className="mt-5 text-sm font-bold text-foreground">
                {recentlyPlayedGames.length} recent{' '}
                {recentlyPlayedGames.length === 1 ? 'game' : 'games'}
              </p>
            </div>
            {recentlyPlayedGames.length > 0 ? (
              <Button onClick={clearRecentlyPlayed} variant="secondary">
                Clear history
              </Button>
            ) : null}
          </div>
        </section>

        {!hasLoaded ? (
          <LibraryLoading />
        ) : recentlyPlayedGames.length === 0 ? (
          <EmptyState
            actionHref="/search"
            actionLabel="Play something"
            description="Open any game page and it will appear here automatically."
            title="No recent games yet"
          />
        ) : (
          <div className="space-y-4">
            <ResponsiveGrid dense>
              {recentlyPlayedItems.map((item) => (
                <div className="space-y-2" key={item.game.id}>
                  <GameCard game={item.game} variant="compact" />
                  <p className="px-1 text-xs font-semibold text-muted">
                    Last played {formatPlayedAt(item.entry.playedAt)}
                  </p>
                </div>
              ))}
            </ResponsiveGrid>
          </div>
        )}
      </PageContainer>
    </main>
  );
}

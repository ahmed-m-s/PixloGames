'use client';

import { GameCard } from '@/components/game/game-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LibraryLoading } from '@/components/ui/library-loading';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { SectionHeader } from '@/components/ui/section-header';
import { useRecentlyPlayed } from '@/hooks/use-recently-played';

export function RecentlyPlayed() {
  const { recentlyPlayedGames, hasLoaded } = useRecentlyPlayed();
  const previewGames = recentlyPlayedGames.slice(0, 4);

  return (
    <section>
      <SectionHeader
        description="Jump back into your newest sessions without searching again."
        eyebrow="Personal"
        title="Recently Played"
      />
      {!hasLoaded ? (
        <LibraryLoading />
      ) : previewGames.length === 0 ? (
        <EmptyState
          actionHref="/search"
          actionLabel="Start exploring"
          description="Open a game and it will appear here automatically for quick return sessions."
          title="No games played yet"
        />
      ) : (
        <ResponsiveGrid dense>
          {previewGames.map((game) => (
            <GameCard game={game} key={game.id} variant="compact" />
          ))}
        </ResponsiveGrid>
      )}
    </section>
  );
}

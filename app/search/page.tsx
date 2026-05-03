import type { Metadata } from 'next';
import Link from 'next/link';
import { GameCard } from '@/components/game/game-card';
import { BrowseControls } from '@/components/ui/browse-controls';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { Pill } from '@/components/ui/pill';
import { browseGames, getTagsFromGames, parseBrowseState } from '@/lib/browse';
import { listGames } from '@/lib/games';
import { createPageMetadata } from '@/lib/metadata';
import type { BrowseSearchParams } from '@/types/browse';

type SearchPageProps = {
  searchParams: Promise<BrowseSearchParams>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const state = parseBrowseState(params);

  return createPageMetadata(
    state.q ? `Search results for ${state.q}` : 'Search Games',
    state.q
      ? `Search PixloGames for ${state.q} and refine results by category, tags, rating, and play style.`
      : 'Search PixloGames by title, category, tag, device support, and play style.',
    {
      path: '/search',
      noIndex: true
    }
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const games = await listGames();
  const browseState = parseBrowseState(params);
  const results = browseGames(games, browseState);
  const suggestedSearches = [
    'endless',
    'memory',
    'block',
    'number',
    'merge',
    'puzzle',
    'mobile',
    'arcade'
  ];

  return (
    <main>
      <PageContainer className="space-y-9 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.07),rgb(255_255_255_/_0.025))] p-6 shadow-card sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Pill tone="brand">Search</Pill>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                {browseState.q
                  ? `Games matching "${browseState.q}"`
                  : 'Search the PixloGames library'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Search titles, categories, tags, and play styles, then refine the results without
                losing your query.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {suggestedSearches.map((term) => (
                  <Link
                    className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-muted transition hover:border-white/20 hover:bg-white/[0.09] hover:text-foreground"
                    href={`/search?q=${encodeURIComponent(term)}`}
                    key={term}
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/[0.22] px-4 py-3">
              <p className="font-display text-2xl font-bold text-foreground">{results.length}</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {results.length === 1 ? 'game found' : 'games found'}
              </p>
            </div>
          </div>
        </section>

        <BrowseControls
          keepQueryOnReset
          pathname="/search"
          state={browseState}
          tags={getTagsFromGames(games)}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Search results
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
              {browseState.q
                ? `${results.length} result${results.length === 1 ? '' : 's'} for "${browseState.q}"`
                : `${results.length} games in the full library`}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Try direct terms like endless, memory, block, number, merge, puzzle, arcade, or mobile
            to jump into the current catalog faster.
          </p>
        </div>

        {results.length > 0 ? (
          <ResponsiveGrid dense>
            {results.map((game) => (
              <GameCard game={game} key={game.id} variant="compact" />
            ))}
          </ResponsiveGrid>
        ) : (
          <EmptyState
            actionHref={
              browseState.q ? `/search?q=${encodeURIComponent(browseState.q)}` : '/search'
            }
            actionLabel={browseState.q ? 'Clear filters' : 'Browse all games'}
            description="Try clearing a filter, searching a broader term, or using a direct game term like endless, memory, block, or puzzle."
            title="No matching games"
          />
        )}
      </PageContainer>
    </main>
  );
}

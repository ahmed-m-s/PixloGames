import type { Metadata } from 'next';
import Link from 'next/link';
import { GameCard } from '@/components/game/game-card';
import { BrowseControls } from '@/components/ui/browse-controls';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { summarizeCatalogEntries } from '@/lib/catalog-semantics';
import { categories } from '@/data/games';
import { browseGames, getTagsFromGames, parseBrowseState } from '@/lib/browse';
import { listGames } from '@/lib/games';
import { createPageMetadata } from '@/lib/metadata';
import type { BrowseSearchParams } from '@/types/browse';

export const metadata: Metadata = createPageMetadata(
  'All Games',
  'Browse every PixloGames HTML5 browser game with category filters, tags, sorting, and instant-play discovery.',
  {
    path: '/games'
  }
);

type GamesPageProps = {
  searchParams: Promise<BrowseSearchParams>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const games = await listGames();
  const catalogSummary = summarizeCatalogEntries(games);
  const browseState = parseBrowseState(params);
  const results = browseGames(games, browseState);
  const mobileReadyCount = games.filter(
    (game) => game.mobileSupported && game.source.mode === 'embedded'
  ).length;
  const quickLinks = [
    { label: 'Pixlo Originals', href: '/originals' },
    { label: 'Quick Plays', href: '/games?tag=casual' },
    { label: 'Touch-Friendly', href: '/games?mobile=1' },
    { label: 'Puzzle Picks', href: '/categories/puzzle' },
    { label: 'New Releases', href: '/games?sort=newest&new=1' }
  ];

  return (
    <main>
      <PageContainer className="space-y-9 py-10 sm:py-12 lg:py-14">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.07),rgb(255_255_255_/_0.025))] p-6 shadow-card sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Pill tone="brand">Library</Pill>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                Browse games built for instant play
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Browse playable local titles, remote-ready embeds, and preview entries from one
                catalog. Start with Pixlo Originals and mobile-ready picks, then narrow the library
                by category, device, tags, and editorial signals.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {quickLinks.map((link) => (
                  <Link
                    className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-muted transition hover:border-white/20 hover:bg-white/[0.09] hover:text-foreground"
                    href={link.href}
                    key={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[430px] lg:grid-cols-2">
              {[
                [catalogSummary.totalEntries, 'Catalog entries'],
                [catalogSummary.playableLocalEntries, 'Playable local'],
                [catalogSummary.previewEntries, 'Preview entries'],
                [mobileReadyCount, 'Playable on mobile'],
                [categories.length, 'Categories']
              ].map(([value, label]) => (
                <div
                  className="rounded-lg border border-white/10 bg-black/[0.22] px-4 py-3"
                  key={label}
                >
                  <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BrowseControls pathname="/games" state={browseState} tags={getTagsFromGames(games)} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Current results
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
              {results.length} of {games.length} {games.length === 1 ? 'game' : 'games'}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Open any card to review controls, source status, and tags. Play-ready entries launch in
            the browser, while preview entries stay visible until a verified embed is connected.
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
            actionHref="/games"
            actionLabel="Reset browse"
            description="Try clearing a tag or using a broader category to reopen the library."
            title="No games match these filters"
          />
        )}
      </PageContainer>
    </main>
  );
}

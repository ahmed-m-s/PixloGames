import type { Metadata } from 'next';
import Link from 'next/link';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireInternalPermission } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/metadata';
import { listCollections, resolveCollectionGames } from '@/lib/repositories/content-repository';

export const metadata: Metadata = createPageMetadata(
  'Internal Collections',
  'Internal PixloGames scaffold for editorial collections, sponsored placements, and homepage programming.',
  {
    path: '/internal/collections',
    noIndex: true
  }
);

function visibilityTone(visibility: string) {
  if (visibility === 'public') return 'success';
  if (visibility === 'archived') return 'danger';
  if (visibility === 'scheduled') return 'warning';
  return 'neutral';
}

export default async function InternalCollectionsPage() {
  const session = await requireInternalPermission('manage_collections');
  const collections = [...(await listCollections())].sort((a, b) => b.priority - a.priority);
  const collectionRows = await Promise.all(
    collections.map(async (collection) => ({
      collection,
      games: await resolveCollectionGames(collection)
    }))
  );

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="brand">Internal scaffold</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Collections
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            Editorial and operational groupings for homepage programming, browse modules, seasonal
            campaigns, and sponsored-ready surfaces.
          </p>
        </section>

        <InternalAccessPanel session={session} title="Collection operations access" />

        <section className="grid gap-5 lg:grid-cols-2">
          {collectionRows.map(({ collection, games }) => {
            return (
              <article
                className="rounded-lg border border-white/10 bg-white/[0.05] p-5"
                key={collection.id}
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={collection.visibility}
                    tone={visibilityTone(collection.visibility)}
                  />
                  <StatusBadge
                    label={collection.type}
                    tone={collection.sponsored ? 'warning' : 'brand'}
                  />
                  {collection.sponsored ? <StatusBadge label="sponsored" tone="warning" /> : null}
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                  {collection.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">{collection.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted">
                  <div>
                    <dt className="font-bold text-foreground">Priority</dt>
                    <dd>{collection.priority}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-foreground">Owner</dt>
                    <dd>{collection.owner}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-foreground">Games</dt>
                    <dd>{games.length}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-foreground">Placement</dt>
                    <dd className="capitalize">{collection.placement.join(', ')}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {games.slice(0, 5).map((game) => (
                    <Link
                      className="rounded-full border border-white/10 bg-black/[0.22] px-3 py-1.5 text-xs font-bold text-muted transition hover:text-foreground"
                      href={`/games/${game.slug}`}
                      key={game.id}
                    >
                      {game.title}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </PageContainer>
    </main>
  );
}

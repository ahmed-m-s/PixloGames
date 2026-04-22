import Link from 'next/link';
import type { Metadata } from 'next';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { categories } from '@/data/games';
import { createPageMetadata } from '@/lib/metadata';
import { listGames } from '@/lib/repositories/content-repository';
import { cn } from '@/lib/utils';

const accentStyles = {
  brand: 'from-brand/[0.18] to-brand/[0.04] text-brand',
  ember: 'from-ember/[0.18] to-ember/[0.04] text-ember',
  sun: 'from-sun/[0.18] to-sun/[0.04] text-sun',
  aqua: 'from-aqua/[0.18] to-aqua/[0.04] text-aqua'
};

export const metadata: Metadata = createPageMetadata(
  'Game Categories',
  'Browse PixloGames by category, including action, racing, puzzle, adventure, multiplayer, shooting, sports, and arcade games.',
  {
    path: '/categories'
  }
);

export default async function CategoriesPage() {
  const games = await listGames();
  const filledCategories = categories.filter((category) =>
    games.some((game) => game.category === category.name)
  ).length;

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.07),rgb(255_255_255_/_0.025))] p-6 shadow-card sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Pill tone="aqua">Explore</Pill>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                Browse by category
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Choose the mood first, then jump into a focused set of playable browser games with
                filters and related discovery built in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
              <div className="rounded-lg border border-white/10 bg-black/[0.22] px-4 py-3">
                <p className="font-display text-2xl font-bold text-foreground">
                  {categories.length}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">Browse lanes</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/[0.22] px-4 py-3">
                <p className="font-display text-2xl font-bold text-foreground">
                  {filledCategories}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">With live games</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const count = games.filter((game) => game.category === category.name).length;

            return (
              <Link
                className={cn(
                  'group rounded-lg border border-white/10 bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-1 hover:border-white/20',
                  accentStyles[category.accent]
                )}
                href={`/categories/${category.slug}`}
                key={category.slug}
              >
                <div className="flex h-full min-h-[150px] flex-col justify-between">
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {category.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">{category.description}</p>
                  </div>
                  <p className="mt-6 text-sm font-bold transition group-hover:translate-x-1">
                    {count > 0 ? `${count} ${count === 1 ? 'game' : 'games'} ready` : 'Coming soon'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </PageContainer>
    </main>
  );
}

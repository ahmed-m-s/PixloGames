import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GameCard } from '@/components/game/game-card';
import { BrowseControls } from '@/components/ui/browse-controls';
import { CategoryOpenTracker } from '@/components/ui/category-open-tracker';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { categories } from '@/data/games';
import { browseGames, getTagsFromGames, parseBrowseState } from '@/lib/browse';
import { getCategoryBySlug, getGamesByCategory } from '@/lib/games';
import { createPageMetadata } from '@/lib/metadata';
import type { BrowseSearchParams } from '@/types/browse';

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<BrowseSearchParams>;
};

export function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found - PixloGames'
    };
  }

  return {
    ...createPageMetadata(
      `${category.name} Games`,
      `Play ${category.name.toLowerCase()} browser games on PixloGames. ${category.description}`,
      {
        path: `/categories/${category.slug}`
      }
    )
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const browseParams = await searchParams;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const categoryGames = await getGamesByCategory(category.name);
  const browseState = {
    ...parseBrowseState(browseParams),
    category: undefined
  };
  const results = browseGames(categoryGames, browseState);
  const categoryTags = getTagsFromGames(categoryGames).slice(0, 6);
  const relatedCategories = categories
    .filter((candidate) => candidate.slug !== category.slug)
    .slice(0, 4);

  return (
    <main>
      <CategoryOpenTracker category={category.name} slug={category.slug} />
      <PageContainer className="space-y-9 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.07),rgb(255_255_255_/_0.025))] p-6 shadow-card sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Pill tone={category.accent}>{category.name}</Pill>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                {category.name} Games
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                {category.description} Browse a focused set of playable browser games, then use tags
                and sort options to find the right next session.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {categoryTags.map((tag) => (
                  <Link
                    className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-muted transition hover:border-white/20 hover:bg-white/[0.09] hover:text-foreground"
                    href={`/categories/${category.slug}?tag=${encodeURIComponent(tag)}`}
                    key={tag}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-lg border border-white/10 bg-black/[0.22] px-4 py-3">
                <p className="font-display text-2xl font-bold text-foreground">
                  {categoryGames.length}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">Category games</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/[0.22] px-4 py-3">
                <p className="font-display text-2xl font-bold text-foreground">
                  {categoryTags.length}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">Popular tags</p>
              </div>
            </div>
          </div>
        </section>

        <BrowseControls
          pathname={`/categories/${category.slug}`}
          showCategoryFilter={false}
          state={browseState}
          tagLimit={8}
          tags={getTagsFromGames(categoryGames)}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {category.name} results
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
              {results.length} of {categoryGames.length}{' '}
              {categoryGames.length === 1 ? 'game' : 'games'}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Switch categories below or reset filters if you want a broader set of playable titles.
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
            actionHref={`/categories/${category.slug}`}
            actionLabel="Reset category filters"
            description={`Try a broader ${category.name.toLowerCase()} filter set or explore a related category below.`}
            title={`No ${category.name.toLowerCase()} games match these filters`}
          />
        )}

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Keep browsing
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                Related categories
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((relatedCategory) => (
                <Link
                  className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-muted transition hover:border-white/20 hover:bg-white/[0.08] hover:text-foreground"
                  href={`/categories/${relatedCategory.slug}`}
                  key={relatedCategory.slug}
                >
                  {relatedCategory.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

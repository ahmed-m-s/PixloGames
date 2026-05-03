import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { GameCard } from '@/components/game/game-card';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { LinkButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { SectionHeader } from '@/components/ui/section-header';
import { isPlayableLocalGame } from '@/lib/catalog-semantics';
import { listGames } from '@/lib/games';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Pixlo Originals',
  "Explore PixloGames' first-party HTML5 browser games built for instant play, clean controls, and mobile-ready sessions.",
  {
    path: '/originals'
  }
);

const principles = [
  {
    title: 'Instant browser play',
    description:
      'Each Original is packaged for the embedded PixloGames player with no install step.'
  },
  {
    title: 'Readable first sessions',
    description: 'Controls, goals, and feedback are designed to make the first click feel obvious.'
  },
  {
    title: 'Desktop and touch ready',
    description:
      'The launch lineup is selected for smooth play across mouse, keyboard, and mobile taps.'
  }
];

export default async function OriginalsPage() {
  const games = await listGames();
  const originals = games.filter(isPlayableLocalGame).sort((a, b) => {
    return b.featuredPriority - a.featuredPriority || a.title.localeCompare(b.title);
  });
  const leadGame = originals[0];
  const mobileReadyCount = originals.filter((game) => game.mobileSupported).length;
  const categories = Array.from(new Set(originals.map((game) => game.category)));

  return (
    <main>
      <PageContainer className="space-y-12 py-10 sm:py-12 lg:space-y-16 lg:py-14">
        {leadGame ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Link
              className="group relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-card transition hover:-translate-y-1 hover:border-white/20 hover:shadow-hover"
              href={`/games/${leadGame.slug}`}
            >
              <Image
                alt={`${leadGame.title} cover art`}
                className="object-cover transition duration-500 group-hover:scale-105"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                src={leadGame.coverImage}
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(0_0_0_/_0.86),rgb(0_0_0_/_0.16)_54%),linear-gradient(90deg,rgb(0_0_0_/_0.76),transparent_72%)]" />
              <div className="relative z-10 flex h-full min-h-[520px] flex-col justify-between p-5 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  <Pill tone="brand">Pixlo Original</Pill>
                  <Pill tone="aqua">Playable now</Pill>
                  <Pill tone="sun">No download</Pill>
                </div>

                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                    Featured original
                  </p>
                  <h1 className="mt-4 font-display text-4xl font-bold leading-[1.02] text-white sm:text-6xl">
                    Pixlo Originals
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
                    First-party HTML5 games built for fast loading, clean controls, and instant
                    sessions inside the PixloGames player.
                  </p>
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <span className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-5 text-base font-black text-black transition group-hover:bg-white">
                      Play {leadGame.title}
                    </span>
                    <GameMetaRow game={leadGame} />
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex flex-col justify-between gap-5 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.08),rgb(255_255_255_/_0.035))] p-6 shadow-card sm:p-8">
              <div>
                <Pill tone="brand">First-party catalog</Pill>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                  A curated label for games made to feel native to PixloGames.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
                  Pixlo Originals are the platform&apos;s own browser games. They set the standard
                  for quick onboarding, polished embeds, mobile-friendly play, and clear replay
                  loops.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  [originals.length, 'Originals'],
                  [mobileReadyCount, 'Mobile ready'],
                  [categories.length, 'Genres']
                ].map(([value, label]) => (
                  <div
                    className="rounded-lg border border-white/10 bg-black/[0.22] p-4"
                    key={label}
                  >
                    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <LinkButton href={`/games/${leadGame.slug}`} size="lg">
                  Play featured
                </LinkButton>
                <LinkButton href="/games" size="lg" variant="secondary">
                  Browse all games
                </LinkButton>
              </div>
            </div>
          </section>
        ) : (
          <EmptyState
            actionHref="/games"
            actionLabel="Browse games"
            description="First-party titles will appear here once they are published and playable."
            title="No Pixlo Originals are live yet"
          />
        )}

        {originals.length > 0 ? (
          <section>
            <SectionHeader
              description="The current first-party lineup covers arcade reflex, memory matching, block placement, number merging, and polished browser classics."
              eyebrow="Curated lineup"
              title="Play the Originals"
            />
            <ResponsiveGrid>
              {originals.map((game, index) => (
                <GameCard game={game} key={game.id} priority={index < 3} />
              ))}
            </ResponsiveGrid>
          </section>
        ) : null}

        <section>
          <SectionHeader
            description="Pixlo Originals are intentionally small, fast, and easy to understand without sacrificing polish."
            eyebrow="The standard"
            title="What makes a Pixlo Original"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <div
                className="min-h-36 rounded-lg border border-white/10 bg-white/[0.05] p-5"
                key={principle.title}
              >
                <p className="font-display text-xl font-bold text-foreground">{principle.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{principle.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                More originals coming
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
                The label grows from here.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                This first-party lineup gives PixloGames a clear identity while the broader catalog
                continues to expand through curated submissions and future releases.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/games?sort=newest&new=1" variant="secondary">
                New releases
              </LinkButton>
              <LinkButton href="/developers/submit-game" variant="secondary">
                Submit Game
              </LinkButton>
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

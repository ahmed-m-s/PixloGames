import Image from 'next/image';
import Link from 'next/link';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { LinkButton } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';
import type { Game } from '@/types/game';

type PixloOriginalsProps = {
  games: Game[];
};

export function PixloOriginals({ games }: PixloOriginalsProps) {
  if (games.length === 0) {
    return null;
  }

  const [leadGame, ...supportingGames] = games;

  return (
    <section aria-labelledby="pixlo-originals-title">
      <SectionHeader
        action={
          <LinkButton href="/originals" size="sm" variant="ghost">
            View Originals
          </LinkButton>
        }
        description="Exclusive browser games from PixloGames Lab, built for fast loading, clean controls, and quick sessions on desktop or mobile."
        eyebrow="Pixlo Originals"
        title="Pixlo Originals"
        titleId="pixlo-originals-title"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.75fr)]">
        <Link
          className="group relative min-h-[280px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-card transition hover:-translate-y-1 hover:border-white/20 hover:shadow-hover sm:min-h-[340px]"
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
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(0_0_0_/_0.84),rgb(0_0_0_/_0.1)_54%),linear-gradient(90deg,rgb(0_0_0_/_0.72),transparent_70%)]" />
          <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between p-5 sm:min-h-[340px] sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Pill tone="brand">Original</Pill>
              {leadGame.mobileSupported ? <Pill tone="aqua">Mobile-friendly</Pill> : null}
            </div>

            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Featured original
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                {leadGame.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
                {leadGame.shortDescription}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-black text-black transition group-hover:bg-white">
                  Play now
                </span>
                <GameMetaRow game={leadGame} />
              </div>
            </div>
          </div>
        </Link>

        <div className="grid gap-3">
          {supportingGames.map((game, index) => (
            <Link
              className={cn(
                'group grid grid-cols-[96px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-3 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] sm:grid-cols-[132px_1fr]',
                index === 0 && 'lg:min-h-[160px]'
              )}
              href={`/games/${game.slug}`}
              key={game.id}
            >
              <span className="relative min-h-24 overflow-hidden rounded-lg">
                <Image
                  alt={`${game.title} thumbnail`}
                  className="object-cover transition duration-500 group-hover:scale-105"
                  fill
                  sizes="(min-width: 640px) 132px, 96px"
                  src={game.thumbnail}
                />
              </span>
              <span className="flex min-w-0 flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                  Original
                </span>
                <span className="mt-1 font-display text-xl font-bold text-foreground transition group-hover:text-brand">
                  {game.title}
                </span>
                <span className="mt-2 line-clamp-2 text-sm leading-5 text-muted">
                  {game.shortDescription}
                </span>
                <span className="mt-2 text-sm font-black text-foreground">Play now</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

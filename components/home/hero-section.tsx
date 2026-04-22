'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { LinkButton } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { formatPlayCount } from '@/lib/format';
import type { Game } from '@/types/game';

type HeroSectionProps = {
  heroGame: Game;
  sideGames: Game[];
  originalCount: number;
};

export function HeroSection({ heroGame, sideGames, originalCount }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-4 sm:pt-6 lg:pt-8">
      <PageContainer>
        <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-card sm:min-h-[500px] lg:min-h-[540px]">
          <Image
            alt={`${heroGame.title} cover art`}
            className="absolute inset-0 h-full w-full object-cover"
            fill
            priority
            sizes="100vw"
            src={heroGame.coverImage}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0_/_0.86),rgb(0_0_0_/_0.55)_46%,rgb(0_0_0_/_0.18)),linear-gradient(0deg,rgb(0_0_0_/_0.78),transparent_48%)]" />

          <div className="relative z-10 flex min-h-[430px] flex-col justify-between p-5 sm:min-h-[500px] sm:p-7 lg:min-h-[540px] lg:p-8">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl pt-3 sm:pt-6"
              initial={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap gap-2">
                <Pill tone="brand">Instant play</Pill>
                <Pill tone="aqua">No downloads</Pill>
                <Pill tone="sun">Mobile ready</Pill>
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.02] text-white sm:text-5xl lg:text-6xl">
                Play polished browser games the second you arrive.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                PixloGames is a fast HTML5 arcade for quick sessions, clean discovery, and games
                that work across desktop, tablet, and phone.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <LinkButton href={`/games/${heroGame.slug}`} size="lg">
                  Play now
                </LinkButton>
                <LinkButton href="/games" size="lg" variant="secondary">
                  Explore games
                </LinkButton>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-white/58">
                {originalCount} Pixlo Originals · 0 installs required
              </p>
            </motion.div>

            <div className="grid gap-3 lg:grid-cols-[1fr_340px] lg:items-end">
              <div className="rounded-lg border border-white/10 bg-black/[0.38] p-4 backdrop-blur-md sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                      Featured original
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                      {heroGame.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                      {heroGame.shortDescription}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:items-end">
                    <GameMetaRow game={heroGame} />
                    <LinkButton href={`/games/${heroGame.slug}`} size="sm">
                      Start playing
                    </LinkButton>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {sideGames.map((game) => (
                  <Link
                    className="group flex min-h-24 gap-3 rounded-lg border border-white/10 bg-black/[0.42] p-3 backdrop-blur-md transition hover:border-white/20 hover:bg-black/[0.56]"
                    href={`/games/${game.slug}`}
                    key={game.id}
                  >
                    <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        alt={`${game.title} thumbnail`}
                        className="object-cover"
                        fill
                        sizes="96px"
                        src={game.thumbnail}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-white group-hover:text-brand">
                        {game.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-white/54">{game.category}</p>
                      <p className="mt-2 text-xs font-semibold text-white/62">
                        {formatPlayCount(game.plays)} plays
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

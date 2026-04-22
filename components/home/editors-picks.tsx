import Image from 'next/image';
import Link from 'next/link';
import { GameCard } from '@/components/game/game-card';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { SectionHeader } from '@/components/ui/section-header';
import type { Game } from '@/types/game';

type EditorsPicksProps = {
  games: Game[];
};

export function EditorsPicks({ games }: EditorsPicksProps) {
  const [leadGame, ...sideGames] = games;

  if (!leadGame) {
    return null;
  }

  return (
    <section>
      <SectionHeader
        description="Curated games with strong feel, memorable loops, and polished first sessions."
        eyebrow="Curated"
        title="Editor's Picks"
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <GameCard game={leadGame} priority variant="featured" />
        <div className="grid gap-4">
          {sideGames.map((game) => (
            <Link
              className="group grid grid-cols-[112px_1fr] gap-4 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] sm:grid-cols-[156px_1fr]"
              href={`/games/${game.slug}`}
              key={game.id}
            >
              <span className="relative min-h-28 overflow-hidden rounded-lg">
                <Image
                  alt={`${game.title} thumbnail`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 640px) 156px, 112px"
                  src={game.thumbnail}
                />
              </span>
              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">
                  {game.category}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-foreground transition group-hover:text-brand sm:text-xl">
                  {game.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {game.shortDescription}
                </p>
                <div className="mt-3">
                  <GameMetaRow compact game={game} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import type { Game } from '@/types/game';
import { formatPlayCount, formatRating } from '@/lib/format';

type GameMetaRowProps = {
  game: Pick<Game, 'rating' | 'plays' | 'mobileSupported'>;
  compact?: boolean;
};

export function GameMetaRow({ game, compact = false }: GameMetaRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
      <span>{formatRating(game.rating)} rating</span>
      <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden />
      <span>{formatPlayCount(game.plays)} plays</span>
      {!compact && game.mobileSupported ? (
        <>
          <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden />
          <span>Mobile ready</span>
        </>
      ) : null}
    </div>
  );
}

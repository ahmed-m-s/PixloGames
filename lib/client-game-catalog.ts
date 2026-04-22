import { games } from '@/data/games';
import type { Game } from '@/types/game';

const gameById = new Map(games.map((game) => [game.id, game]));

export function getClientGamesByIds(ids: string[]) {
  return ids.map((id) => gameById.get(id)).filter((game): game is Game => Boolean(game));
}

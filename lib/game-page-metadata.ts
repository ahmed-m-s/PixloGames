import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';
import type { Game } from '@/types/game';

type GameMetadataInput = Pick<
  Game,
  'coverImage' | 'seoDescription' | 'seoTitle' | 'shortDescription' | 'slug' | 'thumbnail' | 'title'
>;

export function createGameDetailPageMetadata(game: GameMetadataInput): Metadata {
  return createPageMetadata(
    game.seoTitle ?? game.title,
    game.seoDescription ?? game.shortDescription,
    {
      path: `/games/${game.slug}`,
      image: game.coverImage || game.thumbnail
    }
  );
}

export function createMissingGamePageMetadata(slug: string): Metadata {
  return createPageMetadata(
    'Game Not Found',
    'The requested PixloGames title could not be found.',
    {
      path: `/games/${slug}`,
      noIndex: true
    }
  );
}

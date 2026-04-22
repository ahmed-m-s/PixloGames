import type { Metadata } from 'next';
import { FavoritesView } from '@/components/game/favorites-view';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Favorites',
  'Your saved PixloGames favorites.',
  {
    path: '/favorites',
    noIndex: true
  }
);

export default function FavoritesPage() {
  return <FavoritesView />;
}

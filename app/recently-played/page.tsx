import type { Metadata } from 'next';
import { RecentlyPlayedView } from '@/components/game/recently-played-view';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Recently Played',
  'Return to games you recently opened on PixloGames.',
  {
    path: '/recently-played',
    noIndex: true
  }
);

export default function RecentlyPlayedPage() {
  return <RecentlyPlayedView />;
}

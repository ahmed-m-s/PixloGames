import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GameDetail } from '@/components/game/game-detail';
import { getGameBySlug, getRelatedGames, listGames } from '@/lib/games';
import {
  createGameDetailPageMetadata,
  createMissingGamePageMetadata
} from '@/lib/game-page-metadata';

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const games = await listGames();

  return games.map((game) => ({
    slug: game.slug
  }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return createMissingGamePageMetadata(slug);
  }

  return createGameDetailPageMetadata(game);
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return <GameDetail game={game} relatedGames={await getRelatedGames(game)} />;
}

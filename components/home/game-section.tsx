import { GameCard } from '@/components/game/game-card';
import { LinkButton } from '@/components/ui/button';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { SectionHeader } from '@/components/ui/section-header';
import type { Game, GameCardVariant } from '@/types/game';

type GameSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  games: Game[];
  variant?: GameCardVariant;
  dense?: boolean;
  actionHref?: string;
};

export function GameSection({
  eyebrow,
  title,
  description,
  games,
  variant = 'default',
  dense = false,
  actionHref = '/games'
}: GameSectionProps) {
  const cardVariant = dense ? 'compact' : variant;
  const titleId = `${title.toLowerCase().replaceAll(' ', '-')}-title`;

  return (
    <section aria-labelledby={titleId}>
      <SectionHeader
        action={
          <LinkButton href={actionHref} size="sm" variant="ghost">
            View all
          </LinkButton>
        }
        description={description}
        eyebrow={eyebrow}
        title={title}
        titleId={titleId}
      />
      <ResponsiveGrid dense={dense}>
        {games.map((game, index) => (
          <GameCard game={game} key={game.id} priority={index < 2} variant={cardVariant} />
        ))}
      </ResponsiveGrid>
    </section>
  );
}

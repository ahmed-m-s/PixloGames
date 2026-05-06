import { GameCard } from '@/components/game/game-card';
import { LinkButton } from '@/components/ui/button';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { SectionHeader } from '@/components/ui/section-header';
import type { Game, GameCardVariant } from '@/types/game';

type GameSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  games: Game[];
  variant?: GameCardVariant;
  dense?: boolean;
  homepageGrid?: boolean;
  actionHref?: string;
  titleTone?: 'default' | 'brand';
};

export function GameSection({
  eyebrow,
  title,
  description,
  games,
  variant,
  dense = false,
  homepageGrid = false,
  actionHref = '/games',
  titleTone = 'default'
}: GameSectionProps) {
  const cardVariant = variant ?? (dense ? 'compact' : 'default');
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
        titleTone={titleTone}
      />
      <ResponsiveGrid
        className={homepageGrid ? 'gap-3 sm:grid-cols-3 lg:gap-4 xl:grid-cols-5' : undefined}
        dense={dense}
      >
        {games.map((game, index) => (
          <GameCard game={game} key={game.id} priority={index < 2} variant={cardVariant} />
        ))}
      </ResponsiveGrid>
    </section>
  );
}

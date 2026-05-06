'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FavoriteButton } from '@/components/game/favorite-button';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { Pill } from '@/components/ui/pill';
import { trackEvent } from '@/lib/analytics';
import { getCatalogEntryKind, isPlayableLocalGame } from '@/lib/catalog-semantics';
import { cn } from '@/lib/utils';
import type { Game, GameBadge, GameCardVariant } from '@/types/game';

type GameCardProps = {
  game: Game;
  variant?: GameCardVariant;
  priority?: boolean;
  className?: string;
};

const variantClasses: Record<GameCardVariant, string> = {
  default: 'min-h-[360px]',
  compact: 'min-h-[268px]',
  featured: 'min-h-[420px] sm:min-h-[460px]',
  homepage: 'min-h-0'
};

function getBadges(game: Game): GameBadge[] {
  const badges: GameBadge[] = [];

  if (game.isNew) badges.push('New');
  if (game.isTrending) badges.push('Trending');
  if (game.isMultiplayer) badges.push('Multiplayer');
  if (game.isEditorsPick) badges.push("Editor's Pick");

  return badges.slice(0, 3);
}

function badgeTone(badge: GameBadge) {
  if (badge === 'Trending') return 'ember';
  if (badge === 'New') return 'brand';
  if (badge === 'Multiplayer') return 'aqua';
  return 'sun';
}

export function GameCard({
  game,
  variant = 'default',
  priority = false,
  className
}: GameCardProps) {
  const isHomepage = variant === 'homepage';

  if (isHomepage) {
    return (
      <motion.article
        className={cn(
          'card-glow group overflow-hidden rounded-lg bg-white/[0.055] shadow-card',
          'surface-border transition duration-200 hover:border-brand/65 hover:shadow-[0_22px_64px_rgb(34_211_238_/_0.14),0_0_28px_rgb(98_255_174_/_0.16)]',
          'focus-within:border-brand/65 focus-within:ring-2 focus-within:ring-brand/30 focus-within:shadow-[0_18px_54px_rgb(98_255_174_/_0.14)]',
          variantClasses[variant],
          className
        )}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <Link
          className="flex h-full flex-col focus:outline-none"
          href={`/games/${game.slug}`}
          onClick={() =>
            trackEvent('game_click', {
              gameId: game.id,
              slug: game.slug,
              source: 'game_card'
            })
          }
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-strong">
            <Image
              alt={`${game.title} game thumbnail`}
              className="h-full w-full object-cover brightness-[1.12] contrast-[1.12] saturate-[1.32] transition duration-500 group-hover:scale-105 group-hover:brightness-[1.2] group-hover:contrast-[1.16] group-hover:saturate-[1.45]"
              fill
              priority={priority}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              src={game.thumbnail}
            />
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(0deg,rgb(0_0_0_/_0.72),rgb(0_0_0_/_0.34)_38%,rgb(0_0_0_/_0)_100%)]" />
            <span
              aria-hidden
              className="absolute left-3 top-3 inline-flex translate-y-1 rounded-full border border-brand/30 bg-black/[0.62] px-2.5 py-1 text-xs font-semibold text-brand opacity-0 backdrop-blur transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              Play
            </span>
            <h3 className="absolute bottom-3 left-3 right-3 line-clamp-2 font-display text-xl font-medium leading-[1.05] text-white drop-shadow-[0_2px_14px_rgb(0_0_0_/_0.92)] transition group-hover:text-brand sm:text-[1.35rem]">
              {game.title}
            </h3>
          </div>
        </Link>
        <FavoriteButton
          className="absolute right-2 top-2 z-20 h-8 w-8 px-0 opacity-90 shadow-[0_8px_22px_rgb(0_0_0_/_0.28)] hover:opacity-100"
          gameId={game.id}
          label="short"
          onClick={(event) => {
            event.stopPropagation();
          }}
        />
      </motion.article>
    );
  }

  const badges = getBadges(game);
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  const entryKind = getCatalogEntryKind(game);
  const entryLabel =
    entryKind === 'playable_local'
      ? 'Pixlo Original'
      : entryKind === 'preview'
        ? 'Preview entry'
        : 'Remote playable';
  const actionLabel = entryKind === 'preview' ? 'View preview' : 'Play now';

  return (
    <motion.article
      className={cn(
        'card-glow group overflow-hidden rounded-lg bg-surface shadow-card',
        'surface-border transition duration-200 hover:border-white/20 hover:shadow-hover',
        variantClasses[variant],
        className
      )}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <Link
        className="flex h-full flex-col focus:outline-none"
        href={`/games/${game.slug}`}
        onClick={() =>
          trackEvent('game_click', {
            gameId: game.id,
            slug: game.slug,
            source: 'game_card'
          })
        }
      >
        <div
          className={cn(
            'relative overflow-hidden bg-surface-strong',
            isCompact ? 'aspect-[16/10]' : 'aspect-[16/11]',
            isFeatured && 'aspect-[16/12] sm:aspect-[16/10]'
          )}
        >
          <Image
            alt={`${game.title} game thumbnail`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            fill
            priority={priority}
            sizes={
              isCompact
                ? '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'
                : '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw'
            }
            src={game.thumbnail}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/6 to-transparent" />
          <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Pill
                className="h-6 bg-black/[0.35] backdrop-blur"
                key={badge}
                tone={badgeTone(badge)}
              >
                {badge}
              </Pill>
            ))}
          </div>
          <div className="absolute bottom-3 left-3 rounded-full border border-white/[0.12] bg-black/[0.45] px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {game.category}
          </div>
        </div>
        <div
          className={cn(
            'flex flex-1 flex-col p-4',
            isCompact ? 'gap-2' : 'gap-3',
            isFeatured && 'p-5'
          )}
        >
          <div>
            <h3
              className={cn(
                'font-display font-bold leading-tight text-foreground transition group-hover:text-brand',
                isCompact ? 'text-lg' : 'text-xl',
                isFeatured && 'text-2xl'
              )}
            >
              {game.title}
            </h3>
            {!isCompact ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                {game.shortDescription}
              </p>
            ) : null}
          </div>
          <div className="mt-auto">
            <GameMetaRow compact={isCompact} game={game} />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                {isPlayableLocalGame(game) ? 'Pixlo Original' : entryLabel}
              </span>
              <span className="text-sm font-black text-foreground transition group-hover:text-brand">
                {actionLabel}
              </span>
            </div>
          </div>
        </div>
      </Link>
      <FavoriteButton
        className="absolute right-3 top-3 z-20 h-9 w-9 px-0"
        gameId={game.id}
        label="short"
        onClick={(event) => {
          event.stopPropagation();
        }}
      />
    </motion.article>
  );
}

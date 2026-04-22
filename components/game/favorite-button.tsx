'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

type FavoriteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  gameId: string;
  label?: 'short' | 'full';
};

export function FavoriteButton({
  gameId,
  label = 'short',
  className,
  onClick,
  ...props
}: FavoriteButtonProps) {
  const { hasLoaded, isFavorite, toggleFavorite } = useFavorites();
  const active = hasLoaded && isFavorite(gameId);

  return (
    <button
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/70',
        active
          ? 'border-brand/35 bg-brand text-black hover:bg-brand-strong'
          : 'border-white/10 bg-black/[0.46] text-white backdrop-blur hover:border-white/20 hover:bg-black/[0.62]',
        className
      )}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          toggleFavorite(gameId);
        }
      }}
      type="button"
      {...props}
    >
      <svg
        aria-hidden
        className="h-4 w-4"
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
      >
        <path
          d="M12 21s-7.5-4.7-9.4-10.1C1.2 6.8 3.6 3 7.7 3c2 0 3.4 1 4.3 2.3C12.9 4 14.3 3 16.3 3c4.1 0 6.5 3.8 5.1 7.9C19.5 16.3 12 21 12 21Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      {label === 'full' ? <span>{active ? 'Saved' : 'Favorite'}</span> : null}
    </button>
  );
}

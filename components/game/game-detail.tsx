'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FavoriteButton } from '@/components/game/favorite-button';
import { GameCard } from '@/components/game/game-card';
import { GameMetaRow } from '@/components/game/game-meta-row';
import { GamePlayer } from '@/components/game/game-player';
import { ShareButton } from '@/components/game/share-button';
import { AdSlot } from '@/components/ui/ad-slot';
import { Button, LinkButton } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { categories } from '@/data/games';
import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { trackEvent } from '@/lib/analytics';
import { formatDate } from '@/lib/format';
import type { Game } from '@/types/game';

type GameDetailProps = {
  game: Game;
  relatedGames: Game[];
};

function formatDiscoveryLabel(value: string) {
  return value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRecommendationReasons(currentGame: Game, candidate: Game) {
  const reasons: string[] = [];
  const sharedTags = candidate.tags.filter((tag) => currentGame.tags.includes(tag));

  if (candidate.category === currentGame.category) {
    reasons.push(`More ${currentGame.category}`);
  }

  if (sharedTags.length > 0) {
    reasons.push(formatDiscoveryLabel(sharedTags[0]));
  }

  if (candidate.sourceOrigin === 'first_party') {
    reasons.push('Pixlo Original');
  }

  if (currentGame.mobileSupported && candidate.mobileSupported) {
    reasons.push('Mobile Ready');
  }

  if (candidate.isNew) {
    reasons.push('New');
  }

  if (candidate.isEditorsPick) {
    reasons.push("Editor's Pick");
  }

  return Array.from(new Set(reasons)).slice(0, 3);
}

function getCurrentGameDiscoverySignals(game: Game) {
  const signals = [`More ${game.category}`];

  if (game.sourceOrigin === 'first_party') signals.push('Pixlo Originals');
  if (game.mobileSupported) signals.push('Mobile Ready');
  if (game.controls.touch) signals.push('Touch Friendly');
  if (game.isNew) signals.push('New Releases');
  if (game.isEditorsPick) signals.push("Editor's Picks");

  return signals.slice(0, 4);
}

export function GameDetail({ game, relatedGames }: GameDetailProps) {
  const { addRecentlyPlayed } = useRecentlyPlayed();
  const [playRequestKey, setPlayRequestKey] = useState(0);
  const category = categories.find((candidate) => candidate.name === game.category);
  const playNextGame = relatedGames[0];
  const playNextReasons = playNextGame ? getRecommendationReasons(game, playNextGame) : [];
  const discoverySignals = getCurrentGameDiscoverySignals(game);
  const controlSummary = [
    game.controls.keyboard.length > 0 ? game.controls.keyboard.join(', ') : undefined,
    game.controls.mouse ? 'Mouse' : undefined,
    game.controls.touch ? 'Touch' : undefined,
    game.controls.gamepad ? 'Gamepad' : undefined
  ]
    .filter(Boolean)
    .join(' + ');
  const detailStats = [
    {
      label: 'Category',
      value: game.category,
      href: category ? `/categories/${category.slug}` : '/categories'
    },
    { label: 'Difficulty', value: game.difficulty },
    { label: 'Platform', value: game.mobileSupported ? 'Desktop + mobile' : 'Desktop' },
    { label: 'Controls', value: controlSummary || 'Tap / click' }
  ];
  const gameFacts = [
    { label: 'Developer', value: game.developerName },
    { label: 'Publisher', value: game.publisherName },
    { label: 'Released', value: formatDate(game.releaseDate) },
    { label: 'Updated', value: formatDate(game.updatedAt) },
    { label: 'Content rating', value: game.contentRating },
    { label: 'Play mode', value: game.playMode.replaceAll('-', ' ') }
  ];
  const controlBadges = [
    game.controls.mouse ? 'Mouse ready' : 'No mouse required',
    game.controls.touch ? 'Touch ready' : 'Keyboard focused',
    game.controls.gamepad ? 'Gamepad ready' : 'No gamepad needed',
    game.mobileSupported ? 'Mobile supported' : 'Desktop recommended'
  ];
  const compatibilityItems = [
    { label: 'Safety', value: game.adSafe ? 'Ad-safe content' : 'Limited ad eligibility' },
    { label: 'Status', value: `${game.status} status` },
    { label: 'Layout', value: `${game.orientation} orientation` },
    {
      label: 'Embed',
      value: game.hasRealEmbed ? 'Playable embed connected' : 'Preview mode active'
    }
  ];

  useEffect(() => {
    addRecentlyPlayed(game.id);
    trackEvent('game_open', {
      gameId: game.id,
      slug: game.slug,
      category: game.category
    });
  }, [addRecentlyPlayed, game.category, game.id, game.slug]);

  function handlePlayNow() {
    setPlayRequestKey((currentKey) => currentKey + 1);
    document.getElementById('play')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  return (
    <main>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: game.title,
            description: game.shortDescription,
            genre: [game.category, ...game.tags],
            applicationCategory: 'Game',
            operatingSystem: 'Web browser',
            playMode: game.playMode,
            aggregateRating:
              game.rating > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: game.rating,
                    ratingCount: Math.max(1, Math.round(game.plays / 1000))
                  }
                : undefined,
            publisher: {
              '@type': 'Organization',
              name: game.publisherName
            }
          })
        }}
        type="application/ld+json"
      />
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
            <Link className="transition hover:text-foreground" href="/">
              Home
            </Link>
            <span>/</span>
            <Link className="transition hover:text-foreground" href="/games">
              Games
            </Link>
            <span>/</span>
            <span className="text-foreground">{game.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] space-y-12 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <GamePlayer game={game} playRequestKey={playRequestKey} />

          <aside className="space-y-4 lg:self-start">
            <div className="rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.08),rgb(255_255_255_/_0.035))] p-5 shadow-card">
              <div className="flex flex-wrap gap-2">
                <Link href={category ? `/categories/${category.slug}` : '/categories'}>
                  <Pill
                    className="transition hover:border-brand/45 hover:bg-brand/[0.18]"
                    tone="brand"
                  >
                    {game.category}
                  </Pill>
                </Link>
                {game.sourceOrigin === 'first_party' ? (
                  <Pill tone="brand">Pixlo Original</Pill>
                ) : null}
                {game.isNew ? <Pill tone="aqua">New</Pill> : null}
                {game.isTrending ? <Pill tone="ember">Trending</Pill> : null}
                {game.isEditorsPick ? <Pill tone="sun">Editor&apos;s Pick</Pill> : null}
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground">
                {game.title}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted">{game.shortDescription}</p>
              <div className="mt-4">
                <GameMetaRow game={game} />
              </div>
              <div className="mt-5 grid gap-3">
                <Button
                  className="h-12 w-full text-base font-black"
                  onClick={handlePlayNow}
                  size="lg"
                >
                  Play now
                </Button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <FavoriteButton gameId={game.id} label="full" />
                <ShareButton text={game.shortDescription} title={game.title} />
              </div>
            </div>

            {playNextGame ? (
              <Link
                className="group block rounded-lg border border-brand/20 bg-brand/[0.07] p-5 shadow-card transition hover:border-brand/40 hover:bg-brand/[0.1]"
                href={`/games/${playNextGame.slug}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">
                      Play next
                    </p>
                    <p className="mt-2 font-display text-xl font-bold text-foreground transition group-hover:text-brand">
                      {playNextGame.title}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-black/[0.25] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-foreground transition group-hover:border-brand/35 group-hover:text-brand">
                    Play now
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                  {playNextGame.shortDescription}
                </p>
                {playNextReasons.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {playNextReasons.map((reason) => (
                      <Pill key={reason} tone="neutral">
                        {reason}
                      </Pill>
                    ))}
                  </div>
                ) : null}
              </Link>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {detailStats.map((item) => {
                const content = (
                  <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4 transition hover:border-white/20 hover:bg-white/[0.08]">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-bold capitalize text-foreground">
                      {item.value}
                    </p>
                  </div>
                );

                return item.href ? (
                  <Link href={item.href} key={item.label}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-xl font-bold text-foreground">Game info</p>
                <Pill tone="neutral">{game.difficulty}</Pill>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
                {gameFacts.map((item) => (
                  <div key={item.label}>
                    <dt className="font-bold text-foreground">{item.label}</dt>
                    <dd className="mt-1 capitalize text-muted">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 border-t border-white/10 pt-4 text-sm text-muted">
                <div>
                  <p className="font-bold text-foreground">Keyboard</p>
                  <p className="mt-1">
                    {game.controls.keyboard.length > 0
                      ? game.controls.keyboard.join(', ')
                      : 'No keyboard controls required'}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {controlBadges.map((label) => (
                    <p
                      className="rounded-lg border border-white/10 bg-black/[0.2] px-3 py-2"
                      key={label}
                    >
                      {label}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <AdSlot placement="game-sidebar" />
          </aside>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="font-display text-2xl font-bold text-foreground">About this game</p>
              <p className="mt-3 text-base leading-8 text-muted">{game.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <Link
                    className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-sm font-semibold text-muted transition hover:border-white/20 hover:text-foreground"
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    key={tag}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
              <p className="font-display text-xl font-bold text-foreground">Compatibility</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {compatibilityItems.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 capitalize text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {game.supportedPlatforms.map((platform) => (
                  <Pill key={platform} tone="neutral">
                    {platform}
                  </Pill>
                ))}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4 text-sm text-muted">
                <p className="font-bold text-foreground">Source status</p>
                <p className="mt-2 leading-6">{game.source.message}</p>
                <p className="mt-3 capitalize">
                  {game.embedType.replaceAll('-', ' ')}
                  {game.source.providerName ? ` by ${game.source.providerName}` : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.075),rgb(255_255_255_/_0.03))] p-4 shadow-card sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="brand">Keep playing</Pill>
                {discoverySignals.map((signal) => (
                  <Pill key={signal} tone="neutral">
                    {signal}
                  </Pill>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                <h2 className="font-display text-2xl font-bold leading-tight text-foreground">
                  More like this
                </h2>
                <p className="text-sm leading-6 text-muted">
                  Similar picks by category, controls, mobile fit, and editorial signals.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {category ? (
                <LinkButton href={`/categories/${category.slug}`} size="sm" variant="secondary">
                  More {game.category}
                </LinkButton>
              ) : null}
              <LinkButton href="/games" size="sm" variant="ghost">
                Browse all
              </LinkButton>
            </div>
          </div>
          <ResponsiveGrid className="gap-3" dense>
            {relatedGames.map((relatedGame) => {
              const reasons = getRecommendationReasons(game, relatedGame);

              return (
                <div
                  className="rounded-lg border border-white/10 bg-black/[0.16] p-2 transition hover:border-white/20 hover:bg-black/[0.22]"
                  key={relatedGame.id}
                >
                  {reasons.length > 0 ? (
                    <div className="mb-2 flex min-h-7 flex-wrap content-start gap-1.5">
                      {reasons.slice(0, 2).map((reason) => (
                        <span
                          className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted"
                          key={reason}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <GameCard game={relatedGame} variant="compact" />
                </div>
              );
            })}
          </ResponsiveGrid>
        </section>
      </div>
    </main>
  );
}

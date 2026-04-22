'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getGameIframePolicy, getGameMessageTargetOrigin } from '@/lib/embed-security';
import { cn } from '@/lib/utils';
import type { Game } from '@/types/game';

type GamePlayerProps = {
  game: Game;
  playRequestKey?: number;
};

const playerViewportClasses: Record<Game['orientation'], string> = {
  landscape: 'aspect-[16/10] min-h-[320px] sm:aspect-video lg:min-h-[560px]',
  portrait: 'min-h-[620px] sm:min-h-[700px] lg:min-h-[760px]',
  responsive: 'min-h-[600px] sm:min-h-[680px] lg:min-h-[760px] xl:min-h-[820px]'
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function withAutostart(url: string) {
  const [pathAndQuery, hash] = url.split('#');
  const separator = pathAndQuery.includes('?') ? '&' : '?';

  return `${pathAndQuery}${separator}autostart=1${hash ? `#${hash}` : ''}`;
}

export function GamePlayer({ game, playRequestKey = 0 }: GamePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [frameError, setFrameError] = useState('');
  const [fullscreenError, setFullscreenError] = useState('');
  const framePolicy = getGameIframePolicy(game);
  const isBlockedEmbed = framePolicy.trustLevel === 'invalid';
  const isUnavailable = game.source.mode === 'unavailable' || isBlockedEmbed;
  const isEmbedded = game.source.mode === 'embedded' && Boolean(game.source.url) && !isBlockedEmbed;
  const isPreview = game.source.mode === 'preview';
  const embedUrl =
    isEmbedded && game.source.url
      ? game.embedType === 'html5-package'
        ? withAutostart(game.source.url)
        : game.source.url
      : '';

  const postFullscreenState = useCallback(
    (fullscreenActive: boolean) => {
      const targetOrigin = getGameMessageTargetOrigin(game, window.location.origin);

      if (!targetOrigin) {
        return;
      }

      iframeRef.current?.contentWindow?.postMessage(
        {
          isFullscreen: fullscreenActive,
          type: 'pixlo:fullscreen-state'
        },
        targetOrigin
      );
    },
    [game]
  );

  function handleStart() {
    setFrameError('');
    setIsFrameLoading(true);
    setHasStarted(true);
  }

  function handleFrameLoad() {
    setIsFrameLoading(false);
    iframeRef.current?.focus({ preventScroll: true });
    postFullscreenState(isFullscreen);
  }

  async function handleFullscreen() {
    const fullscreenTarget = viewportRef.current ?? containerRef.current;

    if (!fullscreenTarget) {
      return;
    }

    setFullscreenError('');

    try {
      if (!document.fullscreenEnabled) {
        throw new Error('Fullscreen unavailable');
      }

      if (document.fullscreenElement === fullscreenTarget) {
        await document.exitFullscreen();
        return;
      }

      await fullscreenTarget.requestFullscreen();
    } catch {
      setFullscreenError('Fullscreen is not available in this browser.');
      window.setTimeout(() => setFullscreenError(''), 2600);
    }
  }

  useEffect(() => {
    function syncFullscreenState() {
      const fullscreenActive = document.fullscreenElement === viewportRef.current;
      setIsFullscreen(fullscreenActive);
      postFullscreenState(fullscreenActive);
    }

    syncFullscreenState();
    document.addEventListener('fullscreenchange', syncFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
    };
  }, [postFullscreenState]);

  useEffect(() => {
    if (playRequestKey < 1 || isUnavailable) {
      return;
    }

    const requestId = window.requestAnimationFrame(() => {
      if (hasStarted) {
        iframeRef.current?.focus({ preventScroll: true });
        return;
      }

      setFrameError('');
      setIsFrameLoading(true);
      setHasStarted(true);
    });

    return () => {
      window.cancelAnimationFrame(requestId);
    };
  }, [hasStarted, isUnavailable, playRequestKey]);

  useEffect(() => {
    if (!hasStarted || game.slug !== 'endless-runner') {
      return;
    }

    function handleParentKeyDown(event: KeyboardEvent) {
      if (event.code !== 'ArrowUp') {
        return;
      }

      event.preventDefault();
      iframeRef.current?.contentWindow?.postMessage(
        {
          code: 'ArrowUp',
          type: 'pixlo:game-input'
        },
        window.location.origin
      );
    }

    window.addEventListener('keydown', handleParentKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleParentKeyDown, true);
    };
  }, [game.slug, hasStarted]);

  const safeTitle = escapeHtml(game.title);
  const safeProvider = escapeHtml(game.source.providerName ?? 'Pixlo Preview');
  const srcDoc = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          html, body {
            margin: 0;
            width: 100%;
            height: 100%;
            background: #050506;
            color: #f8fafc;
            font-family: Inter, system-ui, sans-serif;
            overflow: hidden;
          }
          body {
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at 25% 20%, rgba(98, 255, 174, 0.22), transparent 34%),
              radial-gradient(circle at 80% 70%, rgba(255, 91, 91, 0.16), transparent 36%),
              linear-gradient(135deg, #09090b, #141418);
          }
          .stage {
            width: min(76vw, 760px);
            aspect-ratio: 16 / 9;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 8px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,.05);
            box-shadow: 0 24px 80px rgba(0,0,0,.38);
          }
          .pulse {
            width: 88px;
            height: 88px;
            border-radius: 8px;
            border: 2px solid rgba(98,255,174,.9);
            animation: pulse 1.8s ease-in-out infinite;
          }
          h1 {
            margin: 22px 0 0;
            font-size: clamp(28px, 5vw, 64px);
            line-height: 1;
            text-align: center;
          }
          p {
            margin: 12px auto 0;
            max-width: 520px;
            color: rgba(255,255,255,.68);
            text-align: center;
            line-height: 1.6;
          }
          @keyframes pulse {
            0%, 100% { transform: rotate(0deg) scale(1); opacity: .72; }
            50% { transform: rotate(8deg) scale(1.08); opacity: 1; }
          }
        </style>
      </head>
      <body>
        <main>
          <div class="stage">
            <div>
              <div class="pulse"></div>
              <h1>${safeTitle}</h1>
              <p>Preview shell by ${safeProvider}</p>
            </div>
          </div>
        </main>
      </body>
    </html>
  `;

  return (
    <div
      className="relative flex min-h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black shadow-card"
      data-testid="game-player"
      id="play"
      ref={containerRef}
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold leading-6 text-muted">
            {isEmbedded ? 'Embedded player ready.' : game.source.message}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {!hasStarted && !isUnavailable ? (
              <Button className="min-w-24" onClick={handleStart} size="sm">
                {isEmbedded ? 'Play' : 'Start preview'}
              </Button>
            ) : null}
            {!isFullscreen && !isUnavailable ? (
              <Button className="min-w-28" onClick={handleFullscreen} size="sm" variant="secondary">
                Fullscreen
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted sm:justify-end">
            <span className="rounded-full border border-white/10 bg-black/[0.28] px-3 py-1.5">
              No download
            </span>
            <span className="rounded-full border border-white/10 bg-black/[0.28] px-3 py-1.5">
              {game.mobileSupported ? 'Touch ready' : 'Desktop focused'}
            </span>
            <span className="rounded-full border border-white/10 bg-black/[0.28] px-3 py-1.5 capitalize">
              {game.difficulty}
            </span>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'game-player-viewport relative min-h-0 flex-1 overflow-hidden bg-black',
          playerViewportClasses[game.orientation]
        )}
        ref={viewportRef}
      >
        {hasStarted && isEmbedded ? (
          <>
            <iframe
              allow={framePolicy.allow}
              allowFullScreen={framePolicy.allowFullscreen}
              className="absolute inset-0 h-full w-full focus:outline-none"
              data-testid="game-player-frame"
              loading="eager"
              onError={() => {
                setIsFrameLoading(false);
                setFrameError('The game frame could not load. Try refreshing the page.');
              }}
              onLoad={handleFrameLoad}
              ref={iframeRef}
              referrerPolicy={framePolicy.referrerPolicy}
              sandbox={framePolicy.sandbox}
              src={embedUrl}
              tabIndex={0}
              title={`${game.title} playable embed`}
            />
            {isFrameLoading ? (
              <div className="absolute inset-0 grid place-items-center bg-black/[0.78] text-center backdrop-blur-sm">
                <div>
                  <div className="mx-auto h-12 w-12 animate-pulse rounded-lg border-2 border-brand" />
                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-brand">
                    Loading game
                  </p>
                  <p className="mt-2 text-sm text-white/62">Preparing the HTML5 player frame.</p>
                </div>
              </div>
            ) : null}
          </>
        ) : hasStarted && isPreview ? (
          <>
            <iframe
              allow={framePolicy.allow}
              allowFullScreen={framePolicy.allowFullscreen}
              className="absolute inset-0 h-full w-full focus:outline-none"
              data-testid="game-player-frame"
              onError={() => {
                setIsFrameLoading(false);
                setFrameError('The preview frame could not load.');
              }}
              onLoad={handleFrameLoad}
              ref={iframeRef}
              referrerPolicy={framePolicy.referrerPolicy}
              sandbox={framePolicy.sandbox}
              srcDoc={srcDoc}
              tabIndex={0}
              title={`${game.title} player`}
            />
            {isFrameLoading ? (
              <div className="absolute inset-0 grid place-items-center bg-black/[0.78] text-center backdrop-blur-sm">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                  Loading preview
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Image
              alt={`${game.title} cover art`}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 72vw, 100vw"
              src={game.coverImage}
            />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(0_0_0_/_0.78),rgb(0_0_0_/_0.18)),linear-gradient(90deg,rgb(0_0_0_/_0.64),transparent_70%)]" />
            <div className="absolute inset-x-5 bottom-5 max-w-xl sm:inset-x-8 sm:bottom-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                {isUnavailable
                  ? 'Unavailable'
                  : isEmbedded
                    ? 'Ready to play'
                    : 'Local preview session'}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                {game.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/72 sm:text-base">
                {game.source.message}
              </p>
              {!isUnavailable ? (
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-white/56">
                  No install needed
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
      {fullscreenError ? (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-ember/25 bg-black/[0.72] px-4 py-3 text-sm font-semibold text-ember backdrop-blur">
          {fullscreenError}
        </div>
      ) : null}
      {frameError ? (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-ember/25 bg-black/[0.82] px-4 py-3 text-sm font-semibold text-ember backdrop-blur">
          {frameError}
        </div>
      ) : null}
    </div>
  );
}

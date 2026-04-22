import type { Game } from '@/types/game';

export type GameEmbedTrustLevel =
  | 'trusted-first-party-local'
  | 'sandboxed-third-party'
  | 'preview'
  | 'unavailable'
  | 'invalid';

export type GameIframePolicy = {
  trustLevel: GameEmbedTrustLevel;
  sandbox: string;
  allow: string;
  allowFullscreen: boolean;
  referrerPolicy: 'no-referrer';
};

export type GameEmbedSecurityIssue = {
  field: string;
  message: string;
};

const trustedFirstPartySandbox = ['allow-scripts', 'allow-same-origin', 'allow-pointer-lock'];
const sandboxedThirdPartySandbox = ['allow-scripts', 'allow-pointer-lock'];
const previewSandbox = ['allow-scripts'];

function isHttpsUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isSameOriginPath(value: string | undefined) {
  return Boolean(value?.startsWith('/'));
}

function getExpectedLocalPackageUrl(game: Game) {
  return `/games/${game.slug}/index.html`;
}

function isExpectedFirstPartyLocalPackage(game: Game) {
  return (
    game.sourceOrigin === 'first_party' &&
    game.embedType === 'html5-package' &&
    game.source.url === getExpectedLocalPackageUrl(game)
  );
}

function getAllowedFeatures(game: Game, trustLevel: GameEmbedTrustLevel) {
  if (trustLevel === 'invalid' || trustLevel === 'unavailable') {
    return '';
  }

  const features = ['fullscreen'];

  if (trustLevel === 'trusted-first-party-local') {
    features.unshift('autoplay');
  }

  if (
    trustLevel === 'trusted-first-party-local' &&
    (game.controls.gamepad || game.supportedPlatforms.includes('gamepad'))
  ) {
    features.push('gamepad');
  }

  return features.join('; ');
}

export function getGameEmbedTrustLevel(game: Game): GameEmbedTrustLevel {
  if (game.source.mode === 'unavailable') {
    return 'unavailable';
  }

  if (game.source.mode === 'preview') {
    return 'preview';
  }

  if (game.source.mode !== 'embedded' || !game.source.url) {
    return 'invalid';
  }

  if (isExpectedFirstPartyLocalPackage(game)) {
    return 'trusted-first-party-local';
  }

  if (isSameOriginPath(game.source.url)) {
    return 'invalid';
  }

  if (isHttpsUrl(game.source.url)) {
    return 'sandboxed-third-party';
  }

  return 'invalid';
}

export function getGameIframePolicy(game: Game): GameIframePolicy {
  const trustLevel = getGameEmbedTrustLevel(game);
  const sandbox =
    trustLevel === 'trusted-first-party-local'
      ? trustedFirstPartySandbox
      : trustLevel === 'sandboxed-third-party'
        ? sandboxedThirdPartySandbox
        : previewSandbox;

  return {
    trustLevel,
    sandbox: sandbox.join(' '),
    allow: getAllowedFeatures(game, trustLevel),
    allowFullscreen: trustLevel !== 'invalid' && trustLevel !== 'unavailable',
    referrerPolicy: 'no-referrer'
  };
}

export function getGameMessageTargetOrigin(game: Game, hostOrigin: string) {
  const trustLevel = getGameEmbedTrustLevel(game);

  if (trustLevel === 'trusted-first-party-local') {
    return hostOrigin;
  }

  return undefined;
}

export function getGameEmbedSecurityIssues(game: Game): GameEmbedSecurityIssue[] {
  if (game.source.mode !== 'embedded') {
    return [];
  }

  const issues: GameEmbedSecurityIssue[] = [];
  const sourceUrl = game.source.url;

  if (!sourceUrl) {
    return [
      {
        field: 'source.url',
        message: 'Embedded games require a source URL.'
      }
    ];
  }

  if (isExpectedFirstPartyLocalPackage(game) || isHttpsUrl(sourceUrl)) {
    return [];
  }

  if (isSameOriginPath(sourceUrl)) {
    issues.push({
      field: 'source.url',
      message:
        'Same-origin game embeds are reserved for trusted first-party local packages. Developer or publisher content must use a separate HTTPS game origin.'
    });
  } else {
    issues.push({
      field: 'source.url',
      message:
        'Embedded games must use HTTPS remote URLs unless they are trusted first-party packages.'
    });
  }

  return issues;
}

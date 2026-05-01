import type { Game, GameEmbedType, GameSourceOrigin } from '@/types/game';

export type GameCatalogEntryKind = 'playable_local' | 'playable_remote' | 'preview' | 'unavailable';

type CatalogSemanticsInput = {
  sourceMode: Game['source']['mode'];
  embedType: GameEmbedType;
  sourceOrigin: GameSourceOrigin;
  hasRealEmbed: boolean;
  embedUrl: string;
};

export type CatalogSemanticsSummary = {
  totalEntries: number;
  playableEntries: number;
  playableLocalEntries: number;
  playableRemoteEntries: number;
  previewEntries: number;
  unavailableEntries: number;
};

const localPackageBasePaths = ['/games/', '/playable-games/'] as const;

export function getCatalogEntryKindFromInput(input: CatalogSemanticsInput): GameCatalogEntryKind {
  if (input.sourceMode === 'unavailable') {
    return 'unavailable';
  }

  const hasPlayableEmbed =
    input.sourceMode === 'embedded' &&
    input.hasRealEmbed &&
    input.embedType !== 'local-preview' &&
    input.embedType !== 'none';

  if (!hasPlayableEmbed) {
    return 'preview';
  }

  const isPlayableLocalPackage =
    input.sourceOrigin === 'first_party' &&
    input.embedType === 'html5-package' &&
    localPackageBasePaths.some((basePath) => input.embedUrl.startsWith(basePath));

  return isPlayableLocalPackage ? 'playable_local' : 'playable_remote';
}

export function getCatalogEntryKind(game: Game): GameCatalogEntryKind {
  return getCatalogEntryKindFromInput({
    sourceMode: game.source.mode,
    embedType: game.embedType,
    sourceOrigin: game.sourceOrigin,
    hasRealEmbed: game.hasRealEmbed,
    embedUrl: game.embedUrl
  });
}

export function isPlayableCatalogGame(game: Game) {
  const kind = getCatalogEntryKind(game);

  return kind === 'playable_local' || kind === 'playable_remote';
}

export function isPlayableLocalGame(game: Game) {
  return getCatalogEntryKind(game) === 'playable_local';
}

export function isPlayableRemoteGame(game: Game) {
  return getCatalogEntryKind(game) === 'playable_remote';
}

export function isPreviewCatalogEntry(game: Game) {
  return getCatalogEntryKind(game) === 'preview';
}

export function summarizeCatalogEntries(games: Game[]): CatalogSemanticsSummary {
  const summary: CatalogSemanticsSummary = {
    totalEntries: games.length,
    playableEntries: 0,
    playableLocalEntries: 0,
    playableRemoteEntries: 0,
    previewEntries: 0,
    unavailableEntries: 0
  };

  for (const game of games) {
    const kind = getCatalogEntryKind(game);

    if (kind === 'playable_local') {
      summary.playableEntries += 1;
      summary.playableLocalEntries += 1;
      continue;
    }

    if (kind === 'playable_remote') {
      summary.playableEntries += 1;
      summary.playableRemoteEntries += 1;
      continue;
    }

    if (kind === 'preview') {
      summary.previewEntries += 1;
      continue;
    }

    summary.unavailableEntries += 1;
  }

  return summary;
}

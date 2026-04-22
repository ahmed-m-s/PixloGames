import { prisma } from '@/lib/db/prisma';
import {
  mapGameToDbData,
  mapDbCollectionToCollection,
  mapDbGameToGame,
  mapDbSubmissionReviewToReviewEntry,
  mapDbSubmissionToSubmission,
  mapSubmissionToDbData
} from '@/lib/repositories/prisma-mappers';
import {
  buildDraftGameFromSubmission,
  getGamePublishingReadiness,
  getSubmissionPublishingReadiness,
  slugifyTitle
} from '@/lib/publishing';
import type { GameCollection } from '@/types/collection';
import type { AdPlacement, AdPlacementKey } from '@/types/ad';
import type { Game, GameVisibility } from '@/types/game';
import type { GameSubmission, SubmissionStatus } from '@/types/submission';
import type { GameAdminPatch, PublishingAction } from '@/types/schema';

const gameInclude = {
  collections: {
    orderBy: {
      position: 'asc' as const
    }
  },
  mediaAssets: {
    orderBy: {
      createdAt: 'desc' as const
    }
  }
};

const collectionInclude = {
  games: {
    orderBy: {
      position: 'asc' as const
    }
  }
};

const submissionInclude = {
  publishedGame: {
    select: {
      id: true
    }
  },
  mediaAssets: {
    orderBy: {
      createdAt: 'desc' as const
    }
  }
};

type PublishingMutationResult =
  | {
      ok: true;
      game: Game;
      message: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
      issues: string[];
    };

function normalizeSubmissionCriteria(value: unknown): GameSubmission['criteria'] {
  if (value && typeof value === 'object') {
    return value as GameSubmission['criteria'];
  }

  return {
    performance: false,
    controls: false,
    adSafety: false,
    rights: false,
    mobile: false
  };
}

export type GameQuery = {
  visibility?: GameVisibility;
  includeInternal?: boolean;
  includeCollections?: boolean;
  includeMedia?: boolean;
};

function getGameInclude(query: GameQuery = {}) {
  return {
    ...(query.includeInternal || query.includeCollections
      ? {
          collections: gameInclude.collections
        }
      : {}),
    ...(query.includeInternal || query.includeMedia
      ? {
          mediaAssets: gameInclude.mediaAssets
        }
      : {})
  };
}

export async function listGames(query: GameQuery = {}) {
  const include = getGameInclude(query);
  const rows = await prisma.game.findMany({
    where: {
      visibility: query.visibility ?? (query.includeInternal ? undefined : 'public')
    },
    ...(Object.keys(include).length > 0 ? { include } : {}),
    orderBy: [
      {
        featuredPriority: 'desc'
      },
      {
        plays: 'desc'
      }
    ]
  });

  return rows.map(mapDbGameToGame);
}

export async function getGameBySlugFromRepository(slug: string) {
  const row = await prisma.game.findUnique({
    where: {
      slug
    },
    include: gameInclude
  });

  return row ? mapDbGameToGame(row) : undefined;
}

export async function getGameByIdFromRepository(gameId: string) {
  const row = await prisma.game.findUnique({
    where: {
      id: gameId
    },
    include: gameInclude
  });

  return row ? mapDbGameToGame(row) : undefined;
}

export async function listCollections() {
  const rows = await prisma.collection.findMany({
    include: collectionInclude,
    orderBy: [
      {
        priority: 'desc'
      },
      {
        title: 'asc'
      }
    ]
  });

  return rows.map(mapDbCollectionToCollection);
}

export async function getCollectionBySlugFromRepository(slug: string) {
  const row = await prisma.collection.findUnique({
    where: {
      slug
    },
    include: collectionInclude
  });

  return row ? mapDbCollectionToCollection(row) : undefined;
}

export async function resolveCollectionGames(collection: GameCollection) {
  if (collection.gameIds.length === 0) {
    return [];
  }

  const rows = await prisma.game.findMany({
    where: {
      id: {
        in: collection.gameIds
      }
    },
    include: gameInclude
  });
  const gameById = new Map(rows.map((game) => [game.id, mapDbGameToGame(game)]));

  return collection.gameIds
    .map((gameId) => gameById.get(gameId))
    .filter((game): game is Game => Boolean(game));
}

export async function listCollectionsForGame(gameId: string) {
  const rows = await prisma.collection.findMany({
    where: {
      games: {
        some: {
          gameId
        }
      }
    },
    orderBy: {
      priority: 'desc'
    }
  });

  return rows.map(mapDbCollectionToCollection);
}

export async function listAdPlacements(): Promise<AdPlacement[]> {
  const rows = await prisma.adPlacement.findMany({
    orderBy: {
      placementKey: 'asc'
    }
  });

  return rows.map((placement) => ({
    id: placement.id,
    placementKey: placement.placementKey as AdPlacementKey,
    label: placement.label,
    enabled: placement.enabled,
    sponsoredOnly: placement.sponsoredOnly,
    createdAt: placement.createdAt.toISOString(),
    updatedAt: placement.updatedAt.toISOString()
  }));
}

export async function listSubmissions(options: { includeRuntime?: boolean } = {}) {
  void options;

  const rows = await prisma.submission.findMany({
    include: submissionInclude,
    orderBy: {
      submittedAt: 'desc'
    }
  });

  return rows.map(mapDbSubmissionToSubmission);
}

export async function getSubmissionById(submissionId: string) {
  const row = await prisma.submission.findUnique({
    where: {
      id: submissionId
    },
    include: submissionInclude
  });

  return row ? mapDbSubmissionToSubmission(row) : undefined;
}

export async function getGameBySourceSubmissionId(submissionId: string) {
  const row = await prisma.game.findUnique({
    where: {
      sourceSubmissionId: submissionId
    },
    include: gameInclude
  });

  return row ? mapDbGameToGame(row) : undefined;
}

export async function listSubmissionReviews(submissionId: string) {
  const rows = await prisma.submissionReview.findMany({
    where: {
      submissionId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return rows.map(mapDbSubmissionReviewToReviewEntry);
}

export async function getSubmissionIntakeSignals(input: {
  title: string;
  developerName: string;
  contactEmail: string;
  buildUrl: string;
}) {
  const submittedSince = new Date(Date.now() - 1000 * 60 * 60);
  const [recentCount, duplicate] = await Promise.all([
    prisma.submission.count({
      where: {
        contactEmail: input.contactEmail,
        submittedAt: {
          gte: submittedSince
        }
      }
    }),
    prisma.submission.findFirst({
      where: {
        OR: [
          {
            buildUrl: input.buildUrl
          },
          {
            title: input.title,
            developerName: input.developerName
          }
        ]
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })
  ]);

  const warnings: string[] = [];
  let abuseScore = Math.min(60, recentCount * 12);

  if (duplicate) {
    warnings.push(`Potential duplicate of submission ${duplicate.id}.`);
    abuseScore += 20;
  }

  if (recentCount >= 3) {
    warnings.push('Multiple submissions from this contact email in the last hour.');
  }

  return {
    recentCount,
    duplicateSignal: duplicate?.id,
    warnings,
    abuseScore,
    rateLimited: recentCount >= 5
  };
}

export async function createSubmission(submission: GameSubmission) {
  const row = await prisma.submission.upsert({
    where: {
      id: submission.id
    },
    create: mapSubmissionToDbData(submission),
    update: mapSubmissionToDbData(submission)
  });

  return mapDbSubmissionToSubmission(row);
}

export async function createRuntimeSubmission(submission: GameSubmission) {
  return createSubmission(submission);
}

export async function updateSubmissionAssetUrls(
  submissionId: string,
  assetUrls: {
    thumbnailUrl?: string;
    coverImageUrl?: string;
  }
) {
  const row = await prisma.submission.update({
    where: {
      id: submissionId
    },
    data: {
      ...assetUrls,
      contentUpdatedAt: new Date()
    },
    include: submissionInclude
  });

  return mapDbSubmissionToSubmission(row);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  reviewNote?: string,
  reviewerName = 'Internal Ops'
) {
  const target = await prisma.submission.findUnique({
    where: {
      id: submissionId
    }
  });

  if (!target) {
    return undefined;
  }

  const reviewNotes = reviewNote ? [reviewNote, ...target.reviewNotes] : target.reviewNotes;
  const criteria = normalizeSubmissionCriteria(target.criteria);

  const [updated] = await prisma.$transaction([
    prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        status,
        contentUpdatedAt: new Date(),
        reviewNotes,
        criteria:
          status === 'approved'
            ? {
                ...criteria,
                performance: true,
                controls: true,
                adSafety: true,
                rights: true
              }
            : criteria
      }
    }),
    prisma.submissionReview.create({
      data: {
        submissionId,
        action: status,
        note: reviewNote,
        reviewerName
      }
    })
  ]);

  return mapDbSubmissionToSubmission(updated);
}

export async function addSubmissionReviewNote(
  submissionId: string,
  reviewNote: string,
  reviewerName = 'Internal Ops'
) {
  const target = await prisma.submission.findUnique({
    where: {
      id: submissionId
    }
  });

  if (!target) {
    return undefined;
  }

  const [updated] = await prisma.$transaction([
    prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        contentUpdatedAt: new Date(),
        reviewNotes: [reviewNote, ...target.reviewNotes]
      }
    }),
    prisma.submissionReview.create({
      data: {
        submissionId,
        action: 'add_note',
        note: reviewNote,
        reviewerName
      }
    })
  ]);

  return mapDbSubmissionToSubmission(updated);
}

export async function updateRuntimeSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  reviewNote?: string,
  reviewerName?: string
) {
  return updateSubmissionStatus(submissionId, status, reviewNote, reviewerName);
}

async function getUniqueGameSlug(title: string) {
  const baseSlug = slugifyTitle(title);
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.game.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createGameDraftFromSubmission(
  submissionId: string,
  reviewerName = 'Internal Ops'
): Promise<PublishingMutationResult> {
  const row = await prisma.submission.findUnique({
    where: {
      id: submissionId
    },
    include: submissionInclude
  });

  if (!row) {
    return {
      ok: false,
      code: 'submission_not_found',
      message: 'Submission not found.',
      issues: ['Submission not found.']
    };
  }

  const submission = mapDbSubmissionToSubmission(row);
  const readiness = getSubmissionPublishingReadiness(submission, submission.publishedGameId);

  if (!readiness.eligible) {
    return {
      ok: false,
      code: 'submission_not_publishable',
      message: 'Submission is not ready to become a game draft.',
      issues: readiness.issues.map((issue) => issue.message)
    };
  }

  const slug = await getUniqueGameSlug(submission.title);
  const draftGame = buildDraftGameFromSubmission(submission, slug);
  const gameData = mapGameToDbData(draftGame);
  const note = `Game draft ${draftGame.slug} created from approved submission.`;

  const [created] = await prisma.$transaction([
    prisma.game.create({
      data: gameData,
      include: gameInclude
    }),
    prisma.submission.update({
      where: {
        id: submission.id
      },
      data: {
        publishingStatus: 'draft_created',
        publishingNotes: [note, ...(submission.publishingNotes ?? [])],
        contentUpdatedAt: new Date(),
        mediaAssets: {
          updateMany: {
            where: {
              gameId: null
            },
            data: {
              gameId: draftGame.id
            }
          }
        }
      }
    }),
    prisma.submissionReview.create({
      data: {
        submissionId: submission.id,
        action: 'draft_created',
        note,
        reviewerName
      }
    })
  ]);

  return {
    ok: true,
    game: mapDbGameToGame(created),
    message: note
  };
}

export async function updateGamePublishingState(input: {
  gameId: string;
  action: Extract<
    PublishingAction,
    | 'publish_game'
    | 'unpublish_game'
    | 'save_game_draft'
    | 'promote_featured'
    | 'mark_sponsored_eligible'
  >;
  featuredPriority?: number;
  sponsoredPriority?: number;
  reviewNote?: string;
  reviewerName?: string;
}): Promise<PublishingMutationResult> {
  const row = await prisma.game.findUnique({
    where: {
      id: input.gameId
    },
    include: gameInclude
  });

  if (!row) {
    return {
      ok: false,
      code: 'game_not_found',
      message: 'Game not found.',
      issues: ['Game not found.']
    };
  }

  const game = mapDbGameToGame(row);
  const now = new Date();
  const note =
    input.reviewNote?.trim() || `Publishing action ${input.action.replaceAll('_', ' ')} saved.`;

  if (input.action === 'publish_game') {
    const readiness = getGamePublishingReadiness(game);

    if (!readiness.eligible) {
      return {
        ok: false,
        code: 'game_not_publishable',
        message: 'Game is blocked from public publishing.',
        issues: readiness.issues.map((issue) => issue.message)
      };
    }
  }

  if (input.action === 'mark_sponsored_eligible' && !game.adSafe) {
    return {
      ok: false,
      code: 'game_not_ad_safe',
      message: 'Only ad-safe games can be marked sponsored eligible.',
      issues: ['Game must be ad safe before sponsored eligibility is enabled.']
    };
  }

  const gamePatch =
    input.action === 'publish_game'
      ? {
          status: 'published',
          visibility: 'public',
          publishAt: now,
          unpublishAt: null,
          isNew: true
        }
      : input.action === 'unpublish_game'
        ? {
            status: 'draft',
            visibility: 'internal',
            unpublishAt: now
          }
        : input.action === 'save_game_draft'
          ? {
              status: 'draft',
              visibility: 'internal',
              publishAt: null
            }
          : input.action === 'promote_featured'
            ? {
                isFeatured: true,
                featuredPriority: Math.max(1, input.featuredPriority ?? game.featuredPriority ?? 80)
              }
            : {
                isSponsored: true,
                sponsoredPriority: Math.max(
                  1,
                  input.sponsoredPriority ?? game.sponsoredPriority ?? 60
                )
              };

  const submissionPatch =
    game.sourceSubmissionId && input.action === 'publish_game'
      ? {
          publishingStatus: 'published',
          publishedAt: now,
          publishingNotes: [note]
        }
      : game.sourceSubmissionId &&
          (input.action === 'unpublish_game' || input.action === 'save_game_draft')
        ? {
            publishingStatus: 'draft_created',
            publishedAt: null,
            publishingNotes: [note]
          }
        : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedGame = await tx.game.update({
      where: {
        id: game.id
      },
      data: {
        ...gamePatch,
        contentUpdatedAt: now,
        reviewNotes: [note, ...game.reviewNotes]
      },
      include: gameInclude
    });

    if (game.sourceSubmissionId && submissionPatch) {
      const existingSubmission = await tx.submission.findUnique({
        where: {
          id: game.sourceSubmissionId
        }
      });

      await tx.submission.update({
        where: {
          id: game.sourceSubmissionId
        },
        data: {
          ...submissionPatch,
          publishingNotes: [
            ...(submissionPatch.publishingNotes ?? []),
            ...(existingSubmission?.publishingNotes ?? [])
          ],
          contentUpdatedAt: now
        }
      });

      await tx.submissionReview.create({
        data: {
          submissionId: game.sourceSubmissionId,
          action: input.action,
          note,
          reviewerName: input.reviewerName
        }
      });
    }

    return updatedGame;
  });

  return {
    ok: true,
    game: mapDbGameToGame(updated),
    message: note
  };
}

export async function updateGameAdminFields(gameId: string, patch: GameAdminPatch = {}) {
  const existing = await prisma.game.findUnique({
    where: {
      id: gameId
    }
  });

  if (!existing) {
    return undefined;
  }

  const { collectionIds, ...fieldPatch } = patch;
  const data = {
    ...fieldPatch,
    collections: collectionIds
      ? {
          deleteMany: {},
          create: collectionIds.map((collectionId, position) => ({
            collectionId,
            position
          }))
        }
      : undefined
  };

  const updated = await prisma.game.update({
    where: {
      id: gameId
    },
    data,
    include: gameInclude
  });

  return mapDbGameToGame(updated);
}

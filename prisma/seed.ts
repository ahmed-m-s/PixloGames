import 'dotenv/config';
import { prisma } from '@/lib/db/prisma';
import {
  mapCollectionToDbData,
  mapGameToDbData,
  mapSubmissionToDbData
} from '@/lib/repositories/prisma-mappers';
import { hashPassword } from '@/lib/auth/password';
import { gameCollections } from '@/data/collections';
import { games } from '@/data/games';
import { gameSubmissions } from '@/data/submissions';

const stalePreviewGameSlugs = [
  'rocket-rivals',
  'neon-driftline',
  'shadow-sprint',
  'tile-tempo',
  'cabinet-clash',
  'orbit-raiders',
  'crypt-circuits',
  'forest-runner',
  'goalstorm',
  'micro-mayhem',
  'battle-bounce',
  'skyforge-quest'
] as const;

async function deleteStalePreviewGames() {
  const result = await prisma.game.deleteMany({
    where: {
      slug: {
        in: [...stalePreviewGameSlugs]
      }
    }
  });

  console.log(
    `Removed ${result.count} stale preview-entry games matching known slugs: ${stalePreviewGameSlugs.join(
      ', '
    )}.`
  );
}

async function seedGames() {
  for (const game of games) {
    const data = mapGameToDbData(game);

    await prisma.game.upsert({
      where: {
        id: game.id
      },
      create: data,
      update: data
    });
  }
}

async function seedCollections() {
  for (const collection of gameCollections) {
    const data = mapCollectionToDbData(collection);

    await prisma.collection.upsert({
      where: {
        id: collection.id
      },
      create: data,
      update: data
    });
  }

  await prisma.gameCollectionMembership.deleteMany({});

  for (const collection of gameCollections) {
    if (collection.gameIds.length === 0) {
      continue;
    }

    await prisma.gameCollectionMembership.createMany({
      data: collection.gameIds.map((gameId, position) => ({
        gameId,
        collectionId: collection.id,
        position
      })),
      skipDuplicates: true
    });
  }
}

async function seedSubmissions() {
  for (const submission of gameSubmissions) {
    const data = mapSubmissionToDbData(submission);

    await prisma.submission.upsert({
      where: {
        id: submission.id
      },
      create: data,
      update: data
    });
  }
}

async function seedAdPlacements() {
  const placements = [
    {
      id: 'ad-homepage-inline',
      placementKey: 'homepage-inline',
      label: 'Homepage Inline',
      enabled: false,
      sponsoredOnly: false
    },
    {
      id: 'ad-between-section',
      placementKey: 'between-section',
      label: 'Between Section',
      enabled: false,
      sponsoredOnly: false
    },
    {
      id: 'ad-game-sidebar',
      placementKey: 'game-sidebar',
      label: 'Game Page Sidebar',
      enabled: false,
      sponsoredOnly: true
    }
  ];

  for (const placement of placements) {
    await prisma.adPlacement.upsert({
      where: {
        id: placement.id
      },
      create: placement,
      update: placement
    });
  }
}

async function seedInternalUsers() {
  const email = (process.env.PIXLO_INTERNAL_ADMIN_EMAIL ?? 'admin@pixlogames.local')
    .trim()
    .toLowerCase();
  const password = process.env.PIXLO_INTERNAL_ADMIN_PASSWORD ?? 'pixlo-admin-dev';

  await prisma.internalUser.upsert({
    where: {
      email
    },
    create: {
      email,
      name: 'Pixlo Admin',
      role: 'admin',
      passwordHash: hashPassword(password),
      active: true
    },
    update: {
      name: 'Pixlo Admin',
      role: 'admin',
      active: true
    }
  });
}

async function main() {
  await deleteStalePreviewGames();
  await seedGames();
  await seedCollections();
  await seedSubmissions();
  await seedAdPlacements();
  await seedInternalUsers();

  const [gameCount, collectionCount, submissionCount, internalUserCount] = await Promise.all([
    prisma.game.count(),
    prisma.collection.count(),
    prisma.submission.count(),
    prisma.internalUser.count()
  ]);

  console.log(
    `Seed complete: ${gameCount} games, ${collectionCount} collections, ${submissionCount} submissions, ${internalUserCount} internal users.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

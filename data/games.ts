import type { Game, GameCategory } from '@/types/game';
import { applyProvidedGamePageContent } from '@/data/game-page-content';
import { prepareGameContent, type GameContentInput } from '@/lib/content';
import { GAME_DISTRIBUTION_PROVIDER_NAME } from '@/lib/game-distribution';
import { createLocalHtml5Game } from '@/lib/game-ingestion';

export type CategoryInfo = {
  name: GameCategory;
  slug: string;
  description: string;
  accent: 'brand' | 'ember' | 'sun' | 'aqua';
};

export const categories: CategoryInfo[] = [
  {
    name: 'Action',
    slug: 'action',
    description: 'Fast reflex games with immediate pressure.',
    accent: 'ember'
  },
  {
    name: 'Racing',
    slug: 'racing',
    description: 'Time trials, street runs, and drift battles.',
    accent: 'sun'
  },
  {
    name: 'Puzzle',
    slug: 'puzzle',
    description: 'Sharp logic games for quick wins.',
    accent: 'aqua'
  },
  {
    name: 'Adventure',
    slug: 'adventure',
    description: 'Exploration-led worlds built for discovery.',
    accent: 'brand'
  },
  {
    name: 'Multiplayer',
    slug: 'multiplayer',
    description: 'Jump into co-op and versus sessions.',
    accent: 'aqua'
  },
  {
    name: 'Shooting',
    slug: 'shooting',
    description: 'Aim-first challenges with arcade pacing.',
    accent: 'ember'
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Skill shots, tournaments, and quick matches.',
    accent: 'sun'
  },
  {
    name: 'Arcade',
    slug: 'arcade',
    description: 'Readable rules, deep replay loops.',
    accent: 'brand'
  },
  {
    name: 'Casual',
    slug: 'casual',
    description: 'Relaxed browser games with friendly controls and quick starts.',
    accent: 'aqua'
  },
  {
    name: 'Management',
    slug: 'management',
    description: 'Shop, idle, and resource games built around smart upgrades.',
    accent: 'sun'
  }
];

type GameDistributionCategorySlug =
  | 'mahjong'
  | 'match-3'
  | 'sudoku'
  | 'word'
  | 'physics'
  | 'idle'
  | 'merge'
  | 'cooking'
  | 'restaurant'
  | 'runner'
  | 'jumping'
  | 'stack'
  | 'bubble-shooter'
  | 'racing';

type GameDistributionRegistration = {
  title: string;
  categorySlug: GameDistributionCategorySlug;
  url: string;
};

const gameDistributionCategoryMap: Record<GameDistributionCategorySlug, GameCategory> = {
  mahjong: 'Puzzle',
  'match-3': 'Puzzle',
  sudoku: 'Puzzle',
  word: 'Puzzle',
  physics: 'Arcade',
  idle: 'Management',
  merge: 'Puzzle',
  cooking: 'Casual',
  restaurant: 'Management',
  runner: 'Arcade',
  jumping: 'Arcade',
  stack: 'Arcade',
  'bubble-shooter': 'Puzzle',
  racing: 'Racing'
};

const gameDistributionRegistrations: GameDistributionRegistration[] = [
  {
    title: 'Mojicon Spring Connect',
    categorySlug: 'mahjong',
    url: 'https://gamedistribution.com/games/mojicon-spring-connect/'
  },
  {
    title: 'Mahjong Solitaire Zodiac',
    categorySlug: 'mahjong',
    url: 'https://gamedistribution.com/games/mahjong-solitaire-zodiac/'
  },
  {
    title: 'Fruit Mahjong 3D',
    categorySlug: 'mahjong',
    url: 'https://gamedistribution.com/games/fruit-mahjong-3d/'
  },
  {
    title: 'Stickman Jewel Match 3 Master',
    categorySlug: 'match-3',
    url: 'https://gamedistribution.com/games/stickman-jewel-match-3-master/'
  },
  {
    title: 'Candy Riddles Free Match 3 Puzzle',
    categorySlug: 'match-3',
    url: 'https://gamedistribution.com/games/candy-riddles-free-match-3-puzzle/'
  },
  {
    title: 'Gem Match Deluxe',
    categorySlug: 'match-3',
    url: 'https://gamedistribution.com/games/gem-match-deluxe/'
  },
  {
    title: 'New Daily Sudoku',
    categorySlug: 'sudoku',
    url: 'https://gamedistribution.com/games/new-daily-sudoku/'
  },
  {
    title: 'Sudoku Master',
    categorySlug: 'sudoku',
    url: 'https://gamedistribution.com/games/sudoku-master-1/'
  },
  {
    title: 'Word Connect',
    categorySlug: 'word',
    url: 'https://gamedistribution.com/games/word-connect/'
  },
  {
    title: 'Word Search 3',
    categorySlug: 'word',
    url: 'https://gamedistribution.com/games/word-search-3/'
  },
  {
    title: 'Super Stickman Sling',
    categorySlug: 'physics',
    url: 'https://gamedistribution.com/games/super-stickman-sling/'
  },
  {
    title: 'Rescue Boss Cut Rope',
    categorySlug: 'physics',
    url: 'https://gamedistribution.com/games/rescue-boss-cut-rope/'
  },
  {
    title: 'Idle Mining Empire',
    categorySlug: 'idle',
    url: 'https://gamedistribution.com/games/idle-mining-empire/'
  },
  {
    title: 'Cinema Empire Idle Tycoon',
    categorySlug: 'idle',
    url: 'https://gamedistribution.com/games/cinema-empire-idle-tycoon/'
  },
  {
    title: '2048 Merge World',
    categorySlug: 'merge',
    url: 'https://gamedistribution.com/games/2048-merge-world/'
  },
  {
    title: 'Top Burger Cooking',
    categorySlug: 'cooking',
    url: 'https://gamedistribution.com/games/top-burger-cooking/'
  },
  {
    title: 'Pizza Maker',
    categorySlug: 'cooking',
    url: 'https://gamedistribution.com/games/pizza-maker-1/'
  },
  {
    title: 'Idle Restaurant Tycoon',
    categorySlug: 'restaurant',
    url: 'https://gamedistribution.com/games/idle-restaurant-tycoon/'
  },
  {
    title: 'Stickman Run',
    categorySlug: 'runner',
    url: 'https://gamedistribution.com/games/stickman-run/'
  },
  {
    title: 'Stick Hero',
    categorySlug: 'jumping',
    url: 'https://gamedistribution.com/games/stick-hero/'
  },
  {
    title: 'Stack Tower',
    categorySlug: 'stack',
    url: 'https://gamedistribution.com/games/stack-tower-1/'
  },
  {
    title: 'Bubble Shooter Classic Match 3 Pop Bubbles',
    categorySlug: 'bubble-shooter',
    url: 'https://gamedistribution.com/games/bubble-shooter-classic-match-3-pop-bubbles/'
  },
  {
    title: 'Bubble Pop Fairyland',
    categorySlug: 'bubble-shooter',
    url: 'https://gamedistribution.com/games/bubble-pop-fairyland/'
  },
  {
    title: 'Bubble Pop Butterfly',
    categorySlug: 'bubble-shooter',
    url: 'https://gamedistribution.com/games/bubble-pop-butterfly/'
  },
  {
    title: 'Drift Boss',
    categorySlug: 'racing',
    url: 'https://gamedistribution.com/games/drift-boss/'
  },
  {
    title: 'Parking Fury 3D',
    categorySlug: 'racing',
    url: 'https://gamedistribution.com/games/parking-fury-3d/'
  }
];

function slugifyGameTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createGameDistributionGame(input: GameDistributionRegistration): GameContentInput {
  const slug = slugifyGameTitle(input.title);
  const category = gameDistributionCategoryMap[input.categorySlug];

  return {
    id: `game-${slug}`,
    slug,
    title: input.title,
    shortDescription: `Play ${input.title} on PixloGames through GameDistribution.`,
    description: `${input.title} is a remote GameDistribution HTML5 game in the ${input.categorySlug} category, embedded for browser play on PixloGames through a sandboxed third-party iframe.`,
    thumbnail: '/games/game-distribution/assets/thumbnail.svg',
    coverImage: '/games/game-distribution/assets/cover.svg',
    category,
    tags: Array.from(new Set([input.categorySlug, category.toLowerCase(), 'gamedistribution'])),
    rating: 0,
    plays: 0,
    isNew: true,
    isTrending: false,
    isMultiplayer: false,
    isEditorsPick: false,
    embedUrl: input.url,
    controls: {
      keyboard: [],
      mouse: true,
      touch: true
    },
    mobileSupported: true,
    developerName: GAME_DISTRIBUTION_PROVIDER_NAME,
    publisherName: GAME_DISTRIBUTION_PROVIDER_NAME,
    releaseDate: '2026-05-11',
    updatedAt: '2026-05-11',
    supportedPlatforms: ['desktop', 'mobile', 'tablet'],
    orientation: 'responsive',
    difficulty: 'medium',
    seoTitle: input.title,
    seoDescription: `Play ${input.title} on PixloGames through GameDistribution.`,
    contentRating: 'Everyone',
    featuredWeight: 0,
    isFeatured: false,
    isSponsored: false,
    adSafe: true,
    status: 'published',
    playMode: 'single-player',
    hasRealEmbed: true,
    embedType: 'external-provider',
    source: {
      mode: 'embedded',
      embedType: 'external-provider',
      providerName: GAME_DISTRIBUTION_PROVIDER_NAME,
      url: input.url,
      message: 'Playable GameDistribution embed.'
    },
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: ['Registered from the provided GameDistribution catalog URL.'],
    featuredPriority: 0,
    sponsoredPriority: 0,
    collectionIds: [],
    visibility: 'public',
    publishAt: '2026-05-11',
    sourceOrigin: 'publisher_feed',
    ingestionWarnings: [],
    qaStatus: 'passed'
  };
}

const gameDistributionGames = gameDistributionRegistrations.map(createGameDistributionGame);

const gameContentInputs: GameContentInput[] = [
  {
    id: 'game-endless-runner',
    slug: 'endless-runner',
    title: 'Endless Runner',
    shortDescription: 'Jump cleanly, dodge fast obstacles, and survive as the pace keeps climbing.',
    description:
      'A polished HTML5 endless runner built for quick browser sessions. Time your jumps, stay ahead of the speed curve, and chase a better best score on desktop, tablet, or phone.',
    thumbnail: '/games/endless-runner/assets/thumbnail.jpg',
    coverImage: '/games/endless-runner/assets/cover.svg',
    category: 'Arcade',
    tags: ['runner', 'jump', 'endless', 'reflex', 'mobile'],
    rating: 0,
    plays: 0,
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: '/games/endless-runner/index.html',
    controls: {
      keyboard: ['Arrow Up'],
      mouse: true,
      touch: true
    },
    mobileSupported: true,
    developerName: 'PixloGames Lab',
    publisherName: 'PixloGames',
    releaseDate: '2026-04-20',
    updatedAt: '2026-04-20',
    supportedPlatforms: ['desktop', 'mobile', 'tablet'],
    orientation: 'landscape',
    contentRating: 'Everyone',
    featuredWeight: 145,
    isFeatured: true,
    isSponsored: false,
    adSafe: true,
    status: 'published',
    playMode: 'single-player',
    hasRealEmbed: true,
    embedType: 'html5-package',
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: ['First-party HTML5 package verified for iframe play and mobile tap controls.'],
    featuredPriority: 145,
    sponsoredPriority: 0,
    collectionIds: [
      'collection-trending-now',
      'collection-new-releases',
      'collection-editors-picks'
    ],
    visibility: 'public',
    publishAt: '2026-04-20',
    sourceOrigin: 'first_party',
    ingestionWarnings: [],
    qaStatus: 'passed'
  },
  {
    id: 'game-memory-match',
    slug: 'memory-match',
    title: 'Memory Match',
    shortDescription: 'Flip polished cards, remember each symbol, and clear the board fast.',
    description:
      'A clean HTML5 memory game built around quick pattern recognition, smooth card flips, and satisfying short-session mastery. Match every pair on the 4x4 board while chasing fewer moves and a faster best time.',
    thumbnail: '/games/memory-match/assets/thumbnail.jpg',
    coverImage: '/games/memory-match/assets/cover.svg',
    category: 'Puzzle',
    tags: ['memory', 'match', 'cards', 'casual', 'logic', 'mobile'],
    rating: 0,
    plays: 0,
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: '/games/memory-match/index.html',
    controls: {
      keyboard: [],
      mouse: true,
      touch: true
    },
    mobileSupported: true,
    developerName: 'PixloGames Lab',
    publisherName: 'PixloGames',
    releaseDate: '2026-04-20',
    updatedAt: '2026-04-20',
    supportedPlatforms: ['desktop', 'mobile', 'tablet'],
    orientation: 'responsive',
    difficulty: 'easy',
    seoTitle: 'Memory Match - Play a Polished HTML5 Card Matching Game',
    seoDescription:
      'Play Memory Match on PixloGames. Flip cards, find pairs, track moves and time, and beat your best result in this polished mobile-ready HTML5 puzzle game.',
    contentRating: 'Everyone',
    featuredWeight: 132,
    isFeatured: true,
    isSponsored: false,
    adSafe: true,
    status: 'published',
    playMode: 'single-player',
    hasRealEmbed: true,
    embedType: 'html5-package',
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: [
      'First-party HTML5 package verified for iframe play, touch input, and local best-time persistence.'
    ],
    featuredPriority: 132,
    sponsoredPriority: 0,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now'
    ],
    visibility: 'public',
    publishAt: '2026-04-20',
    sourceOrigin: 'first_party',
    ingestionWarnings: [],
    qaStatus: 'passed'
  },
  {
    id: 'game-block-puzzle',
    slug: 'block-puzzle',
    title: 'Block Puzzle',
    shortDescription: 'Place clever block pieces, clear rows and columns, and keep the grid alive.',
    description:
      'A polished HTML5 block puzzle built around thoughtful placement, clean line clears, and satisfying score-chasing. Select one of three pieces, fit it onto the 8x8 board, and clear full rows or columns before the grid locks up.',
    thumbnail: '/games/block-puzzle/assets/thumbnail.jpg',
    coverImage: '/games/block-puzzle/assets/cover.svg',
    category: 'Puzzle',
    tags: ['block', 'puzzle', 'grid', 'logic', 'casual', 'mobile'],
    rating: 0,
    plays: 0,
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: '/games/block-puzzle/index.html',
    controls: {
      keyboard: [],
      mouse: true,
      touch: true
    },
    mobileSupported: true,
    developerName: 'PixloGames Lab',
    publisherName: 'PixloGames',
    releaseDate: '2026-04-21',
    updatedAt: '2026-04-21',
    supportedPlatforms: ['desktop', 'mobile', 'tablet'],
    orientation: 'responsive',
    difficulty: 'medium',
    seoTitle: 'Block Puzzle - Play a Polished HTML5 Grid Puzzle Game',
    seoDescription:
      'Play Block Puzzle on PixloGames. Place pieces, clear rows and columns, build combos, and chase your best score in this mobile-ready HTML5 puzzle game.',
    contentRating: 'Everyone',
    featuredWeight: 126,
    isFeatured: true,
    isSponsored: false,
    adSafe: true,
    status: 'published',
    playMode: 'single-player',
    hasRealEmbed: true,
    embedType: 'html5-package',
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: [
      'First-party HTML5 package verified for iframe play, tap placement, scoring, and local best-score persistence.'
    ],
    featuredPriority: 126,
    sponsoredPriority: 0,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now'
    ],
    visibility: 'public',
    publishAt: '2026-04-21',
    sourceOrigin: 'first_party',
    ingestionWarnings: [],
    qaStatus: 'passed'
  },
  {
    id: 'game-number-merge',
    slug: 'number-merge',
    title: 'Number Merge',
    shortDescription:
      'Slide number tiles, chain clean merges, and build toward a bigger board score.',
    description:
      'A polished HTML5 number puzzle inspired by classic merge play. Use arrow keys, WASD, or mobile swipes to move every tile, combine matching values, chase the 2048 milestone, and keep the 4x4 board alive for as long as you can.',
    thumbnail: '/games/number-merge/assets/thumbnail.jpg',
    coverImage: '/games/number-merge/assets/cover.svg',
    category: 'Puzzle',
    tags: ['numbers', 'merge', '2048-style', 'logic', 'casual', 'mobile'],
    rating: 0,
    plays: 0,
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: '/games/number-merge/index.html',
    controls: {
      keyboard: ['Arrow keys', 'WASD'],
      touch: true
    },
    mobileSupported: true,
    developerName: 'PixloGames Lab',
    publisherName: 'PixloGames',
    releaseDate: '2026-04-21',
    updatedAt: '2026-04-21',
    supportedPlatforms: ['desktop', 'mobile', 'tablet'],
    orientation: 'responsive',
    difficulty: 'medium',
    seoTitle: 'Number Merge - Play a Polished 2048-Style HTML5 Puzzle Game',
    seoDescription:
      'Play Number Merge on PixloGames. Slide tiles, combine matching numbers, chase the 2048 milestone, and beat your best score in this mobile-ready HTML5 puzzle game.',
    contentRating: 'Everyone',
    featuredWeight: 122,
    isFeatured: true,
    isSponsored: false,
    adSafe: true,
    status: 'published',
    playMode: 'single-player',
    hasRealEmbed: true,
    embedType: 'html5-package',
    submissionStatus: 'approved',
    moderationStatus: 'approved',
    reviewNotes: [
      'First-party HTML5 package verified for iframe play, keyboard input, swipe controls, and local best-score persistence.'
    ],
    featuredPriority: 122,
    sponsoredPriority: 0,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now'
    ],
    visibility: 'public',
    publishAt: '2026-04-21',
    sourceOrigin: 'first_party',
    ingestionWarnings: [],
    qaStatus: 'passed'
  },
  createLocalHtml5Game({
    slug: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    thumbnail: '/games/tic-tac-toe/assets/thumbnail.jpg',
    shortDescription:
      'Play a clean local duel, claim three squares, and reset instantly for another round.',
    description:
      'A polished HTML5 Tic Tac Toe game for fast local two-player sessions. Take turns placing X and O, track local wins and draws, and restart quickly from a responsive board built for mouse and touch.',
    category: 'Puzzle',
    tags: ['tic tac toe', 'strategy', 'board', 'logic', 'casual', 'mobile'],
    rating: 0,
    plays: 0,
    isTrending: false,
    isEditorsPick: true,
    controls: {
      keyboard: [],
      mouse: true,
      touch: true
    },
    instructions: [
      'Tap or click an open square to place your mark.',
      'X moves first.',
      'Connect three marks in a row to win the round.'
    ],
    difficulty: 'easy',
    orientation: 'responsive',
    releaseDate: '2026-04-21',
    featuredWeight: 140,
    featuredPriority: 140,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-seasonal-picks'
    ],
    seoTitle: 'Tic Tac Toe - Play a Polished HTML5 Board Game',
    seoDescription:
      'Play Tic Tac Toe on PixloGames. Place X and O, connect three marks, track local wins, and enjoy a clean mobile-ready HTML5 board game.'
  }),
  createLocalHtml5Game({
    slug: 'flappy-flight',
    title: 'Flappy Flight',
    thumbnail: '/games/flappy-flight/assets/thumbnail.jpg',
    shortDescription: 'Tap to flap, thread neon gates, and chase a cleaner high-score run.',
    description:
      'A lightweight flappy-style HTML5 arcade game with smooth canvas motion, responsive jump input, local best score tracking, and quick restart loops for instant browser play.',
    category: 'Arcade',
    tags: ['flappy', 'flight', 'arcade', 'tap', 'reflex', 'mobile'],
    rating: 0,
    plays: 0,
    isTrending: true,
    isEditorsPick: true,
    controls: {
      keyboard: ['Space', 'Arrow Up', 'W'],
      mouse: true,
      touch: true
    },
    instructions: [
      'Press Space, Arrow Up, W, click, or tap to flap.',
      'Thread each gate without touching pipes.',
      'Survive longer to raise your score.'
    ],
    difficulty: 'medium',
    orientation: 'landscape',
    releaseDate: '2026-04-21',
    featuredWeight: 138,
    featuredPriority: 138,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now'
    ],
    seoTitle: 'Flappy Flight - Play a Fast HTML5 Arcade Game',
    seoDescription:
      'Play Flappy Flight on PixloGames. Tap or press to flap, thread neon gates, and chase your best score in a mobile-ready HTML5 arcade game.'
  }),
  createLocalHtml5Game({
    slug: 'color-sort',
    title: 'Color Sort',
    thumbnail: '/games/color-sort/assets/thumbnail.jpg',
    shortDescription: 'Pour stacked colors into matching tubes and solve each clean logic puzzle.',
    description:
      'A polished HTML5 color sorting puzzle with simple tap-to-pour controls, readable tubes, valid move rules, win detection, and local best move tracking for quick logic sessions.',
    category: 'Puzzle',
    tags: ['color sort', 'sorting', 'logic', 'puzzle', 'casual', 'mobile'],
    rating: 0,
    plays: 0,
    isTrending: true,
    isEditorsPick: true,
    controls: {
      keyboard: [],
      mouse: true,
      touch: true
    },
    instructions: [
      'Select a tube to pour from.',
      'Pour into an empty tube or onto the same top color.',
      'Solve the puzzle by grouping each color into its own tube.'
    ],
    difficulty: 'medium',
    orientation: 'responsive',
    releaseDate: '2026-04-21',
    featuredWeight: 136,
    featuredPriority: 136,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now',
      'collection-seasonal-picks'
    ],
    seoTitle: 'Color Sort - Play a Polished HTML5 Sorting Puzzle',
    seoDescription:
      'Play Color Sort on PixloGames. Pour colors between tubes, solve each stack, and improve your best move count in a mobile-ready HTML5 puzzle.'
  }),
  createLocalHtml5Game({
    slug: '2048',
    title: '2048',
    thumbnail: '/games/2048/assets/thumbnail.jpg',
    shortDescription: 'Slide numbered tiles, merge matching values, and keep the board alive.',
    description:
      'A clean browser-ready 2048 puzzle built for quick logic sessions. Use arrow keys, WASD, or mobile swipes to slide every tile, merge matching numbers, and chase a bigger score before the board fills up.',
    category: 'Puzzle',
    tags: ['2048', 'numbers', 'merge', 'logic', 'puzzle', 'mobile'],
    rating: 0,
    plays: 0,
    isTrending: true,
    isEditorsPick: true,
    controls: {
      keyboard: ['Arrow keys', 'WASD'],
      touch: true
    },
    instructions: [
      'Use arrow keys or WASD to slide every tile.',
      'Swipe on touch screens.',
      'Matching numbers merge into the next value.'
    ],
    difficulty: 'medium',
    releaseDate: '2026-04-21',
    featuredWeight: 118,
    featuredPriority: 118,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now'
    ],
    seoTitle: '2048 - Play a Fast HTML5 Number Merge Puzzle',
    seoDescription:
      'Play 2048 on PixloGames. Slide tiles, merge matching numbers, and chase your best score in a fast mobile-ready HTML5 puzzle.'
  }),
  createLocalHtml5Game({
    slug: 'snake',
    title: 'Snake',
    thumbnail: '/games/snake/assets/thumbnail.jpg',
    shortDescription:
      'Guide the neon snake, collect pickups, and survive without hitting yourself.',
    description:
      'A polished HTML5 Snake game with crisp keyboard controls, swipe support, local best score tracking, and a compact arcade loop that works cleanly inside the PixloGames player.',
    category: 'Arcade',
    tags: ['snake', 'arcade', 'classic', 'reflex', 'mobile'],
    rating: 0,
    plays: 0,
    isTrending: true,
    isEditorsPick: false,
    controls: {
      keyboard: ['Arrow keys', 'WASD'],
      touch: true
    },
    instructions: [
      'Use arrow keys or WASD to steer.',
      'Swipe on touch screens.',
      'Collect food and avoid walls or your own tail.'
    ],
    difficulty: 'easy',
    orientation: 'responsive',
    releaseDate: '2026-04-21',
    featuredWeight: 108,
    featuredPriority: 108,
    collectionIds: ['collection-new-releases', 'collection-trending-now'],
    seoTitle: 'Snake - Play a Polished HTML5 Arcade Classic',
    seoDescription:
      'Play Snake on PixloGames. Steer, collect pickups, grow longer, and beat your best score in a fast browser arcade game.'
  }),
  createLocalHtml5Game({
    slug: 'brick-breaker',
    title: 'Brick Breaker',
    thumbnail: '/games/brick-breaker/assets/thumbnail.jpg',
    shortDescription: 'Bounce the ball, clear bright brick walls, and keep the rally alive.',
    description:
      'A lightweight HTML5 Brick Breaker with smooth paddle control, satisfying clears, local best score tracking, and desktop plus touch support for instant arcade sessions.',
    category: 'Arcade',
    tags: ['brick breaker', 'arcade', 'paddle', 'ball', 'classic', 'mobile'],
    rating: 0,
    plays: 0,
    isTrending: false,
    isEditorsPick: true,
    controls: {
      keyboard: ['Arrow keys', 'Space'],
      mouse: true,
      touch: true
    },
    instructions: [
      'Move with arrow keys, mouse, or touch.',
      'Press Space or tap to launch the ball.',
      'Clear every brick without losing all lives.'
    ],
    difficulty: 'medium',
    orientation: 'landscape',
    releaseDate: '2026-04-21',
    featuredWeight: 106,
    featuredPriority: 106,
    collectionIds: ['collection-new-releases', 'collection-editors-picks'],
    seoTitle: 'Brick Breaker - Play a Fast HTML5 Arcade Game',
    seoDescription:
      'Play Brick Breaker on PixloGames. Move the paddle, launch the ball, clear bricks, and chase your best score in a lightweight HTML5 arcade game.'
  }),
  createLocalHtml5Game({
    slug: 'panda-mart',
    assetBasePath: '/playable-games',
    title: 'Panda Mart',
    thumbnail: '/playable-games/panda-mart/assets/thumbnail.jpg',
    shortDescription:
      'Run a cozy bamboo shop, stock shelves, serve guests, and upgrade your tiny forest mart.',
    description:
      'Run a cozy bamboo shop, collect fresh bamboo, stock shelves, help forest customers check out, and spend coins on upgrades that make each shift smoother.',
    category: 'Management',
    tags: ['Management', 'Idle', 'Cute', 'Panda', 'Shop', 'Casual'],
    rating: 0,
    plays: 0,
    isTrending: true,
    isEditorsPick: true,
    controls: {
      keyboard: ['WASD', 'Arrow keys', 'E', 'Space'],
      mouse: true,
      touch: true
    },
    instructions: [
      'Move with WASD or Arrow Keys.',
      'Press E or Space near the bamboo garden to collect stock.',
      'Press E or Space near the shelf to restock it for customers.',
      'Use coins from sales to upgrade carry capacity, walk speed, and shelf capacity.'
    ],
    difficulty: 'easy',
    orientation: 'responsive',
    releaseDate: '2026-04-25',
    featuredWeight: 142,
    featuredPriority: 142,
    collectionIds: [
      'collection-new-releases',
      'collection-editors-picks',
      'collection-trending-now'
    ],
    seoTitle: 'Panda Mart - Play a Cozy HTML5 Shop Management Game',
    seoDescription:
      'Play Panda Mart on PixloGames. Collect bamboo, stock shelves, serve forest customers, and upgrade a tiny mobile-ready shop management game.'
  }),
  ...gameDistributionGames
];

export const games: Game[] = prepareGameContent(applyProvidedGamePageContent(gameContentInputs));

export const trendingGames = games.filter((game) => game.isTrending).slice(0, 6);
export const newGames = games.filter((game) => game.isNew).slice(0, 6);
export const popularGames = [...games].sort((a, b) => b.plays - a.plays).slice(0, 8);
export const multiplayerGames = games.filter((game) => game.isMultiplayer).slice(0, 6);
export const editorsPickGames = games.filter((game) => game.isEditorsPick).slice(0, 5);
export const heroGame = games[0];
export const heroSideGames = [games[4], games[6], games[1]];

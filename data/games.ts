import type { Game, GameCategory } from '@/types/game';
import { prepareGameContent } from '@/lib/content';
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
    name: 'Management',
    slug: 'management',
    description: 'Shop, idle, and resource games built around smart upgrades.',
    accent: 'sun'
  }
];

export const games: Game[] = prepareGameContent([
  {
    id: 'game-endless-runner',
    slug: 'endless-runner',
    title: 'Endless Runner',
    shortDescription: 'Jump cleanly, dodge fast obstacles, and survive as the pace keeps climbing.',
    description:
      'A polished HTML5 endless runner built for quick browser sessions. Time your jumps, stay ahead of the speed curve, and chase a better best score on desktop, tablet, or phone.',
    thumbnail: '/games/endless-runner/assets/thumbnail.svg',
    coverImage: '/games/endless-runner/assets/cover.svg',
    category: 'Arcade',
    tags: ['runner', 'jump', 'endless', 'reflex', 'mobile'],
    rating: 4.7,
    plays: 18600,
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
    thumbnail: '/games/memory-match/assets/thumbnail.svg',
    coverImage: '/games/memory-match/assets/cover.svg',
    category: 'Puzzle',
    tags: ['memory', 'match', 'cards', 'casual', 'logic', 'mobile'],
    rating: 4.7,
    plays: 12400,
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
    thumbnail: '/games/block-puzzle/assets/thumbnail.svg',
    coverImage: '/games/block-puzzle/assets/cover.svg',
    category: 'Puzzle',
    tags: ['block', 'puzzle', 'grid', 'logic', 'casual', 'mobile'],
    rating: 4.7,
    plays: 9800,
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
    thumbnail: '/games/number-merge/assets/thumbnail.svg',
    coverImage: '/games/number-merge/assets/cover.svg',
    category: 'Puzzle',
    tags: ['numbers', 'merge', '2048-style', 'logic', 'casual', 'mobile'],
    rating: 4.8,
    plays: 8600,
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
    shortDescription:
      'Play a clean local duel, claim three squares, and reset instantly for another round.',
    description:
      'A polished HTML5 Tic Tac Toe game for fast local two-player sessions. Take turns placing X and O, track local wins and draws, and restart quickly from a responsive board built for mouse and touch.',
    category: 'Puzzle',
    tags: ['tic tac toe', 'strategy', 'board', 'logic', 'casual', 'mobile'],
    rating: 4.5,
    plays: 5400,
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
    shortDescription: 'Tap to flap, thread neon gates, and chase a cleaner high-score run.',
    description:
      'A lightweight flappy-style HTML5 arcade game with smooth canvas motion, responsive jump input, local best score tracking, and quick restart loops for instant browser play.',
    category: 'Arcade',
    tags: ['flappy', 'flight', 'arcade', 'tap', 'reflex', 'mobile'],
    rating: 4.6,
    plays: 6100,
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
    shortDescription: 'Pour stacked colors into matching tubes and solve each clean logic puzzle.',
    description:
      'A polished HTML5 color sorting puzzle with simple tap-to-pour controls, readable tubes, valid move rules, win detection, and local best move tracking for quick logic sessions.',
    category: 'Puzzle',
    tags: ['color sort', 'sorting', 'logic', 'puzzle', 'casual', 'mobile'],
    rating: 4.7,
    plays: 5800,
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
    shortDescription: 'Slide numbered tiles, merge matching values, and keep the board alive.',
    description:
      'A clean browser-ready 2048 puzzle built for quick logic sessions. Use arrow keys, WASD, or mobile swipes to slide every tile, merge matching numbers, and chase a bigger score before the board fills up.',
    category: 'Puzzle',
    tags: ['2048', 'numbers', 'merge', 'logic', 'puzzle', 'mobile'],
    rating: 4.6,
    plays: 7200,
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
    shortDescription:
      'Guide the neon snake, collect pickups, and survive without hitting yourself.',
    description:
      'A polished HTML5 Snake game with crisp keyboard controls, swipe support, local best score tracking, and a compact arcade loop that works cleanly inside the PixloGames player.',
    category: 'Arcade',
    tags: ['snake', 'arcade', 'classic', 'reflex', 'mobile'],
    rating: 4.5,
    plays: 6900,
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
    shortDescription: 'Bounce the ball, clear bright brick walls, and keep the rally alive.',
    description:
      'A lightweight HTML5 Brick Breaker with smooth paddle control, satisfying clears, local best score tracking, and desktop plus touch support for instant arcade sessions.',
    category: 'Arcade',
    tags: ['brick breaker', 'arcade', 'paddle', 'ball', 'classic', 'mobile'],
    rating: 4.5,
    plays: 6400,
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
    shortDescription:
      'Run a cozy bamboo shop, stock shelves, serve guests, and upgrade your tiny forest mart.',
    description:
      'Run a cozy bamboo shop, collect fresh bamboo, stock shelves, help forest customers check out, and spend coins on upgrades that make each shift smoother.',
    category: 'Management',
    tags: ['Management', 'Idle', 'Cute', 'Panda', 'Shop', 'Casual'],
    rating: 4.7,
    plays: 4300,
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
  {
    id: 'game-neon-driftline',
    slug: 'neon-driftline',
    title: 'Neon Driftline',
    shortDescription: 'Thread midnight streets with clean drifts and split-second boosts.',
    description:
      'A precision racing game built around perfect corner entries, boost timing, and short retry loops.',
    thumbnail:
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1500&q=80',
    category: 'Racing',
    tags: ['drift', 'cars', 'time trial', 'arcade'],
    rating: 4.8,
    plays: 1842000,
    isNew: false,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: 'https://play.pixlogames.local/neon-driftline',
    controls: {
      keyboard: ['Arrow keys', 'Space'],
      touch: true,
      gamepad: true
    },
    mobileSupported: true
  },
  {
    id: 'game-orbit-raiders',
    slug: 'orbit-raiders',
    title: 'Orbit Raiders',
    shortDescription: 'Clear asteroid belts, chain upgrades, and survive wave pressure.',
    description:
      'A space arcade shooter with escalating enemy formations and fast upgrade decisions between rounds.',
    thumbnail:
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1500&q=80',
    category: 'Shooting',
    tags: ['space', 'waves', 'upgrades', 'shooter'],
    rating: 4.7,
    plays: 1265000,
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/orbit-raiders',
    controls: {
      keyboard: ['WASD', 'Mouse'],
      mouse: true,
      touch: true
    },
    mobileSupported: true
  },
  {
    id: 'game-tile-tempo',
    slug: 'tile-tempo',
    title: 'Tile Tempo',
    shortDescription: 'Slide color paths into rhythm before the board locks down.',
    description:
      'A bright puzzle game where pathfinding, color matching, and timing pressure converge in short sessions.',
    thumbnail:
      'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=1500&q=80',
    category: 'Puzzle',
    tags: ['logic', 'tiles', 'color', 'quick play'],
    rating: 4.6,
    plays: 946000,
    isNew: true,
    isTrending: false,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: 'https://play.pixlogames.local/tile-tempo',
    controls: {
      keyboard: ['Arrow keys'],
      mouse: true,
      touch: true
    },
    mobileSupported: true
  },
  {
    id: 'game-forest-runner',
    slug: 'forest-runner',
    title: 'Forest Runner',
    shortDescription: 'Leap through glowing ruins and outrun the collapsing canopy.',
    description:
      'An adventure runner with branching routes, collectible relics, and responsive mobile-first movement.',
    thumbnail:
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1500&q=80',
    category: 'Adventure',
    tags: ['runner', 'exploration', 'relics', 'platforming'],
    rating: 4.5,
    plays: 812500,
    isNew: false,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/forest-runner',
    controls: {
      keyboard: ['Arrow keys', 'Space'],
      touch: true
    },
    mobileSupported: true
  },
  {
    id: 'game-rocket-rivals',
    slug: 'rocket-rivals',
    title: 'Rocket Rivals',
    shortDescription: 'Dodge, bump, and boost through frantic four-player arenas.',
    description:
      'A multiplayer arena game where tiny rocket craft collide, rebound, and race for zone control.',
    thumbnail:
      'https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1500&q=80',
    category: 'Multiplayer',
    tags: ['arena', 'versus', 'party', 'boost'],
    rating: 4.9,
    plays: 2230000,
    isNew: false,
    isTrending: true,
    isMultiplayer: true,
    isEditorsPick: true,
    embedUrl: 'https://play.pixlogames.local/rocket-rivals',
    controls: {
      keyboard: ['WASD', 'Space'],
      touch: true,
      gamepad: true
    },
    mobileSupported: true
  },
  {
    id: 'game-goalstorm',
    slug: 'goalstorm',
    title: 'Goalstorm',
    shortDescription: 'Arcade football with bank shots, power kicks, and tiny arenas.',
    description:
      'A fast sports game focused on readable physics, quick matches, and dramatic last-second goals.',
    thumbnail:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1500&q=80',
    category: 'Sports',
    tags: ['football', 'physics', 'quick match', 'arena'],
    rating: 4.4,
    plays: 658000,
    isNew: true,
    isTrending: false,
    isMultiplayer: true,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/goalstorm',
    controls: {
      keyboard: ['Arrow keys', 'Z', 'X'],
      touch: true,
      gamepad: true
    },
    mobileSupported: true
  },
  {
    id: 'game-shadow-sprint',
    slug: 'shadow-sprint',
    title: 'Shadow Sprint',
    shortDescription: 'Chain wall-runs and dash cancels through compact combat rooms.',
    description:
      'A movement-heavy action platformer with readable hazards and satisfying room-by-room mastery.',
    thumbnail:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1500&q=80',
    category: 'Action',
    tags: ['platformer', 'dash', 'combat', 'speedrun'],
    rating: 4.8,
    plays: 1428000,
    isNew: false,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: 'https://play.pixlogames.local/shadow-sprint',
    controls: {
      keyboard: ['WASD', 'J', 'K'],
      touch: true,
      gamepad: true
    },
    mobileSupported: true
  },
  {
    id: 'game-cabinet-clash',
    slug: 'cabinet-clash',
    title: 'Cabinet Clash',
    shortDescription: 'Retro score chasing with modern combo rules and daily modifiers.',
    description:
      'An arcade survival game with compact arenas, rotating objectives, and leaderboards-ready scoring.',
    thumbnail:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1523843268911-45a882919fec?auto=format&fit=crop&w=1500&q=80',
    category: 'Arcade',
    tags: ['retro', 'score', 'combo', 'daily'],
    rating: 4.6,
    plays: 1136000,
    isNew: false,
    isTrending: false,
    isMultiplayer: false,
    isEditorsPick: true,
    embedUrl: 'https://play.pixlogames.local/cabinet-clash',
    controls: {
      keyboard: ['Arrow keys', 'Space'],
      touch: true
    },
    mobileSupported: true
  },
  {
    id: 'game-micro-mayhem',
    slug: 'micro-mayhem',
    title: 'Micro Mayhem',
    shortDescription: 'Tiny car combat across kitchen-table tracks and toy-scale jumps.',
    description:
      'A top-down action racer with collectible powerups and miniature arenas built for repeat sessions.',
    thumbnail:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1500&q=80',
    category: 'Racing',
    tags: ['cars', 'combat', 'powerups', 'arena'],
    rating: 4.3,
    plays: 534000,
    isNew: true,
    isTrending: false,
    isMultiplayer: true,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/micro-mayhem',
    controls: {
      keyboard: ['Arrow keys', 'Space'],
      touch: true,
      gamepad: true
    },
    mobileSupported: true
  },
  {
    id: 'game-crypt-circuits',
    slug: 'crypt-circuits',
    title: 'Crypt Circuits',
    shortDescription: 'Rotate ancient machines and route power through buried vaults.',
    description:
      'A puzzle adventure about repairing strange mechanisms one satisfying circuit at a time.',
    thumbnail:
      'https://images.unsplash.com/photo-1605106702734-205df224ecce?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1605106715994-18d3fecffb98?auto=format&fit=crop&w=1500&q=80',
    category: 'Puzzle',
    tags: ['circuits', 'logic', 'adventure', 'mystery'],
    rating: 4.7,
    plays: 721000,
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/crypt-circuits',
    controls: {
      keyboard: ['Arrow keys'],
      mouse: true,
      touch: true
    },
    mobileSupported: true
  },
  {
    id: 'game-battle-bounce',
    slug: 'battle-bounce',
    title: 'Battle Bounce',
    shortDescription: 'Ricochet shots around breakable arenas in tense two-player duels.',
    description:
      'A multiplayer shooting game that rewards bank shots, map control, and clever defensive angles.',
    thumbnail:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1500&q=80',
    category: 'Shooting',
    tags: ['duel', 'physics', 'arena', 'multiplayer'],
    rating: 4.5,
    plays: 889000,
    isNew: false,
    isTrending: false,
    isMultiplayer: true,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/battle-bounce',
    controls: {
      keyboard: ['WASD'],
      mouse: true,
      touch: true
    },
    mobileSupported: true
  },
  {
    id: 'game-skyforge-quest',
    slug: 'skyforge-quest',
    title: 'Skyforge Quest',
    shortDescription: 'Explore floating islands, unlock routes, and master airship jumps.',
    description:
      'A browser adventure with lightweight progression, atmospheric zones, and short objective chains.',
    thumbnail:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1500&q=80',
    category: 'Adventure',
    tags: ['islands', 'quest', 'exploration', 'platforming'],
    rating: 4.4,
    plays: 612000,
    isNew: false,
    isTrending: false,
    isMultiplayer: false,
    isEditorsPick: false,
    embedUrl: 'https://play.pixlogames.local/skyforge-quest',
    controls: {
      keyboard: ['Arrow keys', 'Space'],
      touch: true,
      gamepad: true
    },
    mobileSupported: true
  }
]);

export const trendingGames = games.filter((game) => game.isTrending).slice(0, 6);
export const newGames = games.filter((game) => game.isNew).slice(0, 6);
export const popularGames = [...games].sort((a, b) => b.plays - a.plays).slice(0, 8);
export const multiplayerGames = games.filter((game) => game.isMultiplayer).slice(0, 6);
export const editorsPickGames = games.filter((game) => game.isEditorsPick).slice(0, 5);
export const heroGame = games[0];
export const heroSideGames = [games[4], games[6], games[1]];

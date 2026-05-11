import type { GameContentInput } from '@/lib/content';

export type GamePageContentBlock = {
  game: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
};

function normalizeGameTitle(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export const targetGamePageContentBlocks: GamePageContentBlock[] = [
  {
    game: 'Endless Runner',
    seoTitle: 'Endless Runner - Play Free Online | PixloGames',
    seoDescription:
      'Run, jump and dodge obstacles in this free browser arcade game. Test reflexes, beat your high score, play instantly.',
    description: `Endless Runner is a fast-paced arcade game where you control a character sprinting through ever-changing terrain. You tap or swipe to jump over gaps, slide under barriers, and weave between obstacles that come at you in rhythm with the action. The game speeds up the longer you survive, so quick reflexes and pattern recognition matter more than raw skill. Each run is a fresh score chase against yourself, and the difficulty curve keeps you sharp without ever feeling unfair. There are no levels to grind through — just one continuous track that rewards focus. This free online game runs directly in your browser with no download, making it easy to drop in for a quick session or settle in for a long high-score battle. Start your run now.`
  },
  {
    game: 'Memory Match',
    seoTitle: 'Memory Match - Play Free Online | PixloGames',
    seoDescription:
      'Flip cards, find pairs and train your memory in this free browser puzzle game. Play instantly across all devices.',
    description: `Memory Match is a classic concentration puzzle that puts your short-term memory to the test. You face a grid of face-down cards and flip two at a time, trying to find matching pairs. Each match clears the cards from the board; each miss flips them back and forces you to remember where they were. The game scales from small grids for warm-ups to large ones that demand focused attention across dozens of tiles. Time pressure and move counters add competitive depth — you can play casually or push for a perfect score. It works as a brain training exercise as much as a game, which makes it satisfying to return to daily. This HTML5 game loads in your browser with no installation. Start matching now.`
  },
  {
    game: 'Block Puzzle',
    seoTitle: 'Block Puzzle - Play Free Online | PixloGames',
    seoDescription:
      'Drop blocks, clear lines and solve spatial puzzles in this free browser game. No download, play instantly online.',
    description: `Block Puzzle is a tile-fitting game where you drag wooden-style blocks of various shapes onto an empty grid, trying to fill complete rows or columns. Every cleared line earns points and frees up space for the next set of pieces. The trick is planning ahead — placing a block thoughtlessly fills your board with gaps and ends the game quickly. There is no time pressure here, just pure spatial logic, which makes Block Puzzle equally good for short breaks or longer focus sessions. The game rewards patience and pattern recognition, and the simple touch controls work the same on desktop and mobile. This free online game is ready to play instantly with no download. See how high you can score and how long you can keep the board clear.`
  },
  {
    game: 'Number Merge',
    seoTitle: 'Number Merge - Play Free Online | PixloGames',
    seoDescription:
      'Combine numbered tiles to reach higher values in this free browser merge puzzle. Play instantly, no download.',
    description: `Number Merge is a casual puzzle game where you slide and combine numbered tiles to create higher-value numbers. Two matching tiles merge into one with double the value — chain those merges together and you build up impressive scores quickly. The board fills up with new tiles each turn, so you'll need to keep clearing space by stacking and combining strategically. The simple rules hide real depth: knowing when to set up a big merge versus when to clear the board is the whole skill of the game. Number Merge is a perfect short-session game but rewards longer play with bigger merges and higher tier numbers. This HTML5 game runs in your browser, no download required. Start merging and see how far you can climb.`
  },
  {
    game: 'Panda Mart',
    seoTitle: 'Panda Mart - Play Free Online | PixloGames',
    seoDescription:
      'Run a cute panda supermarket in this free browser management game. Restock, serve customers, play instantly.',
    description: `Panda Mart is a casual management game where you take charge of a friendly panda-themed supermarket. You restock shelves, take customer orders, ring up purchases at the register, and keep your store running smoothly as the day gets busier. The pace builds gradually — early shifts are relaxed, but rush hour tests your multitasking. Every successful day earns coins you spend on store upgrades, new product lines, and decorations that change how your shop feels. The art is bright and family-friendly, and the gameplay loop is genuinely satisfying without ever getting stressful. Panda Mart works equally well for short play sessions or longer expansion runs. This free online game plays directly in your browser with no download. Open up the shop and serve your first customer.`
  },
  {
    game: 'Mojicon Spring Connect',
    seoTitle: 'Mojicon Spring Connect - Play Free | PixloGames',
    seoDescription:
      'Connect matching mahjong tiles in this free browser puzzle game. Spring-themed visuals, play instantly online.',
    description: `Mojicon Spring Connect is a relaxing mahjong matching game wrapped in fresh spring visuals — cherry blossoms, garden tiles, and soft pastel colors throughout. You connect pairs of matching tiles by drawing paths between them, but each path can only have up to two turns. As the board clears, the remaining tiles get harder to reach, forcing you to think a few moves ahead. Levels start gentle and ramp up steadily, mixing in hint and shuffle tools when you get stuck. The pace is unhurried, which makes Mojicon perfect for low-pressure sessions or quiet evenings. It's the kind of puzzle game that's easy to learn and surprisingly hard to put down. This free online game runs in your browser, no download required. Start connecting tiles.`
  },
  {
    game: 'Mahjong Solitaire Zodiac',
    seoTitle: 'Mahjong Solitaire Zodiac - Play Free | PixloGames',
    seoDescription:
      'Clear stacked mahjong tiles with zodiac symbols in this free browser puzzle. Play instantly, no download.',
    description: `Mahjong Solitaire Zodiac brings the classic stacked tile-clearing puzzle together with a zodiac-themed visual style. Your goal is to remove pairs of matching tiles from a layered pyramid, but only tiles that are free on at least one side and uncovered on top can be selected. Plan your moves carefully — clearing the wrong pair too early can lock you out of a clean solution. The zodiac art gives each level a different mood, and progressive difficulty keeps you challenged without ever feeling unfair. Hint and shuffle tools are there when you need them, but the real reward is solving a tough board on your own. This HTML5 game plays instantly in your browser with no download. Start clearing tiles now.`
  },
  {
    game: 'Fruit Mahjong 3D',
    seoTitle: 'Fruit Mahjong 3D - Play Free Online | PixloGames',
    seoDescription:
      'Match colorful fruit tiles in this free 3D browser mahjong game. Rotate the board, play instantly online.',
    description: `Fruit Mahjong 3D takes the classic mahjong matching format and gives it a fresh twist — every level is built in three dimensions using cheerful fruit-themed tiles. You rotate the board to find matching pairs hidden on different sides, which adds a spatial puzzle layer to the usual memory and planning challenge. The bright colors and friendly art style make this version feel more relaxed than traditional mahjong, but the actual gameplay is just as deep. Limited swaps and clear hints help you over the harder layouts without making the game feel automatic. Fruit Mahjong 3D is great for both short breaks and long focused sessions. This browser game requires no download. Spin the board and start matching.`
  },
  {
    game: 'Stickman Jewel Match 3 Master',
    seoTitle: 'Stickman Jewel Match 3 - Play Free | PixloGames',
    seoDescription:
      'Swap jewels and clear the board in this free browser match-3 game with a stickman twist. Play instantly online.',
    description: `Stickman Jewel Match 3 Master combines the addictive swap-and-match-3 puzzle format with a quirky stickman story wrapped around it. You swap adjacent jewels to create lines of three or more matching colors, clearing them from the board and triggering chain reactions when bigger combos line up. Each level has specific objectives — clear a certain color, free trapped tiles, beat the move count — that keep the gameplay varied. Power-ups appear when you make four or five-tile matches, giving you bombs and line-clears to plan around. The stickman story breaks up the puzzle runs with light humor between stages. This HTML5 game runs in your browser with no download required. Start swapping jewels.`
  },
  {
    game: 'Candy Riddles Free Match 3 Puzzle',
    seoTitle: 'Candy Riddles - Play Free Online | PixloGames',
    seoDescription:
      'Solve sweet match-3 puzzles in this free browser game. Swap candies, hit combos, play instantly online.',
    description: `Candy Riddles is a colorful match-3 puzzle game with bright candy-themed visuals and tight, well-tuned level design. You swap adjacent candy pieces to line up three or more of the same color, clearing them and dropping new candies in to keep the chain going. Each level introduces a new objective — clear blockers, drop ingredients, beat a target score — so the gameplay never falls into a repetitive pattern. Strategic match-making earns you boosters like striped candies and color bombs that trigger satisfying screen-wide combos. The difficulty curve is generous early on and gets genuinely tricky in later stages, which keeps long sessions worth playing. This free online game plays directly in your browser with no download.`
  },
  {
    game: 'Gem Match Deluxe',
    seoTitle: 'Gem Match Deluxe - Play Free Online | PixloGames',
    seoDescription:
      'Match shiny gems in this free browser match-3 puzzle game. Quick rounds, big combos, play instantly online.',
    description: `Gem Match Deluxe is a polished, fast-paced match-3 game built around clearing sparkling gem boards as quickly and cleanly as possible. You swap adjacent gems to create chains of three or more matching stones, triggering cascades when newly fallen gems line up automatically. The pacing is faster than most match-3 games — rounds reward speed alongside strategy, so you'll feel pressure to spot patterns at a glance. Each level has clear, simple targets, which makes Gem Match Deluxe ideal for short breaks where you want a complete game session in five minutes. The visuals are clean and satisfying, with each successful match dropping a small particle burst. This browser game runs instantly with no download. Start matching gems and chasing combos.`
  },
  {
    game: 'New Daily Sudoku',
    seoTitle: 'New Daily Sudoku - Play Free Online | PixloGames',
    seoDescription:
      'Solve a fresh sudoku puzzle every day in this free browser game. Easy to expert difficulty, play instantly.',
    description: `New Daily Sudoku gives you a fresh, hand-crafted sudoku puzzle every single day across four difficulty levels — easy, medium, hard, and expert. You fill in the 9 by 9 grid so that every row, column, and 3 by 3 box contains each digit from one to nine exactly once. The puzzles are designed to have unique solutions and clean logical paths, so a tough one is always solvable without guessing. A clean interface lets you mark candidate numbers, highlight conflicts, and undo mistakes without breaking flow. The daily format is the real draw — coming back tomorrow for a new challenge builds a quiet habit that's surprisingly rewarding. This HTML5 game plays in your browser with no download. Start today's puzzle.`
  },
  {
    game: 'Sudoku Master',
    seoTitle: 'Sudoku Master - Play Free Online | PixloGames',
    seoDescription:
      'Master classic sudoku across all difficulty levels in this free browser game. No download, play instantly.',
    description: `Sudoku Master is a clean, focused implementation of the classic number puzzle, built for players who want a no-frills sudoku experience that just works. You select from four difficulty tiers and get an endless supply of fresh puzzles, each generated to have a unique solution. The interface is minimal — tap a cell, tap a number, mark candidates if you want to think a few steps ahead. Mistake highlighting and an undo button are there to help, but you can also turn them off for a purer challenge. Hard and expert puzzles require advanced techniques like X-wings and naked pairs, so there's real depth here for veteran sudoku players. This free online game runs in your browser instantly. Pick a difficulty and start solving.`
  },
  {
    game: 'Word Connect',
    seoTitle: 'Word Connect - Play Free Online | PixloGames',
    seoDescription:
      'Swipe letters to form words in this free browser word puzzle. Play instantly, grow your vocabulary.',
    description: `Word Connect is a word-finding puzzle game where you swipe between letter tiles arranged in a circle to form valid English words. Each level gives you a small set of letters and a grid of empty word slots to fill — you find the answers by experimenting with letter combinations until words click into place. Bonus words you discover beyond the required answers earn extra points and unlock hint tools for harder levels. The pace is gentle and meditative, which makes Word Connect great for relaxing play sessions or quiet moments when you want to keep your mind engaged without stress. Difficulty grows slowly, so even harder levels stay fair. This HTML5 game plays in your browser with no download. Start connecting letters now.`
  },
  {
    game: 'Word Search 3',
    seoTitle: 'Word Search 3 - Play Free Online | PixloGames',
    seoDescription:
      'Find hidden words across themed puzzles in this free browser game. Multiple difficulties, play instantly.',
    description: `Word Search 3 is a polished word-hunting game where you find hidden words in a grid of seemingly random letters. Words can run horizontally, vertically, diagonally, and even backwards, which makes spotting them more challenging than it first appears. The game features themed puzzles — animals, sports, food, history — so you're always finding words within a topic, and that context makes the hunt easier and more rewarding. Three difficulty levels scale the grid size and word count, so you can pick a quick five-minute puzzle or a sprawling 20-minute challenge. The interface is clean and works just as well on mobile as on desktop. This free online game runs in your browser. Pick a theme and start searching.`
  },
  {
    game: 'Super Stickman Sling',
    seoTitle: 'Super Stickman Sling - Play Free | PixloGames',
    seoDescription:
      'Swing stickman from rope to rope in this free browser physics game. Time your jumps, play instantly online.',
    description: `Super Stickman Sling is a physics-based skill game where you control a stickman swinging through levels using grappling ropes. You tap to fire a rope at the nearest anchor point above, build momentum with the swing, and release at exactly the right moment to launch toward the next anchor. Bad timing sends you plummeting; perfect timing chains beautifully through long sections of the level. The physics feel weighty and responsive, so every successful swing has real satisfaction behind it. Levels introduce new obstacles — saws, gaps, moving anchors — that force you to think about timing and trajectory together. This free online game is short on words and long on momentum. It runs in your browser with no download. Grab a rope and swing.`
  },
  {
    game: 'Rescue Boss Cut Rope',
    seoTitle: 'Rescue Boss Cut Rope - Play Free | PixloGames',
    seoDescription:
      'Cut ropes to rescue the boss in this free browser physics puzzle. Smart cuts, play instantly online.',
    description: `Rescue Boss Cut Rope is a rope-cutting physics puzzle where each level locks a character in a hanging trap that you have to free with carefully timed cuts. You slice ropes with a swipe, and physics takes over — momentum, gravity, swinging arcs all matter to whether your boss lands safely or smashes into something painful. Each level is a small contained puzzle that usually has one or two elegant solutions you have to figure out before you start cutting. The art is bright and lightly cartoonish, and the soft physics make even failed attempts entertaining to watch. The game rewards thinking before acting, which is rarer than it sounds in casual games. This HTML5 game runs in your browser. Get cutting and start rescuing.`
  },
  {
    game: 'Idle Mining Empire',
    seoTitle: 'Idle Mining Empire - Play Free Online | PixloGames',
    seoDescription:
      "Build a mining empire that earns while you're away in this free browser idle game. Play instantly online.",
    description: `Idle Mining Empire is an idle tycoon game where you build and upgrade a mining operation that keeps earning even when you stop playing. You start with a single mine shaft and a tiny crew, and grow it into a sprawling operation with multiple resource types, automated transport systems, and managers who run things for you. The early loop is hands-on — you tap to send miners, sell loads, and buy upgrades. The mid-game shifts as automation kicks in and your job becomes choosing which upgrades to prioritize. Coming back after a few hours away always brings a satisfying pile of accumulated gold to spend. This free online game runs in your browser with no download required. Start your mining empire.`
  },
  {
    game: 'Cinema Empire Idle Tycoon',
    seoTitle: 'Cinema Empire Idle Tycoon - Play Free | PixloGames',
    seoDescription:
      'Build a movie theater empire in this free browser idle tycoon game. Earn passive income, play instantly.',
    description: `Cinema Empire Idle Tycoon puts you in charge of a small movie theater that you grow into a sprawling cinema chain over time. You buy new screens, hire staff, sell concessions, and unlock premium experiences like 3D and luxury seating as your earnings scale up. The idle mechanics mean your theaters keep generating revenue when you're away, so progress continues whether you check in for five minutes or five hours. Strategic decisions matter: deciding when to upgrade existing screens versus open new locations, when to invest in marketing campaigns versus expand the snack bar, all shape how fast you grow. The art is clean and the upgrade pacing feels rewarding without ever stalling. This browser game plays instantly. Build your cinema empire.`
  },
  {
    game: '2048 Merge World',
    seoTitle: '2048 Merge World - Play Free Online | PixloGames',
    seoDescription:
      'Merge numbered tiles to reach 2048 and beyond in this free browser puzzle. Classic gameplay, play instantly.',
    description: `2048 Merge World is a fresh take on the addictive 2048 puzzle format. You swipe to slide all tiles in one direction, and tiles with the same number combine into a single tile with double the value. The goal is to reach 2048, but most players push way beyond — 4096, 8192, and higher are achievable with patience and careful planning. The trick is keeping your highest-value tiles in a single corner so they don't get trapped between unmergeable smaller numbers. The 4 by 4 grid fills quickly if you play carelessly, but a player with strategy can keep stacking merges far longer than they expect. This free online game runs in your browser with no download. Slide, merge, repeat.`
  },
  {
    game: 'Top Burger Cooking',
    seoTitle: 'Top Burger Cooking - Play Free Online | PixloGames',
    seoDescription:
      'Cook and serve perfect burgers in this free browser cooking game. Beat the clock, play instantly online.',
    description: `Top Burger Cooking is a fast-paced cooking game where you take orders, grill patties, stack toppings, and serve customers at a busy burger joint. Each order is timed — customers get impatient if you stall — so you'll be juggling multiple burgers on the grill while assembling others at the counter. The recipes start simple and grow more complex as you advance, introducing new ingredients and dishes that demand sharper multitasking. Successful shifts earn coins for kitchen upgrades — faster grills, better tools, more counter space — that compound into smoother service down the line. The art is bright and family-friendly with no violence or adult themes. This HTML5 game runs in your browser, no download needed. Start cooking.`
  },
  {
    game: 'Pizza Maker',
    seoTitle: 'Pizza Maker - Play Free Online | PixloGames',
    seoDescription:
      'Make and decorate pizzas in this free browser cooking game. Custom toppings, play instantly online.',
    description: `Pizza Maker is a casual cooking game where you build, top, and bake pizzas exactly the way you (or your customer) wants them. You roll out the dough, ladle sauce, sprinkle cheese, then add from a wide selection of toppings — pepperoni, vegetables, seafood, even sweet options for dessert pizzas. The game has both free-play mode where you experiment with creative combinations and an order-based mode where you fulfill customer requests against the clock. The art is colorful and the controls are simple enough that younger players can pick it up immediately. Bonus stars and recipe unlocks keep things rewarding without ever pushing for in-game purchases. This free online game runs in your browser with no download.`
  },
  {
    game: 'Idle Restaurant Tycoon',
    seoTitle: 'Idle Restaurant Tycoon - Play Free | PixloGames',
    seoDescription:
      'Build a restaurant chain in this free browser idle tycoon game. Hire chefs, upgrade kitchens, play instantly.',
    description: `Idle Restaurant Tycoon puts you in charge of a single small eatery and challenges you to grow it into a global restaurant chain through smart upgrades and steady reinvestment. You hire chefs, waiters, and managers who handle daily operations, freeing you to focus on bigger decisions like new locations, menu expansions, and franchise deals. Income generates whether you're playing or away, so dropping in once a day to spend accumulated cash on the next big upgrade is its own satisfying loop. The visual style is friendly and the progression curve avoids the worst free-to-play pacing traps — upgrades stay meaningful even deep into the game. This free online game runs in your browser instantly. Open your first location.`
  },
  {
    game: 'Stickman Run',
    seoTitle: 'Stickman Run - Play Free Online | PixloGames',
    seoDescription:
      'Run, dodge and survive in this free browser endless runner. Stickman action, play instantly online.',
    description: `Stickman Run is a fast-paced endless runner where you control a stickman sprinting through procedurally generated levels filled with traps, gaps, and moving hazards. You tap to jump, double-tap for a higher leap, and swipe to slide under low obstacles — simple controls that get tested hard once the speed ramps up. Coins scattered through each run let you unlock new stickman characters and upgrades that change how runs feel rather than how they play. There's a daily challenge mode that pushes you to chase specific objectives instead of just raw distance, which keeps the gameplay loop fresh. Stickman Run is built for short bursts but easy to lose an hour in. This HTML5 game plays instantly in your browser. Start running.`
  },
  {
    game: 'Stick Hero',
    seoTitle: 'Stick Hero - Play Free Online | PixloGames',
    seoDescription:
      'Stretch sticks to bridge gaps in this free browser skill game. Perfect timing, play instantly online.',
    description: `Stick Hero is a minimalist precision game where your character has to cross gaps between platforms by growing a stick of exactly the right length. Hold to extend the stick, release to drop it — too short and you fall in, too long and you overshoot. Perfectly landing on the small red dot in the middle of each platform earns bonus points and feels disproportionately satisfying. The visual style is clean and graphic, with each new platform appearing from nothing as you move forward. The challenge ramps up through gaps of varying widths and platforms of different sizes, but the controls stay just hold-and-release the entire game. This free online game runs in your browser. One tap, perfect timing.`
  },
  {
    game: 'Stack Tower',
    seoTitle: 'Stack Tower - Play Free Online | PixloGames',
    seoDescription:
      'Stack moving blocks as high as you can in this free browser arcade game. Play instantly, no download.',
    description: `Stack Tower is a one-tap stacking game where blocks slide back and forth across the screen and you tap to drop each one onto the growing tower below. If the block lands perfectly on the one beneath, you keep its full width. If it overshoots, the part that hangs over gets sliced off and you're working with a smaller block on the next try. The game ends when your tower base shrinks to nothing, so every imperfect tap brings the eventual end closer. Higher towers earn more points and unlock new color palettes and visual themes. Stack Tower is one of those games where 30 seconds turns into 30 minutes without warning. This HTML5 game runs in your browser. Start stacking.`
  },
  {
    game: 'Bubble Shooter Classic Match 3 Pop Bubbles',
    seoTitle: 'Bubble Shooter Classic - Play Free | PixloGames',
    seoDescription:
      'Aim, shoot and pop matching bubbles in this free browser puzzle game. Classic gameplay, play instantly.',
    description: `Bubble Shooter Classic is the timeless arcade puzzle reimagined with clean modern art. You aim a cannon at the bottom of the screen and fire colored bubbles upward — when three or more matching colors connect, they pop and any bubbles hanging from them drop too. The whole screen advances downward as you play, so taking too long pushes the bubble wall closer to the game-over line. Multi-bubble drops are the real scoring opportunity, and setting them up takes a mix of careful aim and planning two shots ahead. Hundreds of hand-designed levels keep things interesting beyond the endless mode. This free online game plays in your browser, no download required. Pop your first bubble.`
  },
  {
    game: 'Bubble Pop Fairyland',
    seoTitle: 'Bubble Pop Fairyland - Play Free | PixloGames',
    seoDescription:
      'Pop bubbles across enchanted fairyland levels in this free browser puzzle. Play instantly online.',
    description: `Bubble Pop Fairyland wraps the classic bubble shooter format in a charming fairy-tale visual world, with each level set against backgrounds of enchanted forests, magical castles, and starry night skies. The core gameplay is what you'd expect — aim, fire, match three or more bubbles of the same color, watch chains of disconnected bubbles fall. What sets Fairyland apart is the level design, which mixes special bubble types like rainbow bubbles and locked bubbles that change how you approach each board. Power-ups appear at thoughtful moments rather than constantly, so they feel earned. Suitable for all ages, with no jarring difficulty spikes. This HTML5 game plays in your browser with no download. Enter the fairyland.`
  },
  {
    game: 'Bubble Pop Butterfly',
    seoTitle: 'Bubble Pop Butterfly - Play Free | PixloGames',
    seoDescription:
      'Free butterflies by popping matching bubbles in this free browser puzzle game. Play instantly online.',
    description: `Bubble Pop Butterfly is a bubble shooter game where each level traps butterflies behind a wall of colored bubbles, and your goal is to free them by popping the bubbles around them. Aim your shot, match three or more same-color bubbles, and watch the dependent bubbles drop along with any butterflies they were holding. The butterfly mechanic adds a clear objective beyond just clearing the board — sometimes you only need to free a few butterflies to pass the level, which rewards efficient play. The art is soft and colorful, and the audio is calm and meditative rather than chaotic. A relaxing variation on the classic bubble shooter formula. This browser game plays instantly with no download. Free your first butterfly.`
  },
  {
    game: 'Drift Boss',
    seoTitle: 'Drift Boss - Play Free Online | PixloGames',
    seoDescription:
      'Drift around tight turns in this free browser racing game. One-button controls, play instantly online.',
    description: `Drift Boss is a one-button drift racing game where your car endlessly drives forward on a winding road, and you hold or tap to control how sharply it drifts around each curve. The road generates as you go, throwing tighter turns, gaps, and unexpected angles at you the longer you survive. Falling off the road ends the run, so it's a constant test of timing and feel — when to commit to a drift, when to ease off, when to brace for a sharp curve. Coins along the road let you unlock new cars that change the drift physics in subtle but noticeable ways. Drift Boss is fast, addictive, and easy to pick up. This HTML5 game plays in your browser. Start drifting.`
  },
  {
    game: 'Parking Fury 3D',
    seoTitle: 'Parking Fury 3D - Play Free Online | PixloGames',
    seoDescription:
      'Park cars in tight spots across 3D levels in this free browser puzzle. Realistic physics, play instantly.',
    description: `Parking Fury 3D is a parking puzzle game where you maneuver a car through tight environments and into precise parking spots while avoiding collisions with other cars, walls, and obstacles. The 3D camera gives you a clear sense of your car's size and position, but tight spots and unforgiving collision physics mean every turn matters. Levels start in straightforward parking lots and progress to busy streets, multi-story garages, and trickier setups that test your spatial awareness and patience. There's no race timer — accuracy matters more than speed — which makes Parking Fury 3D more of a puzzle than an action game. This free online game runs in your browser with no download. Park your first car.`
  }
];

export const targetGamePageContentNames = targetGamePageContentBlocks.map((block) => block.game);

export const gamePageContentByTitle = new Map(
  targetGamePageContentBlocks.map((block) => [normalizeGameTitle(block.game), block])
);

export function applyProvidedGamePageContent(gameInputs: GameContentInput[]) {
  const unmatched = new Set(gamePageContentByTitle.keys());
  const gamesWithContent = gameInputs.map((game) => {
    const content = gamePageContentByTitle.get(normalizeGameTitle(game.title));

    if (!content) {
      return game;
    }

    unmatched.delete(normalizeGameTitle(game.title));

    return {
      ...game,
      description: content.description,
      seoTitle: content.seoTitle,
      seoDescription: content.seoDescription
    };
  });

  if (unmatched.size > 0) {
    throw new Error(
      `Provided game page content could not be matched for: ${Array.from(unmatched).join(', ')}`
    );
  }

  return gamesWithContent;
}

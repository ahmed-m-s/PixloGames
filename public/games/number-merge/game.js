(() => {
  'use strict';

  const GRID_SIZE = 4;
  const START_TILE_COUNT = 2;
  const MOVE_THRESHOLD = 24;
  const STORAGE_KEY = 'pixlogames:number-merge:best-score';

  const keyToDirection = new Map([
    ['arrowup', 'up'],
    ['w', 'up'],
    ['arrowright', 'right'],
    ['d', 'right'],
    ['arrowdown', 'down'],
    ['s', 'down'],
    ['arrowleft', 'left'],
    ['a', 'left']
  ]);

  const tileThemes = [
    { min: 2, color: '#d8fff1', text: '#123229' },
    { min: 4, color: '#bff7ff', text: '#102e39' },
    { min: 8, color: '#8fd7ff', text: '#08293d' },
    { min: 16, color: '#78a7ff', text: '#071f42' },
    { min: 32, color: '#a58bff', text: '#1a103f' },
    { min: 64, color: '#d277ff', text: '#2a0a3a' },
    { min: 128, color: '#ff8cc6', text: '#3c1027' },
    { min: 256, color: '#ffb166', text: '#3b1c07' },
    { min: 512, color: '#ffe36d', text: '#382d05' },
    { min: 1024, color: '#9cff78', text: '#17330f' },
    { min: 2048, color: '#58ffc9', text: '#063125' }
  ];

  function shouldAutoStart() {
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }

  function applyEmbedMode() {
    if (shouldAutoStart()) {
      document.documentElement.classList.add('is-embedded-autostart');
    }
  }

  function handlePlatformMessage(event) {
    const data = event.data;

    if (
      event.origin !== window.location.origin ||
      !data ||
      typeof data !== 'object' ||
      data.type !== 'pixlo:fullscreen-state'
    ) {
      return;
    }

    document.documentElement.classList.toggle('is-platform-fullscreen', Boolean(data.isFullscreen));
  }

  class ScoreStorage {
    static readBestScore() {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      const parsedValue = Number.parseInt(rawValue || '0', 10);

      return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    static writeBestScore(score) {
      window.localStorage.setItem(STORAGE_KEY, String(score));
    }
  }

  class AudioSystem {
    playMove() {}

    playMerge() {}

    playMilestone() {}

    playGameOver() {}
  }

  class NumberMergeGame {
    constructor(nodes) {
      this.nodes = nodes;
      this.audio = new AudioSystem();
      this.state = 'start';
      this.tiles = [];
      this.score = 0;
      this.bestScore = ScoreStorage.readBestScore();
      this.nextTileId = 1;
      this.reachedMilestone = false;
      this.pointerStart = null;
      this.milestoneTimer = 0;

      this.renderGrid();
      this.updateScoreboard();
      this.bindEvents();
    }

    bindEvents() {
      this.nodes.startButtons.forEach((button) => {
        button.addEventListener('click', () => this.startGame());
      });

      window.addEventListener(
        'keydown',
        (event) => {
          const direction = keyToDirection.get(event.key.toLowerCase());

          if (!direction || this.state !== 'playing') {
            return;
          }

          event.preventDefault();
          this.move(direction);
        },
        true
      );

      this.nodes.board.addEventListener('pointerdown', (event) => {
        if (this.state !== 'playing') {
          return;
        }

        this.pointerStart = {
          x: event.clientX,
          y: event.clientY
        };
      });

      this.nodes.board.addEventListener('pointerup', (event) => {
        if (!this.pointerStart || this.state !== 'playing') {
          this.pointerStart = null;
          return;
        }

        const deltaX = event.clientX - this.pointerStart.x;
        const deltaY = event.clientY - this.pointerStart.y;
        this.pointerStart = null;

        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < MOVE_THRESHOLD) {
          return;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          this.move(deltaX > 0 ? 'right' : 'left');
          return;
        }

        this.move(deltaY > 0 ? 'down' : 'up');
      });

      this.nodes.board.addEventListener('pointercancel', () => {
        this.pointerStart = null;
      });
    }

    startGame() {
      this.state = 'playing';
      this.tiles = [];
      this.score = 0;
      this.nextTileId = 1;
      this.reachedMilestone = false;
      this.nodes.startScreen.classList.remove('is-visible');
      this.nodes.gameOverScreen.classList.remove('is-visible');
      this.nodes.milestone.classList.remove('is-visible');
      window.clearTimeout(this.milestoneTimer);

      for (let count = 0; count < START_TILE_COUNT; count += 1) {
        this.spawnTile();
      }

      this.setStatus('Merge matching tiles and keep the board alive.');
      this.updateScoreboard();
      this.renderTiles();
      window.requestAnimationFrame(() => {
        this.nodes.board.focus({ preventScroll: true });
      });
    }

    move(direction) {
      const result = this.buildMove(direction);

      if (!result.changed) {
        this.setStatus('No tiles can move that way.');
        return;
      }

      this.tiles = result.tiles;
      this.score += result.scoreGain;

      if (result.scoreGain > 0) {
        this.audio.playMerge();
      } else {
        this.audio.playMove();
      }

      this.spawnTile();
      this.checkMilestone();
      this.updateBestScore();
      this.updateScoreboard();
      this.renderTiles();

      if (!this.hasAvailableMove()) {
        this.endGame();
        return;
      }

      const message =
        result.scoreGain > 0
          ? `Merged for +${result.scoreGain}. Keep building.`
          : 'Nice move. Find the next merge.';
      this.setStatus(message);
    }

    buildMove(direction) {
      const lines = this.getTraversalLines(direction);
      const nextTiles = [];
      let scoreGain = 0;
      let changed = false;

      lines.forEach((line) => {
        const sourceTiles = line
          .map((position) => this.findTile(position.row, position.col))
          .filter(Boolean);

        let targetIndex = 0;

        for (let index = 0; index < sourceTiles.length; index += 1) {
          const currentTile = sourceTiles[index];
          const nextTile = sourceTiles[index + 1];
          const targetPosition = line[targetIndex];

          if (nextTile && currentTile.value === nextTile.value) {
            const mergedValue = currentTile.value * 2;
            nextTiles.push({
              id: currentTile.id,
              value: mergedValue,
              row: targetPosition.row,
              col: targetPosition.col,
              isNew: false,
              isMerged: true
            });
            scoreGain += mergedValue;
            changed = true;
            index += 1;
          } else {
            const movedTile = {
              ...currentTile,
              row: targetPosition.row,
              col: targetPosition.col,
              isNew: false,
              isMerged: false
            };
            nextTiles.push(movedTile);

            if (currentTile.row !== targetPosition.row || currentTile.col !== targetPosition.col) {
              changed = true;
            }
          }

          targetIndex += 1;
        }
      });

      return { tiles: nextTiles, scoreGain, changed };
    }

    getTraversalLines(direction) {
      const lines = [];
      const forward = [0, 1, 2, 3];
      const backward = [3, 2, 1, 0];

      if (direction === 'left' || direction === 'right') {
        const columns = direction === 'left' ? forward : backward;

        for (let row = 0; row < GRID_SIZE; row += 1) {
          lines.push(columns.map((col) => ({ row, col })));
        }

        return lines;
      }

      const rows = direction === 'up' ? forward : backward;

      for (let col = 0; col < GRID_SIZE; col += 1) {
        lines.push(rows.map((row) => ({ row, col })));
      }

      return lines;
    }

    spawnTile() {
      const emptyCells = this.getEmptyCells();

      if (emptyCells.length === 0) {
        return false;
      }

      const position = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      this.tiles.push({
        id: `tile-${this.nextTileId}`,
        value,
        row: position.row,
        col: position.col,
        isNew: true,
        isMerged: false
      });
      this.nextTileId += 1;

      return true;
    }

    getEmptyCells() {
      const emptyCells = [];

      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          if (!this.findTile(row, col)) {
            emptyCells.push({ row, col });
          }
        }
      }

      return emptyCells;
    }

    findTile(row, col) {
      return this.tiles.find((tile) => tile.row === row && tile.col === col) || null;
    }

    hasAvailableMove() {
      if (this.getEmptyCells().length > 0) {
        return true;
      }

      return this.tiles.some((tile) => {
        const rightTile = this.findTile(tile.row, tile.col + 1);
        const downTile = this.findTile(tile.row + 1, tile.col);

        return (
          (rightTile && rightTile.value === tile.value) ||
          (downTile && downTile.value === tile.value)
        );
      });
    }

    checkMilestone() {
      if (this.reachedMilestone || !this.tiles.some((tile) => tile.value >= 2048)) {
        return;
      }

      this.reachedMilestone = true;
      this.audio.playMilestone();
      this.nodes.milestone.classList.add('is-visible');
      window.clearTimeout(this.milestoneTimer);
      this.milestoneTimer = window.setTimeout(() => {
        this.nodes.milestone.classList.remove('is-visible');
      }, 2400);
    }

    updateBestScore() {
      if (this.score <= this.bestScore) {
        return;
      }

      this.bestScore = this.score;
      ScoreStorage.writeBestScore(this.bestScore);
    }

    endGame() {
      this.state = 'gameover';
      this.updateBestScore();
      this.audio.playGameOver();
      this.nodes.finalScore.textContent = String(this.score);
      this.nodes.finalBest.textContent = String(this.bestScore);
      this.nodes.gameOverScreen.classList.add('is-visible');
      this.setStatus('No more moves. Ready for another run?');
    }

    renderGrid() {
      this.nodes.grid.innerHTML = '';

      for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
        const cell = document.createElement('span');
        cell.className = 'cell';
        this.nodes.grid.appendChild(cell);
      }
    }

    renderTiles() {
      const activeIds = new Set(this.tiles.map((tile) => tile.id));
      const existingTiles = Array.from(this.nodes.tileLayer.querySelectorAll('.tile'));

      existingTiles.forEach((tileElement) => {
        if (!activeIds.has(tileElement.dataset.id || '')) {
          tileElement.remove();
        }
      });

      this.tiles.forEach((tile) => {
        let tileElement = this.nodes.tileLayer.querySelector(`[data-id="${tile.id}"]`);

        if (!tileElement) {
          tileElement = document.createElement('span');
          tileElement.className = 'tile';
          tileElement.dataset.id = tile.id;
          this.nodes.tileLayer.appendChild(tileElement);
        }

        const theme = this.getTileTheme(tile.value);
        tileElement.textContent = String(tile.value);
        tileElement.className = 'tile';
        tileElement.style.setProperty('--row', String(tile.row));
        tileElement.style.setProperty('--col', String(tile.col));
        tileElement.style.setProperty('--tile-color', theme.color);
        tileElement.style.setProperty('--tile-text', theme.text);

        if (tile.isNew) {
          tileElement.classList.add('is-new');
        }

        if (tile.isMerged) {
          tileElement.classList.add('is-merged');
        }

        window.setTimeout(() => {
          tile.isNew = false;
          tile.isMerged = false;
          tileElement.classList.remove('is-new', 'is-merged');
        }, 260);
      });
    }

    getTileTheme(value) {
      let selectedTheme = tileThemes[0];

      tileThemes.forEach((theme) => {
        if (value >= theme.min) {
          selectedTheme = theme;
        }
      });

      return selectedTheme;
    }

    updateScoreboard() {
      this.nodes.score.textContent = String(this.score);
      this.nodes.bestScore.textContent = String(this.bestScore);
    }

    setStatus(message) {
      this.nodes.status.textContent = message;
    }
  }

  const nodes = {
    board: document.querySelector('#board'),
    grid: document.querySelector('#grid'),
    tileLayer: document.querySelector('#tileLayer'),
    score: document.querySelector('#score'),
    bestScore: document.querySelector('#bestScore'),
    status: document.querySelector('#statusText'),
    startScreen: document.querySelector('#startScreen'),
    gameOverScreen: document.querySelector('#gameOverScreen'),
    finalScore: document.querySelector('#finalScore'),
    finalBest: document.querySelector('#finalBest'),
    milestone: document.querySelector('#milestone'),
    startButtons: document.querySelectorAll("[data-action='start']")
  };

  if (Object.values(nodes).some((node) => !node) || nodes.startButtons.length === 0) {
    throw new Error('Number Merge could not find the required game UI.');
  }

  applyEmbedMode();
  window.addEventListener('message', handlePlatformMessage);
  const game = new NumberMergeGame(nodes);

  if (shouldAutoStart()) {
    window.setTimeout(() => game.startGame(), 0);
  }
})();

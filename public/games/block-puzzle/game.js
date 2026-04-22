(() => {
  'use strict';

  const STORAGE_KEY = 'pixlogames:block-puzzle:best-score';
  const GRID_SIZE = 8;
  const COLORS = ['#5ef2b6', '#75d8ff', '#ffd166', '#ff8fab', '#a99bff', '#ffb86b'];
  const SHAPES = [
    { name: 'Dot', cells: [[0, 0]], weight: 6 },
    {
      name: 'Line 2',
      cells: [
        [0, 0],
        [1, 0]
      ],
      weight: 6
    },
    {
      name: 'Line 2',
      cells: [
        [0, 0],
        [0, 1]
      ],
      weight: 6
    },
    {
      name: 'Line 3',
      cells: [
        [0, 0],
        [1, 0],
        [2, 0]
      ],
      weight: 5
    },
    {
      name: 'Line 3',
      cells: [
        [0, 0],
        [0, 1],
        [0, 2]
      ],
      weight: 5
    },
    {
      name: 'Corner',
      cells: [
        [0, 0],
        [0, 1],
        [1, 1]
      ],
      weight: 5
    },
    {
      name: 'Corner',
      cells: [
        [1, 0],
        [0, 1],
        [1, 1]
      ],
      weight: 5
    },
    {
      name: 'Corner',
      cells: [
        [0, 0],
        [1, 0],
        [0, 1]
      ],
      weight: 5
    },
    {
      name: 'Corner',
      cells: [
        [0, 0],
        [1, 0],
        [1, 1]
      ],
      weight: 5
    },
    {
      name: 'Square',
      cells: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1]
      ],
      weight: 4
    },
    {
      name: 'Line 4',
      cells: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0]
      ],
      weight: 3
    },
    {
      name: 'Line 4',
      cells: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3]
      ],
      weight: 3
    },
    {
      name: 'Step',
      cells: [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1]
      ],
      weight: 3
    },
    {
      name: 'Step',
      cells: [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1]
      ],
      weight: 3
    },
    {
      name: 'T Block',
      cells: [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, 1]
      ],
      weight: 2
    },
    {
      name: 'Plus',
      cells: [
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [1, 2]
      ],
      weight: 1
    }
  ];

  const elements = {
    board: document.getElementById('board'),
    tray: document.getElementById('pieceTray'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    score: document.getElementById('score'),
    bestScore: document.getElementById('bestScore'),
    comboText: document.getElementById('comboText'),
    statusText: document.getElementById('statusText'),
    finalScore: document.getElementById('finalScore'),
    finalBest: document.getElementById('finalBest'),
    gameOverSummary: document.getElementById('gameOverSummary')
  };

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

  class Storage {
    static getBestScore() {
      try {
        return Number(localStorage.getItem(STORAGE_KEY)) || 0;
      } catch {
        return 0;
      }
    }

    static saveBestScore(score) {
      try {
        localStorage.setItem(STORAGE_KEY, String(score));
      } catch {
        // Storage availability should not affect the current run.
      }
    }
  }

  class AudioSystem {
    playPlace() {}
    playClear() {}
    playGameOver() {}
  }

  class BlockPuzzle {
    constructor(nodes) {
      this.nodes = nodes;
      this.audio = new AudioSystem();
      this.state = 'start';
      this.board = createEmptyBoard();
      this.pieces = [];
      this.selectedIndex = -1;
      this.score = 0;
      this.bestScore = Storage.getBestScore();
      this.combo = 1;
      this.messageTimer = 0;

      this.start = this.start.bind(this);
      this.restart = this.restart.bind(this);
      this.handlePieceClick = this.handlePieceClick.bind(this);
      this.handleBoardClick = this.handleBoardClick.bind(this);
      this.handleBoardPreview = this.handleBoardPreview.bind(this);
      this.clearPreview = this.clearPreview.bind(this);

      this.nodes.startButton.addEventListener('click', this.start);
      this.nodes.restartButton.addEventListener('click', this.restart);
      this.nodes.tray.addEventListener('click', this.handlePieceClick);
      this.nodes.board.addEventListener('click', this.handleBoardClick);
      this.nodes.board.addEventListener('pointerover', this.handleBoardPreview);
      this.nodes.board.addEventListener('pointerleave', this.clearPreview);

      this.renderBoard();
      this.renderPieces();
      this.updateStats();
    }

    start() {
      this.state = 'playing';
      this.board = createEmptyBoard();
      this.pieces = [];
      this.selectedIndex = -1;
      this.score = 0;
      this.combo = 1;
      this.nodes.startScreen.classList.remove('is-visible');
      this.nodes.gameOverScreen.classList.remove('is-visible');
      this.generatePieceSet();
      this.renderBoard();
      this.renderPieces();
      this.updateStats();
      this.setStatus('Select a piece, then choose where it should land.');
    }

    restart() {
      this.start();
    }

    generatePieceSet() {
      const nextPieces = [];

      for (let index = 0; index < 3; index += 1) {
        const shape = this.pickFittingShape();

        if (!shape) {
          this.endGame();
          return false;
        }

        nextPieces.push({
          id: `piece-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
          name: shape.name,
          cells: shape.cells,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          used: false
        });
      }

      this.pieces = nextPieces;
      this.selectedIndex = 0;
      return true;
    }

    pickFittingShape() {
      const maxCells = this.score < 500 ? 4 : 5;
      const fittingShapes = SHAPES.filter(
        (shape) => shape.cells.length <= maxCells && this.canShapeFitAnywhere(shape.cells)
      );

      if (fittingShapes.length === 0) {
        return null;
      }

      return pickWeighted(fittingShapes);
    }

    handlePieceClick(event) {
      const target = event.target instanceof Element ? event.target.closest('.piece-card') : null;

      if (!target || this.state !== 'playing') {
        return;
      }

      const index = Number(target.dataset.index);
      const piece = this.pieces[index];

      if (!piece || piece.used) {
        return;
      }

      this.selectedIndex = index;
      this.renderPieces();
      this.clearPreview();
      this.setStatus(`${piece.name} selected. Tap the board to preview placement.`);
    }

    handleBoardPreview(event) {
      if (this.state !== 'playing' || this.selectedIndex < 0) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest('.cell') : null;

      if (!target) {
        return;
      }

      this.previewPlacement(Number(target.dataset.row), Number(target.dataset.col));
    }

    handleBoardClick(event) {
      const target = event.target instanceof Element ? event.target.closest('.cell') : null;

      if (!target || this.state !== 'playing') {
        return;
      }

      if (this.selectedIndex < 0 || !this.pieces[this.selectedIndex]) {
        this.setStatus('Select one of the three pieces before placing.');
        return;
      }

      const row = Number(target.dataset.row);
      const col = Number(target.dataset.col);
      const piece = this.pieces[this.selectedIndex];

      if (!this.canPlace(piece, row, col)) {
        this.previewPlacement(row, col, true);
        this.setStatus('That piece does not fit there.');
        return;
      }

      this.placePiece(piece, row, col);
    }

    placePiece(piece, row, col) {
      const cells = getPlacedCells(piece, row, col);

      cells.forEach((cell) => {
        this.board[cell.row][cell.col] = piece.color;
      });

      piece.used = true;
      this.selectedIndex = this.getNextSelectablePieceIndex();
      this.score += piece.cells.length * 10;
      this.audio.playPlace();

      const clearedCells = this.clearCompletedLines();

      if (clearedCells.length > 0) {
        this.audio.playClear();
        this.combo += 1;
        this.score += clearedCells.lineCount * 100 + (this.combo - 1) * 60;
        this.setStatus(
          `${clearedCells.lineCount} line${clearedCells.lineCount === 1 ? '' : 's'} cleared. Combo x${this.combo}.`
        );
      } else {
        this.combo = 1;
        this.setStatus('Piece placed. Keep building toward full rows and columns.');
      }

      this.clearPreview();
      this.renderBoard();
      this.renderPieces();
      this.updateStats();

      if (clearedCells.length > 0) {
        this.flashCells(clearedCells);
      }

      if (this.pieces.every((candidate) => candidate.used)) {
        if (!this.generatePieceSet()) {
          return;
        }

        this.renderPieces();
        this.setStatus('Fresh pieces are ready.');
      }

      if (!this.hasAvailableMove()) {
        this.endGame();
      }
    }

    clearCompletedLines() {
      const rows = [];
      const cols = [];

      for (let row = 0; row < GRID_SIZE; row += 1) {
        if (this.board[row].every(Boolean)) {
          rows.push(row);
        }
      }

      for (let col = 0; col < GRID_SIZE; col += 1) {
        let full = true;

        for (let row = 0; row < GRID_SIZE; row += 1) {
          if (!this.board[row][col]) {
            full = false;
            break;
          }
        }

        if (full) {
          cols.push(col);
        }
      }

      const cleared = [];
      const clearedKeys = new Set();

      rows.forEach((row) => {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          clearedKeys.add(`${row}-${col}`);
        }
      });

      cols.forEach((col) => {
        for (let row = 0; row < GRID_SIZE; row += 1) {
          clearedKeys.add(`${row}-${col}`);
        }
      });

      clearedKeys.forEach((key) => {
        const [row, col] = key.split('-').map(Number);
        this.board[row][col] = null;
        cleared.push({ row, col });
      });

      cleared.lineCount = rows.length + cols.length;
      return cleared;
    }

    canPlace(piece, row, col) {
      return getPlacedCells(piece, row, col).every((cell) => {
        return (
          cell.row >= 0 &&
          cell.row < GRID_SIZE &&
          cell.col >= 0 &&
          cell.col < GRID_SIZE &&
          !this.board[cell.row][cell.col]
        );
      });
    }

    canShapeFitAnywhere(cells) {
      const fakePiece = { cells };

      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          if (this.canPlace(fakePiece, row, col)) {
            return true;
          }
        }
      }

      return false;
    }

    hasAvailableMove() {
      return this.pieces.some((piece) => !piece.used && this.canShapeFitAnywhere(piece.cells));
    }

    getNextSelectablePieceIndex() {
      return this.pieces.findIndex((piece) => !piece.used);
    }

    previewPlacement(row, col, holdInvalid = false) {
      const piece = this.pieces[this.selectedIndex];

      this.clearPreview();

      if (!piece || piece.used) {
        return;
      }

      const valid = this.canPlace(piece, row, col);
      const cells = getPlacedCells(piece, row, col);

      cells.forEach((cell) => {
        if (cell.row < 0 || cell.row >= GRID_SIZE || cell.col < 0 || cell.col >= GRID_SIZE) {
          return;
        }

        const node = this.getCellNode(cell.row, cell.col);
        node.style.setProperty('--preview-color', piece.color);
        node.classList.add(valid ? 'is-preview-valid' : 'is-preview-invalid');
      });

      if (!valid && holdInvalid) {
        window.clearTimeout(this.messageTimer);
        this.messageTimer = window.setTimeout(this.clearPreview, 420);
      }
    }

    clearPreview() {
      this.nodes.board
        .querySelectorAll('.is-preview-valid, .is-preview-invalid')
        .forEach((cell) => {
          cell.classList.remove('is-preview-valid', 'is-preview-invalid');
          cell.style.removeProperty('--preview-color');
        });
    }

    flashCells(cells) {
      cells.forEach((cell) => {
        const node = this.getCellNode(cell.row, cell.col);
        node.classList.add('is-pop');
      });

      window.setTimeout(() => {
        this.nodes.board.querySelectorAll('.is-pop').forEach((cell) => {
          cell.classList.remove('is-pop');
        });
      }, 260);
    }

    endGame() {
      this.state = 'gameover';
      this.audio.playGameOver();
      this.clearPreview();

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        Storage.saveBestScore(this.bestScore);
      }

      this.nodes.finalScore.textContent = String(this.score);
      this.nodes.finalBest.textContent = String(this.bestScore);
      this.nodes.gameOverSummary.textContent = `Your final score was ${this.score}.`;
      this.nodes.gameOverScreen.classList.add('is-visible');
      this.updateStats();
    }

    renderBoard() {
      const fragment = document.createDocumentFragment();
      this.nodes.board.innerHTML = '';

      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          const cell = document.createElement('button');
          const color = this.board[row][col];

          cell.className = 'cell';
          cell.type = 'button';
          cell.dataset.row = String(row);
          cell.dataset.col = String(col);
          cell.setAttribute('aria-label', `Board cell ${row + 1}, ${col + 1}`);

          if (color) {
            cell.classList.add('is-filled');
            cell.style.setProperty('--cell-color', color);
          }

          fragment.appendChild(cell);
        }
      }

      this.nodes.board.appendChild(fragment);
    }

    renderPieces() {
      const fragment = document.createDocumentFragment();
      this.nodes.tray.innerHTML = '';

      this.pieces.forEach((piece, index) => {
        const button = document.createElement('button');
        button.className = 'piece-card';
        button.type = 'button';
        button.dataset.index = String(index);

        if (piece.used) {
          button.classList.add('is-used');
          button.disabled = true;
        }

        if (index === this.selectedIndex && !piece.used) {
          button.classList.add('is-selected');
        }

        button.innerHTML = `
          <span class="piece-meta">
            <strong>${piece.name}</strong>
            <span>${piece.cells.length} block${piece.cells.length === 1 ? '' : 's'}</span>
          </span>
          ${createPieceMarkup(piece)}
        `;

        fragment.appendChild(button);
      });

      this.nodes.tray.appendChild(fragment);
    }

    updateStats() {
      this.nodes.score.textContent = String(this.score);
      this.nodes.bestScore.textContent = String(this.bestScore);
      this.nodes.comboText.textContent = `x${this.combo}`;
    }

    setStatus(message) {
      this.nodes.statusText.textContent = message;
    }

    getCellNode(row, col) {
      return this.nodes.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
  }

  function createEmptyBoard() {
    return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));
  }

  function getPlacedCells(piece, row, col) {
    return piece.cells.map(([x, y]) => ({
      row: row + y,
      col: col + x
    }));
  }

  function pickWeighted(shapes) {
    const totalWeight = shapes.reduce((total, shape) => total + shape.weight, 0);
    let target = Math.random() * totalWeight;

    for (const shape of shapes) {
      target -= shape.weight;

      if (target <= 0) {
        return shape;
      }
    }

    return shapes[shapes.length - 1];
  }

  function getPieceBounds(piece) {
    const width = Math.max(...piece.cells.map(([x]) => x)) + 1;
    const height = Math.max(...piece.cells.map(([, y]) => y)) + 1;

    return { width, height };
  }

  function createPieceMarkup(piece) {
    const bounds = getPieceBounds(piece);
    const occupied = new Set(piece.cells.map(([x, y]) => `${x}-${y}`));
    let cells = '';

    for (let y = 0; y < bounds.height; y += 1) {
      for (let x = 0; x < bounds.width; x += 1) {
        const filled = occupied.has(`${x}-${y}`);
        cells += `<span class="piece-cell${filled ? ' is-filled' : ''}"></span>`;
      }
    }

    return `
      <span
        class="piece-grid"
        style="grid-template-columns: repeat(${bounds.width}, 18px); --piece-color: ${piece.color}"
        aria-hidden="true"
      >${cells}</span>
    `;
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyEmbedMode();
    window.addEventListener('message', handlePlatformMessage);

    const game = new BlockPuzzle(elements);

    if (shouldAutoStart()) {
      window.setTimeout(() => game.start(), 0);
    }
  });
})();

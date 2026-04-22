(() => {
  'use strict';

  const STORAGE_KEY = 'pixlogames:color-sort:best-moves';
  const CAPACITY = 4;
  const COLORS = {
    mint: '#5ef2b6',
    aqua: '#75d8ff',
    sun: '#ffd166',
    rose: '#ff6b8a',
    violet: '#a99bff'
  };
  const PUZZLES = [
    [
      ['mint', 'aqua', 'aqua', 'mint'],
      ['rose', 'sun', 'sun', 'rose'],
      ['aqua', 'mint', 'rose', 'sun'],
      ['sun', 'rose', 'mint', 'aqua'],
      [],
      []
    ],
    [
      ['violet', 'mint', 'rose', 'aqua'],
      ['sun', 'aqua', 'mint', 'violet'],
      ['rose', 'sun', 'aqua', 'mint'],
      ['mint', 'rose', 'violet', 'sun'],
      ['aqua', 'violet', 'sun', 'rose'],
      [],
      []
    ],
    [
      ['aqua', 'sun', 'mint', 'rose'],
      ['violet', 'rose', 'aqua', 'sun'],
      ['mint', 'violet', 'sun', 'aqua'],
      ['rose', 'mint', 'violet', 'mint'],
      ['sun', 'aqua', 'rose', 'violet'],
      [],
      []
    ]
  ];

  const nodes = {
    board: document.getElementById('tubeBoard'),
    startScreen: document.getElementById('startScreen'),
    winScreen: document.getElementById('winScreen'),
    startButton: document.getElementById('startButton'),
    resetButton: document.getElementById('resetButton'),
    nextButton: document.getElementById('nextButton'),
    moves: document.getElementById('moves'),
    bestMoves: document.getElementById('bestMoves'),
    puzzleLabel: document.getElementById('puzzleLabel'),
    statusText: document.getElementById('statusText'),
    winSummary: document.getElementById('winSummary'),
    finalMoves: document.getElementById('finalMoves'),
    finalBest: document.getElementById('finalBest')
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

  function clonePuzzle(puzzle) {
    return puzzle.map((tube) => [...tube]);
  }

  function readBestMoves() {
    try {
      const value = Number(localStorage.getItem(STORAGE_KEY));

      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  function writeBestMoves(moves) {
    try {
      localStorage.setItem(STORAGE_KEY, String(moves));
    } catch {
      // Local bests are nice to have, not required to play.
    }
  }

  class ColorSortGame {
    constructor(ui) {
      this.ui = ui;
      this.levelIndex = 0;
      this.tubes = clonePuzzle(PUZZLES[this.levelIndex]);
      this.selectedIndex = -1;
      this.moves = 0;
      this.bestMoves = readBestMoves();
      this.state = 'start';

      this.start = this.start.bind(this);
      this.reset = this.reset.bind(this);
      this.nextPuzzle = this.nextPuzzle.bind(this);
      this.handleTubeClick = this.handleTubeClick.bind(this);

      this.ui.startButton.addEventListener('click', this.start);
      this.ui.resetButton.addEventListener('click', this.reset);
      this.ui.nextButton.addEventListener('click', this.nextPuzzle);
      this.ui.board.addEventListener('click', this.handleTubeClick);

      this.render();
      this.updateHud();
    }

    start() {
      this.state = 'playing';
      this.tubes = clonePuzzle(PUZZLES[this.levelIndex]);
      this.selectedIndex = -1;
      this.moves = 0;
      this.ui.startScreen.classList.remove('is-visible');
      this.ui.winScreen.classList.remove('is-visible');
      this.setStatus('Select a tube to pour from.');
      this.render();
      this.updateHud();
      window.requestAnimationFrame(() => this.ui.board.focus({ preventScroll: true }));
    }

    reset() {
      this.start();
    }

    nextPuzzle() {
      this.levelIndex = (this.levelIndex + 1) % PUZZLES.length;
      this.start();
    }

    handleTubeClick(event) {
      const tubeNode = event.target.closest('[data-index]');

      if (!tubeNode || this.state !== 'playing') {
        return;
      }

      const index = Number(tubeNode.dataset.index);

      if (this.selectedIndex === -1) {
        this.selectTube(index);
        return;
      }

      if (this.selectedIndex === index) {
        this.selectedIndex = -1;
        this.setStatus('Selection cleared. Choose a tube to pour from.');
        this.render();
        return;
      }

      if (this.tryMove(this.selectedIndex, index)) {
        this.selectedIndex = -1;
        this.moves += 1;
        this.updateHud();
        this.render();

        if (this.isSolved()) {
          this.finish();
          return;
        }

        this.setStatus('Nice pour. Keep grouping each color.');
        return;
      }

      this.setStatus('That pour is blocked. Match the top color or use an empty tube.');
      this.selectedIndex = this.tubes[index].length > 0 ? index : -1;
      this.render();
    }

    selectTube(index) {
      if (this.tubes[index].length === 0) {
        this.setStatus('Empty tubes can receive color, but cannot pour first.');
        return;
      }

      this.selectedIndex = index;
      this.setStatus('Now choose a matching or empty tube.');
      this.render();
    }

    tryMove(fromIndex, toIndex) {
      const source = this.tubes[fromIndex];
      const target = this.tubes[toIndex];

      if (source.length === 0 || target.length >= CAPACITY) {
        return false;
      }

      const color = source[source.length - 1];
      const targetColor = target[target.length - 1];

      if (targetColor && targetColor !== color) {
        return false;
      }

      const runLength = this.getTopRunLength(source);
      const availableSpace = CAPACITY - target.length;
      const pourCount = Math.min(runLength, availableSpace);

      for (let count = 0; count < pourCount; count += 1) {
        target.push(source.pop());
      }

      return true;
    }

    getTopRunLength(tube) {
      if (tube.length === 0) {
        return 0;
      }

      const color = tube[tube.length - 1];
      let count = 0;

      for (let index = tube.length - 1; index >= 0; index -= 1) {
        if (tube[index] !== color) {
          break;
        }

        count += 1;
      }

      return count;
    }

    isSolved() {
      return this.tubes.every((tube) => {
        if (tube.length === 0) {
          return true;
        }

        return tube.length === CAPACITY && tube.every((color) => color === tube[0]);
      });
    }

    finish() {
      this.state = 'complete';

      if (!this.bestMoves || this.moves < this.bestMoves) {
        this.bestMoves = this.moves;
        writeBestMoves(this.bestMoves);
      }

      this.ui.winSummary.textContent = `Solved in ${this.moves} moves.`;
      this.ui.finalMoves.textContent = String(this.moves);
      this.ui.finalBest.textContent = String(this.bestMoves);
      this.updateHud();
      this.setStatus('Puzzle solved. Clean tubes across the board.');
      this.ui.winScreen.classList.add('is-visible');
    }

    render() {
      this.ui.board.innerHTML = this.tubes
        .map((tube, tubeIndex) => {
          const segments = Array.from({ length: CAPACITY }, (_, segmentIndex) => {
            const color = tube[segmentIndex];

            if (!color) {
              return `<span class="segment"></span>`;
            }

            return `<span class="segment is-filled" style="--segment-color: ${COLORS[color]}"></span>`;
          }).join('');

          return `
            <button class="tube${this.selectedIndex === tubeIndex ? ' is-selected' : ''}" data-index="${tubeIndex}" type="button" aria-label="Tube ${tubeIndex + 1}">
              <span class="tube-inner">${segments}</span>
            </button>
          `;
        })
        .join('');
    }

    updateHud() {
      this.ui.moves.textContent = String(this.moves);
      this.ui.bestMoves.textContent = this.bestMoves ? String(this.bestMoves) : '--';
      this.ui.finalBest.textContent = this.bestMoves ? String(this.bestMoves) : '--';
      this.ui.puzzleLabel.textContent = String(this.levelIndex + 1);
    }

    setStatus(message) {
      this.ui.statusText.textContent = message;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyEmbedMode();
    window.addEventListener('message', handlePlatformMessage);

    const game = new ColorSortGame(nodes);

    if (shouldAutoStart()) {
      window.setTimeout(() => game.start(), 0);
    }
  });
})();

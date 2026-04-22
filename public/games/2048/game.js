(() => {
  'use strict';

  const SIZE = 4;
  const STORAGE_KEY = 'pixlogames:2048:best-score';
  const board = document.getElementById('board');

  const ui = {
    score: document.getElementById('scoreValue'),
    best: document.getElementById('bestValue'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    finalScore: document.getElementById('finalScore'),
    finalBest: document.getElementById('finalBest'),
    milestone: document.getElementById('milestone')
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
    static readBest() {
      try {
        return Number(localStorage.getItem(STORAGE_KEY)) || 0;
      } catch {
        return 0;
      }
    }

    static writeBest(score) {
      try {
        localStorage.setItem(STORAGE_KEY, String(score));
      } catch {
        // Storage can be unavailable in strict private browsing contexts.
      }
    }
  }

  class Game2048 {
    constructor() {
      this.grid = this.createGrid();
      this.score = 0;
      this.best = Storage.readBest();
      this.state = 'start';
      this.touchStart = null;
      this.reachedMilestone = false;

      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);
      this.start = this.start.bind(this);

      window.addEventListener('keydown', this.handleKeyDown, true);
      board.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      board.addEventListener('touchend', this.handleTouchEnd, { passive: false });
      ui.startButton.addEventListener('click', this.start);
      ui.restartButton.addEventListener('click', this.start);

      this.render();
      this.updateUi();

      if (shouldAutoStart()) {
        window.setTimeout(() => this.start(), 0);
      }
    }

    createGrid() {
      return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
    }

    start() {
      this.grid = this.createGrid();
      this.score = 0;
      this.state = 'playing';
      this.reachedMilestone = false;
      ui.startScreen.classList.remove('is-visible');
      ui.gameOverScreen.classList.remove('is-visible');
      this.addTile();
      this.addTile();
      this.render();
      this.updateUi();
    }

    addTile() {
      const empty = [];

      for (let row = 0; row < SIZE; row += 1) {
        for (let col = 0; col < SIZE; col += 1) {
          if (this.grid[row][col] === 0) {
            empty.push({ row, col });
          }
        }
      }

      if (empty.length === 0) return;

      const target = empty[Math.floor(Math.random() * empty.length)];
      this.grid[target.row][target.col] = Math.random() < 0.9 ? 2 : 4;
    }

    handleKeyDown(event) {
      const map = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right'
      };
      const direction = map[event.code];

      if (!direction) return;

      event.preventDefault();
      this.move(direction);
    }

    handleTouchStart(event) {
      event.preventDefault();
      const touch = event.changedTouches[0];
      this.touchStart = { x: touch.clientX, y: touch.clientY };
    }

    handleTouchEnd(event) {
      event.preventDefault();

      if (!this.touchStart) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.touchStart.x;
      const dy = touch.clientY - this.touchStart.y;
      this.touchStart = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;

      this.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    }

    getLine(index, direction) {
      if (direction === 'left') return this.grid[index].slice();
      if (direction === 'right') return this.grid[index].slice().reverse();

      const line = this.grid.map((row) => row[index]);
      return direction === 'down' ? line.reverse() : line;
    }

    setLine(index, direction, line) {
      const values = direction === 'right' || direction === 'down' ? line.slice().reverse() : line;

      if (direction === 'left' || direction === 'right') {
        this.grid[index] = values;
        return;
      }

      for (let row = 0; row < SIZE; row += 1) {
        this.grid[row][index] = values[row];
      }
    }

    mergeLine(line) {
      const compact = line.filter(Boolean);
      const merged = [];
      let gained = 0;

      for (let index = 0; index < compact.length; index += 1) {
        if (compact[index] === compact[index + 1]) {
          const value = compact[index] * 2;
          merged.push(value);
          gained += value;
          index += 1;
        } else {
          merged.push(compact[index]);
        }
      }

      while (merged.length < SIZE) {
        merged.push(0);
      }

      return { line: merged, gained };
    }

    move(direction) {
      if (this.state !== 'playing') return;

      const before = JSON.stringify(this.grid);
      let gained = 0;

      for (let index = 0; index < SIZE; index += 1) {
        const result = this.mergeLine(this.getLine(index, direction));
        gained += result.gained;
        this.setLine(index, direction, result.line);
      }

      if (JSON.stringify(this.grid) === before) return;

      this.score += gained;
      this.addTile();
      this.updateBest();
      this.checkMilestone();
      this.render();
      this.updateUi();

      if (!this.hasAvailableMove()) {
        this.gameOver();
      }
    }

    checkMilestone() {
      if (this.reachedMilestone || !this.grid.some((row) => row.includes(2048))) {
        return;
      }

      this.reachedMilestone = true;
      ui.milestone.classList.add('is-visible');
      window.setTimeout(() => ui.milestone.classList.remove('is-visible'), 1500);
    }

    hasAvailableMove() {
      for (let row = 0; row < SIZE; row += 1) {
        for (let col = 0; col < SIZE; col += 1) {
          const value = this.grid[row][col];

          if (
            value === 0 ||
            this.grid[row]?.[col + 1] === value ||
            this.grid[row + 1]?.[col] === value
          ) {
            return true;
          }
        }
      }

      return false;
    }

    updateBest() {
      if (this.score > this.best) {
        this.best = this.score;
        Storage.writeBest(this.best);
      }
    }

    gameOver() {
      this.state = 'gameover';
      this.updateBest();
      ui.finalScore.textContent = String(this.score);
      ui.finalBest.textContent = String(this.best);
      ui.gameOverScreen.classList.add('is-visible');
      this.updateUi();
    }

    updateUi() {
      ui.score.textContent = String(this.score);
      ui.best.textContent = String(this.best);
    }

    render() {
      const fragment = document.createDocumentFragment();
      board.innerHTML = '';

      this.grid.flat().forEach((value) => {
        const cell = document.createElement('div');
        const tileClass = value > 2048 ? 'tile-super' : `tile-${value}`;
        cell.className = value ? `cell ${tileClass}` : 'cell is-empty';
        cell.textContent = value ? String(value) : '';
        fragment.appendChild(cell);
      });

      board.appendChild(fragment);
    }
  }

  applyEmbedMode();
  window.addEventListener('message', handlePlatformMessage);
  window.addEventListener('DOMContentLoaded', () => new Game2048());
})();

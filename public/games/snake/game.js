(() => {
  'use strict';

  const GRID = 20;
  const CELL = 32;
  const SIZE = GRID * CELL;
  const STORAGE_KEY = 'pixlogames:snake:best-score';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const ui = {
    score: document.getElementById('scoreValue'),
    best: document.getElementById('bestValue'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    finalScore: document.getElementById('finalScore'),
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
        // Storage can be unavailable in private browsing contexts.
      }
    }
  }

  class SnakeGame {
    constructor() {
      this.best = Storage.readBest();
      this.touchStart = null;
      this.raf = 0;
      this.lastStep = 0;

      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);
      this.loop = this.loop.bind(this);
      this.start = this.start.bind(this);

      window.addEventListener('keydown', this.handleKeyDown, true);
      canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
      ui.startButton.addEventListener('click', this.start);
      ui.restartButton.addEventListener('click', this.start);

      this.reset();
      this.draw();
      this.updateUi();

      if (shouldAutoStart()) {
        window.setTimeout(() => this.start(), 0);
      }
    }

    reset() {
      this.state = 'start';
      this.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ];
      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
      this.score = 0;
      this.food = this.spawnFood();
      this.lastStep = 0;
    }

    start() {
      cancelAnimationFrame(this.raf);
      this.reset();
      this.state = 'playing';
      ui.startScreen.classList.remove('is-visible');
      ui.gameOverScreen.classList.remove('is-visible');
      this.updateUi();
      this.raf = requestAnimationFrame(this.loop);
    }

    spawnFood() {
      let food;

      do {
        food = {
          x: Math.floor(Math.random() * GRID),
          y: Math.floor(Math.random() * GRID)
        };
      } while (this.snake.some((part) => part.x === food.x && part.y === food.y));

      return food;
    }

    handleKeyDown(event) {
      const map = {
        ArrowUp: { x: 0, y: -1 },
        KeyW: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        KeyS: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        KeyA: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyD: { x: 1, y: 0 }
      };
      const direction = map[event.code];

      if (!direction) return;

      event.preventDefault();
      this.queueDirection(direction);
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

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

      this.queueDirection(
        Math.abs(dx) > Math.abs(dy) ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 }
      );
    }

    queueDirection(direction) {
      if (this.state === 'start' || this.state === 'gameover') {
        this.start();
        return;
      }

      if (direction.x + this.direction.x === 0 && direction.y + this.direction.y === 0) {
        return;
      }

      this.nextDirection = direction;
    }

    loop(time) {
      if (time - this.lastStep > 112) {
        this.lastStep = time;
        this.step();
      }

      this.draw();
      this.raf = requestAnimationFrame(this.loop);
    }

    step() {
      this.direction = this.nextDirection;
      const head = this.snake[0];
      const nextHead = {
        x: head.x + this.direction.x,
        y: head.y + this.direction.y
      };

      if (
        nextHead.x < 0 ||
        nextHead.y < 0 ||
        nextHead.x >= GRID ||
        nextHead.y >= GRID ||
        this.snake.some((part) => part.x === nextHead.x && part.y === nextHead.y)
      ) {
        this.gameOver();
        return;
      }

      this.snake.unshift(nextHead);

      if (nextHead.x === this.food.x && nextHead.y === this.food.y) {
        this.score += 10;
        this.food = this.spawnFood();
        this.updateUi();
        return;
      }

      this.snake.pop();
    }

    gameOver() {
      this.state = 'gameover';
      cancelAnimationFrame(this.raf);

      if (this.score > this.best) {
        this.best = this.score;
        Storage.writeBest(this.best);
      }

      ui.finalScore.textContent = String(this.score);
      ui.finalBest.textContent = String(this.best);
      ui.gameOverScreen.classList.add('is-visible');
      this.updateUi();
      this.draw();
    }

    updateUi() {
      ui.score.textContent = String(this.score);
      ui.best.textContent = String(this.best);
    }

    drawCell(x, y, color, radius = 8) {
      const px = x * CELL + 3;
      const py = y * CELL + 3;
      const size = CELL - 6;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(px, py, size, size, radius);
      ctx.fill();
    }

    draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#071014';
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;

      for (let index = 0; index <= GRID; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * CELL, 0);
        ctx.lineTo(index * CELL, SIZE);
        ctx.moveTo(0, index * CELL);
        ctx.lineTo(SIZE, index * CELL);
        ctx.stroke();
      }

      this.drawCell(this.food.x, this.food.y, '#ffd166', 10);

      this.snake.forEach((part, index) => {
        this.drawCell(index === 0 ? part.x : part.x, part.y, index === 0 ? '#75d8ff' : '#5ef2b6');
      });
    }
  }

  applyEmbedMode();
  window.addEventListener('message', handlePlatformMessage);
  window.addEventListener('DOMContentLoaded', () => new SnakeGame());
})();

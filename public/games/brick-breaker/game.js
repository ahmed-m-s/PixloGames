(() => {
  'use strict';

  const WIDTH = 960;
  const HEIGHT = 540;
  const STORAGE_KEY = 'pixlogames:brick-breaker:best-score';

  const canvas = document.getElementById('gameCanvas');
  const frame = document.getElementById('gameFrame');
  const ctx = canvas.getContext('2d');

  const ui = {
    score: document.getElementById('scoreValue'),
    lives: document.getElementById('livesValue'),
    best: document.getElementById('bestValue'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    endTitle: document.getElementById('endTitle'),
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
        // Storage may be blocked in some embedded contexts.
      }
    }
  }

  class BrickBreaker {
    constructor() {
      this.best = Storage.readBest();
      this.keys = new Set();
      this.raf = 0;
      this.lastTime = 0;

      this.loop = this.loop.bind(this);
      this.start = this.start.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);

      window.addEventListener('keydown', this.handleKeyDown, true);
      window.addEventListener('keyup', this.handleKeyUp);
      frame.addEventListener('pointermove', this.handlePointerMove, { passive: false });
      frame.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
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
      this.score = 0;
      this.lives = 3;
      this.paddle = {
        x: WIDTH / 2 - 70,
        y: HEIGHT - 54,
        width: 140,
        height: 16,
        speed: 760
      };
      this.ball = {
        x: WIDTH / 2,
        y: HEIGHT - 78,
        radius: 10,
        vx: 260,
        vy: -340,
        stuck: true
      };
      this.bricks = this.createBricks();
    }

    createBricks() {
      const bricks = [];
      const rows = 5;
      const cols = 9;
      const gap = 10;
      const width = 86;
      const height = 24;
      const startX = (WIDTH - cols * width - (cols - 1) * gap) / 2;
      const colors = ['#5ef2b6', '#75d8ff', '#ffd166', '#ff8fab', '#b6ffd8'];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          bricks.push({
            x: startX + col * (width + gap),
            y: 72 + row * (height + gap),
            width,
            height,
            color: colors[row % colors.length],
            alive: true
          });
        }
      }

      return bricks;
    }

    start() {
      cancelAnimationFrame(this.raf);
      this.reset();
      this.state = 'playing';
      ui.startScreen.classList.remove('is-visible');
      ui.gameOverScreen.classList.remove('is-visible');
      this.lastTime = 0;
      this.updateUi();
      this.raf = requestAnimationFrame(this.loop);
    }

    handleKeyDown(event) {
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'Space') {
        event.preventDefault();
      }

      if (event.code === 'Space') {
        this.launch();
        return;
      }

      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        this.keys.add(event.code);
      }
    }

    handleKeyUp(event) {
      this.keys.delete(event.code);
    }

    handlePointerMove(event) {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
      this.paddle.x = clamp(x - this.paddle.width / 2, 18, WIDTH - this.paddle.width - 18);
    }

    handlePointerDown(event) {
      event.preventDefault();

      if (this.state === 'start' || this.state === 'gameover') {
        this.start();
        return;
      }

      this.launch();
    }

    launch() {
      if (this.state === 'playing' && this.ball.stuck) {
        this.ball.stuck = false;
      }
    }

    loop(time) {
      const delta = Math.min((time - this.lastTime) / 1000 || 0, 0.033);
      this.lastTime = time;

      this.update(delta);
      this.draw();
      this.raf = requestAnimationFrame(this.loop);
    }

    update(delta) {
      if (this.keys.has('ArrowLeft')) {
        this.paddle.x -= this.paddle.speed * delta;
      }

      if (this.keys.has('ArrowRight')) {
        this.paddle.x += this.paddle.speed * delta;
      }

      this.paddle.x = clamp(this.paddle.x, 18, WIDTH - this.paddle.width - 18);

      if (this.ball.stuck) {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius - 3;
        return;
      }

      this.ball.x += this.ball.vx * delta;
      this.ball.y += this.ball.vy * delta;

      if (this.ball.x <= this.ball.radius || this.ball.x >= WIDTH - this.ball.radius) {
        this.ball.vx *= -1;
        this.ball.x = clamp(this.ball.x, this.ball.radius, WIDTH - this.ball.radius);
      }

      if (this.ball.y <= this.ball.radius) {
        this.ball.vy *= -1;
        this.ball.y = this.ball.radius;
      }

      if (
        this.ball.y + this.ball.radius >= this.paddle.y &&
        this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
        this.ball.x >= this.paddle.x &&
        this.ball.x <= this.paddle.x + this.paddle.width &&
        this.ball.vy > 0
      ) {
        const hit =
          (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        this.ball.vx = hit * 430;
        this.ball.vy = -Math.abs(this.ball.vy) - 8;
      }

      for (const brick of this.bricks) {
        if (!brick.alive || !this.collidesBrick(brick)) continue;

        brick.alive = false;
        this.ball.vy *= -1;
        this.score += 25;
        this.updateUi();
        break;
      }

      if (this.bricks.every((brick) => !brick.alive)) {
        this.finish('Board Cleared');
      }

      if (this.ball.y - this.ball.radius > HEIGHT) {
        this.lives -= 1;
        this.updateUi();

        if (this.lives <= 0) {
          this.finish('Game Over');
          return;
        }

        this.ball.stuck = true;
        this.ball.vx = Math.random() > 0.5 ? 260 : -260;
        this.ball.vy = -340;
      }
    }

    collidesBrick(brick) {
      return (
        this.ball.x + this.ball.radius >= brick.x &&
        this.ball.x - this.ball.radius <= brick.x + brick.width &&
        this.ball.y + this.ball.radius >= brick.y &&
        this.ball.y - this.ball.radius <= brick.y + brick.height
      );
    }

    finish(title) {
      this.state = 'gameover';
      cancelAnimationFrame(this.raf);

      if (this.score > this.best) {
        this.best = this.score;
        Storage.writeBest(this.best);
      }

      ui.endTitle.textContent = title;
      ui.finalScore.textContent = String(this.score);
      ui.finalBest.textContent = String(this.best);
      ui.gameOverScreen.classList.add('is-visible');
      this.updateUi();
      this.draw();
    }

    updateUi() {
      ui.score.textContent = String(this.score);
      ui.lives.textContent = String(this.lives);
      ui.best.textContent = String(this.best);
    }

    drawRoundRect(x, y, width, height, radius) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    }

    draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      background.addColorStop(0, '#101827');
      background.addColorStop(1, '#071014');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      for (const brick of this.bricks) {
        if (!brick.alive) continue;

        ctx.fillStyle = brick.color;
        this.drawRoundRect(brick.x, brick.y, brick.width, brick.height, 7);
      }

      ctx.fillStyle = '#5ef2b6';
      this.drawRoundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      ctx.fill();

      if (this.ball.stuck && this.state === 'playing') {
        ctx.fillStyle = 'rgba(255,255,255,0.68)';
        ctx.font = '700 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space or tap to launch', WIDTH / 2, HEIGHT - 100);
      }
    }
  }

  applyEmbedMode();
  window.addEventListener('message', handlePlatformMessage);
  window.addEventListener('DOMContentLoaded', () => new BrickBreaker());
})();

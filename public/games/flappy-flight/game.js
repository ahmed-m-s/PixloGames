(() => {
  'use strict';

  const WIDTH = 960;
  const HEIGHT = 540;
  const STORAGE_KEY = 'pixlogames:flappy-flight:best-score';
  const canvas = document.getElementById('gameCanvas');
  const frame = document.getElementById('gameFrame');
  const ctx = canvas.getContext('2d');

  const ui = {
    score: document.getElementById('scoreValue'),
    best: document.getElementById('bestValue'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    finalScore: document.getElementById('finalScore'),
    finalBest: document.getElementById('finalBest'),
    playHint: document.getElementById('playHint')
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

  function drawRoundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
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
        // Embedded storage availability should not interrupt play.
      }
    }
  }

  class AudioSystem {
    playFlap() {}
    playScore() {}
    playHit() {}
  }

  class FlappyFlight {
    constructor() {
      this.audio = new AudioSystem();
      this.bestScore = Storage.readBest();
      this.lastTime = performance.now();
      this.spawnTimer = 0;
      this.backgroundOffset = 0;
      this.pipes = [];
      this.state = 'start';
      this.score = 0;
      this.lastDisplayedScore = -1;
      this.lastDisplayedBest = -1;

      this.handleInput = this.handleInput.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.loop = this.loop.bind(this);

      window.addEventListener('keydown', this.handleKeyDown, true);
      frame.addEventListener('pointerdown', this.handleInput, { passive: false });
      ui.startButton.addEventListener('click', this.handleInput);
      ui.restartButton.addEventListener('click', this.handleInput);

      this.resetFlight();
      this.updateUi(true);

      if (shouldAutoStart()) {
        window.setTimeout(() => this.start(), 0);
      }

      requestAnimationFrame(this.loop);
    }

    resetFlight() {
      this.bird = {
        x: 178,
        y: HEIGHT * 0.48,
        radius: 24,
        velocity: 0,
        rotation: 0
      };
      this.pipes = [];
      this.spawnTimer = 0.3;
      this.score = 0;
      this.speed = 215;
      this.gap = 170;
      this.state = this.state === 'start' ? 'start' : 'playing';
    }

    start() {
      this.state = 'playing';
      this.resetFlight();
      ui.startScreen.classList.add('hidden');
      ui.gameOverScreen.classList.add('hidden');
      ui.playHint.textContent = 'Space, ↑, click, or tap to flap';
      this.updateUi(true);
      window.requestAnimationFrame(() => frame.focus({ preventScroll: true }));
    }

    handleKeyDown(event) {
      if (!['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
        return;
      }

      event.preventDefault();
      this.handleInput(event);
    }

    handleInput(event) {
      if (
        event.type === 'pointerdown' &&
        event.target instanceof Element &&
        event.target.closest('button')
      ) {
        return;
      }

      event.preventDefault?.();

      if (this.state === 'start' || this.state === 'gameover') {
        this.start();
        return;
      }

      this.flap();
    }

    flap() {
      if (this.state !== 'playing') {
        return;
      }

      this.bird.velocity = -405;
      this.audio.playFlap();
    }

    loop(now) {
      const delta = Math.min((now - this.lastTime) / 1000, 0.032);
      this.lastTime = now;

      if (this.state === 'playing') {
        this.update(delta);
      }

      this.draw();
      requestAnimationFrame(this.loop);
    }

    update(delta) {
      this.backgroundOffset += delta * this.speed;
      this.speed = Math.min(330, 215 + this.score * 5);
      this.gap = Math.max(136, 170 - this.score * 1.2);
      this.spawnTimer -= delta;

      if (this.spawnTimer <= 0) {
        this.spawnPipe();
        this.spawnTimer = 1.42;
      }

      this.bird.velocity += 1040 * delta;
      this.bird.y += this.bird.velocity * delta;
      this.bird.rotation = Math.max(-0.55, Math.min(0.9, this.bird.velocity / 520));

      for (const pipe of this.pipes) {
        pipe.x -= this.speed * delta;

        if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
          pipe.passed = true;
          this.score += 1;
          this.audio.playScore();
          this.updateUi();
        }

        if (this.collidesWithPipe(pipe)) {
          this.endGame();
          return;
        }
      }

      this.pipes = this.pipes.filter((pipe) => pipe.x + pipe.width > -40);

      if (this.bird.y - this.bird.radius < 0 || this.bird.y + this.bird.radius > HEIGHT - 48) {
        this.endGame();
      }
    }

    spawnPipe() {
      const margin = 92;
      const center = margin + Math.random() * (HEIGHT - 48 - margin * 2);

      this.pipes.push({
        x: WIDTH + 20,
        width: 82,
        gapTop: center - this.gap / 2,
        gapBottom: center + this.gap / 2,
        passed: false
      });
    }

    collidesWithPipe(pipe) {
      const birdLeft = this.bird.x - this.bird.radius;
      const birdRight = this.bird.x + this.bird.radius;
      const birdTop = this.bird.y - this.bird.radius;
      const birdBottom = this.bird.y + this.bird.radius;
      const withinX = birdRight > pipe.x && birdLeft < pipe.x + pipe.width;

      if (!withinX) {
        return false;
      }

      return birdTop < pipe.gapTop || birdBottom > pipe.gapBottom;
    }

    endGame() {
      if (this.state !== 'playing') {
        return;
      }

      this.state = 'gameover';
      this.audio.playHit();
      this.bestScore = Math.max(this.bestScore, this.score);
      Storage.writeBest(this.bestScore);
      this.updateUi(true);
      ui.finalScore.textContent = String(this.score);
      ui.finalBest.textContent = String(this.bestScore);
      ui.gameOverScreen.classList.remove('hidden');
      ui.playHint.textContent = 'Tap or press Space to fly again';
    }

    updateUi(force = false) {
      if (force || this.score !== this.lastDisplayedScore) {
        ui.score.textContent = String(this.score);
        this.lastDisplayedScore = this.score;
      }

      if (force || this.bestScore !== this.lastDisplayedBest) {
        ui.best.textContent = String(this.bestScore);
        this.lastDisplayedBest = this.bestScore;
      }
    }

    draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      this.drawBackground();
      this.pipes.forEach((pipe) => this.drawPipe(pipe));
      this.drawGround();
      this.drawBird();
    }

    drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#101d32');
      sky.addColorStop(0.58, '#142035');
      sky.addColorStop(1, '#0a101b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = 'rgba(103, 217, 255, 0.16)';
      for (let i = 0; i < 12; i += 1) {
        const rawX = i * 116 - this.backgroundOffset * 0.28;
        const x = (((rawX % (WIDTH + 140)) + WIDTH + 140) % (WIDTH + 140)) - 90;
        const y = 70 + (i % 4) * 52;
        drawRoundRect(ctx, x, y, 78 + (i % 3) * 24, 18, 10);
        ctx.fill();
      }
    }

    drawPipe(pipe) {
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      gradient.addColorStop(0, '#37df91');
      gradient.addColorStop(0.55, '#62ffae');
      gradient.addColorStop(1, '#1bb978');

      ctx.fillStyle = gradient;
      drawRoundRect(ctx, pipe.x, -18, pipe.width, pipe.gapTop + 18, 12);
      ctx.fill();
      drawRoundRect(ctx, pipe.x - 8, pipe.gapTop - 22, pipe.width + 16, 22, 10);
      ctx.fill();
      drawRoundRect(ctx, pipe.x, pipe.gapBottom, pipe.width, HEIGHT - pipe.gapBottom - 48, 12);
      ctx.fill();
      drawRoundRect(ctx, pipe.x - 8, pipe.gapBottom, pipe.width + 16, 22, 10);
      ctx.fill();
    }

    drawGround() {
      ctx.fillStyle = '#0e1725';
      ctx.fillRect(0, HEIGHT - 48, WIDTH, 48);
      ctx.strokeStyle = 'rgba(98, 255, 174, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT - 48.5);
      ctx.lineTo(WIDTH, HEIGHT - 48.5);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
      ctx.lineWidth = 2;
      for (let x = -60 - (this.backgroundOffset % 60); x < WIDTH + 60; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, HEIGHT - 22);
        ctx.lineTo(x + 30, HEIGHT - 22);
        ctx.stroke();
      }
    }

    drawBird() {
      ctx.save();
      ctx.translate(this.bird.x, this.bird.y);
      ctx.rotate(this.bird.rotation);
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.lineWidth = 3;
      drawRoundRect(ctx, -26, -20, 52, 40, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#62ffae';
      drawRoundRect(ctx, -12, 5, 32, 12, 8);
      ctx.fill();

      ctx.fillStyle = '#f8fbff';
      ctx.beginPath();
      ctx.arc(10, -7, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#061018';
      ctx.beginPath();
      ctx.arc(12, -7, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff746b';
      ctx.beginPath();
      ctx.moveTo(25, -2);
      ctx.lineTo(43, 5);
      ctx.lineTo(25, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  applyEmbedMode();
  window.addEventListener('message', handlePlatformMessage);
  new FlappyFlight();
})();

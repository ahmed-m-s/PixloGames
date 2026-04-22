(() => {
  'use strict';

  const LOGICAL_WIDTH = 960;
  const LOGICAL_HEIGHT = 540;
  const GROUND_Y = 432;
  const STORAGE_KEY = 'pixlogames:endless-runner:best-score';

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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

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
        // Private browsing or embedded contexts may block storage.
      }
    }
  }

  class AudioSystem {
    constructor() {
      this.enabled = true;
    }

    playJump() {
      // Hook future jump sound here.
    }

    playHit() {
      // Hook future collision sound here.
    }

    playScore() {
      // Hook future score milestone sound here.
    }
  }

  class InputHandler {
    constructor(target, callbacks) {
      this.callbacks = callbacks;
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onMessage = this.onMessage.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);

      window.addEventListener('keydown', this.onKeyDown, true);
      window.addEventListener('message', this.onMessage);
      target.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    }

    onKeyDown(event) {
      if (event.code === 'ArrowUp') {
        event.preventDefault();
        this.callbacks.action();
      }
    }

    onMessage(event) {
      const data = event.data;

      if (
        event.origin !== window.location.origin ||
        !data ||
        typeof data !== 'object' ||
        data.type !== 'pixlo:game-input' ||
        data.code !== 'ArrowUp'
      ) {
        return;
      }

      this.callbacks.action();
    }

    onPointerDown(event) {
      event.preventDefault();
      this.callbacks.action();
    }

    destroy(target) {
      window.removeEventListener('keydown', this.onKeyDown, true);
      window.removeEventListener('message', this.onMessage);
      target.removeEventListener('pointerdown', this.onPointerDown);
    }
  }

  class Player {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = 118;
      this.width = 52;
      this.height = 68;
      this.y = GROUND_Y - this.height;
      this.velocityY = 0;
      this.grounded = true;
      this.runTime = 0;
      this.squash = 0;
    }

    jump() {
      if (!this.grounded) return false;

      this.velocityY = -760;
      this.grounded = false;
      this.squash = 1;
      return true;
    }

    update(delta) {
      this.runTime += delta;
      this.velocityY += 2100 * delta;
      this.y += this.velocityY * delta;

      const floor = GROUND_Y - this.height;
      if (this.y >= floor) {
        this.y = floor;
        this.velocityY = 0;
        this.grounded = true;
      }

      this.squash = Math.max(0, this.squash - delta * 5);
    }

    getBounds() {
      return {
        x: this.x + 8,
        y: this.y + 8,
        width: this.width - 14,
        height: this.height - 10
      };
    }

    draw(context) {
      const bob = this.grounded ? Math.sin(this.runTime * 14) * 2 : 0;
      const stretch = this.squash * 5;
      const x = this.x;
      const y = this.y + bob + stretch;
      const bodyHeight = this.height - stretch;

      context.save();
      context.shadowColor = 'rgba(98, 255, 174, 0.22)';
      context.shadowBlur = 18;

      const gradient = context.createLinearGradient(x, y, x + this.width, y + bodyHeight);
      gradient.addColorStop(0, '#67d9ff');
      gradient.addColorStop(1, '#62ffae');
      context.fillStyle = gradient;
      drawRoundRect(context, x, y, this.width, bodyHeight, 14);
      context.fill();

      context.shadowBlur = 0;
      context.fillStyle = '#071018';
      context.beginPath();
      context.arc(x + 35, y + 20, 4, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = 'rgba(4, 17, 10, 0.72)';
      const legCycle = Math.sin(this.runTime * 18);
      drawRoundRect(context, x + 10, y + bodyHeight - 10, 14, 22 + legCycle * 4, 6);
      context.fill();
      drawRoundRect(context, x + 31, y + bodyHeight - 10, 14, 22 - legCycle * 4, 6);
      context.fill();

      context.restore();
    }
  }

  class Obstacle {
    constructor(x, speed) {
      this.x = x;
      this.width = random(30, 58);
      this.height = random(42, 92);
      this.y = GROUND_Y - this.height;
      this.speed = speed;
      this.hue = Math.random() > 0.5 ? 'ember' : 'sun';
      this.passed = false;
    }

    update(delta, speed) {
      this.x -= speed * delta;
    }

    getBounds() {
      return {
        x: this.x + 4,
        y: this.y + 4,
        width: this.width - 8,
        height: this.height - 4
      };
    }

    draw(context) {
      const color = this.hue === 'ember' ? '#ff6a5e' : '#ffd166';
      const dark = this.hue === 'ember' ? '#9f2d38' : '#9d6f19';

      context.save();
      context.fillStyle = color;
      context.shadowColor =
        this.hue === 'ember' ? 'rgba(255, 106, 94, 0.24)' : 'rgba(255, 209, 102, 0.2)';
      context.shadowBlur = 18;
      drawRoundRect(context, this.x, this.y, this.width, this.height, 9);
      context.fill();
      context.shadowBlur = 0;

      context.fillStyle = dark;
      drawRoundRect(context, this.x + 7, this.y + 9, this.width - 14, 7, 4);
      context.fill();
      drawRoundRect(context, this.x + 7, this.y + 24, this.width - 18, 7, 4);
      context.fill();
      context.restore();
    }
  }

  class Particle {
    constructor(x, y, speed) {
      this.x = x;
      this.y = y;
      this.radius = random(2, 5);
      this.life = random(0.35, 0.65);
      this.maxLife = this.life;
      this.vx = -speed * random(0.12, 0.24);
      this.vy = random(-36, 18);
    }

    update(delta) {
      this.life -= delta;
      this.x += this.vx * delta;
      this.y += this.vy * delta;
      this.vy += 120 * delta;
    }

    draw(context) {
      const alpha = clamp(this.life / this.maxLife, 0, 1);
      context.fillStyle = `rgba(98, 255, 174, ${alpha * 0.45})`;
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  class Game {
    constructor() {
      this.state = 'start';
      this.player = new Player();
      this.obstacles = [];
      this.particles = [];
      this.audio = new AudioSystem();
      this.input = new InputHandler(frame, { action: () => this.handleAction() });
      this.bestScore = Storage.readBest();
      this.score = 0;
      this.lastDisplayedScore = -1;
      this.lastDisplayedBest = -1;
      this.speed = 360;
      this.distance = 0;
      this.spawnTimer = 1.1;
      this.groundOffset = 0;
      this.backgroundOffset = 0;
      this.lastTime = 0;
      this.raf = 0;

      ui.startButton.addEventListener('click', () => this.start());
      ui.restartButton.addEventListener('click', () => this.start());
      window.addEventListener('resize', () => this.resize());

      this.resize();
      this.updateUi(true);
      this.raf = requestAnimationFrame((time) => this.loop(time));

      if (shouldAutoStart()) {
        window.setTimeout(() => this.start(), 0);
      }
    }

    focusGameSurface() {
      window.requestAnimationFrame(() => {
        window.focus();
        frame.focus({ preventScroll: true });
      });
    }

    resize() {
      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(canvas.width / LOGICAL_WIDTH, 0, 0, canvas.height / LOGICAL_HEIGHT, 0, 0);
    }

    handleAction() {
      if (this.state === 'start') {
        this.start();
        return;
      }

      if (this.state === 'gameover') {
        this.start();
        return;
      }

      if (this.player.jump()) {
        this.audio.playJump();
        for (let i = 0; i < 8; i += 1) {
          this.particles.push(new Particle(this.player.x + 16, GROUND_Y - 8, this.speed));
        }
      }
    }

    start() {
      this.focusGameSurface();
      this.state = 'playing';
      this.player.reset();
      this.obstacles = [];
      this.particles = [];
      this.score = 0;
      this.distance = 0;
      this.speed = 360;
      this.spawnTimer = 0.9;
      ui.startScreen.classList.add('hidden');
      ui.gameOverScreen.classList.add('hidden');
      ui.playHint.style.opacity = '1';
      this.updateUi(true);
    }

    gameOver() {
      this.state = 'gameover';
      this.audio.playHit();
      this.bestScore = Math.max(this.bestScore, Math.floor(this.score));
      Storage.writeBest(this.bestScore);
      ui.finalScore.textContent = String(Math.floor(this.score));
      ui.finalBest.textContent = String(this.bestScore);
      ui.gameOverScreen.classList.remove('hidden');
      ui.playHint.style.opacity = '0';
      this.updateUi(true);
    }

    loop(time) {
      const delta = Math.min((time - this.lastTime) / 1000 || 0, 0.033);
      this.lastTime = time;

      this.update(delta);
      this.draw();
      this.updateUi();

      this.raf = requestAnimationFrame((nextTime) => this.loop(nextTime));
    }

    update(delta) {
      const sceneSpeed = this.state === 'playing' ? this.speed : 140;
      this.groundOffset = (this.groundOffset + sceneSpeed * delta) % 64;
      this.backgroundOffset = (this.backgroundOffset + sceneSpeed * 0.18 * delta) % LOGICAL_WIDTH;

      if (this.state !== 'playing') return;

      this.distance += this.speed * delta;
      this.score += delta * 12 + this.speed * delta * 0.018;
      this.speed = Math.min(660, 360 + this.distance * 0.032);
      this.spawnTimer -= delta;

      if (this.spawnTimer <= 0) {
        this.obstacles.push(new Obstacle(LOGICAL_WIDTH + 80, this.speed));
        const difficulty = clamp((this.speed - 360) / 300, 0, 1);
        this.spawnTimer = random(1.05 - difficulty * 0.28, 1.55 - difficulty * 0.38);
      }

      this.player.update(delta);
      this.obstacles.forEach((obstacle) => obstacle.update(delta, this.speed));
      this.particles.forEach((particle) => particle.update(delta));

      this.obstacles = this.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -80);
      this.particles = this.particles.filter((particle) => particle.life > 0);

      for (const obstacle of this.obstacles) {
        if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
          obstacle.passed = true;
          this.score += 12;
          this.audio.playScore();
        }

        if (this.collides(this.player.getBounds(), obstacle.getBounds())) {
          this.gameOver();
          break;
        }
      }
    }

    collides(a, b) {
      return (
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
      );
    }

    updateUi(force = false) {
      const displayScore = Math.floor(this.score);
      if (force || displayScore !== this.lastDisplayedScore) {
        ui.score.textContent = String(displayScore);
        this.lastDisplayedScore = displayScore;
      }

      if (force || this.bestScore !== this.lastDisplayedBest) {
        ui.best.textContent = String(this.bestScore);
        this.lastDisplayedBest = this.bestScore;
      }
    }

    draw() {
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      this.drawBackground();
      this.drawGround();
      this.particles.forEach((particle) => particle.draw(ctx));
      this.obstacles.forEach((obstacle) => obstacle.draw(ctx));
      this.player.draw(ctx);
    }

    drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      sky.addColorStop(0, '#111b31');
      sky.addColorStop(0.55, '#111827');
      sky.addColorStop(1, '#0b1019');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = 'rgba(103, 217, 255, 0.12)';
      for (let i = 0; i < 12; i += 1) {
        const x = (i * 118 - this.backgroundOffset * 0.6) % (LOGICAL_WIDTH + 130);
        const y = 58 + (i % 4) * 36;
        ctx.beginPath();
        ctx.arc(x < -30 ? x + LOGICAL_WIDTH + 130 : x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      this.drawCityLayer(318, 0.55, 'rgba(103, 217, 255, 0.13)', 80);
      this.drawCityLayer(356, 0.9, 'rgba(255, 255, 255, 0.08)', 56);
    }

    drawCityLayer(baseY, factor, color, baseHeight) {
      ctx.fillStyle = color;
      for (let i = 0; i < 14; i += 1) {
        const width = 54 + (i % 4) * 18;
        const height = baseHeight + (i % 5) * 14;
        const rawX = i * 92 - this.backgroundOffset * factor;
        const x =
          (((rawX % (LOGICAL_WIDTH + 120)) + LOGICAL_WIDTH + 120) % (LOGICAL_WIDTH + 120)) - 80;
        drawRoundRect(ctx, x, baseY - height, width, height, 8);
        ctx.fill();
      }
    }

    drawGround() {
      ctx.fillStyle = '#101722';
      ctx.fillRect(0, GROUND_Y, LOGICAL_WIDTH, LOGICAL_HEIGHT - GROUND_Y);

      ctx.strokeStyle = 'rgba(98, 255, 174, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 0.5);
      ctx.lineTo(LOGICAL_WIDTH, GROUND_Y + 0.5);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      for (let x = -64 - this.groundOffset; x < LOGICAL_WIDTH + 64; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 36);
        ctx.lineTo(x + 34, GROUND_Y + 36);
        ctx.stroke();
      }
    }
  }

  applyEmbedMode();
  window.addEventListener('message', handlePlatformMessage);
  new Game();
})();

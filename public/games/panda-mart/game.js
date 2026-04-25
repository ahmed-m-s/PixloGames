(() => {
  'use strict';

  const WIDTH = 960;
  const HEIGHT = 600;
  const SALE_VALUE = 5;
  const CUSTOMER_LIMIT = 6;
  const CUSTOMER_SPAWN_SECONDS = 3.2;

  const canvas = document.getElementById('gameCanvas');
  const stage = document.getElementById('gameStage');
  const ctx = canvas.getContext('2d');

  const ui = {
    coins: document.getElementById('coinsValue'),
    carry: document.getElementById('carryValue'),
    shelf: document.getElementById('shelfValue'),
    customers: document.getElementById('customersValue'),
    status: document.getElementById('statusText'),
    levels: document.getElementById('levelsValue'),
    carryCost: document.getElementById('carryCost'),
    speedCost: document.getElementById('speedCost'),
    shelfCost: document.getElementById('shelfCost'),
    startScreen: document.getElementById('startScreen'),
    pauseScreen: document.getElementById('pauseScreen'),
    startButton: document.getElementById('startButton'),
    pauseButton: document.getElementById('pauseButton'),
    resumeButton: document.getElementById('resumeButton'),
    restartButton: document.getElementById('restartButton'),
    touchInteractButton: document.getElementById('touchInteractButton')
  };

  const zones = {
    source: { x: 76, y: 340, width: 170, height: 150 },
    shelf: { x: 438, y: 238, width: 190, height: 122 },
    checkout: { x: 742, y: 232, width: 132, height: 112 },
    entrance: { x: 940, y: 132 },
    exit: { x: 998, y: 456 }
  };

  const keys = new Set();
  const touchDirections = {
    up: false,
    down: false,
    left: false,
    right: false
  };
  const floatingTexts = [];

  let customerId = 0;
  let lastTime = performance.now();

  const state = {
    mode: 'start',
    coins: 0,
    carry: 0,
    shelfStock: 0,
    spawnTimer: 1.6,
    customers: [],
    status: 'Open the mart to begin.',
    player: {
      x: 210,
      y: 244,
      radius: 24
    },
    upgrades: {
      carry: 1,
      speed: 1,
      shelf: 1
    }
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

  function getCarryCapacity() {
    return state.upgrades.carry + 2;
  }

  function getShelfCapacity() {
    return state.upgrades.shelf + 4;
  }

  function getWalkSpeed() {
    return 178 + (state.upgrades.speed - 1) * 30;
  }

  function getUpgradeCost(type) {
    const baseCosts = {
      carry: 30,
      speed: 40,
      shelf: 35
    };

    return Math.round((baseCosts[type] * Math.pow(1.45, state.upgrades[type] - 1)) / 5) * 5;
  }

  function setStatus(message) {
    state.status = message;
  }

  function isPlaying() {
    return state.mode === 'playing';
  }

  function circleNearZone(circle, zone, padding = 28) {
    const nearestX = Math.max(zone.x - padding, Math.min(circle.x, zone.x + zone.width + padding));
    const nearestY = Math.max(zone.y - padding, Math.min(circle.y, zone.y + zone.height + padding));
    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;

    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function moveToward(entity, target, speed, dt) {
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const length = Math.hypot(dx, dy);

    if (length < 3) {
      entity.x = target.x;
      entity.y = target.y;
      return true;
    }

    const step = Math.min(length, speed * dt);
    entity.x += (dx / length) * step;
    entity.y += (dy / length) * step;

    return false;
  }

  function resetGame() {
    state.coins = 0;
    state.carry = 0;
    state.shelfStock = 0;
    state.spawnTimer = 1.6;
    state.customers = [];
    state.status = 'Collect bamboo from the garden, then stock the shelf.';
    state.player.x = 210;
    state.player.y = 244;
    state.upgrades.carry = 1;
    state.upgrades.speed = 1;
    state.upgrades.shelf = 1;
    floatingTexts.length = 0;
    customerId = 0;
  }

  function setMode(mode) {
    state.mode = mode;
    ui.startScreen.classList.toggle('is-visible', mode === 'start');
    ui.pauseScreen.classList.toggle('is-visible', mode === 'paused');
    ui.pauseButton.textContent = mode === 'paused' ? 'Resume' : 'Pause';
  }

  function startGame() {
    resetGame();
    setMode('playing');
    stage.focus({ preventScroll: true });
    lastTime = performance.now();
    updateUi();
  }

  function togglePause() {
    if (state.mode === 'start') {
      startGame();
      return;
    }

    if (state.mode === 'paused') {
      setMode('playing');
      stage.focus({ preventScroll: true });
      lastTime = performance.now();
      return;
    }

    setMode('paused');
  }

  function interact() {
    if (state.mode === 'start') {
      startGame();
      return;
    }

    if (!isPlaying()) {
      return;
    }

    const playerCircle = {
      x: state.player.x,
      y: state.player.y,
      radius: state.player.radius
    };

    if (circleNearZone(playerCircle, zones.source)) {
      const freeSpace = getCarryCapacity() - state.carry;

      if (freeSpace <= 0) {
        setStatus('Carry basket full. Bring bamboo to the shelf.');
        return;
      }

      const collected = Math.min(2, freeSpace);
      state.carry += collected;
      setStatus(`Collected ${collected} bamboo from the garden.`);
      floatingTexts.push({ x: state.player.x, y: state.player.y - 34, text: `+${collected}`, life: 0.8 });
      return;
    }

    if (circleNearZone(playerCircle, zones.shelf)) {
      const freeSpace = getShelfCapacity() - state.shelfStock;

      if (state.carry <= 0) {
        setStatus('Your basket is empty. Collect bamboo first.');
        return;
      }

      if (freeSpace <= 0) {
        setStatus('The bamboo shelf is full.');
        return;
      }

      const deposited = Math.min(state.carry, freeSpace);
      state.carry -= deposited;
      state.shelfStock += deposited;
      setStatus(`Stocked ${deposited} bamboo on the shelf.`);
      floatingTexts.push({
        x: zones.shelf.x + zones.shelf.width / 2,
        y: zones.shelf.y - 10,
        text: `Shelf +${deposited}`,
        life: 0.8
      });
      return;
    }

    setStatus('Stand near the bamboo garden or shelf, then interact.');
  }

  function buyUpgrade(type) {
    if (state.mode === 'start') {
      startGame();
    }

    const cost = getUpgradeCost(type);

    if (state.coins < cost) {
      setStatus(`Need ${cost} coins for that upgrade.`);
      return;
    }

    state.coins -= cost;
    state.upgrades[type] += 1;

    if (type === 'carry') {
      setStatus('Carry capacity upgraded.');
    } else if (type === 'speed') {
      setStatus('Walk speed upgraded.');
    } else {
      setStatus('Shelf capacity upgraded.');
    }

    updateUi();
  }

  function getInputVector() {
    let x = 0;
    let y = 0;

    if (keys.has('ArrowLeft') || keys.has('KeyA') || touchDirections.left) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD') || touchDirections.right) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW') || touchDirections.up) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS') || touchDirections.down) y += 1;

    if (x === 0 && y === 0) {
      return { x, y };
    }

    const length = Math.hypot(x, y);

    return {
      x: x / length,
      y: y / length
    };
  }

  function updatePlayer(dt) {
    const input = getInputVector();
    const speed = getWalkSpeed();

    state.player.x += input.x * speed * dt;
    state.player.y += input.y * speed * dt;
    state.player.x = Math.max(36, Math.min(WIDTH - 36, state.player.x));
    state.player.y = Math.max(72, Math.min(HEIGHT - 36, state.player.y));

    if (input.x !== 0 || input.y !== 0) {
      const playerCircle = {
        x: state.player.x,
        y: state.player.y,
        radius: state.player.radius
      };

      if (circleNearZone(playerCircle, zones.source)) {
        setStatus('Press E, Space, or Interact to collect bamboo.');
      } else if (circleNearZone(playerCircle, zones.shelf)) {
        setStatus('Press E, Space, or Interact to stock the bamboo shelf.');
      }
    }
  }

  function getCustomerShelfTarget(customer) {
    const offset = (customer.id % 3) * 26;

    return {
      x: zones.shelf.x + zones.shelf.width + 56,
      y: zones.shelf.y + 26 + offset
    };
  }

  function spawnCustomer() {
    if (state.customers.length >= CUSTOMER_LIMIT) {
      return;
    }

    const palette = ['#f7b267', '#9be7ff', '#f79ac0', '#c2f970', '#d4a5ff'];

    state.customers.push({
      id: customerId,
      x: zones.entrance.x,
      y: zones.entrance.y + (customerId % 3) * 36,
      state: 'toShelf',
      wait: 0,
      hasBamboo: false,
      color: palette[customerId % palette.length],
      speed: 110 + (customerId % 3) * 8
    });
    customerId += 1;
  }

  function sellToCustomer(customer) {
    state.shelfStock -= 1;
    customer.hasBamboo = true;
    customer.state = 'toCheckout';
    setStatus('A guest picked bamboo and is heading to checkout.');
  }

  function updateCustomer(customer, dt) {
    if (customer.state === 'toShelf') {
      if (moveToward(customer, getCustomerShelfTarget(customer), customer.speed, dt)) {
        if (state.shelfStock > 0) {
          sellToCustomer(customer);
        } else {
          customer.state = 'waiting';
          customer.wait = 2.4;
          setStatus('A guest is waiting for bamboo stock.');
        }
      }
      return;
    }

    if (customer.state === 'waiting') {
      customer.wait -= dt;

      if (state.shelfStock > 0) {
        sellToCustomer(customer);
      } else if (customer.wait <= 0) {
        customer.state = 'leaving';
        setStatus('A guest left because the shelf was empty.');
      }
      return;
    }

    if (customer.state === 'toCheckout') {
      const checkoutTarget = {
        x: zones.checkout.x + zones.checkout.width / 2,
        y: zones.checkout.y + zones.checkout.height + 44
      };

      if (moveToward(customer, checkoutTarget, customer.speed, dt)) {
        customer.state = 'paying';
        customer.wait = 0.55;
      }
      return;
    }

    if (customer.state === 'paying') {
      customer.wait -= dt;

      if (customer.wait <= 0) {
        state.coins += SALE_VALUE;
        customer.state = 'leaving';
        floatingTexts.push({
          x: zones.checkout.x + zones.checkout.width / 2,
          y: zones.checkout.y + 20,
          text: `+${SALE_VALUE} coins`,
          life: 0.9
        });
        setStatus(`Sale complete. Earned ${SALE_VALUE} coins.`);
      }
      return;
    }

    moveToward(customer, zones.exit, customer.speed, dt);
  }

  function updateCustomers(dt) {
    state.spawnTimer += dt;

    if (state.spawnTimer >= CUSTOMER_SPAWN_SECONDS) {
      state.spawnTimer = 0;
      spawnCustomer();
    }

    for (const customer of state.customers) {
      updateCustomer(customer, dt);
    }

    state.customers = state.customers.filter((customer) => distance(customer, zones.exit) > 8);
  }

  function updateFloatingTexts(dt) {
    for (const floatingText of floatingTexts) {
      floatingText.y -= 34 * dt;
      floatingText.life -= dt;
    }

    for (let index = floatingTexts.length - 1; index >= 0; index -= 1) {
      if (floatingTexts[index].life <= 0) {
        floatingTexts.splice(index, 1);
      }
    }
  }

  function update(dt) {
    if (!isPlaying()) {
      return;
    }

    updatePlayer(dt);
    updateCustomers(dt);
    updateFloatingTexts(dt);
    updateUi();
  }

  function drawRoundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function fillRoundRect(x, y, width, height, radius, fillStyle) {
    drawRoundRect(x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function strokeRoundRect(x, y, width, height, radius, strokeStyle, lineWidth = 2) {
    drawRoundRect(x, y, width, height, radius);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawLabel(text, x, y, color = '#f5fff6') {
    ctx.save();
    ctx.font = '800 16px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    fillRoundRect(x - 8, y - 20, ctx.measureText(text).width + 16, 28, 8, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawFloor() {
    const tile = 48;

    ctx.fillStyle = '#173a24';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;

    for (let x = 0; x < WIDTH; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y < HEIGHT; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    fillRoundRect(34, 54, 892, 492, 24, '#214c2f');
    strokeRoundRect(34, 54, 892, 492, 24, 'rgba(255,255,255,.1)', 3);
  }

  function drawBamboo(x, y, length = 46) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d9f270';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y - 4);
    ctx.stroke();
    ctx.strokeStyle = '#6bbf59';
    ctx.lineWidth = 2;
    for (let i = 8; i < length; i += 14) {
      ctx.beginPath();
      ctx.moveTo(x + i, y - 8);
      ctx.lineTo(x + i + 1, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShop() {
    const source = zones.source;
    const shelf = zones.shelf;
    const checkout = zones.checkout;

    fillRoundRect(source.x, source.y, source.width, source.height, 18, '#2d6c3a');
    strokeRoundRect(source.x, source.y, source.width, source.height, 18, 'rgba(216,240,122,.42)', 3);
    drawLabel('Bamboo garden', source.x + 18, source.y - 10, '#d8f07a');
    for (let i = 0; i < 8; i += 1) {
      drawBamboo(source.x + 20 + (i % 4) * 34, source.y + 40 + Math.floor(i / 4) * 44, 32);
    }

    fillRoundRect(shelf.x, shelf.y, shelf.width, shelf.height, 14, '#7d5635');
    strokeRoundRect(shelf.x, shelf.y, shelf.width, shelf.height, 14, 'rgba(255,255,255,.2)', 3);
    drawLabel('Bamboo shelf', shelf.x + 10, shelf.y - 10, '#f5fff6');
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.fillRect(shelf.x + 14, shelf.y + 42, shelf.width - 28, 10);
    ctx.fillRect(shelf.x + 14, shelf.y + 82, shelf.width - 28, 10);

    for (let i = 0; i < state.shelfStock; i += 1) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      drawBamboo(shelf.x + 24 + col * 30, shelf.y + 58 + row * 38, 22);
    }

    fillRoundRect(checkout.x, checkout.y, checkout.width, checkout.height, 16, '#31533a');
    strokeRoundRect(checkout.x, checkout.y, checkout.width, checkout.height, 16, 'rgba(255,209,102,.38)', 3);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(checkout.x + 96, checkout.y + 28, 14, 0, Math.PI * 2);
    ctx.fill();
    drawLabel('Checkout', checkout.x + 12, checkout.y - 10, '#ffd166');

    ctx.fillStyle = '#10251a';
    ctx.fillRect(916, 112, 44, 78);
    ctx.fillRect(916, 418, 44, 78);
    drawLabel('In', 884, 132, '#b8cbbd');
    drawLabel('Exit', 870, 452, '#b8cbbd');
  }

  function drawPanda() {
    const { x, y } = state.player;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.ellipse(2, 27, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f6fff8';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111915';
    ctx.beginPath();
    ctx.arc(-18, -18, 9, 0, Math.PI * 2);
    ctx.arc(18, -18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111915';
    ctx.beginPath();
    ctx.ellipse(-9, -2, 7, 10, -0.45, 0, Math.PI * 2);
    ctx.ellipse(9, -2, 7, 10, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6fff8';
    ctx.beginPath();
    ctx.arc(-7, -4, 2.2, 0, Math.PI * 2);
    ctx.arc(7, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111915';
    ctx.beginPath();
    ctx.arc(0, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    if (state.carry > 0) {
      fillRoundRect(-17, 20, 34, 18, 8, '#a8703e');
      for (let i = 0; i < state.carry; i += 1) {
        drawBamboo(-14 + i * 8, 28, 14);
      }
    }

    ctx.restore();
  }

  function drawCustomer(customer) {
    ctx.save();
    ctx.translate(customer.x, customer.y);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(1, 23, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = customer.color;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.beginPath();
    ctx.arc(-6, -3, 2.4, 0, Math.PI * 2);
    ctx.arc(6, -3, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    if (customer.hasBamboo) {
      drawBamboo(-13, 20, 24);
    }

    if (customer.state === 'waiting') {
      drawLabel('Need stock', -34, -28, '#ffd166');
    }

    ctx.restore();
  }

  function drawHudHints() {
    const playerCircle = {
      x: state.player.x,
      y: state.player.y,
      radius: state.player.radius
    };

    if (state.mode !== 'playing') {
      return;
    }

    if (circleNearZone(playerCircle, zones.source)) {
      drawLabel('Interact: collect bamboo', state.player.x - 74, state.player.y - 42, '#d8f07a');
    } else if (circleNearZone(playerCircle, zones.shelf)) {
      drawLabel('Interact: stock shelf', state.player.x - 68, state.player.y - 42, '#f5fff6');
    }
  }

  function drawFloatingTexts() {
    ctx.save();
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const floatingText of floatingTexts) {
      ctx.globalAlpha = Math.max(0, floatingText.life);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    }
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawFloor();
    drawShop();

    for (const customer of state.customers) {
      drawCustomer(customer);
    }

    drawPanda();
    drawHudHints();
    drawFloatingTexts();

    ctx.save();
    ctx.font = '900 18px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.fillText('Forest Mart', 62, 92);
    ctx.restore();
  }

  function updateUi() {
    ui.coins.textContent = String(state.coins);
    ui.carry.textContent = `${state.carry} / ${getCarryCapacity()}`;
    ui.shelf.textContent = `${state.shelfStock} / ${getShelfCapacity()}`;
    ui.customers.textContent = String(state.customers.length);
    ui.status.textContent = state.status;
    ui.levels.textContent = `Carry ${state.upgrades.carry} | Speed ${state.upgrades.speed} | Shelf ${state.upgrades.shelf}`;
    ui.carryCost.textContent = String(getUpgradeCost('carry'));
    ui.speedCost.textContent = String(getUpgradeCost('speed'));
    ui.shelfCost.textContent = String(getUpgradeCost('shelf'));

    for (const button of document.querySelectorAll('[data-upgrade]')) {
      const type = button.dataset.upgrade;
      button.disabled = state.coins < getUpgradeCost(type);
    }
  }

  function loop(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function isFormControl(target) {
    return target instanceof HTMLElement && Boolean(target.closest('button, input, select, textarea'));
  }

  function handleKeyDown(event) {
    const gameCodes = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'Space',
      'KeyE'
    ]);

    if (gameCodes.has(event.code)) {
      event.preventDefault();
    }

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(
        event.code
      )
    ) {
      keys.add(event.code);
    }

    if ((event.code === 'Space' || event.code === 'KeyE') && !event.repeat && !isFormControl(event.target)) {
      interact();
    }

    if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat) {
      event.preventDefault();
      togglePause();
    }
  }

  function handleKeyUp(event) {
    keys.delete(event.code);
  }

  function bindTouchControls() {
    for (const button of document.querySelectorAll('[data-dir]')) {
      const direction = button.dataset.dir;

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        touchDirections[direction] = true;
        button.setPointerCapture(event.pointerId);
        stage.focus({ preventScroll: true });
      });
      button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        touchDirections[direction] = false;
      });
      button.addEventListener('pointercancel', () => {
        touchDirections[direction] = false;
      });
      button.addEventListener('lostpointercapture', () => {
        touchDirections[direction] = false;
      });
    }
  }

  function bindEvents() {
    window.addEventListener('message', handlePlatformMessage);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', () => keys.clear());

    ui.startButton.addEventListener('click', startGame);
    ui.pauseButton.addEventListener('click', togglePause);
    ui.resumeButton.addEventListener('click', togglePause);
    ui.restartButton.addEventListener('click', startGame);
    ui.touchInteractButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      stage.focus({ preventScroll: true });
      interact();
    });

    for (const button of document.querySelectorAll('[data-upgrade]')) {
      button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade));
    }

    bindTouchControls();
  }

  applyEmbedMode();
  bindEvents();
  updateUi();
  render();
  requestAnimationFrame(loop);

  if (shouldAutoStart()) {
    window.setTimeout(startGame, 0);
  }
})();

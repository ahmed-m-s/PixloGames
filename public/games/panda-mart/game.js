(() => {
  'use strict';

  const WIDTH = 960;
  const HEIGHT = 600;
  const SALE_VALUE = 5;
  const CUSTOMER_LIMIT = 6;
  const CUSTOMER_SPAWN_SECONDS = 3.2;
  const SOURCE_CAPACITY = 18;
  const SOURCE_REGEN_SECONDS = 0.85;
  const AUTO_TRANSFER_SECONDS = 0.24;
  const HARVEST_AMOUNT = 1;
  const DEPOSIT_AMOUNT = 1;
  const CUSTOMER_PROFILES = [
    {
      fur: '#f7b267',
      ear: '#c86b45',
      shirt: '#54c7d9',
      pants: '#2d6073',
      ears: 'round'
    },
    {
      fur: '#f8d7e8',
      ear: '#f29abc',
      shirt: '#95d56c',
      pants: '#3f7140',
      ears: 'long'
    },
    {
      fur: '#cdb7ff',
      ear: '#9d7be8',
      shirt: '#ffd166',
      pants: '#7b5f26',
      ears: 'point'
    },
    {
      fur: '#9be7ff',
      ear: '#5fb9d4',
      shirt: '#ff9f7d',
      pants: '#704245',
      ears: 'round'
    },
    {
      fur: '#d7f5ba',
      ear: '#8fca6a',
      shirt: '#f79ac0',
      pants: '#69495a',
      ears: 'leaf'
    }
  ];

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
    sourceStock: SOURCE_CAPACITY,
    sourceRegenTimer: 0,
    shelfStock: 0,
    spawnTimer: 1.6,
    customers: [],
    status: 'Open the mart to begin.',
    player: {
      x: 210,
      y: 244,
      radius: 24,
      facingX: 0,
      facingY: 1,
      walkTime: 0,
      isMoving: false,
      harvestCooldown: 0,
      depositCooldown: 0
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

  function getPlayerCircle() {
    return {
      x: state.player.x,
      y: state.player.y,
      radius: state.player.radius
    };
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
      entity.isMoving = false;
      return true;
    }

    const step = Math.min(length, speed * dt);
    const moveX = dx / length;
    const moveY = dy / length;
    entity.x += moveX * step;
    entity.y += moveY * step;
    entity.facingX = moveX;
    entity.facingY = moveY;
    entity.isMoving = true;
    entity.walkTime = (entity.walkTime || 0) + dt * (7.2 + speed / 90);

    return false;
  }

  function resetGame() {
    state.coins = 0;
    state.carry = 0;
    state.sourceStock = SOURCE_CAPACITY;
    state.sourceRegenTimer = 0;
    state.shelfStock = 0;
    state.spawnTimer = 1.6;
    state.customers = [];
    state.status = 'Step into the garden to auto harvest, then walk to the shelf to stock it.';
    state.player.x = 210;
    state.player.y = 244;
    state.player.facingX = 0;
    state.player.facingY = 1;
    state.player.walkTime = 0;
    state.player.isMoving = false;
    state.player.harvestCooldown = 0;
    state.player.depositCooldown = 0;
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

    setStatus('Harvesting and restocking are automatic when the panda stands on the right spot.');
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
    const isMoving = input.x !== 0 || input.y !== 0;

    state.player.x += input.x * speed * dt;
    state.player.y += input.y * speed * dt;
    state.player.x = Math.max(36, Math.min(WIDTH - 36, state.player.x));
    state.player.y = Math.max(72, Math.min(HEIGHT - 36, state.player.y));
    state.player.isMoving = isMoving;

    if (isMoving) {
      state.player.facingX = input.x;
      state.player.facingY = input.y;
      state.player.walkTime += dt * (7.6 + speed / 90);
    }
  }

  function updateSource(dt) {
    if (state.sourceStock >= SOURCE_CAPACITY) {
      state.sourceStock = SOURCE_CAPACITY;
      state.sourceRegenTimer = 0;
      return;
    }

    state.sourceRegenTimer += dt;

    while (state.sourceRegenTimer >= SOURCE_REGEN_SECONDS && state.sourceStock < SOURCE_CAPACITY) {
      state.sourceStock += 1;
      state.sourceRegenTimer -= SOURCE_REGEN_SECONDS;
    }
  }

  function updateAutoInteractions(dt) {
    state.player.harvestCooldown = Math.max(0, state.player.harvestCooldown - dt);
    state.player.depositCooldown = Math.max(0, state.player.depositCooldown - dt);

    const playerCircle = getPlayerCircle();

    if (circleNearZone(playerCircle, zones.source, 0)) {
      const freeCarry = getCarryCapacity() - state.carry;

      if (freeCarry <= 0) {
        setStatus('Basket full. Walk to the shelf to auto stock bamboo.');
      } else if (state.sourceStock <= 0) {
        setStatus('The garden is growing more bamboo.');
      } else if (state.player.harvestCooldown <= 0) {
        const collected = Math.min(HARVEST_AMOUNT, freeCarry, state.sourceStock);
        state.carry += collected;
        state.sourceStock -= collected;
        state.player.harvestCooldown = AUTO_TRANSFER_SECONDS;
        setStatus('Auto harvesting bamboo.');
        floatingTexts.push({
          x: state.player.x,
          y: state.player.y - 48,
          text: `+${collected}`,
          life: 0.75
        });
      }
    }

    if (circleNearZone(playerCircle, zones.shelf, 0)) {
      const freeShelf = getShelfCapacity() - state.shelfStock;

      if (state.carry <= 0) {
        setStatus('Basket empty. Walk into the garden for bamboo.');
      } else if (freeShelf <= 0) {
        setStatus('Shelf full. Customers can pick up bamboo now.');
      } else if (state.player.depositCooldown <= 0) {
        const deposited = Math.min(DEPOSIT_AMOUNT, state.carry, freeShelf);
        state.carry -= deposited;
        state.shelfStock += deposited;
        state.player.depositCooldown = AUTO_TRANSFER_SECONDS;
        setStatus('Auto stocking the bamboo shelf.');
        floatingTexts.push({
          x: zones.shelf.x + zones.shelf.width / 2,
          y: zones.shelf.y - 18,
          text: `Shelf +${deposited}`,
          life: 0.75
        });
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

    const profile = CUSTOMER_PROFILES[customerId % CUSTOMER_PROFILES.length];

    state.customers.push({
      id: customerId,
      x: zones.entrance.x,
      y: zones.entrance.y + (customerId % 3) * 36,
      state: 'toShelf',
      wait: 0,
      hasBamboo: false,
      profile,
      facingX: -1,
      facingY: 0,
      walkTime: 0,
      isMoving: false,
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
      customer.isMoving = false;
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
      customer.isMoving = false;
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
    updateSource(dt);
    updateAutoInteractions(dt);
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
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    const width = ctx.measureText(text).width + 18;
    fillRoundRect(x - 9, y - 21, width, 28, 8, 'rgba(28, 49, 35, 0.72)');
    strokeRoundRect(x - 9, y - 21, width, 28, 8, 'rgba(255,255,255,.18)', 1.5);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function fillStrokeCircle(x, y, radius, fillStyle, strokeStyle = '#263126', lineWidth = 3) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function fillStrokeEllipse(
    x,
    y,
    radiusX,
    radiusY,
    rotation,
    fillStyle,
    strokeStyle = '#263126',
    lineWidth = 3
  ) {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawLimb(x1, y1, x2, y2, width, color, outline = '#263126') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = outline;
    ctx.lineWidth = width + 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawStockBadge(title, value, stateText, x, y, accent) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 11px system-ui, sans-serif';
    const titleWidth = ctx.measureText(title.toUpperCase()).width;
    ctx.font = '900 20px system-ui, sans-serif';
    const valueWidth = ctx.measureText(value).width;
    ctx.font = '800 10px system-ui, sans-serif';
    const stateWidth = ctx.measureText(stateText).width;
    const width = Math.max(112, titleWidth + 36, valueWidth + 34, stateWidth + 34);

    fillRoundRect(x - width / 2, y - 42, width, 56, 8, 'rgba(255, 253, 232, 0.95)');
    strokeRoundRect(x - width / 2, y - 42, width, 56, 8, '#243527', 3);
    fillRoundRect(x - width / 2 + 6, y - 36, width - 12, 14, 6, accent);
    ctx.fillStyle = '#223023';
    ctx.font = '900 10px system-ui, sans-serif';
    ctx.fillText(title.toUpperCase(), x, y - 29);
    ctx.fillStyle = '#1b261d';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(value, x, y - 9);
    ctx.fillStyle = '#446047';
    ctx.font = '800 10px system-ui, sans-serif';
    ctx.fillText(stateText, x, y + 6);
    ctx.restore();
  }

  function drawFloor() {
    const tile = 48;
    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, '#80c96d');
    background.addColorStop(0.46, '#4fae83');
    background.addColorStop(1, '#347e63');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    fillRoundRect(34, 54, 892, 492, 22, '#f4d98f');
    strokeRoundRect(34, 54, 892, 492, 22, '#2f6d4e', 5);

    ctx.strokeStyle = 'rgba(126, 86, 46, 0.18)';
    ctx.lineWidth = 1;
    for (let x = 58; x < 910; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 58);
      ctx.lineTo(x, 542);
      ctx.stroke();
    }

    for (let y = 82; y < 540; y += tile) {
      ctx.beginPath();
      ctx.moveTo(38, y);
      ctx.lineTo(922, y);
      ctx.stroke();
    }

    fillRoundRect(298, 92, 104, 416, 18, 'rgba(115, 183, 100, 0.32)');
    fillRoundRect(662, 94, 54, 404, 18, 'rgba(255, 164, 102, 0.24)');

    ctx.fillStyle = 'rgba(47, 109, 78, 0.24)';
    for (let i = 0; i < 20; i += 1) {
      const x = 76 + ((i * 83) % 806);
      const y = 88 + ((i * 59) % 410);
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 3, (i % 5) * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBamboo(x, y, length = 46, angle = -0.08) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#365b2e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.strokeStyle = '#d9f46d';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.strokeStyle = '#5aa84d';
    ctx.lineWidth = 2;
    for (let i = 8; i < length; i += 13) {
      ctx.beginPath();
      ctx.moveTo(i, -5);
      ctx.lineTo(i, 5);
      ctx.stroke();
    }
    ctx.fillStyle = '#69c866';
    ctx.beginPath();
    ctx.ellipse(length - 4, -7, 8, 3, -0.35, 0, Math.PI * 2);
    ctx.ellipse(length - 11, 7, 7, 3, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawShelfStock(shelf) {
    const visibleStock = Math.min(state.shelfStock, 15);

    for (let i = 0; i < visibleStock; i += 1) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      drawBamboo(shelf.x + 24 + col * 30, shelf.y + 54 + row * 29, 22, -0.08 + row * 0.03);
    }

    if (state.shelfStock > visibleStock) {
      drawLabel(`+${state.shelfStock - visibleStock}`, shelf.x + shelf.width - 44, shelf.y + shelf.height - 8, '#ffd166');
    }
  }

  function drawShop() {
    const source = zones.source;
    const shelf = zones.shelf;
    const checkout = zones.checkout;
    const sourceState = state.sourceStock > 0 ? 'Ready' : 'Growing';
    const shelfState = state.shelfStock >= getShelfCapacity() ? 'Full' : 'Open space';

    fillRoundRect(source.x - 12, source.y - 12, source.width + 24, source.height + 24, 18, '#67b857');
    strokeRoundRect(source.x - 12, source.y - 12, source.width + 24, source.height + 24, 18, '#245936', 4);
    fillRoundRect(source.x + 10, source.y + 14, source.width - 20, source.height - 28, 14, '#8b603c');
    strokeRoundRect(source.x + 10, source.y + 14, source.width - 20, source.height - 28, 14, '#4b3322', 3);

    for (let i = 0; i < Math.min(state.sourceStock, 12); i += 1) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const stemX = source.x + 30 + col * 34;
      const stemY = source.y + 54 + row * 32;
      drawBamboo(stemX, stemY, 30, -0.65 + (col % 2) * 0.22);
    }

    drawStockBadge(
      'Garden',
      `${state.sourceStock}/${SOURCE_CAPACITY}`,
      sourceState,
      source.x + source.width / 2,
      source.y - 8,
      '#a8e65b'
    );

    fillRoundRect(shelf.x - 16, shelf.y - 18, shelf.width + 32, 38, 8, '#ffcf5a');
    strokeRoundRect(shelf.x - 16, shelf.y - 18, shelf.width + 32, 38, 8, '#714c27', 3);
    for (let i = 0; i < 4; i += 1) {
      fillRoundRect(shelf.x - 8 + i * 48, shelf.y - 15, 24, 32, 6, i % 2 === 0 ? '#ff8e72' : '#fff1a6');
    }

    fillRoundRect(shelf.x, shelf.y + 16, shelf.width, shelf.height, 10, '#9c6738');
    strokeRoundRect(shelf.x, shelf.y + 16, shelf.width, shelf.height, 10, '#4c311e', 4);
    fillRoundRect(shelf.x + 14, shelf.y + 48, shelf.width - 28, 12, 5, '#5b3822');
    fillRoundRect(shelf.x + 14, shelf.y + 84, shelf.width - 28, 12, 5, '#5b3822');
    fillRoundRect(shelf.x + 10, shelf.y + shelf.height + 4, shelf.width - 20, 18, 7, '#6e4529');
    drawShelfStock(shelf);
    drawStockBadge(
      'Shelf',
      `${state.shelfStock}/${getShelfCapacity()}`,
      shelfState,
      shelf.x + shelf.width / 2,
      shelf.y - 34,
      '#ffcf5a'
    );

    fillRoundRect(checkout.x, checkout.y, checkout.width, checkout.height, 12, '#7dc7d8');
    strokeRoundRect(checkout.x, checkout.y, checkout.width, checkout.height, 12, '#254b54', 4);
    fillRoundRect(checkout.x + 14, checkout.y + 58, checkout.width - 28, 24, 8, '#3b7985');
    fillStrokeCircle(checkout.x + 96, checkout.y + 28, 15, '#ffd166', '#6b4b17', 3);
    drawLabel('Checkout', checkout.x + 14, checkout.y - 10, '#ffd166');

    fillRoundRect(916, 112, 44, 78, 8, '#245936');
    fillRoundRect(916, 418, 44, 78, 8, '#245936');
    strokeRoundRect(916, 112, 44, 78, 8, '#14331f', 3);
    strokeRoundRect(916, 418, 44, 78, 8, '#14331f', 3);
    drawLabel('In', 884, 132, '#e8ffe8');
    drawLabel('Exit', 870, 452, '#e8ffe8');
  }

  function drawPanda() {
    const player = state.player;
    const step = player.isMoving ? Math.sin(player.walkTime * 2.2) : 0;
    const bob = player.isMoving ? Math.abs(step) * 1.8 : 0;
    const lookX = Math.max(-3, Math.min(3, player.facingX * 3));
    const lookY = Math.max(-2, Math.min(2, player.facingY * 2));

    ctx.save();
    ctx.translate(player.x, player.y - bob);
    ctx.fillStyle = 'rgba(38, 49, 38, 0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 33 + bob, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    drawLimb(-8, 12 + step * 2, -12, 33 + step * 5, 11, '#111915');
    drawLimb(9, 12 - step * 2, 13, 33 - step * 5, 11, '#111915');
    fillStrokeEllipse(0, 0, 19, 25, 0, '#f8fff8', '#253027', 3);
    fillStrokeEllipse(0, 4, 11, 17, 0, '#ffffff', '#d8e4d9', 2);
    drawLimb(-15, -7, -26, 12 - step * 4, 9, '#111915');
    drawLimb(15, -7, 26, 12 + step * 4, 9, '#111915');

    if (state.carry > 0) {
      fillRoundRect(-20, 7, 40, 20, 7, '#bd7b3e');
      strokeRoundRect(-20, 7, 40, 20, 7, '#5d351d', 3);
      ctx.strokeStyle = '#6a3d22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 8, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < state.carry; i += 1) {
        drawBamboo(-14 + i * 8, 15 - (i % 2) * 3, 20, -0.16);
      }
    }

    fillStrokeCircle(-16, -31, 9, '#111915', '#253027', 3);
    fillStrokeCircle(16, -31, 9, '#111915', '#253027', 3);
    fillStrokeCircle(0, -22, 23, '#f8fff8', '#253027', 3);
    fillStrokeEllipse(-8 + lookX, -23 + lookY, 7, 10, -0.42, '#111915', '#111915', 1);
    fillStrokeEllipse(8 + lookX, -23 + lookY, 7, 10, 0.42, '#111915', '#111915', 1);
    fillStrokeCircle(-6 + lookX, -25 + lookY, 2.2, '#ffffff', '#ffffff', 1);
    fillStrokeCircle(10 + lookX, -25 + lookY, 2.2, '#ffffff', '#ffffff', 1);
    fillStrokeEllipse(0 + lookX * 0.4, -13 + lookY * 0.5, 9, 7, 0, '#ffffff', '#e1e9e1', 2);
    fillStrokeCircle(0 + lookX * 0.35, -15 + lookY * 0.45, 3.6, '#111915', '#111915', 1);
    ctx.strokeStyle = '#111915';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0 + lookX * 0.25, -10 + lookY * 0.35, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawCustomerEars(profile) {
    if (profile.ears === 'long') {
      fillStrokeEllipse(-10, -34, 5, 15, -0.22, profile.ear);
      fillStrokeEllipse(10, -34, 5, 15, 0.22, profile.ear);
      return;
    }

    if (profile.ears === 'point') {
      ctx.fillStyle = profile.ear;
      ctx.strokeStyle = '#263126';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-17, -24);
      ctx.lineTo(-9, -42);
      ctx.lineTo(-2, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(17, -24);
      ctx.lineTo(9, -42);
      ctx.lineTo(2, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (profile.ears === 'leaf') {
      fillStrokeEllipse(-12, -32, 6, 11, -0.65, profile.ear);
      fillStrokeEllipse(12, -32, 6, 11, 0.65, profile.ear);
      return;
    }

    fillStrokeCircle(-14, -29, 7, profile.ear);
    fillStrokeCircle(14, -29, 7, profile.ear);
  }

  function drawCustomer(customer) {
    const profile = customer.profile;
    const step = customer.isMoving ? Math.sin(customer.walkTime * 2.2) : 0;
    const bob = customer.isMoving ? Math.abs(step) * 1.4 : 0;
    const lookX = Math.max(-2, Math.min(2, customer.facingX * 2));
    const lookY = Math.max(-1.5, Math.min(1.5, customer.facingY * 1.5));

    ctx.save();
    ctx.translate(customer.x, customer.y - bob);
    ctx.fillStyle = 'rgba(38, 49, 38, 0.2)';
    ctx.beginPath();
    ctx.ellipse(1, 29 + bob, 23, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(-7, 10 + step * 2, -10, 28 + step * 4, 8, profile.pants);
    drawLimb(8, 10 - step * 2, 11, 28 - step * 4, 8, profile.pants);
    fillStrokeEllipse(0, 0, 16, 21, 0, profile.shirt);
    drawLimb(-13, -5, -21, 10 - step * 3, 7, profile.fur);
    drawLimb(13, -5, 21, 10 + step * 3, 7, profile.fur);
    drawCustomerEars(profile);
    fillStrokeCircle(0, -20, 18, profile.fur);
    fillStrokeEllipse(0, -14, 9, 6, 0, 'rgba(255,255,255,.72)', 'rgba(255,255,255,.72)', 1);
    fillStrokeCircle(-6 + lookX, -22 + lookY, 2.6, '#253027', '#253027', 1);
    fillStrokeCircle(6 + lookX, -22 + lookY, 2.6, '#253027', '#253027', 1);
    ctx.strokeStyle = '#253027';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0 + lookX * 0.2, -14 + lookY * 0.3, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();

    if (customer.hasBamboo) {
      drawBamboo(-18, 10, 28, -0.18);
    }

    if (customer.state === 'waiting') {
      drawLabel('Need stock', -35, -46, '#ffd166');
    }

    ctx.restore();
  }

  function drawHudHints() {
    const playerCircle = getPlayerCircle();

    if (state.mode !== 'playing') {
      return;
    }

    if (circleNearZone(playerCircle, zones.source, 0)) {
      drawLabel('Auto harvest', state.player.x - 54, state.player.y - 54, '#e8ffe8');
    } else if (circleNearZone(playerCircle, zones.shelf, 0)) {
      drawLabel('Auto stock', state.player.x - 44, state.player.y - 54, '#fff1a6');
    }
  }

  function drawFloatingTexts() {
    ctx.save();
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const floatingText of floatingTexts) {
      ctx.globalAlpha = Math.max(0, floatingText.life);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(32, 42, 31, 0.72)';
      ctx.strokeText(floatingText.text, floatingText.x, floatingText.y);
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
    ctx.fillStyle = '#243527';
    ctx.fillText('Panda Mart', 62, 92);
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
    const movementCodes = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD'
    ]);
    const scrollCodes = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

    if (scrollCodes.has(event.code) && !isFormControl(event.target)) {
      event.preventDefault();
    }

    if (movementCodes.has(event.code)) {
      keys.add(event.code);
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

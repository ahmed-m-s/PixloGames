(() => {
  'use strict';

  const STORAGE_KEY = 'pixlogames:memory-match:best';
  const BOARD_COLUMNS = 4;
  const PAIRS = [
    { id: 'bolt', symbol: '⚡', color: '#5ef2b6' },
    { id: 'comet', symbol: '✦', color: '#75d8ff' },
    { id: 'sun', symbol: '☀', color: '#ffd166' },
    { id: 'gem', symbol: '◆', color: '#ff8fab' },
    { id: 'wave', symbol: '≈', color: '#9b8cff' },
    { id: 'spark', symbol: '✹', color: '#ffb86b' },
    { id: 'moon', symbol: '☾', color: '#b6f7ff' },
    { id: 'plus', symbol: '✚', color: '#b7ff7a' }
  ];

  const elements = {
    board: document.getElementById('board'),
    startScreen: document.getElementById('startScreen'),
    completeScreen: document.getElementById('completeScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    moveCount: document.getElementById('moveCount'),
    timer: document.getElementById('timer'),
    bestTime: document.getElementById('bestTime'),
    completeTitle: document.getElementById('completeTitle'),
    starRating: document.getElementById('starRating'),
    completeSummary: document.getElementById('completeSummary'),
    finalMoves: document.getElementById('finalMoves'),
    finalTime: document.getElementById('finalTime'),
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

  function setPlatformFullscreen(isFullscreen) {
    document.documentElement.classList.toggle('is-platform-fullscreen', Boolean(isFullscreen));
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

    setPlatformFullscreen(data.isFullscreen);
  }

  class Storage {
    static getBest() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);

        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    static saveBest(result) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {
        // Private browsing or disabled storage should never break a game session.
      }
    }
  }

  class AudioSystem {
    playFlip() {}
    playMatch() {}
    playComplete() {}
  }

  class MemoryGame {
    constructor(nodes) {
      this.nodes = nodes;
      this.audio = new AudioSystem();
      this.state = 'start';
      this.cards = [];
      this.openCards = [];
      this.matchedPairs = 0;
      this.moves = 0;
      this.startedAt = 0;
      this.elapsedBeforeStop = 0;
      this.timerId = 0;
      this.inputLocked = false;

      this.handleCardSelect = this.handleCardSelect.bind(this);
      this.start = this.start.bind(this);
      this.restart = this.restart.bind(this);

      this.nodes.startButton.addEventListener('click', this.start);
      this.nodes.restartButton.addEventListener('click', this.restart);
      this.nodes.board.addEventListener('click', this.handleCardSelect);
      this.nodes.board.addEventListener('touchend', this.handleCardSelect, { passive: false });

      this.renderBoard();
      this.updateBestDisplay();
      this.updateStats();
    }

    start() {
      this.state = 'playing';
      this.cards = this.createDeck();
      this.openCards = [];
      this.matchedPairs = 0;
      this.moves = 0;
      this.elapsedBeforeStop = 0;
      this.startedAt = performance.now();
      this.inputLocked = false;

      this.nodes.startScreen.classList.remove('is-visible');
      this.nodes.completeScreen.classList.remove('is-visible');
      this.renderBoard();
      this.updateStats();
      this.startTimer();
    }

    restart() {
      this.stopTimer();
      this.start();
    }

    createDeck() {
      return this.shuffle(PAIRS.flatMap((pair) => [this.createCard(pair), this.createCard(pair)]));
    }

    createCard(pair) {
      const uniqueId =
        globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : Math.random().toString(16).slice(2);

      return {
        uid: `${pair.id}-${uniqueId}`,
        pairId: pair.id,
        symbol: pair.symbol,
        color: pair.color,
        flipped: false,
        matched: false
      };
    }

    shuffle(items) {
      const copy = [...items];

      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
      }

      return copy;
    }

    renderBoard() {
      const cards = this.cards.length > 0 ? this.cards : this.createDeck();
      const fragment = document.createDocumentFragment();
      this.nodes.board.style.gridTemplateColumns = `repeat(${BOARD_COLUMNS}, 1fr)`;
      this.nodes.board.innerHTML = '';

      cards.forEach((card, index) => {
        const button = document.createElement('button');
        button.className = 'memory-card';
        button.type = 'button';
        button.dataset.index = String(index);
        button.dataset.cardId = card.uid;
        button.setAttribute('aria-label', 'Face-down memory card');

        if (card.flipped) {
          button.classList.add('is-flipped');
          button.setAttribute('aria-label', `${card.symbol} card`);
        }

        if (card.matched) {
          button.classList.add('is-matched', 'is-locked');
          button.setAttribute('aria-label', `Matched ${card.symbol} card`);
          button.disabled = true;
        }

        button.innerHTML = `
          <span class="card-inner">
            <span class="card-face card-back" aria-hidden="true"></span>
            <span class="card-face card-front" style="--card-color: ${card.color}" aria-hidden="true">${card.symbol}</span>
          </span>
        `;
        fragment.appendChild(button);
      });

      this.nodes.board.appendChild(fragment);
    }

    handleCardSelect(event) {
      if (event.type === 'touchend') {
        event.preventDefault();
      }

      const target = event.target instanceof Element ? event.target.closest('.memory-card') : null;

      if (!target || this.state !== 'playing' || this.inputLocked) {
        return;
      }

      const index = Number(target.dataset.index);
      const card = this.cards[index];

      if (!card || card.flipped || card.matched || this.openCards.length >= 2) {
        return;
      }

      this.flipCard(card, target);
    }

    flipCard(card, element) {
      card.flipped = true;
      element.classList.add('is-flipped');
      element.setAttribute('aria-label', `${card.symbol} card`);
      this.openCards.push(card);
      this.audio.playFlip();

      if (this.openCards.length === 2) {
        this.moves += 1;
        this.updateStats();
        this.resolveOpenCards();
      }
    }

    resolveOpenCards() {
      const [first, second] = this.openCards;
      this.inputLocked = true;

      if (first.pairId === second.pairId) {
        window.setTimeout(() => {
          first.matched = true;
          second.matched = true;
          this.matchedPairs += 1;
          this.openCards = [];
          this.inputLocked = false;
          this.audio.playMatch();
          this.renderBoard();

          if (this.matchedPairs === PAIRS.length) {
            this.completeGame();
          }
        }, 340);

        return;
      }

      window.setTimeout(() => {
        first.flipped = false;
        second.flipped = false;
        this.openCards = [];
        this.inputLocked = false;
        this.renderBoard();
      }, 760);
    }

    startTimer() {
      this.stopTimer();
      this.timerId = window.setInterval(() => {
        this.updateStats();
      }, 250);
    }

    stopTimer() {
      if (this.timerId) {
        window.clearInterval(this.timerId);
        this.timerId = 0;
      }
    }

    getElapsedSeconds() {
      if (this.state === 'playing') {
        return Math.floor((performance.now() - this.startedAt) / 1000);
      }

      return this.elapsedBeforeStop;
    }

    updateStats() {
      this.nodes.moveCount.textContent = String(this.moves);
      this.nodes.timer.textContent = formatTime(this.getElapsedSeconds());
    }

    updateBestDisplay() {
      const best = Storage.getBest();
      this.nodes.bestTime.textContent = best ? `${formatTime(best.seconds)} / ${best.moves}` : '--';
    }

    completeGame() {
      const finalSeconds = Math.floor((performance.now() - this.startedAt) / 1000);
      this.state = 'complete';
      this.elapsedBeforeStop = finalSeconds;
      this.stopTimer();
      this.updateStats();
      this.audio.playComplete();

      const result = {
        seconds: finalSeconds,
        moves: this.moves,
        completedAt: new Date().toISOString()
      };
      const best = Storage.getBest();
      const isNewBest = !best || isBetterResult(result, best);

      if (isNewBest) {
        Storage.saveBest(result);
      }

      const savedBest = Storage.getBest() || result;
      const stars = getStarRating(this.moves, this.elapsedBeforeStop);
      this.nodes.completeTitle.textContent = isNewBest ? 'New Best Run!' : 'Board Cleared!';
      this.nodes.starRating.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      this.nodes.completeSummary.textContent = `You matched all ${PAIRS.length} pairs in ${formatTime(result.seconds)}.`;
      this.nodes.finalMoves.textContent = String(result.moves);
      this.nodes.finalTime.textContent = formatTime(result.seconds);
      this.nodes.finalBest.textContent = `${formatTime(savedBest.seconds)} / ${savedBest.moves}`;
      this.updateBestDisplay();
      this.nodes.completeScreen.classList.add('is-visible');
    }
  }

  function isBetterResult(current, best) {
    return (
      current.seconds < best.seconds ||
      (current.seconds === best.seconds && current.moves < best.moves)
    );
  }

  function getStarRating(moves, seconds) {
    if (moves <= 12 && seconds <= 55) {
      return 3;
    }

    if (moves <= 18 && seconds <= 85) {
      return 2;
    }

    return 1;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyEmbedMode();
    window.addEventListener('message', handlePlatformMessage);
    const game = new MemoryGame(elements);

    if (shouldAutoStart()) {
      window.setTimeout(() => game.start(), 0);
    }
  });
})();

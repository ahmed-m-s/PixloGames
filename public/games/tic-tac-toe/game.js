(() => {
  'use strict';

  const STORAGE_KEY = 'pixlogames:tic-tac-toe:scoreboard';
  const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  const nodes = {
    board: document.getElementById('board'),
    startScreen: document.getElementById('startScreen'),
    resultScreen: document.getElementById('resultScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    resetButton: document.getElementById('resetButton'),
    turnLabel: document.getElementById('turnLabel'),
    statusText: document.getElementById('statusText'),
    xWins: document.getElementById('xWins'),
    oWins: document.getElementById('oWins'),
    resultEyebrow: document.getElementById('resultEyebrow'),
    resultTitle: document.getElementById('resultTitle'),
    resultSummary: document.getElementById('resultSummary'),
    finalXWins: document.getElementById('finalXWins'),
    finalOWins: document.getElementById('finalOWins'),
    finalDraws: document.getElementById('finalDraws')
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

  function readScoreboard() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      return {
        X: Number(value.X) || 0,
        O: Number(value.O) || 0,
        draws: Number(value.draws) || 0
      };
    } catch {
      return { X: 0, O: 0, draws: 0 };
    }
  }

  function writeScoreboard(scoreboard) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreboard));
    } catch {
      // Storage should never block a local match.
    }
  }

  class TicTacToeGame {
    constructor(ui) {
      this.ui = ui;
      this.board = Array.from({ length: 9 }, () => '');
      this.currentPlayer = 'X';
      this.state = 'start';
      this.scoreboard = readScoreboard();

      this.start = this.start.bind(this);
      this.handleCellClick = this.handleCellClick.bind(this);

      this.renderBoard();
      this.updateHud();
      this.bindEvents();
    }

    bindEvents() {
      this.ui.startButton.addEventListener('click', this.start);
      this.ui.restartButton.addEventListener('click', this.start);
      this.ui.resetButton.addEventListener('click', this.start);
      this.ui.board.addEventListener('click', this.handleCellClick);
    }

    start() {
      this.board = Array.from({ length: 9 }, () => '');
      this.currentPlayer = 'X';
      this.state = 'playing';
      this.ui.startScreen.classList.remove('is-visible');
      this.ui.resultScreen.classList.remove('is-visible');
      this.setStatus('X to move. Claim a square and build a line.');
      this.renderBoard();
      this.updateHud();
      window.requestAnimationFrame(() => this.ui.board.focus({ preventScroll: true }));
    }

    handleCellClick(event) {
      const cell = event.target.closest('[data-index]');

      if (!cell || this.state !== 'playing') {
        return;
      }

      const index = Number(cell.dataset.index);

      if (this.board[index]) {
        this.setStatus('That square is already taken.');
        return;
      }

      this.board[index] = this.currentPlayer;
      const result = this.getRoundResult();
      this.renderBoard(result.line);

      if (result.winner) {
        this.finishRound(result.winner, result.line);
        return;
      }

      if (result.draw) {
        this.finishRound('draw', []);
        return;
      }

      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      this.setStatus(`${this.currentPlayer} to move.`);
      this.updateHud();
    }

    getRoundResult() {
      for (const line of WIN_LINES) {
        const [a, b, c] = line;

        if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
          return { winner: this.board[a], line, draw: false };
        }
      }

      return {
        winner: '',
        line: [],
        draw: this.board.every(Boolean)
      };
    }

    finishRound(result, line) {
      this.state = 'complete';

      if (result === 'draw') {
        this.scoreboard.draws += 1;
        this.ui.resultEyebrow.textContent = 'Board locked';
        this.ui.resultTitle.textContent = 'Draw';
        this.ui.resultSummary.textContent =
          'No line this time. Reset the board and try a sharper route.';
        this.setStatus('Draw. No more open squares.');
      } else {
        this.scoreboard[result] += 1;
        this.ui.resultEyebrow.textContent = 'Three in a row';
        this.ui.resultTitle.textContent = `${result} wins`;
        this.ui.resultSummary.textContent = `${result} connected a clean line. Play another round?`;
        this.setStatus(`${result} wins the round.`);
      }

      writeScoreboard(this.scoreboard);
      this.renderBoard(line);
      this.updateHud();
      this.ui.resultScreen.classList.add('is-visible');
    }

    renderBoard(winningLine = []) {
      const winningCells = new Set(winningLine);

      this.ui.board.innerHTML = this.board
        .map((mark, index) => {
          const classes = ['cell'];

          if (mark) {
            classes.push(`mark-${mark.toLowerCase()}`);
          }

          if (winningCells.has(index)) {
            classes.push('is-winning');
          }

          return `<button class="${classes.join(' ')}" data-index="${index}" type="button" aria-label="Cell ${index + 1}${mark ? ` ${mark}` : ''}">${mark}</button>`;
        })
        .join('');
    }

    updateHud() {
      this.ui.turnLabel.textContent = this.currentPlayer;
      this.ui.xWins.textContent = String(this.scoreboard.X);
      this.ui.oWins.textContent = String(this.scoreboard.O);
      this.ui.finalXWins.textContent = String(this.scoreboard.X);
      this.ui.finalOWins.textContent = String(this.scoreboard.O);
      this.ui.finalDraws.textContent = String(this.scoreboard.draws);
    }

    setStatus(message) {
      this.ui.statusText.textContent = message;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyEmbedMode();
    window.addEventListener('message', handlePlatformMessage);

    const game = new TicTacToeGame(nodes);

    if (shouldAutoStart()) {
      window.setTimeout(() => game.start(), 0);
    }
  });
})();

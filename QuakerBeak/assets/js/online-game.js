// Online Battleship Game Client - 2D Grid Implementation (No Three.js)

// IMMEDIATE FAILSAFE: Remove loading screen after 5 seconds no matter what
setTimeout(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen && loadingScreen.classList.contains('active')) {
    console.warn('[FAILSAFE] Forcing loading screen removal after 5 seconds');
    loadingScreen.classList.remove('active');
    const statusMsg = document.getElementById('status-message');
    if (statusMsg) {
      statusMsg.textContent = 'Connection issue detected. Refresh if the game does not load.';
    }
  }
}, 5000);

const Logger = {
  styles: {
    info: 'color: #4285F4; font-weight: bold',
    success: 'color: #0F9D58; font-weight: bold',
    warning: 'color: #F4B400; font-weight: bold',
    error: 'color: #DB4437; font-weight: bold',
    network: 'color: #AB47BC; font-weight: bold',
    game: 'color: #00ACC1; font-weight: bold'
  },
  log(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const style = this.styles[level] || '';
    console.log(`%c[${timestamp}] [${category.toUpperCase()}] ${message}`, style, data || '');
  },
  info(c, m, d) { this.log('info', c, m, d); },
  success(c, m, d) { this.log('success', c, m, d); },
  warn(c, m, d) { this.log('warning', c, m, d); },
  error(c, m, d) { this.log('error', c, m, d); },
  network(c, m, d) { this.log('network', c, m, d); },
  game(c, m, d) { this.log('game', c, m, d); }
};

// Socket connection
const socket = io();
Logger.network('socket', 'Connecting to server...');

// Sound system using Howler
const sounds = {
  hit: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.5 }),
  miss: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], volume: 0.3 }),
  place: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'], volume: 0.2 }),
  victory: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.6 }),
  defeat: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1936/1936-preview.mp3'], volume: 0.6 })
};

// Game state
let gameState = 'connecting';
let myShips = [];
let enemyShips = [];
let currentShipIndex = 0;
let shipOrientation = 'horizontal';
let myBoard = [];
let enemyBoard = [];
let myBoardCells = [];
let enemyBoardCells = [];
let isMyTurn = false;
let timeLeft = 30;
let timerInterval = null;

const SHIP_TYPES = [
  { name: 'Carrier', length: 5, icon: 'C' },
  { name: 'Battleship', length: 4, icon: 'B' },
  { name: 'Cruiser', length: 3, icon: 'R' },
  { name: 'Submarine', length: 3, icon: 'S' },
  { name: 'Destroyer', length: 2, icon: 'D' }
];

// Heartbeat system
setInterval(() => {
  if (socket.connected) {
    socket.emit('heartbeat');
  }
}, 10000);

// Initialize 2D Grid Boards
function initBoards() {
  const container = document.getElementById('canvas-container');
  container.innerHTML = '';

  // Create boards wrapper
  const boardsWrapper = document.createElement('div');
  boardsWrapper.className = 'boards-wrapper';

  // Create My Board
  const myBoardContainer = createBoardContainer('my', 'Your Fleet');
  boardsWrapper.appendChild(myBoardContainer);

  // Create Enemy Board
  const enemyBoardContainer = createBoardContainer('enemy', 'Enemy Fleet');
  boardsWrapper.appendChild(enemyBoardContainer);

  container.appendChild(boardsWrapper);

  Logger.success('game', '2D Battleship grids initialized - 10x10 boards (200 cells total)');
}

function createBoardContainer(boardType, title) {
  const container = document.createElement('div');
  container.className = 'board-container';

  const titleEl = document.createElement('h2');
  titleEl.className = 'board-title';
  titleEl.textContent = title;
  container.appendChild(titleEl);

  const grid = document.createElement('div');
  grid.className = `game-grid ${boardType}-board`;
  grid.id = `${boardType}-grid`;

  const cells = boardType === 'my' ? myBoardCells : enemyBoardCells;
  const board = boardType === 'my' ? myBoard : enemyBoard;

  for (let row = 0; row < 10; row++) {
    board[row] = [];
    cells[row] = [];

    for (let col = 0; col < 10; col++) {
      board[row][col] = 0;

      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.board = boardType;
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Add row/col labels
      if (col === 0) {
        cell.dataset.rowLabel = row + 1;
      }
      if (row === 0) {
        cell.dataset.colLabel = String.fromCharCode(65 + col); // A-J
      }

      // Event listeners
      cell.addEventListener('click', () => onCellClick(boardType, row, col));
      cell.addEventListener('mouseenter', () => onCellHover(boardType, row, col, true));
      cell.addEventListener('mouseleave', () => onCellHover(boardType, row, col, false));

      grid.appendChild(cell);
      cells[row][col] = cell;
    }
  }

  container.appendChild(grid);
  return container;
}

function onCellClick(boardType, row, col) {
  if (gameState === 'placing' && boardType === 'my') {
    placeShip(row, col);
  } else if (gameState === 'playing' && isMyTurn && boardType === 'enemy' && enemyBoard[row][col] === 0) {
    socket.emit('attack', { row, col });
    isMyTurn = false;
    updateStatusMessage('Attack sent! Waiting for result...');
  }
}

function onCellHover(boardType, row, col, isEntering) {
  const cell = (boardType === 'my' ? myBoardCells : enemyBoardCells)[row][col];

  if (gameState === 'placing' && boardType === 'my' && isEntering) {
    // Show ship placement preview
    highlightShipPlacement(row, col, true);
  } else if (gameState === 'placing' && boardType === 'my' && !isEntering) {
    // Remove preview
    highlightShipPlacement(row, col, false);
  } else if (gameState === 'playing' && isMyTurn && boardType === 'enemy' && enemyBoard[row][col] === 0) {
    // Hover effect for attack
    cell.classList.toggle('hover', isEntering);
  }
}

function highlightShipPlacement(row, col, highlight) {
  if (currentShipIndex >= SHIP_TYPES.length) return;

  const ship = SHIP_TYPES[currentShipIndex];
  const cells = [];

  for (let i = 0; i < ship.length; i++) {
    const r = shipOrientation === 'horizontal' ? row : row + i;
    const c = shipOrientation === 'horizontal' ? col + i : col;

    if (r >= 10 || c >= 10) break;
    cells.push({ row: r, col: c });
  }

  cells.forEach(({ row, col }) => {
    const cell = myBoardCells[row][col];
    const isValid = myBoard[row][col] === 0;

    if (highlight) {
      cell.classList.add('preview');
      cell.classList.toggle('preview-invalid', !isValid);
    } else {
      cell.classList.remove('preview', 'preview-invalid');
    }
  });
}

function placeShip(row, col) {
  if (currentShipIndex >= SHIP_TYPES.length) return;

  const ship = SHIP_TYPES[currentShipIndex];
  const cells = [];

  for (let i = 0; i < ship.length; i++) {
    const r = shipOrientation === 'horizontal' ? row : row + i;
    const c = shipOrientation === 'horizontal' ? col + i : col;

    if (r >= 10 || c >= 10 || myBoard[r][c] !== 0) {
      Logger.warn('game', 'Invalid ship placement');
      return;
    }
    cells.push({ row: r, col: c });
  }

  // Place ship on board
  cells.forEach(({ row, col }) => {
    myBoard[row][col] = 1;
    myBoardCells[row][col].classList.add('ship');
    myBoardCells[row][col].dataset.icon = ship.icon;

    // Animate placement
    gsap.from(myBoardCells[row][col], { scale: 0.5, duration: 0.3, ease: 'back.out' });
  });

  myShips.push({ type: ship.name, length: ship.length, cells, hits: 0, sunk: false });
  sounds.place.play();

  currentShipIndex++;
  updateShipPreview();

  if (currentShipIndex >= SHIP_TYPES.length) {
    document.getElementById('ready-btn').disabled = false;
    updateStatusMessage('All ships placed! Click Ready to Battle.');
  }
}

function autoPlaceShips() {
  // Clear existing ships
  myBoard.forEach((row, r) => {
    row.forEach((cell, c) => {
      myBoard[r][c] = 0;
      myBoardCells[r][c].classList.remove('ship');
      delete myBoardCells[r][c].dataset.icon;
    });
  });
  myShips = [];
  currentShipIndex = 0;

  // Place all ships randomly
  SHIP_TYPES.forEach((ship, index) => {
    let placed = false;

    for (let attempts = 0; attempts < 100 && !placed; attempts++) {
      const row = Math.floor(Math.random() * 10);
      const col = Math.floor(Math.random() * 10);
      const horizontal = Math.random() < 0.5;

      const cells = [];
      let valid = true;

      for (let i = 0; i < ship.length; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;

        if (r >= 10 || c >= 10 || myBoard[r][c] !== 0) {
          valid = false;
          break;
        }
        cells.push({ row: r, col: c });
      }

      if (valid) {
        cells.forEach(({ row, col }) => {
          myBoard[row][col] = 1;
          myBoardCells[row][col].classList.add('ship');
          myBoardCells[row][col].dataset.icon = ship.icon;
          gsap.from(myBoardCells[row][col], { scale: 0.5, duration: 0.2, ease: 'back.out', delay: index * 0.1 });
        });

        myShips.push({ type: ship.name, length: ship.length, cells, hits: 0, sunk: false });
        placed = true;
        currentShipIndex++;
      }
    }
  });

  sounds.place.play();
  document.getElementById('ready-btn').disabled = false;
  updateShipPreview();
  updateStatusMessage('Ships auto-placed! Click Ready to Battle.');
}

function updateShipPreview() {
  if (currentShipIndex < SHIP_TYPES.length) {
    const ship = SHIP_TYPES[currentShipIndex];
    document.querySelector('.ship-preview').textContent = ship.icon;
    document.querySelector('.ship-name-large').textContent = `${ship.name} (${ship.length} cells) - ${shipOrientation}`;
  } else {
    document.querySelector('.ship-name-large').textContent = 'All ships placed!';
  }
}

function updateStatusMessage(message) {
  document.getElementById('status-message').textContent = message;
}

function updateCell(boardType, row, col, state) {
  const cells = boardType === 'my' ? myBoardCells : enemyBoardCells;
  const cell = cells[row][col];

  // Remove previous state classes
  cell.classList.remove('hit', 'miss', 'sunk');

  // Add new state
  if (state === 'hit') {
    cell.classList.add('hit');
    gsap.from(cell, { scale: 1.5, duration: 0.4, ease: 'elastic.out' });
  } else if (state === 'miss') {
    cell.classList.add('miss');
    gsap.from(cell, { scale: 0.8, duration: 0.3, ease: 'back.out' });
  } else if (state === 'sunk') {
    cell.classList.add('sunk');
    gsap.from(cell, { rotation: 360, duration: 0.6, ease: 'back.out' });
  }
}

// Socket event handlers
socket.on('connect', () => {
  Logger.network('socket', 'Connected to server');
  document.getElementById('loading-screen').classList.remove('active');

  const playerName = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
  socket.emit('join', { name: playerName, mode: 'online' });
  gameState = 'placing';
});

socket.on('connect_error', (error) => {
  Logger.error('socket', 'Connection error', error);
  document.getElementById('loading-screen').classList.remove('active');
  updateStatusMessage('⚠️ Unable to connect to server. Please check if the server is running.');
});

socket.on('connect_timeout', () => {
  Logger.error('socket', 'Connection timeout');
  document.getElementById('loading-screen').classList.remove('active');
  updateStatusMessage('⚠️ Connection timeout. Please refresh the page.');
});

// Fallback timeout to remove loading screen after 10 seconds
setTimeout(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen && loadingScreen.classList.contains('active')) {
    Logger.warn('socket', 'Loading screen timeout - removing');
    loadingScreen.classList.remove('active');
    updateStatusMessage('⚠️ Connection taking too long. Please check server status.');
  }
}, 10000);

socket.on('gameStart', (data) => {
  Logger.game('game', 'Game started', data);
  document.getElementById('player-name').textContent = data.playerName || 'You';
  updateStatusMessage(`Opponent: ${data.opponent || 'Waiting...'}`);
});

socket.on('battleStart', (data) => {
  Logger.game('game', 'Battle phase started', data);
  gameState = 'playing';
  isMyTurn = data.isYourTurn;

  if (isMyTurn) {
    updateStatusMessage('Your turn - Attack enemy fleet!');
    startTimer();
  } else {
    updateStatusMessage("Opponent's turn - Wait...");
  }
});

// Turn updates from server
socket.on('turnChange', ({ isYourTurn }) => {
  isMyTurn = !!isYourTurn;
  if (isMyTurn) {
    updateStatusMessage('Your turn - Attack enemy fleet!');
    startTimer();
  } else {
    updateStatusMessage("Opponent's turn - Wait...");
    stopTimer();
  }
});

socket.on('attackResult', (data) => {
  const { row, col, hit, sunk, ship, isAttacker } = data;

  if (isAttacker) {
    // Your attack on enemy board
    enemyBoard[row][col] = hit ? 3 : 2;
    updateCell('enemy', row, col, sunk ? 'sunk' : (hit ? 'hit' : 'miss'));

    if (hit) {
      sounds.hit.play();
      if (sunk) {
        Logger.success('game', `Enemy ${ship} sunk!`);
        updateStatusMessage(`💥 Enemy ${ship} destroyed!`);
      } else {
        updateStatusMessage('🎯 Direct hit!');
      }
    } else {
      sounds.miss.play();
      updateStatusMessage('💦 Miss!');
    }
  } else {
    // Enemy attack on your board
    myBoard[row][col] = hit ? 3 : 2;
    updateCell('my', row, col, sunk ? 'sunk' : (hit ? 'hit' : 'miss'));

    if (hit && sunk) {
      updateShipLegend(ship, true);
      updateStatusMessage(`⚠️ Your ${ship} was destroyed!`);
    } else if (hit) {
      updateStatusMessage('⚠️ Enemy hit your ship!');
    } else {
      updateStatusMessage('Enemy missed!');
    }
  }
});

socket.on('roundEnd', (data) => {
  Logger.game('game', 'Round ended', data);
  const won = data.winner === socket.id;
  updateStatusMessage(won ? `🎉 Round ${data.round} Won!` : `💀 Round ${data.round} Lost!`);

  // Update scores
  document.getElementById('player-score').textContent = `Score: ${data.scores.you || 0}`;

  setTimeout(() => {
    resetBoard();
    gameState = 'placing';
    currentShipIndex = 0;
    document.getElementById('placement-screen').classList.remove('hidden');
    updateShipPreview();
  }, 3000);
});

socket.on('gameOver', (data) => {
  gameState = 'finished';
  const won = data.winner === socket.id;
  updateStatusMessage(won ? '🏆 VICTORY! You won the game!' : '💀 DEFEAT! Better luck next time!');
  won ? sounds.victory.play() : sounds.defeat.play();

  setTimeout(() => {
    if (confirm('Game Over! Return to menu?')) {
      window.location.href = '/';
    }
  }, 3000);
});

socket.on('opponentDisconnected', (data) => {
  Logger.warn('game', 'Opponent disconnected', data);
  updateStatusMessage('⚠️ Opponent disconnected!');

  if (confirm('Opponent left. Continue with AI bot?')) {
    socket.emit('continueWithBot');
  } else {
    window.location.href = '/';
  }
});

socket.on('botJoined', (data) => {
  Logger.info('game', 'Bot joined', data);
  updateStatusMessage(`🤖 Playing against ${data.botName} (${data.difficultyName})`);
});

socket.on('disconnect', () => {
  Logger.error('socket', 'Disconnected from server');
  updateStatusMessage('⚠️ Connection lost!');
});

function resetBoard() {
  // Reset my board
  myBoard.forEach((row, r) => {
    row.forEach((cell, c) => {
      myBoard[r][c] = 0;
      myBoardCells[r][c].className = 'grid-cell';
      delete myBoardCells[r][c].dataset.icon;
    });
  });

  // Reset enemy board
  enemyBoard.forEach((row, r) => {
    row.forEach((cell, c) => {
      enemyBoard[r][c] = 0;
      enemyBoardCells[r][c].className = 'grid-cell';
    });
  });

  myShips = [];
  document.querySelectorAll('.ship-item').forEach(item => {
    item.classList.remove('destroyed');
    item.querySelectorAll('.health-cell').forEach(cell => cell.classList.remove('sunk'));
  });
}

function startTimer() {
  timeLeft = 30;
  const timerEl = document.getElementById('timer');
  timerEl.textContent = timeLeft;
  timerEl.classList.remove('warning');

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 5) {
      timerEl.classList.add('warning');
    }

    if (timeLeft <= 0) {
      stopTimer();
      // Auto-attack random cell
      const available = [];
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (enemyBoard[r][c] === 0) available.push({ row: r, col: c });
        }
      }
      if (available.length > 0) {
        const target = available[Math.floor(Math.random() * available.length)];
        socket.emit('attack', target);
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    document.getElementById('timer').classList.remove('warning');
  }
}

function updateShipLegend(shipName, sunk) {
  const shipItem = document.querySelector(`[data-ship="${shipName.toLowerCase()}"]`);
  if (shipItem && sunk) {
    shipItem.classList.add('destroyed');
    shipItem.querySelectorAll('.health-cell').forEach(cell => {
      cell.classList.add('sunk');
    });
  }
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') {
    shipOrientation = shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    updateShipPreview();
  } else if (event.key === ' ' && gameState === 'placing') {
    event.preventDefault();
    autoPlaceShips();
  }
});

// Fleet legend toggle
document.getElementById('legend-toggle')?.addEventListener('click', () => {
  const legend = document.getElementById('ship-legend');
  legend.classList.toggle('collapsed');
});

// UI event listeners
document.getElementById('back-btn')?.addEventListener('click', () => {
  if (confirm('Leave game?')) {
    window.location.href = '/';
  }
});

document.getElementById('auto-place-btn')?.addEventListener('click', autoPlaceShips);

document.getElementById('ready-btn')?.addEventListener('click', () => {
  if (myShips.length === SHIP_TYPES.length) {
    document.getElementById('placement-screen').classList.add('hidden');
    socket.emit('placeShips', myShips);
    gameState = 'waiting';
    updateStatusMessage('Waiting for opponent to finish placement...');
  } else {
    alert('Please place all ships first!');
  }
});

// Initialize on load
window.addEventListener('load', () => {
  Logger.info('init', 'Initializing 2D Battleship game (10×10 grids, 200 cells total)');
  initBoards();
  updateShipPreview();
});

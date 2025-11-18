// Debug Logger (Google Style)
const Logger = {
  styles: {
    info: 'color: #4285F4; font-weight: bold',
    success: 'color: #0F9D58; font-weight: bold',
    warning: 'color: #F4B400; font-weight: bold',
    error: 'color: #DB4437; font-weight: bold',
    network: 'color: #AB47BC; font-weight: bold',
    game: 'color: #00ACC1; font-weight: bold',
    timer: 'color: #FF6F00; font-weight: bold',
    ai: 'color: #7CB342; font-weight: bold'
  },

  log(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const style = this.styles[level] || '';
    console.log(`%c[${timestamp}] [${category.toUpperCase()}] ${message}`, style, data || '');
  },

  info(category, message, data) { this.log('info', category, message, data); },
  success(category, message, data) { this.log('success', category, message, data); },
  warn(category, message, data) { this.log('warning', category, message, data); },
  error(category, message, data) { this.log('error', category, message, data); },
  network(category, message, data) { this.log('network', category, message, data); },
  game(category, message, data) { this.log('game', category, message, data); },
  timer(category, message, data) { this.log('timer', category, message, data); },
  ai(category, message, data) { this.log('ai', category, message, data); }
};

// Socket connection
const socket = io();
Logger.network('socket', 'Initializing Socket.IO connection');

// Heartbeat system - send every 10 seconds to track activity
setInterval(() => {
  if (socket.connected) {
    socket.emit('heartbeat');
    Logger.info('heartbeat', 'Activity heartbeat sent');
  }
}, 10000);

// Three.js setup
let scene, camera, renderer, raycaster, mouse;
let myBoard = [], enemyBoard = [];
let myBoardMeshes = [], enemyBoardMeshes = [];
let myShips = [], enemyShips = [];

// Game state
let gameState = 'waiting';
let isMyTurn = false;
let placingShips = true;
let shipsToPlace = 5; // Simple: 5 ships, 1 cell each
let round = 1;
let opponent = '';
let timer = null;
let timeLeft = 30;
let gameMode = 'online'; // 'online' or 'offline'

// Camera shake state
let cameraShake = { active: false, intensity: 0, duration: 0, elapsed: 0, originalPos: null };

Logger.info('init', 'Game state initialized', { gameState, shipsToPlace, round });

// Initialize Three.js
function initThree() {
  Logger.info('three.js', 'Initializing Three.js renderer');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e3c72);
  Logger.success('three.js', 'Scene created', { backgroundColor: '#1e3c72' });

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 25, 8);
  camera.lookAt(0, 0, 0);
  Logger.success('three.js', 'Camera configured', { position: camera.position, fov: 60 });

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  Logger.success('three.js', 'WebGL renderer initialized', {
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true
  });

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  Logger.info('three.js', 'Raycaster and mouse tracking initialized');

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  Logger.success('three.js', 'Ambient light added', { intensity: 0.6 });

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  Logger.success('three.js', 'Directional light added', { intensity: 0.8, position: directionalLight.position });

  // Create boards
  Logger.info('three.js', 'Creating game boards...');
  createBoards();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);
  window.addEventListener('mousemove', onMouseMove);
  Logger.success('three.js', 'Event listeners registered', { events: ['resize', 'click', 'mousemove'] });

  animate();
  Logger.success('three.js', 'Animation loop started');
}

function createBoards() {
  Logger.game('board', 'Creating game boards');
  const boardSize = 10;
  const cellSize = 1;
  const spacing = 3;

  Logger.info('board', 'Board configuration', { boardSize, cellSize, spacing });

  // My board (left side)
  Logger.info('board', 'Creating player board (left side)');
  for (let row = 0; row < boardSize; row++) {
    myBoard[row] = [];
    myBoardMeshes[row] = [];
    for (let col = 0; col < boardSize; col++) {
      myBoard[row][col] = 0; // 0 = empty, 1 = ship, 2 = miss, 3 = hit

      const geometry = new THREE.BoxGeometry(cellSize * 0.9, 0.2, cellSize * 0.9);
      const material = new THREE.MeshPhongMaterial({ color: 0x4a90e2 });
      const cube = new THREE.Mesh(geometry, material);

      cube.position.x = col * cellSize - (boardSize * cellSize) / 2 - spacing;
      cube.position.z = row * cellSize - (boardSize * cellSize) / 2;
      cube.userData = { board: 'my', row, col };

      scene.add(cube);
      myBoardMeshes[row][col] = cube;
    }
  }
  Logger.success('board', 'Player board created', { cells: boardSize * boardSize, color: '#4a90e2' });

  // Enemy board (right side)
  Logger.info('board', 'Creating enemy board (right side)');
  for (let row = 0; row < boardSize; row++) {
    enemyBoard[row] = [];
    enemyBoardMeshes[row] = [];
    for (let col = 0; col < boardSize; col++) {
      enemyBoard[row][col] = 0;

      const geometry = new THREE.BoxGeometry(cellSize * 0.9, 0.2, cellSize * 0.9);
      const material = new THREE.MeshPhongMaterial({ color: 0xe24a4a });
      const cube = new THREE.Mesh(geometry, material);

      cube.position.x = col * cellSize + (boardSize * cellSize) / 2 + spacing;
      cube.position.z = row * cellSize - (boardSize * cellSize) / 2;
      cube.userData = { board: 'enemy', row, col };

      scene.add(cube);
      enemyBoardMeshes[row][col] = cube;
    }
  }
  Logger.success('board', 'Enemy board created', { cells: boardSize * boardSize, color: '#e24a4a' });

  // Labels
  Logger.info('board', 'Adding board labels');
  createLabel('YOUR BOARD', -8, -6);
  createLabel('ENEMY BOARD', 8, -6);
  Logger.success('board', 'Both boards created successfully');
}

function createLabel(text, x, z) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'white';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.fillText(text, 256, 80);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);

  sprite.position.set(x, 0, z);
  sprite.scale.set(8, 2, 1);
  scene.add(sprite);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData.board));

  // Reset all cell colors
  myBoardMeshes.forEach(row => {
    row.forEach(mesh => {
      const state = myBoard[mesh.userData.row][mesh.userData.col];
      if (state === 0) mesh.material.color.setHex(0x4a90e2);
      else if (state === 1) mesh.material.color.setHex(0x4CAF50);
      else if (state === 2) mesh.material.color.setHex(0x2196F3);
      else if (state === 3) mesh.material.color.setHex(0xf44336);
    });
  });

  enemyBoardMeshes.forEach(row => {
    row.forEach(mesh => {
      const state = enemyBoard[mesh.userData.row][mesh.userData.col];
      if (state === 0) mesh.material.color.setHex(0xe24a4a);
      else if (state === 2) mesh.material.color.setHex(0x2196F3);
      else if (state === 3) mesh.material.color.setHex(0xf44336);
    });
  });

  // Highlight hovered cell
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (placingShips && obj.userData.board === 'my' && myBoard[obj.userData.row][obj.userData.col] === 0) {
      obj.material.color.setHex(0x90EE90);
    } else if (isMyTurn && obj.userData.board === 'enemy' && enemyBoard[obj.userData.row][obj.userData.col] === 0) {
      obj.material.color.setHex(0xFF6B6B);
    }
  }
}

function onMouseClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData.board));

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const { board, row, col } = obj.userData;
    Logger.game('input', 'Mouse click detected', { board, row, col });

    if (placingShips && board === 'my' && myBoard[row][col] === 0) {
      Logger.game('placement', 'Placing ship at position', { row, col });
      placeShip(row, col);
    } else if (isMyTurn && board === 'enemy' && enemyBoard[row][col] === 0) {
      Logger.game('attack', 'Attacking enemy position', { row, col });
      attack(row, col);
    } else {
      Logger.warn('input', 'Invalid click', { placingShips, isMyTurn, board, cellState: board === 'my' ? myBoard[row][col] : enemyBoard[row][col] });
    }
  }
}

function placeShip(row, col) {
  Logger.game('placement', 'Ship placed on board', { row, col, shipsRemaining: shipsToPlace - 1 });
  myBoard[row][col] = 1;
  myShips.push({ row, col });
  myBoardMeshes[row][col].material.color.setHex(0x4CAF50);

  shipsToPlace--;
  updateInfo(`Ships to place: ${shipsToPlace}`);

  if (shipsToPlace === 0) {
    placingShips = false;
    Logger.success('placement', 'All ships placed! Sending to server', { totalShips: myShips.length });
    socket.emit('placeShips', myShips);
    updateStatus('Waiting for opponent...');
    updateInfo('');
  }
}

function attack(row, col) {
  Logger.network('attack', 'Sending attack to server', { row, col });
  socket.emit('attack', { row, col });
  isMyTurn = false;
  updateStatus('Waiting for opponent...');
}

function animate() {
  requestAnimationFrame(animate);

  // Update particle effects
  updateParticleEffects();

  // Update camera shake
  if (cameraShake.active) {
    cameraShake.elapsed += 16; // ~16ms per frame at 60fps

    if (cameraShake.elapsed >= cameraShake.duration) {
      // Reset camera position
      cameraShake.active = false;
      if (cameraShake.originalPos) {
        camera.position.copy(cameraShake.originalPos);
      }
    } else {
      // Apply shake
      const progress = cameraShake.elapsed / cameraShake.duration;
      const intensity = cameraShake.intensity * (1 - progress); // Fade out

      camera.position.x = cameraShake.originalPos.x + (Math.random() - 0.5) * intensity;
      camera.position.y = cameraShake.originalPos.y + (Math.random() - 0.5) * intensity;
      camera.position.z = cameraShake.originalPos.z + (Math.random() - 0.5) * intensity;
    }
  }

  renderer.render(scene, camera);
}

// Camera shake effect
function shakeCamera(intensity = 0.2, duration = 300) {
  if (!cameraShake.originalPos) {
    cameraShake.originalPos = camera.position.clone();
  }

  cameraShake.active = true;
  cameraShake.intensity = intensity;
  cameraShake.duration = duration;
  cameraShake.elapsed = 0;

  Logger.game('effect', 'Camera shake activated', { intensity, duration });
}

// Socket handlers
function joinGame(mode) {
  const name = document.getElementById('playerName').value.trim() || 'Guest';
  gameMode = mode;
  Logger.info('game', `Joining game in ${mode} mode`, { playerName: name });

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('ui').classList.remove('hidden');

  socket.emit('join', { name, mode });
  initThree();
  Logger.success('game', 'Game initialization complete', { mode: gameMode });
}

socket.on('waiting', () => {
  Logger.network('socket', 'Received waiting event - no opponent available');
  updateStatus('Waiting for opponent...');
});

socket.on('gameStart', (data) => {
  Logger.success('game', 'Game starting!', { opponent: data.opponent, round: data.round, maxRounds: data.maxRounds });
  opponent = data.opponent;
  round = data.round;

  resetBoards();
  placingShips = true;
  shipsToPlace = 5;
  myShips = [];

  updateStatus(`Round ${round} of ${data.maxRounds} - vs ${opponent}`);
  updateInfo(`Click on your board to place ${shipsToPlace} ships`);
  Logger.game('placement', 'Ship placement phase started', { shipsToPlace: 5 });
});

socket.on('battleStart', (data) => {
  Logger.success('game', 'Battle phase started!', { isYourTurn: data.isYourTurn });
  isMyTurn = data.isYourTurn;
  placingShips = false;

  if (isMyTurn) {
    updateStatus('Your turn! Attack enemy board!');
    Logger.game('turn', 'Your turn to attack');
  } else {
    updateStatus('Opponent\'s turn...');
    Logger.game('turn', 'Waiting for opponent to attack');
  }

  document.getElementById('scores').classList.remove('hidden');
});

socket.on('attackResult', (data) => {
  const { row, col, hit, enemy } = data;
  Logger.game('attack', `Attack result received`, { row, col, hit, isEnemyBoard: enemy });

  if (enemy) {
    enemyBoard[row][col] = hit ? 3 : 2;
    enemyBoardMeshes[row][col].material.color.setHex(hit ? 0xf44336 : 0x2196F3);

    // Get world position for particle effect
    const worldPos = new THREE.Vector3();
    enemyBoardMeshes[row][col].getWorldPosition(worldPos);

    if (hit) {
      Logger.success('attack', 'HIT on enemy board! 💥', { row, col });
      updateInfo('HIT! 💥');
      // Add hit particle effect
      addHitEffect(worldPos.x, worldPos.y + 1, worldPos.z);

      // Add screen shake effect
      shakeCamera(0.2, 300);
    } else {
      Logger.info('attack', 'Miss on enemy board', { row, col });
      updateInfo('Miss...');
      // Add miss particle effect
      addMissEffect(worldPos.x, worldPos.y + 1, worldPos.z);
    }
  } else {
    myBoard[row][col] = hit ? 3 : 2;
    myBoardMeshes[row][col].material.color.setHex(hit ? 0xf44336 : 0x2196F3);

    // Get world position for particle effect
    const worldPos = new THREE.Vector3();
    myBoardMeshes[row][col].getWorldPosition(worldPos);

    if (hit) {
      Logger.error('attack', 'Enemy scored a HIT! 💥', { row, col });
      updateInfo('You were hit! 💥');
      // Add hit particle effect
      addHitEffect(worldPos.x, worldPos.y + 1, worldPos.z);

      // Add screen shake effect
      shakeCamera(0.3, 400);
    } else {
      Logger.info('attack', 'Enemy missed', { row, col });
      updateInfo('Enemy missed');
      // Add miss particle effect
      addMissEffect(worldPos.x, worldPos.y + 1, worldPos.z);
    }
  }
});

socket.on('turnChange', (data) => {
  Logger.game('turn', 'Turn changed', { isYourTurn: data.isYourTurn });
  isMyTurn = data.isYourTurn;

  if (isMyTurn) {
    updateStatus('Your turn! Attack!');
    Logger.game('turn', 'Your turn to attack');
  } else {
    updateStatus('Opponent\'s turn...');
    Logger.game('turn', 'Waiting for opponent');
  }
});

socket.on('roundEnd', (data) => {
  const won = data.winner === socket.id;
  Logger.success('game', `Round ${round} ended`, { won, winner: data.winner, scores: data.scores });
  updateStatus(won ? `You won round ${round}!` : `Opponent won round ${round}!`);
  updateScores(data.scores);

  setTimeout(() => {
    updateInfo('Starting next round...');
    Logger.info('game', 'Preparing for next round');
  }, 2000);
});

socket.on('gameOver', (data) => {
  Logger.success('game', 'GAME OVER', { winner: data.winner, reason: data.reason, scores: data.scores });
  clearInterval(timer);
  document.getElementById('timerDisplay').style.display = 'none';
  updateScores(data.scores);

  if (data.reason) {
    Logger.info('game', `Game ended: ${data.reason}`);
    updateStatus(data.reason);
  } else {
    const won = data.winner === socket.id;
    if (won) {
      Logger.success('game', '🎉 VICTORY! YOU WON THE GAME! 🎉');
    } else {
      Logger.info('game', 'Defeat - Opponent won the game');
    }
    updateStatus(won ? '🎉 YOU WON THE GAME! 🎉' : 'Game Over - Opponent Won');
  }

  setTimeout(() => {
    if (data.winner === socket.id) {
      updateInfo('Waiting for next opponent...');
      Logger.info('game', 'Winner waiting for next opponent');
    }
  }, 3000);
});

socket.on('timerStart', (data) => {
  Logger.timer('timer', 'Turn timer started', { timeLeft: data.timeLeft });
  clearInterval(timer);
  timeLeft = data.timeLeft;
  const timerDisplay = document.getElementById('timerDisplay');
  timerDisplay.style.display = 'none';
  timerDisplay.classList.remove('red');

  timer = setInterval(() => {
    timeLeft--;
    updateInfo(`Time left: ${timeLeft}s`);

    // Show countdown after 10 seconds (when 20 seconds remain)
    if (timeLeft <= 20 && timeLeft > 0) {
      timerDisplay.style.display = 'block';
      timerDisplay.textContent = timeLeft;

      // Flash red when 10 seconds or less
      if (timeLeft <= 10) {
        timerDisplay.classList.add('red');
        Logger.warn('timer', `⏰ WARNING: ${timeLeft} seconds remaining!`);
      } else {
        timerDisplay.classList.remove('red');
      }
    } else {
      timerDisplay.style.display = 'none';
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      timerDisplay.style.display = 'none';
      updateInfo('Time up!');
      Logger.error('timer', '⏰ TIME UP! Turn forfeited');
    }
  }, 1000);
});

socket.on('forfeitNotice', (data) => {
  Logger.warn('game', 'Forfeit notice', { player: data.player, consecutiveForfeits: data.consecutiveForfeits });
  updateInfo(`${data.player} forfeited! (${data.consecutiveForfeits}/2)`);

  setTimeout(() => {
    updateInfo('');
  }, 3000);
});

socket.on('opponentDisconnected', (data) => {
  Logger.error('network', 'Opponent disconnected!', data);
  clearInterval(timer);
  document.getElementById('timerDisplay').style.display = 'none';

  if (confirm(data.message)) {
    Logger.info('game', 'User chose to continue with bot');
    socket.emit('continueWithBot');
    updateStatus('Waiting for bot...');
  } else {
    Logger.info('game', 'User declined to continue with bot');
  }
});

socket.on('botJoined', (data) => {
  Logger.ai('bot', 'Bot joined the game', { botName: data.botName, difficulty: data.difficulty });
  opponent = data.botName;
  updateStatus(`Playing against ${data.botName} (${data.difficulty.toUpperCase()} AI)`);
  updateInfo('Bot is placing ships...');
});

// Spectator mode handlers
socket.on('spectating', (data) => {
  Logger.info('spectate', 'Entered spectator mode', { queuePosition: data.queuePosition });
  gameState = 'spectating';

  // Show spectator UI
  showSpectatorMode(data);
  updateStatus(`👁️ Spectating - Queue Position: #${data.queuePosition}`);
  updateInfo('Watching current game. You will join the next match!');

  // Add visual effect
  addSpectatorOverlay();
});

socket.on('spectatorUpdate', (data) => {
  Logger.info('spectate', 'Spectator update received', data);

  if (data.type === 'gameStarted') {
    updateInfo(`New game started: ${data.player1} vs ${data.player2}`);
  } else if (data.type === 'gameEnded') {
    updateInfo(`Game ended - Winner: ${data.winner}`);
  }
});

socket.on('spectatorGameState', (data) => {
  Logger.game('spectate', 'Received game state as spectator', data);

  // Update spectator display with game info
  const spectatorInfo = document.getElementById('spectatorInfo');
  if (spectatorInfo) {
    spectatorInfo.innerHTML = `
      <div class="spectator-game-info">
        <h3>🎮 Current Match</h3>
        <p><strong>${data.player1}</strong> vs <strong>${data.player2}</strong></p>
        <p>Round ${data.currentRound}/${data.maxRounds}</p>
        <p>Current Turn: <span class="highlight">${data.currentTurn}</span></p>
        <div class="spectator-scores">
          <span>${data.player1}: ${data.scores[Object.keys(data.scores)[0]] || 0}</span>
          <span>${data.player2}: ${data.scores[Object.keys(data.scores)[1]] || 0}</span>
        </div>
      </div>
    `;
  }
});

socket.on('queueUpdate', (data) => {
  Logger.info('queue', 'Queue position updated', { position: data.position, total: data.totalInQueue });
  updateStatus(`👁️ Spectating - Queue Position: #${data.position}`);

  // Animate queue position change
  animateQueueUpdate(data.position);
});

// Kick to menu handler (for inactive offline players)
socket.on('kickToMenu', (data) => {
  Logger.warn('game', 'Kicked to menu due to inactivity', data);

  // Clear game state
  clearInterval(timer);
  gameState = 'waiting';

  // Show notification
  showKickNotification(data.reason);

  // Reset and return to menu
  setTimeout(() => {
    resetGame();
    showStartScreen();
  }, 3000);
});

function updateStatus(text) {
  Logger.info('ui', 'Status updated', { text });
  document.getElementById('status').textContent = text;
}

function updateInfo(text) {
  if (text) Logger.info('ui', 'Info updated', { text });
  document.getElementById('info').textContent = text;
}

function updateScores(scores) {
  const myScore = scores[socket.id] || 0;
  const oppScore = Object.values(scores).find(s => s !== myScore) || 0;
  Logger.game('score', 'Scores updated', { myScore, oppScore, allScores: scores });

  document.getElementById('yourScore').textContent = myScore;
  document.getElementById('oppScore').textContent = oppScore;
}

function resetBoards() {
  Logger.game('board', 'Resetting boards for new round');
  clearInterval(timer);
  document.getElementById('timerDisplay').style.display = 'none';

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      myBoard[row][col] = 0;
      enemyBoard[row][col] = 0;
      myBoardMeshes[row][col].material.color.setHex(0x4a90e2);
      enemyBoardMeshes[row][col].material.color.setHex(0xe24a4a);
    }
  }
  Logger.success('board', 'Boards reset complete');
}

// Leaderboard functions
let currentLeaderboardMode = 'online';

function showLeaderboard() {
  Logger.info('ui', 'Opening leaderboard modal');
  document.getElementById('leaderboardModal').classList.remove('hidden');
  switchLeaderboard('online');
}

function closeLeaderboard() {
  Logger.info('ui', 'Closing leaderboard modal');
  document.getElementById('leaderboardModal').classList.add('hidden');
}

function switchLeaderboard(mode) {
  Logger.info('leaderboard', `Switching to ${mode} leaderboard`);
  currentLeaderboardMode = mode;

  // Update button states
  document.getElementById('onlineTab').style.opacity = mode === 'online' ? '1' : '0.5';
  document.getElementById('offlineTab').style.opacity = mode === 'offline' ? '1' : '0.5';

  // Fetch leaderboard data
  fetch(`/api/leaderboard/${mode}`)
    .then(response => response.json())
    .then(data => {
      Logger.success('leaderboard', `Loaded ${mode} leaderboard`, { entries: data.length });
      displayLeaderboard(data);
    })
    .catch(error => {
      Logger.error('leaderboard', 'Failed to load leaderboard', error);
      document.getElementById('leaderboardList').innerHTML = '<li>Failed to load leaderboard</li>';
    });
}

function displayLeaderboard(data) {
  const list = document.getElementById('leaderboardList');

  if (!data || data.length === 0) {
    list.innerHTML = '<li>No entries yet. Be the first!</li>';
    return;
  }

  list.innerHTML = data.map((entry, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    return `
      <li>
        <span>${medal} ${entry.name}</span>
        <span>Wins: ${entry.wins} | Games: ${entry.games}</span>
      </li>
    `;
  }).join('');
}

// Modern Gaming UI Functions

// Show spectator mode UI
function showSpectatorMode(data) {
  Logger.info('ui', 'Showing spectator mode UI', data);

  // Hide game controls
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('canvas').style.display = 'block';

  // Create spectator info panel if it doesn't exist
  let spectatorPanel = document.getElementById('spectatorPanel');
  if (!spectatorPanel) {
    spectatorPanel = document.createElement('div');
    spectatorPanel.id = 'spectatorPanel';
    spectatorPanel.className = 'spectator-panel fade-in';
    document.body.appendChild(spectatorPanel);
  }

  spectatorPanel.innerHTML = `
    <div class="spectator-header">
      <h2>👁️ SPECTATOR MODE</h2>
      <div class="queue-badge pulse-glow">Queue Position: #${data.queuePosition}</div>
    </div>
    <div id="spectatorInfo" class="spectator-content"></div>
    <p class="spectator-message">You'll join the next available match!</p>
  `;
  spectatorPanel.classList.remove('hidden');
}

// Add spectator overlay effect
function addSpectatorOverlay() {
  Logger.info('ui', 'Adding spectator overlay effect');

  let overlay = document.getElementById('spectatorOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'spectatorOverlay';
    overlay.className = 'spectator-overlay fade-in';
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'block';
}

// Animate queue position updates
function animateQueueUpdate(position) {
  Logger.info('ui', 'Animating queue position change', { position });

  const queueBadge = document.querySelector('.queue-badge');
  if (queueBadge) {
    queueBadge.textContent = `Queue Position: #${position}`;

    // Add bounce animation
    queueBadge.classList.add('bounce');
    setTimeout(() => {
      queueBadge.classList.remove('bounce');
    }, 600);

    // Flash effect for position improvement
    if (position <= 2) {
      queueBadge.classList.add('flash-green');
      setTimeout(() => {
        queueBadge.classList.remove('flash-green');
      }, 1000);
    }
  }
}

// Show kick notification with modern styling
function showKickNotification(reason) {
  Logger.warn('ui', 'Showing kick notification', { reason });

  const notification = document.createElement('div');
  notification.className = 'kick-notification slide-in-top';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">⚠️</div>
      <h3>Returned to Menu</h3>
      <p>${reason}</p>
      <div class="notification-timer">Redirecting in 3 seconds...</div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 2500);
}

// Show start screen with animations
function showStartScreen() {
  Logger.info('ui', 'Showing start screen');

  document.getElementById('canvas').style.display = 'none';
  document.getElementById('startScreen').classList.remove('hidden');

  // Remove spectator panels
  const spectatorPanel = document.getElementById('spectatorPanel');
  const spectatorOverlay = document.getElementById('spectatorOverlay');

  if (spectatorPanel) {
    spectatorPanel.classList.add('fade-out');
    setTimeout(() => spectatorPanel.remove(), 500);
  }

  if (spectatorOverlay) {
    spectatorOverlay.style.display = 'none';
  }

  // Reset game state
  gameState = 'waiting';
  placingShips = true;
  shipsToPlace = 5;
  isMyTurn = false;
}

// Enhanced reset game function
function resetGame() {
  Logger.game('game', 'Resetting entire game state');

  // Clear timers
  clearInterval(timer);

  // Reset game state
  gameState = 'waiting';
  placingShips = true;
  shipsToPlace = 5;
  round = 1;
  isMyTurn = false;
  opponent = '';

  // Reset UI
  document.getElementById('timerDisplay').style.display = 'none';
  document.getElementById('yourScore').textContent = '0';
  document.getElementById('oppScore').textContent = '0';
  updateStatus('Waiting...');
  updateInfo('');

  // Reset boards
  resetBoards();

  Logger.success('game', 'Game reset complete');
}

// Particle effect system (for hits, misses, etc.)
class ParticleEffect {
  constructor(x, y, z, color, count = 20) {
    this.particles = [];
    this.createParticles(x, y, z, color, count);
  }

  createParticles(x, y, z, color, count) {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.set(x, y, z);
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      particle.gravity = -0.02;
      particle.life = 1.0;

      scene.add(particle);
      this.particles.push(particle);
    }
  }

  update() {
    this.particles = this.particles.filter(particle => {
      particle.velocity.y += particle.gravity;
      particle.position.add(particle.velocity);
      particle.life -= 0.02;
      particle.material.opacity = particle.life;

      if (particle.life <= 0) {
        scene.remove(particle);
        return false;
      }
      return true;
    });
  }

  isComplete() {
    return this.particles.length === 0;
  }
}

// Particle system manager
const particleEffects = [];

function addHitEffect(x, y, z) {
  const effect = new ParticleEffect(x, y, z, 0xff0000, 30);
  particleEffects.push(effect);
  Logger.game('effect', 'Hit particle effect created', { x, y, z });
}

function addMissEffect(x, y, z) {
  const effect = new ParticleEffect(x, y, z, 0x00aaff, 15);
  particleEffects.push(effect);
  Logger.game('effect', 'Miss particle effect created', { x, y, z });
}

function updateParticleEffects() {
  for (let i = particleEffects.length - 1; i >= 0; i--) {
    particleEffects[i].update();
    if (particleEffects[i].isComplete()) {
      particleEffects.splice(i, 1);
    }
  }
}

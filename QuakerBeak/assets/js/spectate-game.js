// Spectate Mode Client - Watch Live Matches
const Logger = {
  styles: {
    info: 'color: #4285F4; font-weight: bold',
    success: 'color: #0F9D58; font-weight: bold',
    warning: 'color: #F4B400; font-weight: bold',
    spectate: 'color: #F4B400; font-weight: bold'
  },
  log(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const style = this.styles[level] || '';
    console.log(`%c[${timestamp}] [${category.toUpperCase()}] ${message}`, style, data || '');
  },
  info(c, m, d) { this.log('info', c, m, d); },
  success(c, m, d) { this.log('success', c, m, d); },
  warn(c, m, d) { this.log('warning', c, m, d); },
  spectate(c, m, d) { this.log('spectate', c, m, d); }
};

const socket = io();
Logger.info('socket', 'Connecting to spectate server...');

let scene, camera, renderer;
let player1Board = [], player2Board = [];
let player1Meshes = [], player2Meshes = [];
let inQueue = false;
let queuePosition = 0;
let statsChart = null;

function initThree() {
  const canvas = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e27);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 25, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvas.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  createSpectatorBoards();
  animate();
  Logger.success('three.js', 'Spectator view initialized');
}

function createSpectatorBoards() {
  const boardSize = 10;
  const cellSize = 1;
  const spacing = 3;

  for (let row = 0; row < boardSize; row++) {
    player1Board[row] = [];
    player1Meshes[row] = [];
    player2Board[row] = [];
    player2Meshes[row] = [];

    for (let col = 0; col < boardSize; col++) {
      player1Board[row][col] = 0;
      player2Board[row][col] = 0;

      // Player 1 board (left)
      const p1Geometry = new THREE.BoxGeometry(cellSize * 0.9, 0.2, cellSize * 0.9);
      const p1Material = new THREE.MeshPhongMaterial({ color: 0x00d4ff });
      const p1Cube = new THREE.Mesh(p1Geometry, p1Material);
      p1Cube.position.x = col * cellSize - (boardSize * cellSize) / 2 - spacing;
      p1Cube.position.z = row * cellSize - (boardSize * cellSize) / 2;
      scene.add(p1Cube);
      player1Meshes[row][col] = p1Cube;

      // Player 2 board (right)
      const p2Geometry = new THREE.BoxGeometry(cellSize * 0.9, 0.2, cellSize * 0.9);
      const p2Material = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      const p2Cube = new THREE.Mesh(p2Geometry, p2Material);
      p2Cube.position.x = col * cellSize - (boardSize * cellSize) / 2 + spacing;
      p2Cube.position.z = row * cellSize - (boardSize * cellSize) / 2;
      scene.add(p2Cube);
      player2Meshes[row][col] = p2Cube;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function initStatsChart() {
  const ctx = document.getElementById('stats-chart')?.getContext('2d');
  if (!ctx) return;

  statsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Player 1 Hits', 'Player 1 Misses', 'Player 2 Hits', 'Player 2 Misses'],
      datasets: [{
        label: 'Match Statistics',
        data: [0, 0, 0, 0],
        backgroundColor: ['#00d4ff', '#666', '#ff6b6b', '#666']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Socket events
socket.on('connect', () => {
  Logger.info('socket', 'Connected to spectate server');
  document.getElementById('loading-screen')?.classList.remove('active');

  // Request spectate mode with player name
  const playerName = prompt('Enter your name:') || `Spectator${Math.floor(Math.random() * 1000)}`;
  socket.emit('join', { name: playerName, mode: 'spectate' });
});

socket.on('noActiveGames', () => {
  Logger.warn('spectate', 'No active games to watch');
  document.getElementById('no-match-screen')?.classList.remove('hidden');
  document.getElementById('canvas-container').style.display = 'none';
});

socket.on('spectating', (data) => {
  Logger.spectate('spectate', 'Now spectating match', data);
  document.getElementById('no-match-screen')?.classList.add('hidden');
  document.getElementById('canvas-container').style.display = 'block';

  queuePosition = data.queuePosition || 0;
  updateQueueDisplay();

  if (data.gameState) {
    updateGameState(data.gameState);
  }
});

socket.on('spectatorGameState', (data) => {
  Logger.info('spectate', 'Game state update', data);
  updateGameState(data);
});

socket.on('spectatorUpdate', (data) => {
  Logger.info('spectate', 'Spectator update', data);

  if (data.attack) {
    const { row, col, hit, player } = data.attack;
    const boardMeshes = player === 'player1' ? player2Meshes : player1Meshes;

    gsap.to(boardMeshes[row][col].material.color, {
      r: hit ? 0.9 : 0.2,
      g: hit ? 0 : 0.4,
      b: hit ? 0 : 0.8,
      duration: 0.5
    });

    addToAttackLog(player, row, col, hit);
  }
});

socket.on('queueUpdate', (data) => {
  queuePosition = data.position;
  updateQueueDisplay();
  Logger.info('queue', `Queue position: #${queuePosition}`);
});

socket.on('gameStart', (data) => {
  Logger.success('game', 'You are now playing!', data);
  window.location.href = '/online';
});

socket.on('gameOver', (data) => {
  Logger.info('spectate', 'Match ended', data);
  document.getElementById('status-message').textContent = `Match Over - Winner: ${data.winner}`;

  setTimeout(() => {
    if (inQueue) {
      document.getElementById('status-message').textContent = 'Waiting for next match...';
    } else {
      document.getElementById('no-match-screen')?.classList.remove('hidden');
    }
  }, 3000);
});

function updateGameState(data) {
  document.getElementById('player1-name').textContent = data.player1 || 'Player 1';
  document.getElementById('player2-name').textContent = data.player2 || 'Player 2';
  document.getElementById('player1-score').textContent = data.scores?.player1 || 0;
  document.getElementById('player2-score').textContent = data.scores?.player2 || 0;
  document.getElementById('current-turn').textContent = data.currentTurn || '-';

  if (data.stats && statsChart) {
    statsChart.data.datasets[0].data = [
      data.stats.player1Hits || 0,
      data.stats.player1Misses || 0,
      data.stats.player2Hits || 0,
      data.stats.player2Misses || 0
    ];
    statsChart.update();
  }
}

function updateQueueDisplay() {
  const queueEl = document.getElementById('queue-position');
  if (queueEl) {
    queueEl.textContent = inQueue ? `Position: #${queuePosition}` : 'Not in queue';
  }
}

function addToAttackLog(player, row, col, hit) {
  const log = document.getElementById('attack-log');
  if (!log) return;

  const emptyMsg = log.querySelector('.log-empty');
  if (emptyMsg) emptyMsg.remove();

  const entry = document.createElement('div');
  entry.className = `attack-entry ${hit ? 'hit' : 'miss'}`;
  entry.textContent = `${player === 'player1' ? 'P1' : 'P2'} attacked [${row},${col}] - ${hit ? 'HIT!' : 'Miss'}`;

  log.insertBefore(entry, log.firstChild);

  if (log.children.length > 10) {
    log.removeChild(log.lastChild);
  }

  gsap.from(entry, { x: -50, opacity: 0, duration: 0.3 });
}

function joinQueue() {
  socket.emit('joinQueue');
  inQueue = true;
  document.getElementById('join-queue-btn')?.style.setProperty('display', 'none');
  document.getElementById('leave-queue-btn')?.style.setProperty('display', 'inline-block');
  document.getElementById('join-queue-main-btn')?.style.setProperty('display', 'none');
  document.getElementById('waiting-info')?.style.setProperty('display', 'block');

  Logger.info('queue', 'Joined game queue');
}

function leaveQueue() {
  socket.emit('leaveQueue');
  inQueue = false;
  queuePosition = 0;
  document.getElementById('join-queue-btn')?.style.setProperty('display', 'inline-block');
  document.getElementById('leave-queue-btn')?.style.setProperty('display', 'none');
  document.getElementById('waiting-info')?.style.setProperty('display', 'none');
  updateQueueDisplay();

  Logger.info('queue', 'Left game queue');
}

// UI events
document.getElementById('back-btn')?.addEventListener('click', () => {
  window.location.href = '/';
});

document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
  window.location.href = '/';
});

document.getElementById('join-queue-btn')?.addEventListener('click', joinQueue);
document.getElementById('join-queue-main-btn')?.addEventListener('click', joinQueue);
document.getElementById('leave-queue-btn')?.addEventListener('click', leaveQueue);

window.addEventListener('resize', () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

window.addEventListener('load', () => {
  Logger.info('init', 'Initializing spectate mode...');
  initThree();
  initStatsChart();
});

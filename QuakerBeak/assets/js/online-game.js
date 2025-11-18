// Online Battleship Game Client - Modern Implementation with GSAP & Howler
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
let scene, camera, renderer, raycaster, mouse;
let myBoard = [], enemyBoard = [];
let myBoardMeshes = [], enemyBoardMeshes = [];
let isMyTurn = false;
let timeLeft = 30;
let timerInterval = null;

const SHIP_TYPES = [
  { name: 'Carrier', length: 5, icon: '🚢' },
  { name: 'Battleship', length: 4, icon: '⚓' },
  { name: 'Cruiser', length: 3, icon: '🛥️' },
  { name: 'Submarine', length: 3, icon: '🔱' },
  { name: 'Destroyer', length: 2, icon: '⛵' }
];

// Heartbeat system
setInterval(() => {
  if (socket.connected) {
    socket.emit('heartbeat');
  }
}, 10000);

// Initialize Three.js
function initThree() {
  const canvas = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e27);

  camera = new THREE.OrthographicCamera(
    window.innerWidth / -100,
    window.innerWidth / 100,
    window.innerHeight / 100,
    window.innerHeight / -100,
    0.1,
    1000
  );
  camera.position.set(0, 30, 0);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvas.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  createBoards();

  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('click', onMouseClick);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);

  animate();
  Logger.success('three.js', 'Renderer initialized');
}

function createBoards() {
  const boardSize = 10;
  const cellSize = 1;
  const spacing = 3;

  for (let row = 0; row < boardSize; row++) {
    myBoard[row] = [];
    myBoardMeshes[row] = [];
    enemyBoard[row] = [];
    enemyBoardMeshes[row] = [];

    for (let col = 0; col < boardSize; col++) {
      myBoard[row][col] = 0;
      enemyBoard[row][col] = 0;

      // My board (left)
      const myGeometry = new THREE.BoxGeometry(cellSize * 0.9, 0.2, cellSize * 0.9);
      const myMaterial = new THREE.MeshPhongMaterial({ color: 0x00d4ff });
      const myCube = new THREE.Mesh(myGeometry, myMaterial);
      myCube.position.x = col * cellSize - (boardSize * cellSize) / 2 - spacing;
      myCube.position.z = row * cellSize - (boardSize * cellSize) / 2;
      myCube.userData = { board: 'my', row, col };
      scene.add(myCube);
      myBoardMeshes[row][col] = myCube;

      // Enemy board (right)
      const enemyGeometry = new THREE.BoxGeometry(cellSize * 0.9, 0.2, cellSize * 0.9);
      const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      const enemyCube = new THREE.Mesh(enemyGeometry, enemyMaterial);
      enemyCube.position.x = col * cellSize - (boardSize * cellSize) / 2 + spacing;
      enemyCube.position.z = row * cellSize - (boardSize * cellSize) / 2;
      enemyCube.userData = { board: 'enemy', row, col };
      scene.add(enemyCube);
      enemyBoardMeshes[row][col] = enemyCube;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.left = window.innerWidth / -100;
  camera.right = window.innerWidth / 100;
  camera.top = window.innerHeight / 100;
  camera.bottom = window.innerHeight / -100;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData.board));

  if (intersects.length > 0) {
    const cell = intersects[0].object;
    if (gameState === 'playing' && isMyTurn && cell.userData.board === 'enemy') {
      gsap.to(cell.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.2 });
    }
  }
}

function onMouseClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData.board));

  if (intersects.length > 0) {
    const cell = intersects[0].object;
    const { board, row, col } = cell.userData;

    if (gameState === 'placing' && board === 'my') {
      placeShip(row, col);
    } else if (gameState === 'playing' && isMyTurn && board === 'enemy' && enemyBoard[row][col] === 0) {
      socket.emit('attack', { row, col });
      isMyTurn = false;
    }
  }
}

function onKeyDown(event) {
  if (event.key === 'r' || event.key === 'R') {
    shipOrientation = shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    updateShipPreview();
  } else if (event.key === ' ') {
    event.preventDefault();
    autoPlaceShips();
  }
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

  cells.forEach(({ row, col }) => {
    myBoard[row][col] = 1;
    gsap.to(myBoardMeshes[row][col].material.color, { r: 0.18, g: 0.8, b: 0.44, duration: 0.3 });
  });

  myShips.push({ type: ship.name, length: ship.length, cells, hits: 0, sunk: false });
  sounds.place.play();

  currentShipIndex++;
  updateShipPreview();

  if (currentShipIndex >= SHIP_TYPES.length) {
    document.getElementById('ready-btn').disabled = false;
  }
}

function autoPlaceShips() {
  while (currentShipIndex < SHIP_TYPES.length) {
    const ship = SHIP_TYPES[currentShipIndex];
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
          gsap.to(myBoardMeshes[row][col].material.color, { r: 0.18, g: 0.8, b: 0.44, duration: 0.2 });
        });

        myShips.push({ type: ship.name, length: ship.length, cells, hits: 0, sunk: false });
        placed = true;
        currentShipIndex++;
      }
    }
  }

  sounds.place.play();
  document.getElementById('ready-btn').disabled = false;
}

function updateShipPreview() {
  if (currentShipIndex < SHIP_TYPES.length) {
    const ship = SHIP_TYPES[currentShipIndex];
    document.querySelector('.ship-preview').textContent = ship.icon;
    document.querySelector('.ship-name-large').textContent = ship.name + ` (${ship.length} cells) - ${shipOrientation}`;
  }
}

// Socket event handlers
socket.on('connect', () => {
  Logger.network('socket', 'Connected to server');
  document.getElementById('loading-screen').classList.remove('active');

  // Request online game with player name
  const playerName = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
  socket.emit('join', { name: playerName, mode: 'online' });
  gameState = 'placing';
});

socket.on('gameStart', (data) => {
  Logger.game('game', 'Game started', data);
  document.getElementById('player-name').textContent = data.playerName;
  gameState = 'playing';
  updateShipPreview();
});

socket.on('yourTurn', () => {
  isMyTurn = true;
  document.getElementById('status-message').textContent = 'Your turn - Attack enemy!';
  startTimer();
});

socket.on('opponentTurn', () => {
  isMyTurn = false;
  document.getElementById('status-message').textContent = 'Opponent\'s turn...';
  stopTimer();
});

socket.on('attackResult', (data) => {
  const { row, col, hit, sunk, ship } = data;

  if (data.isAttacker) {
    enemyBoard[row][col] = hit ? 3 : 2;
    gsap.to(enemyBoardMeshes[row][col].material.color, {
      r: hit ? 0.9 : 0.2,
      g: hit ? 0 : 0.4,
      b: hit ? 0 : 0.8,
      duration: 0.5
    });

    if (hit) {
      sounds.hit.play();
      if (sunk) Logger.success('game', `Enemy ${ship} sunk!`);
    } else {
      sounds.miss.play();
    }
  } else {
    myBoard[row][col] = hit ? 3 : 2;
    gsap.to(myBoardMeshes[row][col].material.color, {
      r: hit ? 0.9 : 0.2,
      g: hit ? 0 : 0.4,
      b: hit ? 0 : 0.8,
      duration: 0.5
    });

    if (hit && sunk) {
      updateShipLegend(ship, true);
    }
  }
});

socket.on('gameOver', (data) => {
  gameState = 'finished';
  const won = data.winner === socket.id;
  document.getElementById('status-message').textContent = won ? '🎉 Victory!' : '💀 Defeat!';
  won ? sounds.victory.play() : sounds.defeat.play();

  setTimeout(() => {
    window.location.href = '/';
  }, 5000);
});

socket.on('disconnect', () => {
  Logger.error('socket', 'Disconnected from server');
  document.getElementById('status-message').textContent = 'Connection lost!';
});

function startTimer() {
  timeLeft = 30;
  document.getElementById('timer').textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;

    if (timeLeft <= 5) {
      document.getElementById('timer').classList.add('warning');
    }

    if (timeLeft <= 0) {
      stopTimer();
      socket.emit('attack', { row: Math.floor(Math.random() * 10), col: Math.floor(Math.random() * 10) });
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
  if (shipItem) {
    if (sunk) {
      shipItem.classList.add('destroyed');
      shipItem.querySelectorAll('.health-cell').forEach(cell => {
        cell.classList.add('sunk');
      });
    }
  }
}

// UI event listeners
document.getElementById('back-btn')?.addEventListener('click', () => {
  window.location.href = '/';
});

document.getElementById('auto-place-btn')?.addEventListener('click', autoPlaceShips);

document.getElementById('ready-btn')?.addEventListener('click', () => {
  document.getElementById('placement-screen').classList.add('hidden');
  socket.emit('placeShips', myShips);
  gameState = 'waiting';
});

// Initialize on load
window.addEventListener('load', () => {
  Logger.info('init', 'Initializing online game...');
  initThree();
  updateShipPreview();
});

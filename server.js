const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3010;

// Waterbird directory for JSON logging
const WATERBIRD_DIR = path.join(__dirname, 'waterbird');
const ONLINE_LEADERBOARD_PATH = path.join(WATERBIRD_DIR, 'online-leaderboard.json');
const OFFLINE_LEADERBOARD_PATH = path.join(WATERBIRD_DIR, 'offline-leaderboard.json');
const GAME_LOG_PATH = path.join(WATERBIRD_DIR, 'game-log.json');

// Server Logger with ANSI colors (Google style)
const Logger = {
  colors: {
    reset: '\x1b[0m',
    info: '\x1b[1m\x1b[34m',      // Blue
    success: '\x1b[1m\x1b[32m',   // Green
    warning: '\x1b[1m\x1b[33m',   // Yellow
    error: '\x1b[1m\x1b[31m',     // Red
    network: '\x1b[1m\x1b[35m',   // Magenta
    game: '\x1b[1m\x1b[36m',      // Cyan
    timer: '\x1b[1m\x1b[33m',     // Yellow
    ai: '\x1b[1m\x1b[32m'         // Green
  },

  log(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const color = this.colors[level] || this.colors.reset;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.log(`${color}[${timestamp}] [${category.toUpperCase()}] ${message}${this.colors.reset}${dataStr}`);
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

app.use(express.static('public'));
app.use(express.json());
Logger.success('server', 'Static file serving enabled', { directory: 'public' });

// File system utilities - check before creating
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    Logger.success('fs', 'Directory created', { path: dirPath });
    return false; // Was created
  } else {
    Logger.info('fs', 'Directory already exists', { path: dirPath });
    return true; // Already existed
  }
}

function ensureFileExists(filePath, defaultContent = '[]') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, 'utf8');
    Logger.success('fs', 'File created with default content', { path: filePath });
    return false; // Was created
  } else {
    Logger.info('fs', 'File already exists', { path: filePath });
    return true; // Already existed
  }
}

function readJSONFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    Logger.error('fs', 'Error reading JSON file', { path: filePath, error: error.message });
    return defaultValue;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    Logger.success('fs', 'JSON file written', { path: filePath, entries: data.length });
    return true;
  } catch (error) {
    Logger.error('fs', 'Error writing JSON file', { path: filePath, error: error.message });
    return false;
  }
}

// Initialize waterbird directory and files
Logger.info('init', 'Initializing waterbird directory and files...');
ensureDirectoryExists(WATERBIRD_DIR);
ensureFileExists(ONLINE_LEADERBOARD_PATH, '[]');
ensureFileExists(OFFLINE_LEADERBOARD_PATH, '[]');
ensureFileExists(GAME_LOG_PATH, '[]');
Logger.success('init', 'Waterbird directory initialized');

// Game state - separate tracking for online and offline games
let waitingPlayer = null;
let activeOnlineGame = null; // Only one online game at a time
let activeOfflineGames = []; // Track all offline games
let spectators = []; // Players waiting and spectating
let queue = [];
Logger.info('server', 'Game state initialized', {
  waitingPlayer: null,
  activeOnlineGame: null,
  activeOfflineGames: 0,
  spectators: 0,
  queue: 0
});

// Bot names pool (realistic usernames)
const BOT_NAMES = [
  'ShadowKnight', 'NoobMaster69', 'ProGamer420', 'xXDarkLordXx',
  'CaptainCool', 'TheDestroyer', 'NinjaWarrior', 'DragonSlayer',
  'SilentAssassin', 'ThunderStrike', 'IceQueen', 'PhoenixRising'
];
Logger.info('server', 'Bot name pool loaded', { count: BOT_NAMES.length });

// AI Bot classes with different difficulty levels
class AIBot {
  constructor(difficulty, name) {
    this.id = `bot_${Date.now()}_${Math.random()}`;
    this.name = name;
    this.difficulty = difficulty;
    this.isBot = true;
    this.lastHit = null;
    this.huntMode = false;
  }

  placeShips() {
    Logger.ai('bot', `Bot ${this.name} placing ships`, { difficulty: this.difficulty });
    const ships = [];
    const board = Array(10).fill(null).map(() => Array(10).fill(0));

    for (let i = 0; i < 5; i++) {
      let placed = false;
      while (!placed) {
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        if (board[row][col] === 0) {
          board[row][col] = 1;
          ships.push({ row, col });
          placed = true;
        }
      }
    }

    Logger.success('bot', `Bot ${this.name} placed all ships`, { shipCount: ships.length });
    return ships;
  }

  chooseAttack(enemyBoard) {
    Logger.ai('bot', `Bot ${this.name} choosing attack`, { difficulty: this.difficulty, huntMode: this.huntMode });
    let attack;
    switch (this.difficulty) {
      case 'easy':
        attack = this.randomAttack(enemyBoard);
        break;
      case 'medium':
        attack = this.smartRandomAttack(enemyBoard);
        break;
      case 'hard':
        attack = this.huntAndTargetAttack(enemyBoard);
        break;
      case 'expert':
        attack = this.expertAttack(enemyBoard);
        break;
      default:
        attack = this.randomAttack(enemyBoard);
    }
    Logger.ai('bot', `Bot ${this.name} selected target`, { row: attack.row, col: attack.col, difficulty: this.difficulty });
    return attack;
  }

  randomAttack(board) {
    const available = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 0) {
          available.push({ row, col });
        }
      }
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  smartRandomAttack(board) {
    // Avoid clustering, use checkerboard pattern
    const available = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 0 && (row + col) % 2 === 0) {
          available.push({ row, col });
        }
      }
    }

    if (available.length === 0) {
      return this.randomAttack(board);
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  huntAndTargetAttack(board) {
    // If we hit something, target adjacent cells
    if (this.lastHit) {
      const { row, col } = this.lastHit;
      const adjacent = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 }
      ];

      for (let pos of adjacent) {
        if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
          if (board[pos.row][pos.col] === 0) {
            return pos;
          }
        }
      }

      this.lastHit = null;
    }

    return this.smartRandomAttack(board);
  }

  expertAttack(board) {
    // Check for hits and prioritize adjacent cells
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 2) {
          const adjacent = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
          ];

          for (let pos of adjacent) {
            if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
              if (board[pos.row][pos.col] === 0) {
                return pos;
              }
            }
          }
        }
      }
    }

    return this.smartRandomAttack(board);
  }
}

function createBot() {
  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const bot = new AIBot(difficulty, name);
  Logger.ai('bot', 'Bot created', { name, difficulty, id: bot.id });
  return bot;
}

class BattleshipGame {
  constructor(player1, player2) {
    this.id = Date.now();
    this.player1 = player1;
    this.player2 = player2;
    this.currentRound = 1;
    this.maxRounds = 3;
    this.scores = { [player1.id]: 0, [player2.id]: 0 };
    this.currentTurn = player1.id;
    this.boards = {
      [player1.id]: this.createBoard(),
      [player2.id]: this.createBoard()
    };
    this.ships = {
      [player1.id]: [],
      [player2.id]: []
    };
    this.ready = {
      [player1.id]: false,
      [player2.id]: false
    };
    this.forfeits = {
      [player1.id]: 0,
      [player2.id]: 0
    };
    this.consecutiveForfeits = {
      [player1.id]: 0,
      [player2.id]: 0
    };
    this.timer = null;
    this.turnStartTime = null;

    Logger.game('game', 'New game created', {
      gameId: this.id,
      player1: player1.name,
      player2: player2.name,
      maxRounds: this.maxRounds
    });
  }

  createBoard() {
    return Array(10).fill(null).map(() => Array(10).fill(0));
  }

  placeShips(playerId, ships) {
    const player = playerId === this.player1.id ? this.player1 : this.player2;
    Logger.game('placement', `${player.name} placed ships`, { playerId, shipCount: ships.length });
    this.ships[playerId] = ships;
    this.ready[playerId] = true;
  }

  attack(attackerId, row, col) {
    const defenderId = attackerId === this.player1.id ? this.player2.id : this.player1.id;
    const attacker = attackerId === this.player1.id ? this.player1 : this.player2;
    const defender = defenderId === this.player1.id ? this.player1 : this.player2;
    const board = this.boards[defenderId];
    const ships = this.ships[defenderId];

    Logger.game('attack', `${attacker.name} attacking position`, { row, col, target: defender.name });

    if (board[row][col] !== 0) {
      Logger.warn('attack', 'Invalid attack - cell already attacked', { row, col });
      return null;
    }

    let hit = false;
    for (let ship of ships) {
      if (ship.row === row && ship.col === col) {
        hit = true;
        board[row][col] = 2;
        ship.hit = true;

        // For AI: update last hit
        if (this.player1.isBot) this.player1.lastHit = { row, col };
        if (this.player2.isBot) this.player2.lastHit = { row, col };

        Logger.success('attack', `💥 HIT! ${attacker.name} hit ${defender.name}'s ship`, { row, col });
        break;
      }
    }

    if (!hit) {
      board[row][col] = 1;
      Logger.info('attack', `Miss - ${attacker.name} missed`, { row, col });
    }

    const allSunk = ships.every(s => s.hit);
    if (allSunk) {
      Logger.success('game', `🎯 All ships sunk! ${attacker.name} wins round ${this.currentRound}`, {
        attacker: attacker.name,
        defender: defender.name
      });
    }

    return { hit, allSunk, defenderId };
  }

  forfeitTurn(playerId) {
    const player = playerId === this.player1.id ? this.player1 : this.player2;
    this.consecutiveForfeits[playerId]++;
    Logger.warn('game', `⏰ ${player.name} forfeited turn`, {
      consecutiveForfeits: this.consecutiveForfeits[playerId]
    });

    if (this.consecutiveForfeits[playerId] >= 2) {
      Logger.error('game', `${player.name} forfeited twice - GAME OVER`, { playerId });
      return true; // Game over
    }

    return false;
  }

  resetConsecutiveForfeits(playerId) {
    const player = playerId === this.player1.id ? this.player1 : this.player2;
    if (this.consecutiveForfeits[playerId] > 0) {
      Logger.info('game', `${player.name} forfeit counter reset`, { wasAt: this.consecutiveForfeits[playerId] });
    }
    this.consecutiveForfeits[playerId] = 0;
  }

  switchTurn() {
    const oldTurn = this.currentTurn === this.player1.id ? this.player1 : this.player2;
    this.currentTurn = this.currentTurn === this.player1.id ? this.player2.id : this.player1.id;
    const newTurn = this.currentTurn === this.player1.id ? this.player1 : this.player2;
    Logger.game('turn', 'Turn switched', { from: oldTurn.name, to: newTurn.name });
  }

  nextRound() {
    this.currentRound++;
    Logger.game('round', `Starting round ${this.currentRound}`, {
      player1: this.player1.name,
      player2: this.player2.name,
      scores: this.scores
    });
    this.boards = {
      [this.player1.id]: this.createBoard(),
      [this.player2.id]: this.createBoard()
    };
    this.ships = {
      [this.player1.id]: [],
      [this.player2.id]: []
    };
    this.ready = {
      [this.player1.id]: false,
      [this.player2.id]: false
    };
    this.consecutiveForfeits = {
      [this.player1.id]: 0,
      [this.player2.id]: 0
    };
  }

  getWinner() {
    const p1Score = this.scores[this.player1.id];
    const p2Score = this.scores[this.player2.id];
    if (p1Score > p2Score) return this.player1.id;
    if (p2Score > p1Score) return this.player2.id;
    return null;
  }
}

// Helper functions for spectator mode
function broadcastToSpectators(data) {
  Logger.info('spectate', 'Broadcasting to spectators', { spectatorCount: spectators.length, dataType: data.type });
  spectators.forEach(spectator => {
    if (spectator.socket) {
      spectator.socket.emit('spectatorUpdate', data);
    }
  });
}

function sendSpectatorGameState(socket, game) {
  if (!game) {
    Logger.warn('spectate', 'Cannot send game state - no active game');
    return;
  }

  Logger.info('spectate', 'Sending game state to spectator', { gameId: game.id });
  socket.emit('spectatorGameState', {
    player1: game.player1.name,
    player2: game.player2.name,
    currentRound: game.currentRound,
    maxRounds: game.maxRounds,
    scores: game.scores,
    currentTurn: game.currentTurn === game.player1.id ? game.player1.name : game.player2.name
  });
}

function startNextOnlineGame() {
  if (spectators.length >= 2 && !activeOnlineGame) {
    Logger.info('matchmaking', 'Starting next online game from spectator queue', { spectatorCount: spectators.length });

    const player1 = spectators.shift();
    const player2 = spectators.shift();

    const game = new BattleshipGame(player1, player2);
    game.mode = 'online';
    activeOnlineGame = game;

    Logger.success('matchmaking', `Match found from queue! ${game.player1.name} vs ${game.player2.name}`, {
      gameId: game.id,
      remainingSpectators: spectators.length
    });

    game.player1.socket.emit('gameStart', {
      opponent: game.player2.name,
      round: 1,
      maxRounds: 3
    });

    game.player2.socket.emit('gameStart', {
      opponent: game.player1.name,
      round: 1,
      maxRounds: 3
    });

    // Notify remaining spectators
    broadcastToSpectators({
      type: 'gameStarted',
      player1: game.player1.name,
      player2: game.player2.name
    });

    // Update queue positions for remaining spectators
    spectators.forEach((spectator, index) => {
      spectator.socket.emit('queueUpdate', {
        position: index + 1,
        totalInQueue: spectators.length
      });
    });
  } else if (spectators.length === 1 && !activeOnlineGame) {
    Logger.info('matchmaking', 'Only one spectator - setting as waiting player');
    waitingPlayer = spectators.shift();
    waitingPlayer.socket.emit('waiting');
  }
}

// Helper function to find game for a socket
function findGameForSocket(socketId) {
  // Check online game
  if (activeOnlineGame) {
    if (activeOnlineGame.player1.id === socketId || activeOnlineGame.player2.id === socketId) {
      return activeOnlineGame;
    }
  }

  // Check offline games
  for (let game of activeOfflineGames) {
    if (game.player1.id === socketId || game.player2.id === socketId) {
      return game;
    }
  }

  return null;
}

io.on('connection', (socket) => {
  Logger.network('socket', '🔌 New connection', { socketId: socket.id });

  socket.on('join', (data) => {
    // Handle both old format (string) and new format (object)
    const playerName = typeof data === 'string' ? data : (data.name || `Guest${socket.id.substring(0, 4)}`);
    const mode = typeof data === 'object' ? data.mode : 'online';

    socket.playerName = playerName;
    socket.playerMode = mode;
    Logger.info('player', `Player joined: ${socket.playerName}`, { socketId: socket.id, mode });

    // Offline mode: create game with bot (one at a time per player)
    if (mode === 'offline') {
      Logger.info('offline', `Starting offline game for ${socket.playerName}`);
      const bot = createBot();
      const game = new BattleshipGame(
        { id: socket.id, socket, name: socket.playerName, isBot: false },
        bot
      );
      game.mode = 'offline';
      activeOfflineGames.push(game);

      // Bot places ships automatically
      game.ships[bot.id] = bot.placeShips();
      game.ready[bot.id] = true;

      Logger.success('offline', `Offline game created: ${socket.playerName} vs ${bot.name}`, {
        gameId: game.id,
        botDifficulty: bot.difficulty,
        totalOfflineGames: activeOfflineGames.length
      });

      socket.emit('gameStart', {
        opponent: bot.name,
        round: 1,
        maxRounds: 3
      });

      socket.emit('botJoined', { botName: bot.name, difficulty: bot.difficulty });
      return;
    }

    // Online mode: matchmaking with spectate
    if (!activeOnlineGame && !waitingPlayer) {
      // No active game, no waiting player - become waiting player
      waitingPlayer = { id: socket.id, socket, name: socket.playerName, isBot: false };
      socket.emit('waiting');
      Logger.info('matchmaking', `${socket.playerName} is waiting for opponent`, { socketId: socket.id });
    } else if (!activeOnlineGame && waitingPlayer) {
      // No active game, but there's a waiting player - start game
      const game = new BattleshipGame(waitingPlayer, { id: socket.id, socket, name: socket.playerName, isBot: false });
      game.mode = 'online';
      activeOnlineGame = game;

      Logger.success('matchmaking', `Match found! ${game.player1.name} vs ${game.player2.name}`, {
        gameId: game.id
      });

      game.player1.socket.emit('gameStart', {
        opponent: game.player2.name,
        round: 1,
        maxRounds: 3
      });

      game.player2.socket.emit('gameStart', {
        opponent: game.player1.name,
        round: 1,
        maxRounds: 3
      });

      waitingPlayer = null;

      // Notify spectators
      broadcastToSpectators({
        type: 'gameStarted',
        player1: game.player1.name,
        player2: game.player2.name
      });
    } else {
      // Game in progress - add to spectators
      spectators.push({ id: socket.id, socket, name: socket.playerName });
      socket.emit('spectating', {
        message: 'Game in progress. You are now spectating.',
        queuePosition: spectators.length
      });
      Logger.info('spectate', `${socket.playerName} is spectating`, {
        queuePosition: spectators.length,
        totalSpectators: spectators.length
      });

      // Send current game state to spectator
      if (activeOnlineGame) {
        sendSpectatorGameState(socket, activeOnlineGame);
      }
    }
  });

  socket.on('continueWithBot', () => {
    Logger.info('bot', 'Player requested to continue with bot', { socketId: socket.id });
    const game = activeOnlineGame;

    if (!game || (game.player1.id !== socket.id && game.player2.id !== socket.id)) {
      Logger.warn('bot', 'No active game found for bot request', { socketId: socket.id });
      return;
    }

    const bot = createBot();

    if (game.player1.id === socket.id) {
      Logger.info('bot', `Replacing player2 with bot ${bot.name}`, { difficulty: bot.difficulty });
      game.player2 = bot;
    } else {
      Logger.info('bot', `Replacing player1 with bot ${bot.name}`, { difficulty: bot.difficulty });
      game.player1 = bot;
    }

    // Convert to offline game
    game.mode = 'offline';
    activeOfflineGames.push(game);
    activeOnlineGame = null;

    // Bot places ships automatically
    const botId = bot.id;
    game.ships[botId] = bot.placeShips();
    game.ready[botId] = true;

    socket.emit('botJoined', { botName: bot.name, difficulty: bot.difficulty });
    Logger.success('bot', `Bot ${bot.name} joined the game - converted to offline`, { gameId: game.id });

    if (game.ready[game.player1.id] && game.ready[game.player2.id]) {
      startBattle(game);
    }

    // Start next online game with spectators if any
    startNextOnlineGame();
  });

  socket.on('placeShips', (ships) => {
    const game = findGameForSocket(socket.id);

    if (!game) {
      Logger.warn('placement', 'Ship placement for non-existent game', { socketId: socket.id });
      return;
    }

    game.placeShips(socket.id, ships);

    if (game.ready[game.player1.id] && game.ready[game.player2.id]) {
      Logger.success('game', 'Both players ready - starting battle!', { gameId: game.id });
      startBattle(game);
    }
  });

  socket.on('attack', ({ row, col }) => {
    const game = findGameForSocket(socket.id);

    if (!game) {
      Logger.warn('attack', 'Attack from player not in a game', { socketId: socket.id });
      return;
    }

    if (game.currentTurn !== socket.id) {
      Logger.warn('attack', 'Attack attempted out of turn', { socketId: socket.id, currentTurn: game.currentTurn });
      return;
    }

    clearTimeout(game.timer);
    processAttack(game, socket.id, row, col);
  });

  socket.on('disconnect', () => {
    Logger.network('socket', '🔌 Player disconnected', { socketId: socket.id, playerName: socket.playerName });

    // Check if waiting player
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      Logger.info('matchmaking', `Waiting player ${socket.playerName} disconnected`);
      waitingPlayer = null;
      return;
    }

    // Check if spectator
    const spectatorIndex = spectators.findIndex(s => s.id === socket.id);
    if (spectatorIndex !== -1) {
      spectators.splice(spectatorIndex, 1);
      Logger.info('spectate', `Spectator ${socket.playerName} disconnected`, { remainingSpectators: spectators.length });

      // Update queue positions for remaining spectators
      spectators.forEach((spectator, index) => {
        spectator.socket.emit('queueUpdate', {
          position: index + 1,
          totalInQueue: spectators.length
        });
      });
      return;
    }

    // Check if in online game
    if (activeOnlineGame) {
      if (activeOnlineGame.player1.id === socket.id || activeOnlineGame.player2.id === socket.id) {
        const disconnectedPlayer = activeOnlineGame.player1.id === socket.id ? activeOnlineGame.player1 : activeOnlineGame.player2;
        const winner = activeOnlineGame.player1.id === socket.id ? activeOnlineGame.player2 : activeOnlineGame.player1;

        Logger.warn('game', `${disconnectedPlayer.name} disconnected from online game`, {
          gameId: activeOnlineGame.id,
          winner: winner.name
        });

        if (!winner.isBot && winner.socket) {
          winner.socket.emit('opponentDisconnected', {
            message: 'Opponent disconnected. Continue with bot?'
          });
          Logger.info('game', `Offering bot replacement to ${winner.name}`);
        } else {
          activeOnlineGame = null;
          Logger.info('game', `Online game removed - no human players remaining`);
          startNextOnlineGame();
        }
        return;
      }
    }

    // Check if in offline game
    const offlineGameIndex = activeOfflineGames.findIndex(g =>
      g.player1.id === socket.id || g.player2.id === socket.id
    );

    if (offlineGameIndex !== -1) {
      const game = activeOfflineGames[offlineGameIndex];
      Logger.warn('game', `Player disconnected from offline game`, { gameId: game.id });
      clearTimeout(game.timer);
      activeOfflineGames.splice(offlineGameIndex, 1);
      Logger.info('game', `Offline game ${game.id} removed`, { remainingOfflineGames: activeOfflineGames.length });
    }
  });
});

function startBattle(game) {
  Logger.success('game', `⚔️ Battle starting! Round ${game.currentRound}`, {
    gameId: game.id,
    player1: game.player1.name,
    player2: game.player2.name,
    firstTurn: game.currentTurn === game.player1.id ? game.player1.name : game.player2.name
  });

  const p1Data = {
    isYourTurn: game.currentTurn === game.player1.id,
    round: game.currentRound
  };

  const p2Data = {
    isYourTurn: game.currentTurn === game.player2.id,
    round: game.currentRound
  };

  if (!game.player1.isBot) {
    game.player1.socket.emit('battleStart', p1Data);
  }

  if (!game.player2.isBot) {
    game.player2.socket.emit('battleStart', p2Data);
  }

  startTurnTimer(game);
}

function startTurnTimer(game) {
  const currentPlayer = game.currentTurn === game.player1.id ? game.player1 : game.player2;
  Logger.timer('timer', `⏰ Turn timer started for ${currentPlayer.name}`, { timeLimit: '30s' });

  clearTimeout(game.timer);

  game.timer = setTimeout(() => {
    handleForfeit(game, game.currentTurn);
  }, 30000);

  // Send timer start to both players
  const timeLeft = 30;

  if (!game.player1.isBot && game.player1.socket) {
    game.player1.socket.emit('timerStart', { timeLeft });
  }

  if (!game.player2.isBot && game.player2.socket) {
    game.player2.socket.emit('timerStart', { timeLeft });
  }

  // If it's a bot's turn, make it attack after a delay
  if (currentPlayer.isBot) {
    const delay = 1500 + Math.random() * 1000; // 1.5-2.5 seconds delay
    Logger.ai('bot', `Bot ${currentPlayer.name} will attack in ${Math.round(delay)}ms`);
    setTimeout(() => {
      botTurn(game);
    }, delay);
  }
}

function botTurn(game) {
  const bot = game.currentTurn === game.player1.id ? game.player1 : game.player2;
  const enemyId = game.currentTurn === game.player1.id ? game.player2.id : game.player1.id;
  const enemyBoard = game.boards[enemyId];

  Logger.ai('bot', `🤖 Bot ${bot.name} is taking its turn`);

  const attack = bot.chooseAttack(enemyBoard);

  if (attack) {
    clearTimeout(game.timer);
    processAttack(game, bot.id, attack.row, attack.col);
  } else {
    Logger.error('bot', `Bot ${bot.name} couldn't choose an attack!`);
  }
}

function processAttack(game, attackerId, row, col) {
  Logger.game('attack', 'Processing attack', { attackerId, row, col, gameId: game.id });
  const result = game.attack(attackerId, row, col);
  if (!result) {
    Logger.warn('attack', 'Attack failed - invalid result');
    return;
  }

  game.resetConsecutiveForfeits(attackerId);

  const attacker = attackerId === game.player1.id ? game.player1 : game.player2;
  const defender = result.defenderId === game.player1.id ? game.player1 : game.player2;

  if (!attacker.isBot && attacker.socket) {
    attacker.socket.emit('attackResult', {
      row, col,
      hit: result.hit,
      enemy: true
    });
  }

  if (!defender.isBot && defender.socket) {
    defender.socket.emit('attackResult', {
      row, col,
      hit: result.hit,
      enemy: false
    });
  }

  if (result.allSunk) {
    game.scores[attackerId]++;

    if (game.currentRound >= game.maxRounds) {
      endGame(game);
    } else {
      if (!game.player1.isBot && game.player1.socket) {
        game.player1.socket.emit('roundEnd', {
          winner: attackerId,
          scores: game.scores,
          nextRound: game.currentRound + 1
        });
      }

      if (!game.player2.isBot && game.player2.socket) {
        game.player2.socket.emit('roundEnd', {
          winner: attackerId,
          scores: game.scores,
          nextRound: game.currentRound + 1
        });
      }

      setTimeout(() => {
        game.nextRound();

        // Reset bot ships
        if (game.player1.isBot) {
          game.ships[game.player1.id] = game.player1.placeShips();
          game.ready[game.player1.id] = true;
        }

        if (game.player2.isBot) {
          game.ships[game.player2.id] = game.player2.placeShips();
          game.ready[game.player2.id] = true;
        }

        if (!game.player1.isBot && game.player1.socket) {
          game.player1.socket.emit('gameStart', {
            opponent: game.player2.name,
            round: game.currentRound,
            maxRounds: 3
          });
        }

        if (!game.player2.isBot && game.player2.socket) {
          game.player2.socket.emit('gameStart', {
            opponent: game.player1.name,
            round: game.currentRound,
            maxRounds: 3
          });
        }
      }, 3000);
    }
  } else {
    game.switchTurn();

    if (!game.player1.isBot && game.player1.socket) {
      game.player1.socket.emit('turnChange', {
        isYourTurn: game.currentTurn === game.player1.id
      });
    }

    if (!game.player2.isBot && game.player2.socket) {
      game.player2.socket.emit('turnChange', {
        isYourTurn: game.currentTurn === game.player2.id
      });
    }

    startTurnTimer(game);
  }
}

function handleForfeit(game, playerId) {
  const gameOver = game.forfeitTurn(playerId);
  const loser = playerId === game.player1.id ? game.player1 : game.player2;

  if (gameOver) {
    const winnerId = playerId === game.player1.id ? game.player2.id : game.player1.id;
    const winner = winnerId === game.player1.id ? game.player1 : game.player2;

    // For offline games, kick the inactive player back to menu
    if (game.mode === 'offline' && !loser.isBot && loser.socket) {
      Logger.warn('game', `Kicking inactive offline player ${loser.name} back to menu`);
      loser.socket.emit('kickToMenu', {
        reason: 'You were inactive and forfeited twice in a row'
      });
    }

    if (!winner.isBot && winner.socket) {
      winner.socket.emit('gameOver', {
        winner: winnerId,
        reason: `${loser.name} forfeited twice in a row`,
        scores: game.scores
      });
    }

    if (!loser.isBot && loser.socket && game.mode !== 'offline') {
      loser.socket.emit('gameOver', {
        winner: winnerId,
        reason: 'You forfeited twice in a row',
        scores: game.scores
      });
    }

    // Remove from appropriate game list
    if (game.mode === 'online' && activeOnlineGame === game) {
      activeOnlineGame = null;
      Logger.info('game', 'Online game removed due to forfeit');

      // Start next online game with spectators
      startNextOnlineGame();
    } else if (game.mode === 'offline') {
      const gameIndex = activeOfflineGames.indexOf(game);
      if (gameIndex !== -1) {
        activeOfflineGames.splice(gameIndex, 1);
        Logger.info('game', `Offline game ${game.id} removed due to forfeit`, { remainingOfflineGames: activeOfflineGames.length });
      }
    }

    if (!winner.isBot && game.mode === 'online') {
      waitingPlayer = winner;
      winner.socket.emit('waiting');
    }
  } else {
    const forfeiter = playerId === game.player1.id ? game.player1 : game.player2;

    // For offline games on first forfeit, warn player about kick
    if (game.mode === 'offline' && !forfeiter.isBot) {
      Logger.warn('game', `Offline player ${forfeiter.name} forfeited - will be kicked on next forfeit`);
    }

    if (!game.player1.isBot && game.player1.socket) {
      game.player1.socket.emit('forfeitNotice', {
        player: forfeiter.name,
        consecutiveForfeits: game.consecutiveForfeits[playerId],
        willBeKicked: game.mode === 'offline' && !forfeiter.isBot
      });
    }

    if (!game.player2.isBot && game.player2.socket) {
      game.player2.socket.emit('forfeitNotice', {
        player: forfeiter.name,
        consecutiveForfeits: game.consecutiveForfeits[playerId],
        willBeKicked: game.mode === 'offline' && !forfeiter.isBot
      });
    }

    game.switchTurn();

    if (!game.player1.isBot && game.player1.socket) {
      game.player1.socket.emit('turnChange', {
        isYourTurn: game.currentTurn === game.player1.id
      });
    }

    if (!game.player2.isBot && game.player2.socket) {
      game.player2.socket.emit('turnChange', {
        isYourTurn: game.currentTurn === game.player2.id
      });
    }

    startTurnTimer(game);
  }
}

function endGame(game) {
  Logger.success('game', '🏁 GAME OVER - All rounds complete!', {
    gameId: game.id,
    player1: game.player1.name,
    player2: game.player2.name,
    finalScores: game.scores
  });

  clearTimeout(game.timer);

  const winnerId = game.getWinner();
  const winner = winnerId ? (winnerId === game.player1.id ? game.player1 : game.player2) : null;

  if (winner) {
    Logger.success('game', `🎉 ${winner.name} WINS THE GAME!`, { finalScores: game.scores });
  } else {
    Logger.info('game', 'Game ended in a tie', { finalScores: game.scores });
  }

  if (!game.player1.isBot && game.player1.socket) {
    game.player1.socket.emit('gameOver', {
      winner: winnerId,
      scores: game.scores
    });
  }

  if (!game.player2.isBot && game.player2.socket) {
    game.player2.socket.emit('gameOver', {
      winner: winnerId,
      scores: game.scores
    });
  }

  const gameIndex = activeGames.indexOf(game);
  if (gameIndex !== -1) {
    activeGames.splice(gameIndex, 1);
    Logger.info('game', `Game removed from active games`, { gameId: game.id, remainingGames: activeGames.length });
  }

  if (winnerId && winner && !winner.isBot) {
    waitingPlayer = winner;
    winner.socket.emit('waiting');
    Logger.info('matchmaking', `Winner ${winner.name} waiting for next opponent`);
  }

  // Update leaderboard and log game
  const mode = (game.player1.isBot || game.player2.isBot) ? 'offline' : 'online';

  if (winnerId && winner) {
    updateLeaderboard(winner.name, winner.isBot, true, mode);
  }

  const loser = winnerId ? (winnerId === game.player1.id ? game.player2 : game.player1) : null;
  if (loser) {
    updateLeaderboard(loser.name, loser.isBot, false, mode);
  }

  // Log game data
  logGameToJSON({
    gameId: game.id,
    player1: game.player1.name,
    player2: game.player2.name,
    winner: winner ? winner.name : 'tie',
    scores: game.scores,
    rounds: game.currentRound,
    mode
  });
}

// API Endpoints for Leaderboard
app.get('/api/leaderboard/:mode', (req, res) => {
  const mode = req.params.mode;
  Logger.info('api', `Leaderboard request for ${mode} mode`);

  if (mode !== 'online' && mode !== 'offline') {
    Logger.warn('api', 'Invalid leaderboard mode requested', { mode });
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const filePath = mode === 'online' ? ONLINE_LEADERBOARD_PATH : OFFLINE_LEADERBOARD_PATH;
  const leaderboard = readJSONFile(filePath, []);

  // Sort by wins descending, then by games ascending
  leaderboard.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.games - b.games;
  });

  Logger.success('api', `Leaderboard data sent for ${mode}`, { entries: leaderboard.length });
  res.json(leaderboard.slice(0, 100)); // Top 100
});

// Update leaderboard after game
function updateLeaderboard(playerName, isBot, won, mode) {
  if (isBot) return; // Don't track bot stats

  Logger.info('leaderboard', `Updating leaderboard for ${playerName}`, { won, mode });

  const filePath = mode === 'online' ? ONLINE_LEADERBOARD_PATH : OFFLINE_LEADERBOARD_PATH;
  const leaderboard = readJSONFile(filePath, []);

  // Find or create player entry
  let playerEntry = leaderboard.find(p => p.name === playerName);
  if (!playerEntry) {
    playerEntry = { name: playerName, wins: 0, games: 0 };
    leaderboard.push(playerEntry);
    Logger.info('leaderboard', `New player added to ${mode} leaderboard`, { name: playerName });
  }

  playerEntry.games++;
  if (won) playerEntry.wins++;

  writeJSONFile(filePath, leaderboard);
  Logger.success('leaderboard', `Leaderboard updated for ${playerName}`, {
    wins: playerEntry.wins,
    games: playerEntry.games,
    mode
  });
}

// Log game to JSON
function logGameToJSON(gameData) {
  Logger.info('game-log', 'Logging game to JSON', { gameId: gameData.gameId });

  const gameLogs = readJSONFile(GAME_LOG_PATH, []);
  gameLogs.push({
    ...gameData,
    timestamp: new Date().toISOString()
  });

  // Keep only last 1000 games
  if (gameLogs.length > 1000) {
    gameLogs.shift();
  }

  writeJSONFile(GAME_LOG_PATH, gameLogs);
}

httpServer.listen(PORT, '0.0.0.0', () => {
  Logger.success('server', `🚀 Spatuletail - Game server running on http://0.0.0.0:${PORT}`, {
    port: PORT,
    host: '0.0.0.0'
  });
});

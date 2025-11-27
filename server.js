// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================
// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('\x1b[1m\x1b[31m[FATAL ERROR] .env file not found!\x1b[0m');
  console.error('\x1b[33mPlease copy example.env to .env and configure your settings.\x1b[0m');
  console.error('\x1b[33mCommand: cp example.env .env\x1b[0m');
  process.exit(1);
}

// Load environment variables
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  console.error('\x1b[1m\x1b[31m[FATAL ERROR] Failed to parse .env file!\x1b[0m');
  console.error(result.error);
  process.exit(1);
}

// Validate required environment variables
const REQUIRED_ENV_VARS = [
  'PORT',
  'HOST',
  'NODE_ENV',
  'ADMIN_PASSWORD',
  'SESSION_SECRET',
  'MAX_ROUNDS',
  'TURN_TIMER_SECONDS'
];

const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('\x1b[1m\x1b[31m[FATAL ERROR] Missing required environment variables:\x1b[0m');
  missingVars.forEach(varName => {
    console.error(`  \x1b[31m- ${varName}\x1b[0m`);
  });
  console.error('\x1b[33mPlease check your .env file against example.env\x1b[0m');
  process.exit(1);
}

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const os = require('os');
const rateLimit = require('express-rate-limit');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// ========================================
// CONFIGURATION FROM .ENV
// ========================================
// Server Configuration
const PORT = parseInt(process.env.PORT) || 3010;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Admin Panel
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_TIMEOUT = (parseInt(process.env.ADMIN_SESSION_TIMEOUT_SECONDS) || 3600) * 1000;

// Security
const SESSION_SECRET = process.env.SESSION_SECRET;
const ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING === 'true';
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 10;

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const RATE_LIMIT_SOCKET_ENABLED = process.env.RATE_LIMIT_SOCKET_ENABLED === 'true';
const RATE_LIMIT_SOCKET_MAX_PER_MINUTE = parseInt(process.env.RATE_LIMIT_SOCKET_MAX_PER_MINUTE) || 5;

// Game Configuration
const MAX_ROUNDS = parseInt(process.env.MAX_ROUNDS) || 3;
const TURN_TIMER_SECONDS = parseInt(process.env.TURN_TIMER_SECONDS) || 30;
const MAX_SIMULATED_PLAYERS = parseInt(process.env.MAX_SIMULATED_PLAYERS) || 47;
const BOARD_SIZE = parseInt(process.env.BOARD_SIZE) || 10;
const INACTIVITY_THRESHOLD = (parseInt(process.env.INACTIVITY_THRESHOLD_SECONDS) || 45) * 1000;
const WARNING_THRESHOLD = (parseInt(process.env.WARNING_THRESHOLD_SECONDS) || 30) * 1000;

// Matchmaking
const ENABLE_SPECTATOR_MODE = process.env.ENABLE_SPECTATOR_MODE !== 'false';
const MAX_SPECTATORS = parseInt(process.env.MAX_SPECTATORS) || 50;
const MATCHMAKING_TIMEOUT = (parseInt(process.env.MATCHMAKING_TIMEOUT_SECONDS) || 60) * 1000;

// AI/Bot Configuration
const BOT_MIN_DIFFICULTY = parseInt(process.env.BOT_MIN_DIFFICULTY) || 1;
const BOT_MAX_DIFFICULTY = parseInt(process.env.BOT_MAX_DIFFICULTY) || 4;
const BOT_MIN_DELAY = (parseFloat(process.env.BOT_MIN_DELAY_SECONDS) || 1.5) * 1000;
const BOT_MAX_DELAY = (parseFloat(process.env.BOT_MAX_DELAY_SECONDS) || 2.5) * 1000;

// Logging & Data Storage
const MAX_GAME_LOGS = parseInt(process.env.MAX_GAME_LOGS) || 2000;
const MAX_EVENT_LOGS = parseInt(process.env.MAX_EVENT_LOGS) || 2000;
const MAX_LEADERBOARD_ENTRIES = parseInt(process.env.MAX_LEADERBOARD_ENTRIES) || 100;
const ENABLE_CONSOLE_LOGGING = process.env.ENABLE_CONSOLE_LOGGING !== 'false';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Performance
const STATS_UPDATE_INTERVAL = (parseInt(process.env.STATS_UPDATE_INTERVAL_SECONDS) || 3) * 1000;
const SYSTEM_INFO_INTERVAL = (parseInt(process.env.SYSTEM_INFO_INTERVAL_SECONDS) || 5) * 1000;
const ACTIVITY_CHECK_INTERVAL = (parseInt(process.env.ACTIVITY_CHECK_INTERVAL_SECONDS) || 10) * 1000;

// Features
const ENABLE_OFFLINE_MODE = process.env.ENABLE_OFFLINE_MODE !== 'false';
const ENABLE_ONLINE_MODE = process.env.ENABLE_ONLINE_MODE !== 'false';
const ENABLE_LEADERBOARDS = process.env.ENABLE_LEADERBOARDS !== 'false';
const ENABLE_GAME_STATS = process.env.ENABLE_GAME_STATS !== 'false';

// API Configuration
const API_VERSION = process.env.API_VERSION || 'v1';
const API_FOOTER_ENABLED = process.env.API_FOOTER_ENABLED !== 'false';
const API_FOOTER_NAME = process.env.API_FOOTER_NAME || 'Spatuletail Game API';
const API_FOOTER_VERSION = process.env.API_FOOTER_VERSION || '2.3.5';
const API_FOOTER_AUTHOR = process.env.API_FOOTER_AUTHOR || 'Spatuletail Development Team';
const API_FOOTER_DOCS_URL = process.env.API_FOOTER_DOCS_URL || 'https://github.com/spatuletail/game';
const API_FOOTER_TIMESTAMP = process.env.API_FOOTER_TIMESTAMP !== 'false';

// Print loaded configuration
console.log('\x1b[1m\x1b[32m[CONFIG] Environment configuration loaded successfully\x1b[0m');
console.log('\x1b[36m[CONFIG] Server: %s:%d [%s]\x1b[0m', HOST, PORT, NODE_ENV);
console.log('\x1b[36m[CONFIG] Features: Online=%s, Offline=%s, Spectator=%s\x1b[0m',
  ENABLE_ONLINE_MODE, ENABLE_OFFLINE_MODE, ENABLE_SPECTATOR_MODE);
console.log('\x1b[36m[CONFIG] Game: %d rounds, %ds turn timer, %d max simulated players\x1b[0m',
  MAX_ROUNDS, TURN_TIMER_SECONDS, MAX_SIMULATED_PLAYERS);
console.log('\x1b[36m[CONFIG] Bot difficulty: %d-%d, delay: %.1fs-%.1fs\x1b[0m',
  BOT_MIN_DIFFICULTY, BOT_MAX_DIFFICULTY, BOT_MIN_DELAY/1000, BOT_MAX_DELAY/1000);

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

// Serve static assets from QuakerBeak directory
app.use('/assets', express.static(path.join(__dirname, 'QuakerBeak', 'assets')));
app.use(express.json());
Logger.success('server', 'Static file serving enabled', { directory: 'QuakerBeak/assets' });

// ========================================
// RATE LIMITING MIDDLEWARE
// ========================================
if (ENABLE_RATE_LIMITING) {
  const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: RATE_LIMIT_WINDOW_MINUTES + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      Logger.warn('security', 'Rate limit exceeded', {
        ip: req.ip,
        path: req.path
      });
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: RATE_LIMIT_WINDOW_MINUTES + ' minutes'
      });
    }
  });

  app.use(`/api/${API_VERSION}`, apiLimiter);
  Logger.success('security', 'API rate limiting enabled', {
    window: RATE_LIMIT_WINDOW_MINUTES + ' minutes',
    maxRequests: RATE_LIMIT_MAX_REQUESTS
  });
} else {
  Logger.warn('security', 'Rate limiting is DISABLED');
}

// ========================================
// API FOOTER MIDDLEWARE
// ========================================
if (API_FOOTER_ENABLED) {
  app.use(`/api/${API_VERSION}`, (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      const response = {
        data: data,
        _meta: {
          api: API_FOOTER_NAME,
          version: API_FOOTER_VERSION,
          author: API_FOOTER_AUTHOR,
          docs: API_FOOTER_DOCS_URL
        }
      };

      if (API_FOOTER_TIMESTAMP) {
        response._meta.timestamp = new Date().toISOString();
      }

      return originalJson(response);
    };

    next();
  });

  Logger.success('api', 'API footer middleware enabled', {
    name: API_FOOTER_NAME,
    version: API_FOOTER_VERSION
  });
} else {
  Logger.info('api', 'API footer is DISABLED');
}

// Route handlers for new structure
app.get('/', (req, res) => {
  // Use the non-React landing page to avoid in-browser Babel/React warnings
  res.sendFile(path.join(__dirname, 'QuakerBeak', 'views', 'index.html'));
  Logger.info('route', 'Root route accessed', { path: '/' });
});

app.get('/online', (req, res) => {
  res.sendFile(path.join(__dirname, 'QuakerBeak', 'views', 'online.html'));
  Logger.info('route', 'Online game route accessed', { path: '/online' });
});

app.get('/offline', (req, res) => {
  res.sendFile(path.join(__dirname, 'QuakerBeak', 'views', 'offline.html'));
  Logger.info('route', 'Offline game route accessed', { path: '/offline' });
});

app.get('/spectate', (req, res) => {
  res.sendFile(path.join(__dirname, 'QuakerBeak', 'views', 'spectate.html'));
  Logger.info('route', 'Spectate route accessed', { path: '/spectate' });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'QuakerBeak', 'views', 'admin.html'));
  Logger.info('route', 'Admin dashboard accessed', { path: '/admin' });
});

// Quietly handle missing favicon to avoid noisy 404s in the console
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'secretarybird', 'terms.html'));
  Logger.info('route', 'Terms of Service accessed', { path: '/terms' });
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'secretarybird', 'privacy-policy.html'));
  Logger.info('route', 'Privacy Policy accessed', { path: '/privacy-policy' });
});

Logger.success('server', 'All routes configured', { routes: ['/', '/online', '/offline', '/spectate', '/admin', '/terms', '/privacy-policy'] });

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

// Live game stats
let liveStats = {
  totalConnections: 0,
  currentPlayers: 0,
  gamesPlayed: 0,
  onlineGamesPlayed: 0,
  offlineGamesPlayed: 0,
  totalHits: 0,
  totalMisses: 0,
  averageGameDuration: 0
};

// Player activity tracking
const playerActivity = new Map(); // socketId -> { lastActivity, warnings, isActive }

// Simulated bot players (1-47) to show active players
const SIMULATED_PLAYERS = Array.from({ length: 47 }, (_, i) => i + 1);
const activeSimulatedPlayers = new Set();

// Initialize with random active players (30-40% initially active)
SIMULATED_PLAYERS.forEach(id => {
  if (Math.random() < 0.35) {
    activeSimulatedPlayers.add(id);
  }
});

// Random interval to toggle simulated player activity
function toggleRandomSimulatedPlayer() {
  const randomId = SIMULATED_PLAYERS[Math.floor(Math.random() * SIMULATED_PLAYERS.length)];

  if (activeSimulatedPlayers.has(randomId)) {
    activeSimulatedPlayers.delete(randomId);
  } else {
    activeSimulatedPlayers.add(randomId);
  }

  // Schedule next toggle at random interval (5-30 seconds)
  const nextInterval = 5000 + Math.random() * 25000;
  setTimeout(toggleRandomSimulatedPlayer, nextInterval);
}

// Start the simulated player activity system
toggleRandomSimulatedPlayer();

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

// Ship types for traditional Battleship gameplay
const SHIP_TYPES = [
  { name: 'Carrier', length: 5, symbol: 'C' },
  { name: 'Battleship', length: 4, symbol: 'B' },
  { name: 'Cruiser', length: 3, symbol: 'R' },
  { name: 'Submarine', length: 3, symbol: 'S' },
  { name: 'Destroyer', length: 2, symbol: 'D' }
];
Logger.info('server', 'Ship types loaded', { ships: SHIP_TYPES.length, totalCells: 17 });

// AI Bot classes with 4-tier difficulty system
class AIBot {
  constructor(difficulty, name) {
    this.id = `bot_${Date.now()}_${Math.random()}`;
    this.name = name;
    this.difficulty = difficulty; // 1=Easy, 2=Medium, 3=Hard, 4=Extreme
    this.isBot = true;
    this.lastHit = null;
    this.huntMode = false;
    this.targetQueue = []; // For smart targeting
    this.hitShip = []; // Track hits on current ship
  }

  placeShips() {
    Logger.ai('bot', `Bot ${this.name} placing ships`, { difficulty: this.difficulty });
    const ships = [];
    const board = Array(10).fill(null).map(() => Array(10).fill(0));

    // Place each ship type with proper length
    for (let shipType of SHIP_TYPES) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const horizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);

        // Check if ship fits
        if (horizontal && col + shipType.length <= 10) {
          let canPlace = true;
          // Check all cells are empty
          for (let i = 0; i < shipType.length; i++) {
            if (board[row][col + i] !== 0) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            // Place the ship
            const shipCells = [];
            for (let i = 0; i < shipType.length; i++) {
              board[row][col + i] = 1;
              shipCells.push({ row, col: col + i });
            }
            ships.push({
              type: shipType.name,
              length: shipType.length,
              cells: shipCells,
              hits: 0,
              sunk: false
            });
            placed = true;
          }
        } else if (!horizontal && row + shipType.length <= 10) {
          let canPlace = true;
          // Check all cells are empty
          for (let i = 0; i < shipType.length; i++) {
            if (board[row + i][col] !== 0) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            // Place the ship
            const shipCells = [];
            for (let i = 0; i < shipType.length; i++) {
              board[row + i][col] = 1;
              shipCells.push({ row: row + i, col });
            }
            ships.push({
              type: shipType.name,
              length: shipType.length,
              cells: shipCells,
              hits: 0,
              sunk: false
            });
            placed = true;
          }
        }
      }

      if (!placed) {
        Logger.error('bot', `Failed to place ${shipType.name} after ${maxAttempts} attempts`);
      }
    }

    Logger.success('bot', `Bot ${this.name} placed all ships`, { shipCount: ships.length, difficulty: this.difficulty });
    return ships;
  }

  chooseAttack(enemyBoard) {
    Logger.ai('bot', `Bot ${this.name} choosing attack`, { difficulty: this.difficulty, huntMode: this.huntMode });
    let attack;

    // 4-tier difficulty system: 1=Easy, 2=Medium, 3=Hard, 4=Extreme
    switch (this.difficulty) {
      case 1: // Easy - Pure random
        attack = this.randomAttack(enemyBoard);
        break;
      case 2: // Medium - Checkerboard pattern
        attack = this.smartRandomAttack(enemyBoard);
        break;
      case 3: // Hard - Hunt and target with adjacency
        attack = this.huntAndTargetAttack(enemyBoard);
        break;
      case 4: // Extreme - Advanced targeting with ship tracking
        attack = this.extremeAttack(enemyBoard);
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

  extremeAttack(board) {
    // Priority 1: Continue targeting if we have a target queue
    if (this.targetQueue.length > 0) {
      const target = this.targetQueue.shift();
      if (board[target.row][target.col] === 0) {
        return target;
      }
    }

    // Priority 2: Find hits and add perpendicular targets
    const hits = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 2) { // Hit
          hits.push({ row, col });
        }
      }
    }

    if (hits.length > 0) {
      // Check for linear patterns (ship orientation)
      if (hits.length >= 2) {
        const first = hits[0];
        const second = hits[1];

        // Horizontal ship detected
        if (first.row === second.row) {
          const minCol = Math.min(first.col, second.col);
          const maxCol = Math.max(first.col, second.col);

          // Try to extend the line
          if (maxCol + 1 < 10 && board[first.row][maxCol + 1] === 0) {
            return { row: first.row, col: maxCol + 1 };
          }
          if (minCol - 1 >= 0 && board[first.row][minCol - 1] === 0) {
            return { row: first.row, col: minCol - 1 };
          }
        }

        // Vertical ship detected
        if (first.col === second.col) {
          const minRow = Math.min(first.row, second.row);
          const maxRow = Math.max(first.row, second.row);

          // Try to extend the line
          if (maxRow + 1 < 10 && board[maxRow + 1][first.col] === 0) {
            return { row: maxRow + 1, col: first.col };
          }
          if (minRow - 1 >= 0 && board[minRow - 1][first.col] === 0) {
            return { row: minRow - 1, col: first.col };
          }
        }
      }

      // Add adjacent cells to target queue
      const lastHit = hits[hits.length - 1];
      const adjacent = [
        { row: lastHit.row - 1, col: lastHit.col },
        { row: lastHit.row + 1, col: lastHit.col },
        { row: lastHit.row, col: lastHit.col - 1 },
        { row: lastHit.row, col: lastHit.col + 1 }
      ];

      for (let pos of adjacent) {
        if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
          if (board[pos.row][pos.col] === 0) {
            return pos;
          }
        }
      }
    }

    // Priority 3: Probability-based targeting (prefer cells more likely to contain ships)
    return this.probabilityAttack(board);
  }

  probabilityAttack(board) {
    // Calculate probability for each cell based on possible ship placements
    const probability = Array(10).fill(null).map(() => Array(10).fill(0));

    // For each possible ship placement, increase probability of covered cells
    for (let shipType of SHIP_TYPES) {
      const length = shipType.length;

      // Horizontal placements
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col <= 10 - length; col++) {
          let canPlace = true;
          for (let i = 0; i < length; i++) {
            if (board[row][col + i] !== 0) {
              canPlace = false;
              break;
            }
          }
          if (canPlace) {
            for (let i = 0; i < length; i++) {
              probability[row][col + i]++;
            }
          }
        }
      }

      // Vertical placements
      for (let row = 0; row <= 10 - length; row++) {
        for (let col = 0; col < 10; col++) {
          let canPlace = true;
          for (let i = 0; i < length; i++) {
            if (board[row + i][col] !== 0) {
              canPlace = false;
              break;
            }
          }
          if (canPlace) {
            for (let i = 0; i < length; i++) {
              probability[row + i][col]++;
            }
          }
        }
      }
    }

    // Find cell with highest probability
    let maxProb = 0;
    const bestCells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 0 && probability[row][col] > maxProb) {
          maxProb = probability[row][col];
          bestCells.length = 0;
          bestCells.push({ row, col });
        } else if (board[row][col] === 0 && probability[row][col] === maxProb) {
          bestCells.push({ row, col });
        }
      }
    }

    if (bestCells.length > 0) {
      return bestCells[Math.floor(Math.random() * bestCells.length)];
    }

    return this.randomAttack(board);
  }
}

function createBot() {
  // Use configured difficulty range from .env
  const difficulty = Math.floor(Math.random() * (BOT_MAX_DIFFICULTY - BOT_MIN_DIFFICULTY + 1)) + BOT_MIN_DIFFICULTY;
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];

  const difficultyNames = ['Easy', 'Medium', 'Hard', 'Extreme'];
  const difficultyName = difficultyNames[difficulty - 1];

  const bot = new AIBot(difficulty, name);
  Logger.ai('bot', 'Bot created', { name, difficulty, difficultyName, id: bot.id });
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

    // Validate ship placement to ensure equal tiles for both players
    if (!this.validateShips(ships)) {
      Logger.error('placement', `${player.name} placed invalid ships - rejecting`, {
        playerId,
        shipCount: ships.length,
        expected: SHIP_TYPES.length
      });
      return false;
    }

    Logger.game('placement', `${player.name} placed ships`, { playerId, shipCount: ships.length });
    this.ships[playerId] = ships;
    this.ready[playerId] = true;
    return true;
  }

  validateShips(ships) {
    // Must have exactly 5 ships (equal for both players)
    if (ships.length !== SHIP_TYPES.length) {
      Logger.warn('validation', 'Invalid ship count', {
        received: ships.length,
        expected: SHIP_TYPES.length
      });
      return false;
    }

    // Track which ship types have been placed
    const placedTypes = new Set();
    let totalCells = 0;

    for (let ship of ships) {
      // Check if ship type exists in SHIP_TYPES
      const shipType = SHIP_TYPES.find(st => st.name === ship.type);
      if (!shipType) {
        Logger.warn('validation', 'Unknown ship type', { type: ship.type });
        return false;
      }

      // Check for duplicate ship types
      if (placedTypes.has(ship.type)) {
        Logger.warn('validation', 'Duplicate ship type', { type: ship.type });
        return false;
      }
      placedTypes.add(ship.type);

      // Validate ship length matches expected length
      if (ship.length !== shipType.length) {
        Logger.warn('validation', 'Invalid ship length', {
          type: ship.type,
          expected: shipType.length,
          received: ship.length
        });
        return false;
      }

      // Validate ship cells match length
      if (!ship.cells || ship.cells.length !== ship.length) {
        Logger.warn('validation', 'Ship cells do not match length', {
          type: ship.type,
          cellCount: ship.cells?.length,
          expectedLength: ship.length
        });
        return false;
      }

      totalCells += ship.length;
    }

    // Ensure both players have exactly 17 tiles (5+4+3+3+2)
    if (totalCells !== 17) {
      Logger.warn('validation', 'Invalid total ship cells', {
        received: totalCells,
        expected: 17
      });
      return false;
    }

    // All validation passed - both players will have equal tiles
    Logger.success('validation', 'Ship placement validated - equal tiles confirmed', {
      ships: ships.length,
      totalCells
    });
    return true;
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
    let hitShip = null;

    // Check each ship's cells for a hit
    for (let ship of ships) {
      for (let cell of ship.cells) {
        if (cell.row === row && cell.col === col) {
          hit = true;
          board[row][col] = 2; // Mark as hit
          cell.hit = true;
          ship.hits++;
          hitShip = ship;

          // Check if ship is sunk
          if (ship.hits >= ship.length) {
            ship.sunk = true;
            Logger.success('attack', `🚢 SHIP SUNK! ${attacker.name} sunk ${defender.name}'s ${ship.type}!`, {
              shipType: ship.type,
              length: ship.length
            });
          } else {
            Logger.success('attack', `💥 HIT! ${attacker.name} hit ${defender.name}'s ${ship.type}`, {
              row,
              col,
              hits: ship.hits,
              length: ship.length
            });
          }

          // For AI: update last hit
          if (this.player1.isBot) this.player1.lastHit = { row, col };
          if (this.player2.isBot) this.player2.lastHit = { row, col };

          break;
        }
      }
      if (hit) break;
    }

    if (!hit) {
      board[row][col] = 1; // Mark as miss
      Logger.info('attack', `Miss - ${attacker.name} missed`, { row, col });
    }

    // Check if all ships are sunk
    const allSunk = ships.every(s => s.sunk);
    if (allSunk) {
      Logger.success('game', `🎯 All ships sunk! ${attacker.name} wins round ${this.currentRound}`, {
        attacker: attacker.name,
        defender: defender.name
      });
    }

    return { hit, allSunk, defenderId, ship: hitShip, sunk: hitShip?.sunk || false };
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

// Player activity monitoring
function updatePlayerActivity(socketId) {
  if (playerActivity.has(socketId)) {
    playerActivity.get(socketId).lastActivity = Date.now();
    playerActivity.get(socketId).isActive = true;
  } else {
    playerActivity.set(socketId, {
      lastActivity: Date.now(),
      warnings: 0,
      isActive: true
    });
  }
}

function checkPlayerActivity() {
  const now = Date.now();

  playerActivity.forEach((activity, socketId) => {
    const timeSinceActive = now - activity.lastActivity;

    if (timeSinceActive > INACTIVITY_THRESHOLD && activity.isActive) {
      // Player is inactive
      Logger.warn('activity', 'Player inactive - checking if in game', { socketId, timeSinceActive });

      const game = findGameForSocket(socketId);
      if (game && game.mode === 'offline') {
        // Find the socket
        const player = game.player1.id === socketId ? game.player1 : game.player2;
        if (!player.isBot && player.socket) {
          Logger.error('activity', 'Kicking inactive offline player', {
            socketId,
            playerName: player.name,
            inactiveDuration: timeSinceActive
          });

          // This will be handled by the forfeit system
          activity.isActive = false;
        }
      }
    } else if (timeSinceActive > WARNING_THRESHOLD && activity.warnings === 0) {
      activity.warnings = 1;
      Logger.warn('activity', 'Player approaching inactivity threshold', {
        socketId,
        timeSinceActive
      });
    }
  });
}

// Check player activity based on config
setInterval(checkPlayerActivity, ACTIVITY_CHECK_INTERVAL);

// Automated logging system
function logGameEvent(eventType, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    ...data
  };

  // Ensure we always have an array even if the file was manually edited
  const gameLogsRaw = readJSONFile(GAME_LOG_PATH, []);
  const gameLogs = Array.isArray(gameLogsRaw) ? gameLogsRaw : [];
  gameLogs.push(logEntry);

  // Keep last N events (from config)
  if (gameLogs.length > MAX_EVENT_LOGS) {
    gameLogs.shift();
  }

  writeJSONFile(GAME_LOG_PATH, gameLogs);
  Logger.info('auto-log', `Event logged: ${eventType}`, data);
}

// Live stats update
function updateLiveStats(updateType, data = {}) {
  switch (updateType) {
    case 'connection':
      liveStats.totalConnections++;
      liveStats.currentPlayers++;
      break;
    case 'disconnect':
      liveStats.currentPlayers = Math.max(0, liveStats.currentPlayers - 1);
      break;
    case 'gameStart':
      liveStats.gamesPlayed++;
      if (data.mode === 'online') liveStats.onlineGamesPlayed++;
      if (data.mode === 'offline') liveStats.offlineGamesPlayed++;
      break;
    case 'hit':
      liveStats.totalHits++;
      break;
    case 'miss':
      liveStats.totalMisses++;
      break;
  }

  logGameEvent(updateType, { liveStats, ...data });
}

io.on('connection', (socket) => {
  Logger.network('socket', '🔌 New connection', { socketId: socket.id });
  updateLiveStats('connection', { socketId: socket.id });
  updatePlayerActivity(socket.id);

  // Heartbeat handler for activity tracking
  socket.on('heartbeat', () => {
    updatePlayerActivity(socket.id);
  });

  socket.on('join', (data) => {
    // Handle both old format (string) and new format (object)
    const playerName = typeof data === 'string' ? data : (data.name || `Guest${socket.id.substring(0, 4)}`);
    const mode = typeof data === 'object' ? data.mode : 'online';

    socket.playerName = playerName;
    socket.playerMode = mode;
    updatePlayerActivity(socket.id);
    logGameEvent('playerJoin', { socketId: socket.id, playerName, mode });
    Logger.info('player', `Player joined: ${socket.playerName}`, { socketId: socket.id, mode });

    // Spectate mode: watch active game or wait in queue
    if (mode === 'spectate') {
      if (activeOnlineGame) {
        spectators.push({ id: socket.id, socket, name: socket.playerName });
        socket.emit('spectating', {
          message: 'Watching live match',
          queuePosition: spectators.length
        });
        Logger.info('spectate', `${socket.playerName} is spectating`, {
          queuePosition: spectators.length,
          totalSpectators: spectators.length
        });
        sendSpectatorGameState(socket, activeOnlineGame);
      } else {
        socket.emit('noActiveGames');
        Logger.info('spectate', `${socket.playerName} found no active games`);
      }
      return;
    }

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

      const difficultyNames = ['Easy', 'Medium', 'Hard', 'Extreme'];
      socket.emit('botJoined', {
        botName: bot.name,
        difficulty: bot.difficulty,
        difficultyName: difficultyNames[bot.difficulty - 1],
        shipTypes: SHIP_TYPES
      });
      return;
    }

    // Online mode: matchmaking
    if (mode === 'online' && !activeOnlineGame && !waitingPlayer) {
      // No active game, no waiting player - become waiting player
      waitingPlayer = { id: socket.id, socket, name: socket.playerName, isBot: false };
      socket.emit('waiting');
      Logger.info('matchmaking', `${socket.playerName} is waiting for opponent`, { socketId: socket.id });
    } else if (mode === 'online' && !activeOnlineGame && waitingPlayer) {
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
    } else if (mode === 'online') {
      // Game in progress - add to spectators (online mode auto-spectate)
      spectators.push({ id: socket.id, socket, name: socket.playerName });
      socket.emit('spectating', {
        message: 'Game in progress. You are now spectating.',
        queuePosition: spectators.length
      });
      Logger.info('spectate', `${socket.playerName} auto-spectating online game`, {
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

    const difficultyNames = ['Easy', 'Medium', 'Hard', 'Extreme'];
    socket.emit('botJoined', {
      botName: bot.name,
      difficulty: bot.difficulty,
      difficultyName: difficultyNames[bot.difficulty - 1],
      shipTypes: SHIP_TYPES
    });
    Logger.success('bot', `Bot ${bot.name} joined the game - converted to offline`, { gameId: game.id });

    if (game.ready[game.player1.id] && game.ready[game.player2.id]) {
      startBattle(game);
    }

    // Start next online game with spectators if any
    startNextOnlineGame();
  });

  socket.on('placeShips', (ships) => {
    updatePlayerActivity(socket.id);
    const game = findGameForSocket(socket.id);

    if (!game) {
      Logger.warn('placement', 'Ship placement for non-existent game', { socketId: socket.id });
      socket.emit('placementError', {
        error: 'No active game found',
        message: 'Please rejoin the game'
      });
      return;
    }

    // Validate and place ships - ensure equal tiles for both players
    const validPlacement = game.placeShips(socket.id, ships);

    if (!validPlacement) {
      Logger.error('placement', `Invalid ship placement from ${socket.playerName}`, {
        socketId: socket.id,
        gameId: game.id
      });
      socket.emit('placementError', {
        error: 'Invalid ship placement',
        message: 'You must place all 5 ships correctly (Carrier, Battleship, Cruiser, Submarine, Destroyer)',
        expectedShips: SHIP_TYPES.map(st => ({ name: st.name, length: st.length }))
      });
      return;
    }

    logGameEvent('shipsPlaced', {
      gameId: game.id,
      playerId: socket.id,
      playerName: socket.playerName,
      mode: game.mode
    });

    // Confirm successful placement
    socket.emit('placementConfirmed', {
      message: 'Ships placed successfully - equal tiles confirmed'
    });

    if (game.ready[game.player1.id] && game.ready[game.player2.id]) {
      Logger.success('game', 'Both players ready - starting battle!', { gameId: game.id });
      updateLiveStats('gameStart', { gameId: game.id, mode: game.mode });
      logGameEvent('battleStart', {
        gameId: game.id,
        player1: game.player1.name,
        player2: game.player2.name,
        mode: game.mode
      });
      startBattle(game);
    }
  });

  socket.on('attack', ({ row, col }) => {
    updatePlayerActivity(socket.id);
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
    updateLiveStats('disconnect', { socketId: socket.id, playerName: socket.playerName });
    playerActivity.delete(socket.id);
    logGameEvent('playerDisconnect', { socketId: socket.id, playerName: socket.playerName });

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
  Logger.timer('timer', `⏰ Turn timer started for ${currentPlayer.name}`, { timeLimit: `${TURN_TIMER_SECONDS}s` });

  clearTimeout(game.timer);

  game.timer = setTimeout(() => {
    handleForfeit(game, game.currentTurn);
  }, TURN_TIMER_SECONDS * 1000);

  // Send timer start to both players
  const timeLeft = TURN_TIMER_SECONDS;

  if (!game.player1.isBot && game.player1.socket) {
    game.player1.socket.emit('timerStart', { timeLeft });
  }

  if (!game.player2.isBot && game.player2.socket) {
    game.player2.socket.emit('timerStart', { timeLeft });
  }

  // If it's a bot's turn, make it attack after a delay (from .env config)
  if (currentPlayer.isBot) {
    const delay = BOT_MIN_DELAY + Math.random() * (BOT_MAX_DELAY - BOT_MIN_DELAY);
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

  // Update live stats and log the attack
  if (result.hit) {
    updateLiveStats('hit', {
      gameId: game.id,
      attacker: attacker.name,
      defender: defender.name,
      position: { row, col }
    });
  } else {
    updateLiveStats('miss', {
      gameId: game.id,
      attacker: attacker.name,
      defender: defender.name,
      position: { row, col }
    });
  }

  logGameEvent('attack', {
    gameId: game.id,
    attacker: attacker.name,
    defender: defender.name,
    row,
    col,
    hit: result.hit,
    allSunk: result.allSunk,
    mode: game.mode
  });

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

  // Remove from appropriate game list
  if (game.mode === 'online' && activeOnlineGame === game) {
    activeOnlineGame = null;
    Logger.info('game', 'Online game removed');

    // Notify spectators that game ended
    broadcastToSpectators({
      type: 'gameEnded',
      winner: winner ? winner.name : 'tie',
      scores: game.scores
    });

    // Start next online game with spectators
    startNextOnlineGame();
  } else if (game.mode === 'offline') {
    const gameIndex = activeOfflineGames.indexOf(game);
    if (gameIndex !== -1) {
      activeOfflineGames.splice(gameIndex, 1);
      Logger.info('game', `Offline game ${game.id} removed`, { remainingOfflineGames: activeOfflineGames.length });
    }
  }

  if (winnerId && winner && !winner.isBot && game.mode === 'online') {
    waitingPlayer = winner;
    winner.socket.emit('waiting');
    Logger.info('matchmaking', `Winner ${winner.name} waiting for next opponent`);
  }

  // Update leaderboard and log game
  const mode = game.mode || ((game.player1.isBot || game.player2.isBot) ? 'offline' : 'online');

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
app.get(`/api/${API_VERSION}/leaderboard/:mode`, (req, res) => {
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
  res.json(leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES));
});

// Live Stats API Endpoint
app.get(`/api/${API_VERSION}/stats/live`, (req, res) => {
  Logger.info('api', 'Live stats requested');

  const stats = {
    ...liveStats,
    activeGames: {
      online: activeOnlineGame ? 1 : 0,
      offline: activeOfflineGames.length,
      total: (activeOnlineGame ? 1 : 0) + activeOfflineGames.length
    },
    queue: {
      waiting: waitingPlayer ? 1 : 0,
      spectators: spectators.length
    },
    accuracy: liveStats.totalHits + liveStats.totalMisses > 0
      ? ((liveStats.totalHits / (liveStats.totalHits + liveStats.totalMisses)) * 100).toFixed(2) + '%'
      : '0%',
    activePlayers: playerActivity.size + activeSimulatedPlayers.size,
    timestamp: new Date().toISOString()
  };

  Logger.success('api', 'Live stats sent', stats);
  res.json(stats);
});

// Game Log API Endpoint
app.get(`/api/${API_VERSION}/logs/recent`, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  Logger.info('api', `Recent logs requested`, { limit });

  const logs = readJSONFile(GAME_LOG_PATH, []);
  const recentLogs = logs.slice(-limit).reverse(); // Last N logs, newest first

  Logger.success('api', `Recent logs sent`, { count: recentLogs.length });
  res.json(recentLogs);
});

// Admin Password Verification Endpoint
app.post(`/api/${API_VERSION}/admin/verify`, (req, res) => {
  const { password } = req.body;
  Logger.info('api', 'Admin password verification attempt');

  if (password === ADMIN_PASSWORD) {
    Logger.success('api', 'Admin password verified successfully');
    res.json({ success: true, message: 'Access granted' });
  } else {
    Logger.warn('api', 'Admin password verification failed');
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// System Information API Endpoint
app.get(`/api/${API_VERSION}/admin/system`, (req, res) => {
  Logger.info('api', 'System information requested');

  const systemInfo = {
    server: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        processUsed: process.memoryUsage().heapUsed
      },
      cpus: os.cpus().length,
      hostname: os.hostname()
    },
    game: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      maxRounds: process.env.MAX_ROUNDS || 3,
      turnTimer: process.env.TURN_TIMER_SECONDS || 30,
      maxSimulatedPlayers: process.env.MAX_SIMULATED_PLAYERS || 47
    },
    database: {
      onlineLeaderboard: readJSONFile(ONLINE_LEADERBOARD_PATH, []).length,
      offlineLeaderboard: readJSONFile(OFFLINE_LEADERBOARD_PATH, []).length,
      totalLogs: readJSONFile(GAME_LOG_PATH, []).length
    }
  };

  Logger.success('api', 'System information sent');
  res.json(systemInfo);
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

  // Ensure array integrity in case file was malformed
  const gameLogsRaw = readJSONFile(GAME_LOG_PATH, []);
  const gameLogs = Array.isArray(gameLogsRaw) ? gameLogsRaw : [];
  gameLogs.push({
    ...gameData,
    timestamp: new Date().toISOString()
  });

  // Keep only last N games (from config)
  if (gameLogs.length > MAX_GAME_LOGS) {
    gameLogs.shift();
  }

  writeJSONFile(GAME_LOG_PATH, gameLogs);
}

httpServer.listen(PORT, HOST, () => {
  Logger.success('server', `🚀 Spatuletail - Game server running on http://${HOST}:${PORT}`, {
    port: PORT,
    host: HOST,
    environment: NODE_ENV
  });
  console.log('\x1b[32m[SERVER] Admin panel: http://localhost:%d/admin (password: %s)\x1b[0m', PORT,
    ADMIN_PASSWORD === 'admin123' ? 'admin123 [CHANGE THIS!]' : '***');
});

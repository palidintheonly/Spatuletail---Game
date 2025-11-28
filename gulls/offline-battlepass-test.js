/**
 * Offline Battle Pass integration smoke test.
 * - Starts the server on a test port.
 * - Plays an entire offline game against the bot by attacking every cell until someone wins.
 * - Verifies battlepass.json recorded XP for the test user.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const io = require('socket.io-client');

const HOST = '127.0.0.1';
const PORT = process.env.TEST_PORT || 3101;
const PLAYER_NAME = `XPPilot${Date.now()}`;
const BATTLEPASS_PATH = path.join(__dirname, '..', 'waterbird', 'battlepass.json');
const TEST_TIMEOUT_MS = 180000;
const READY_TIMEOUT_MS = 8000;
const VERBOSE = process.env.TEST_VERBOSE !== '0';

const attackQueue = [];
for (let row = 0; row < 10; row++) {
  for (let col = 0; col < 10; col++) {
    attackQueue.push({ row, col });
  }
}

function readBattlepass() {
  try {
    const raw = fs.readFileSync(BATTLEPASS_PATH, 'utf-8').trim() || '{}';
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read battlepass.json: ${err.message}`);
  }
}

function buildShips() {
  return [
    { type: 'Eagle Carrier', length: 5, cells: [0, 1, 2, 3, 4].map(col => ({ row: 0, col })), hits: 0, sunk: false },
    { type: 'Parrot Warship', length: 4, cells: [0, 1, 2, 3].map(col => ({ row: 1, col })), hits: 0, sunk: false },
    { type: 'Falcon Cruiser', length: 3, cells: [0, 1, 2].map(col => ({ row: 2, col })), hits: 0, sunk: false },
    { type: 'Owl Stealth', length: 3, cells: [0, 1, 2].map(col => ({ row: 3, col })), hits: 0, sunk: false },
    { type: 'Swift Striker', length: 2, cells: [0, 1].map(col => ({ row: 4, col })), hits: 0, sunk: false }
  ];
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['osprey.js'], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOST,
        ENABLE_CONSOLE_LOGGING: 'false',
        BOT_MIN_DELAY_SECONDS: '0',
        BOT_MAX_DELAY_SECONDS: '0.1',
        TURN_TIMER_SECONDS: '5',
        MAX_ROUNDS: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    if (VERBOSE) {
      server.stdout.on('data', data => process.stdout.write(`[server] ${data}`));
      server.stderr.on('data', data => process.stderr.write(`[server-err] ${data}`));
    }

    const readyDeadline = Date.now() + READY_TIMEOUT_MS;
    const pollReady = async () => {
      try {
        const res = await fetch(`http://${HOST}:${PORT}/offline`);
        if (res.ok) {
          return resolve(server);
        }
      } catch (_) {
        // keep polling
      }
      if (Date.now() > readyDeadline) {
        reject(new Error('Server did not start in time'));
      } else {
        setTimeout(pollReady, 250);
      }
    };

    pollReady();

    server.on('exit', code => {
      reject(new Error(`Server exited early with code ${code}`));
    });
  });
}

async function run() {
  if (VERBOSE) console.log('[client] Verbose logging enabled');
  const xpBefore = (readBattlepass()[PLAYER_NAME.toLowerCase()] || {}).xp || 0;
  const server = await startServer();

  let gameOverPayload = null;
  let attackIndex = 0;
  let isMyTurn = false;
  let finished = false;
  let socketId = null;

  const socket = io(`http://${HOST}:${PORT}`, { transports: ['websocket'] });

  const cleanup = async () => {
    socket.disconnect();
    server.kill('SIGTERM');
  };

  const finish = async (error) => {
    if (finished) return;
    finished = true;
    await cleanup();
    if (error) {
      console.error(error.message || error);
      process.exit(1);
    }

    // Give the server a moment to flush battle pass writes
    await new Promise(res => setTimeout(res, 300));
    const bp = readBattlepass();
    const entry = bp[PLAYER_NAME.toLowerCase()];
    if (!gameOverPayload) {
      console.error('No gameOver payload received.');
      process.exit(1);
    }
    if (!entry) {
      console.error('Battle pass entry was not created for test user.');
      process.exit(1);
    }
    if (entry.xp <= xpBefore) {
      console.error(`Battle pass XP did not increase. Before=${xpBefore}, After=${entry.xp}`);
      process.exit(1);
    }

    console.log('Battle pass test passed.');
    const didWin = gameOverPayload.winner && socketId && gameOverPayload.winner === socketId;
    console.log(`Result: ${didWin ? 'Win' : 'Loss'} | XP +${entry.xp - xpBefore} | Tier ${entry.tier}`);
    process.exit(0);
  };

  const fireNextAttack = () => {
    if (!isMyTurn) return;
    if (attackIndex >= attackQueue.length) {
      finish(new Error('Ran out of attack cells before game ended.'));
      return;
    }
    const { row, col } = attackQueue[attackIndex++];
    socket.emit('attack', { row, col });
  };

  const timeout = setTimeout(() => {
    finish(new Error(`Test timed out after ${TEST_TIMEOUT_MS}ms`));
  }, TEST_TIMEOUT_MS);

  socket.on('connect', () => {
    socketId = socket.id;
    if (VERBOSE) console.log('[client] connected, joining offline game');
    socket.emit('join', { name: PLAYER_NAME, mode: 'offline' });
  });

  socket.on('botJoined', () => {
    if (VERBOSE) console.log('[client] bot joined, placing ships');
    socket.emit('placeShips', buildShips());
  });

  socket.on('placementConfirmed', () => {
    if (VERBOSE) console.log('[client] placement confirmed');
  });

  socket.on('placementError', (payload) => {
    clearTimeout(timeout);
    finish(new Error(`Placement rejected: ${payload?.message || 'unknown error'}`));
  });

  socket.on('battleStart', data => {
    if (VERBOSE) console.log('[client] battleStart', data);
    isMyTurn = !!data.isYourTurn;
    if (isMyTurn) fireNextAttack();
  });

  socket.on('turnChange', ({ isYourTurn }) => {
    if (VERBOSE) console.log('[client] turnChange', isYourTurn);
    isMyTurn = !!isYourTurn;
    if (isMyTurn) fireNextAttack();
  });

  socket.on('attackResult', (data) => {
    if (VERBOSE) console.log('[client] attackResult', data);
  });

  socket.on('roundEnd', (data) => {
    if (VERBOSE) console.log('[client] roundEnd', data);
  });

  socket.on('gameOver', data => {
    clearTimeout(timeout);
    gameOverPayload = data;
    finish();
  });

  socket.on('connect_error', err => {
    clearTimeout(timeout);
    finish(new Error(`Socket connect error: ${err.message}`));
  });

  socket.on('disconnect', reason => {
    if (VERBOSE) console.log('[client] disconnect', reason);
    if (!gameOverPayload) {
      clearTimeout(timeout);
      finish(new Error(`Disconnected before game ended: ${reason}`));
    }
  });
}

run().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

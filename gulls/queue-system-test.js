/**
 * Queue system integration test.
 * - Boots the server with MAX_CONCURRENT_GAMES=1.
 * - Connects two players simultaneously.
 * - Verifies first player starts game immediately.
 * - Verifies second player is queued.
 * - Verifies second player starts when first game ends.
 */
const { spawn } = require('child_process');
const io = require('socket.io-client');

const HOST = '127.0.0.1';
const PORT = process.env.TEST_PORT || 3109;
const READY_TIMEOUT_MS = 8000;
const TEST_TIMEOUT_MS = 30000;

function buildShips() {
  return [
    { type: 'Eagle Carrier', length: 5, cells: [0, 1, 2, 3, 4].map(col => ({ row: 0, col })), hits: 0, sunk: false },
    { type: 'Parrot Warship', length: 4, cells: [0, 1, 2, 3].map(col => ({ row: 1, col })), hits: 0, sunk: false },
    { type: 'Falcon Cruiser', length: 3, cells: [0, 1, 2].map(col => ({ row: 2, col })), hits: 0, sunk: false },
    { type: 'Owl Stealth', length: 3, cells: [0, 1, 2].map(col => ({ row: 3, col })), hits: 0, sunk: false },
    { type: 'Swift Striker', length: 2, cells: [0, 1].map(col => ({ row: 4, col })), hits: 0, sunk: false }
  ];
}

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://${HOST}:${PORT}/offline`);
      if (res.ok) return true;
    } catch (_) {
      /* keep polling */
    }
    await new Promise(res => setTimeout(res, 250));
  }
  throw new Error('Server did not become ready in time');
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['osprey.js'], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOST,
        ENABLE_CONSOLE_LOGGING: 'false',
        BOT_MIN_DELAY_SECONDS: '0',
        BOT_MAX_DELAY_SECONDS: '0.1',
        TURN_TIMER_SECONDS: '5',
        MAX_ROUNDS: '1',
        MAX_CONCURRENT_GAMES: '1' // Key: only allow 1 game at a time
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.on('exit', code => reject(new Error(`Server exited early with code ${code}`)));

    waitForServer().then(() => resolve(child)).catch(err => {
      child.kill('SIGTERM');
      reject(err);
    });
  });
}

async function run() {
  const server = await startServer();
  let player1Socket, player2Socket;
  let player1Started = false;
  let player2Queued = false;
  let player2Started = false;
  let finished = false;

  const cleanup = () => {
    if (player1Socket) player1Socket.disconnect();
    if (player2Socket) player2Socket.disconnect();
    server.kill('SIGTERM');
  };

  const finish = (error) => {
    if (finished) return;
    finished = true;
    cleanup();
    if (error) {
      console.error(error.message || error);
      process.exit(1);
    }

    // Verify expectations
    if (!player1Started) {
      console.error('Player 1 never started game');
      process.exit(1);
    }
    if (!player2Queued) {
      console.error('Player 2 was never queued');
      process.exit(1);
    }
    if (!player2Started) {
      console.error('Player 2 never started after queue');
      process.exit(1);
    }

    console.log('Queue system test passed.');
    console.log('- Player 1 started immediately ✓');
    console.log('- Player 2 was queued ✓');
    console.log('- Player 2 started after player 1 finished ✓');
    process.exit(0);
  };

  const timeout = setTimeout(() => {
    finish(new Error(`Test timed out after ${TEST_TIMEOUT_MS}ms`));
  }, TEST_TIMEOUT_MS);

  try {
    // Connect Player 1
    player1Socket = io(`http://${HOST}:${PORT}`, { transports: ['websocket'] });

    player1Socket.on('connect', () => {
      player1Socket.emit('join', { name: 'QueuePlayer1', mode: 'offline' });
    });

    player1Socket.on('botJoined', () => {
      player1Started = true;
      player1Socket.emit('placeShips', buildShips());
    });

    player1Socket.on('battleStart', () => {
      // Player 1 game started, now connect Player 2
      setTimeout(() => {
        player2Socket = io(`http://${HOST}:${PORT}`, { transports: ['websocket'] });

        player2Socket.on('connect', () => {
          player2Socket.emit('join', { name: 'QueuePlayer2', mode: 'offline' });
        });

        player2Socket.on('queued', (data) => {
          player2Queued = true;
          console.log(`Player 2 queued at position ${data.position}`);

          // Force end player 1's game by disconnecting
          setTimeout(() => {
            player1Socket.disconnect();
          }, 500);
        });

        player2Socket.on('gameStart', () => {
          player2Started = true;
          clearTimeout(timeout);
          finish();
        });

        player2Socket.on('botJoined', () => {
          // Immediately place ships to trigger gameStart
          player2Socket.emit('placeShips', buildShips());
        });

        player2Socket.on('connect_error', err => {
          clearTimeout(timeout);
          finish(new Error(`Player 2 socket connect error: ${err.message}`));
        });
      }, 1000);
    });

    player1Socket.on('connect_error', err => {
      clearTimeout(timeout);
      finish(new Error(`Player 1 socket connect error: ${err.message}`));
    });

  } catch (err) {
    clearTimeout(timeout);
    finish(err);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

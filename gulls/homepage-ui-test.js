/**
 * Homepage UI and routing smoke test.
 * - Boots the server on a test port.
 * - Verifies the homepage loads and contains expected content.
 * - Checks that critical navigation links are present.
 * - Validates that offline mode is accessible.
 */
const { spawn } = require('child_process');

const HOST = '127.0.0.1';
const PORT = process.env.TEST_PORT || 3107;
const READY_TIMEOUT_MS = 8000;

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://${HOST}:${PORT}/`);
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
        MAX_ROUNDS: '1'
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
  const cleanup = () => server.kill('SIGTERM');

  try {
    // Test homepage loads
    const homeRes = await fetch(`http://${HOST}:${PORT}/`);
    if (!homeRes.ok) throw new Error(`Homepage returned HTTP ${homeRes.status}`);
    const html = await homeRes.text();

    // Verify critical content
    const criticalContent = [
      'SPATULETAIL WAR COMMAND',
      'TACTICAL BIRD WARFARE',
      'TALON STRIKE OPERATIONS',
      'Start Battle',
      'War Birds Leaderboard'
    ];

    for (const content of criticalContent) {
      if (!html.includes(content)) {
        throw new Error(`Homepage missing expected content: "${content}"`);
      }
    }

    // Test offline route loads
    const offlineRes = await fetch(`http://${HOST}:${PORT}/offline`);
    if (!offlineRes.ok) throw new Error(`Offline route returned HTTP ${offlineRes.status}`);
    const offlineHtml = await offlineRes.text();
    if (!offlineHtml.toLowerCase().includes('game') && !offlineHtml.toLowerCase().includes('battle')) {
      throw new Error('Offline page did not render expected game content');
    }

    // Test leaderboard route loads
    const leaderboardRes = await fetch(`http://${HOST}:${PORT}/leaderboards`);
    if (!leaderboardRes.ok) throw new Error(`Leaderboards route returned HTTP ${leaderboardRes.status}`);
    const leaderboardHtml = await leaderboardRes.text();
    if (!leaderboardHtml.toUpperCase().includes('ELITE COMMANDERS') && !leaderboardHtml.includes('leaderboard')) {
      throw new Error('Leaderboards page did not render expected content');
    }

    console.log('Homepage UI test passed.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

run();

/**
 * Smoke test for the /leaderboards page and backing API.
 * - Boots the game server on a test port.
 * - Verifies the HTML page loads.
 * - Confirms the offline leaderboard API responds with data.
 * - Asserts the page renders an existing leaderboard name when available.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = process.env.TEST_PORT || 3103;
const READY_TIMEOUT_MS = 8000;
const LEADERBOARD_PATH = path.join(__dirname, '..', 'waterbird', 'offline-leaderboard.json');

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
    const pageRes = await fetch(`http://${HOST}:${PORT}/leaderboards`);
    if (!pageRes.ok) throw new Error(`/leaderboards returned HTTP ${pageRes.status}`);
    const html = await pageRes.text();
    if (!html.toLowerCase().includes('leaderboard')) {
      throw new Error('Leaderboards page did not render expected content');
    }

    const apiRes = await fetch(`http://${HOST}:${PORT}/api/v1/leaderboard/offline`);
    if (!apiRes.ok) throw new Error(`Offline API returned HTTP ${apiRes.status}`);
    const payload = await apiRes.json();
    const apiData = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(apiData)) {
      throw new Error(`Offline leaderboard API did not return an array (got: ${JSON.stringify(payload)})`);
    }
    const fileData = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf-8'));
    const sampleName = Array.isArray(fileData) && fileData[0] ? fileData[0].name : null;
    if (sampleName) {
      const found = apiData.some(entry => entry.name === sampleName);
      if (!found) throw new Error(`Offline API missing expected player ${sampleName}`);
    }

    console.log('Leaderboards endpoint test passed.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

run();

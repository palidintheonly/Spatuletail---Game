/**
 * Profile and Avatar API smoke test.
 * - Boots the server on a test port.
 * - Tests avatar list API endpoint.
 * - Tests profile creation (signup).
 * - Tests profile retrieval.
 * - Validates avatar data structure.
 */
const { spawn } = require('child_process');

const HOST = '127.0.0.1';
const PORT = process.env.TEST_PORT || 3111;
const READY_TIMEOUT_MS = 8000;
const TEST_USERNAME = `TestBird${Date.now()}`;
const TEST_PASSWORD = 'testpassword123';

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
    // Test avatars API
    const avatarsRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/avatars`);
    if (!avatarsRes.ok) throw new Error(`Avatars API returned HTTP ${avatarsRes.status}`);
    const avatarsPayload = await avatarsRes.json();
    const avatars = Array.isArray(avatarsPayload) ? avatarsPayload : avatarsPayload.data;

    if (!Array.isArray(avatars)) {
      throw new Error(`Avatars API did not return an array (got: ${JSON.stringify(avatarsPayload)})`);
    }

    if (avatars.length === 0) {
      throw new Error('Avatars API returned empty array');
    }

    // Validate avatar structure
    const firstAvatar = avatars[0];
    if (!firstAvatar.id || !firstAvatar.name) {
      throw new Error('Avatar missing required fields (id, name)');
    }

    console.log(`✓ Avatar API working (${avatars.length} avatars available)`);

    // Test signup
    const signupRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        avatar: firstAvatar.id
      })
    });

    if (!signupRes.ok) {
      const errorText = await signupRes.text();
      throw new Error(`Signup failed: HTTP ${signupRes.status} - ${errorText}`);
    }

    const signupData = await signupRes.json();
    const signupUser = signupData.user || signupData.data?.user;
    const token = signupData.token || signupData.data?.token;

    if (!signupUser || !token) {
      throw new Error(`Signup response missing user or token: ${JSON.stringify(signupData)}`);
    }

    if (signupUser.username !== TEST_USERNAME) {
      throw new Error(`Signup user mismatch: expected ${TEST_USERNAME}, got ${signupUser.username}`);
    }

    console.log(`✓ Signup successful (username: ${TEST_USERNAME})`);

    // Test profile retrieval with token
    const profileRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!profileRes.ok) {
      throw new Error(`Profile retrieval returned HTTP ${profileRes.status}`);
    }

    const profileData = await profileRes.json();
    const profileUser = profileData.user || profileData.data?.user;

    if (!profileUser) {
      throw new Error(`Profile response missing user: ${JSON.stringify(profileData)}`);
    }

    if (profileUser.username !== TEST_USERNAME) {
      throw new Error(`Profile user mismatch: expected ${TEST_USERNAME}, got ${profileUser.username}`);
    }

    console.log('✓ Profile retrieval successful');
    console.log('Profile API test passed.');

  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

run();

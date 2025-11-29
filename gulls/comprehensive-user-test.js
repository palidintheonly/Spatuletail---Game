/**
 * Comprehensive User Interaction Test
 * Tests everything a user can interact with and view:
 * - Homepage UI and navigation
 * - Avatar system (DiceBear integration)
 * - Profile creation and authentication
 * - Battle Pass system
 * - Offline gameplay
 * - Leaderboards
 * - Game mechanics
 */

const { spawn } = require('child_process');
const io = require('socket.io-client');

const HOST = '127.0.0.1';
const PORT = process.env.TEST_PORT || 3200;
const READY_TIMEOUT_MS = 10000;
const TEST_TIMEOUT_MS = 120000;
const VERBOSE = true;

let testsPassed = 0;
let testsFailed = 0;

function log(category, message, data = null) {
  const timestamp = new Date().toISOString();
  const emoji = {
    'START': '🚀',
    'PASS': '✅',
    'FAIL': '❌',
    'INFO': 'ℹ️',
    'TEST': '🧪',
    'API': '🔌',
    'SOCKET': '⚡',
    'GAME': '🎮',
    'USER': '👤',
    'DATA': '📊'
  }[category] || '📝';

  console.log(`${emoji} [${category}] ${message}`);
  if (data && VERBOSE) {
    console.log('   ', JSON.stringify(data, null, 2));
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

async function waitForServer() {
  log('INFO', 'Waiting for server to be ready...');
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://${HOST}:${PORT}/`);
      if (res.ok) {
        log('PASS', 'Server is ready');
        return true;
      }
    } catch (_) {
      await new Promise(res => setTimeout(res, 500));
    }
  }
  throw new Error('Server did not become ready in time');
}

function startServer() {
  log('START', 'Starting test server...', { host: HOST, port: PORT });
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

    server.on('exit', code => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    waitForServer().then(() => resolve(server)).catch(err => {
      server.kill('SIGTERM');
      reject(err);
    });
  });
}

async function testHomepageUI(server) {
  log('TEST', '1. Testing Homepage UI and Content');

  try {
    const res = await fetch(`http://${HOST}:${PORT}/`);
    if (!res.ok) throw new Error(`Homepage returned HTTP ${res.status}`);

    const html = await res.text();

    // Test critical content
    const criticalContent = {
      'Main Title': 'SPATULETAIL WAR COMMAND',
      'Subtitle': 'TACTICAL BIRD WARFARE',
      'Features': 'TALON STRIKE OPERATIONS',
      'CTA Button': 'Start Battle',
      'Leaderboard Link': 'War Birds Leaderboard'
    };

    for (const [name, content] of Object.entries(criticalContent)) {
      if (!html.includes(content)) {
        throw new Error(`Missing ${name}: "${content}"`);
      }
      log('PASS', `✓ ${name} present`);
    }

    // Test responsive meta tags
    if (!html.includes('viewport')) {
      throw new Error('Missing viewport meta tag');
    }
    log('PASS', '✓ Responsive meta tags present');

    // Test war-themed styling references
    if (!html.includes('war') || !html.includes('tactical')) {
      throw new Error('Missing war theme styling');
    }
    log('PASS', '✓ War theme styling present');

    testsPassed++;
    log('PASS', 'Homepage UI test passed');
  } catch (err) {
    testsFailed++;
    log('FAIL', 'Homepage UI test failed', { error: err.message });
    throw err;
  }
}

async function testAvatarSystem(server) {
  log('TEST', '2. Testing Avatar System (DiceBear Integration)');

  try {
    const res = await fetch(`http://${HOST}:${PORT}/api/v1/profile/avatars`);
    if (!res.ok) throw new Error(`Avatars API returned HTTP ${res.status}`);

    const data = await res.json();
    const avatars = Array.isArray(data) ? data : data.data;

    if (!Array.isArray(avatars)) {
      throw new Error(`Expected array, got ${typeof avatars}`);
    }

    if (avatars.length !== 16) {
      throw new Error(`Expected 16 avatars, got ${avatars.length}`);
    }
    log('PASS', `✓ Correct avatar count: ${avatars.length}`);

    // Validate avatar structure
    const requiredFields = ['id', 'name', 'image', 'seed', 'styles'];
    for (const avatar of avatars) {
      for (const field of requiredFields) {
        if (!(field in avatar)) {
          throw new Error(`Avatar missing field: ${field}`);
        }
      }

      // Validate DiceBear URL
      if (!avatar.image.includes('api.dicebear.com')) {
        throw new Error(`Invalid DiceBear URL: ${avatar.image}`);
      }

      // Validate styles object
      const expectedStyles = ['avataaars', 'adventurer', 'lorelei', 'personas'];
      for (const style of expectedStyles) {
        if (!(style in avatar.styles)) {
          throw new Error(`Avatar missing style: ${style}`);
        }
      }
    }
    log('PASS', '✓ All avatars have correct structure');
    log('PASS', '✓ DiceBear URLs validated');
    log('PASS', '✓ Multiple styles available per avatar');

    // Test specific bird warriors
    const birdNames = avatars.map(a => a.name);
    const expectedBirds = ['Resplendent Quetzal', 'Shoebill Striker', 'Philippine Eagle'];
    for (const bird of expectedBirds) {
      if (!birdNames.includes(bird)) {
        throw new Error(`Missing bird warrior: ${bird}`);
      }
    }
    log('PASS', '✓ Bird warrior avatars present');

    testsPassed++;
    log('PASS', 'Avatar system test passed');
  } catch (err) {
    testsFailed++;
    log('FAIL', 'Avatar system test failed', { error: err.message });
    throw err;
  }
}

async function testProfileSystem(server) {
  log('TEST', '3. Testing Profile Signup and Authentication');

  const testUser = {
    username: `WarBird${Date.now()}`,
    password: 'TacticalCode123!',
    avatar: 'resplendent-quetzal'
  };

  try {
    // Test signup
    log('INFO', 'Testing signup...', { username: testUser.username });
    const signupRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!signupRes.ok) {
      const errorText = await signupRes.text();
      throw new Error(`Signup failed: HTTP ${signupRes.status} - ${errorText}`);
    }

    const signupData = await signupRes.json();
    const user = signupData.user || signupData.data?.user;
    const token = signupData.token || signupData.data?.token;

    if (!user || !token) {
      throw new Error('Signup response missing user or token');
    }

    if (user.username !== testUser.username) {
      throw new Error(`Username mismatch: expected ${testUser.username}, got ${user.username}`);
    }

    if (user.avatar !== testUser.avatar) {
      throw new Error(`Avatar not saved: expected ${testUser.avatar}, got ${user.avatar}`);
    }

    log('PASS', '✓ Signup successful');
    log('PASS', '✓ Token generated');
    log('PASS', '✓ Avatar assigned');

    // Test duplicate signup prevention
    log('INFO', 'Testing duplicate signup prevention...');
    const dupRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (dupRes.ok) {
      throw new Error('Duplicate signup should have been rejected');
    }
    log('PASS', '✓ Duplicate signup prevented');

    // Test profile retrieval
    log('INFO', 'Testing profile retrieval...');
    const profileRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/me`, {
      headers: { 'x-bluejay-token': token }
    });

    if (!profileRes.ok) {
      throw new Error(`Profile retrieval failed: HTTP ${profileRes.status}`);
    }

    const profileData = await profileRes.json();
    const retrievedUser = profileData.user || profileData.data?.user;

    if (!retrievedUser || retrievedUser.username !== testUser.username) {
      throw new Error('Profile retrieval failed');
    }
    log('PASS', '✓ Profile retrieved successfully');

    // Test login
    log('INFO', 'Testing login...');
    const loginRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: HTTP ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    const loginToken = loginData.token || loginData.data?.token;
    if (!loginToken) {
      throw new Error('Login did not return token');
    }
    log('PASS', '✓ Login successful');

    testsPassed++;
    log('PASS', 'Profile system test passed');
    return { user, token };
  } catch (err) {
    testsFailed++;
    log('FAIL', 'Profile system test failed', { error: err.message });
    throw err;
  }
}

async function testBattlePassSystem(server, userToken) {
  log('TEST', '4. Testing Battle Pass System');

  try {
    // Test Battle Pass API endpoint
    log('INFO', 'Testing Battle Pass API...');
    const bpRes = await fetch(`http://${HOST}:${PORT}/api/v1/profile/battlepass`, {
      headers: { 'X-Bluejay-Token': userToken }
    });

    if (!bpRes.ok) {
      throw new Error(`Battle Pass API returned HTTP ${bpRes.status}`);
    }

    const bpData = await bpRes.json();
    log('DATA', 'Battle Pass response', bpData);

    const bp = bpData.battlepass || bpData.data?.battlepass;
    if (!bp) {
      throw new Error(`Invalid Battle Pass response: ${JSON.stringify(bpData)}`);
    }
    const requiredFields = ['name', 'xp', 'wins', 'losses', 'tier'];
    for (const field of requiredFields) {
      if (!(field in bp)) {
        throw new Error(`Battle Pass missing field: ${field}`);
      }
    }

    log('PASS', '✓ Battle Pass API working');
    log('DATA', 'Battle Pass data', bp);

    // Validate tier system (4 tiers)
    if (bp.tier < 1 || bp.tier > 4) {
      throw new Error(`Invalid tier: ${bp.tier} (should be 1-4)`);
    }
    log('PASS', '✓ Tier system correct (4 tiers)');

    // Validate XP calculation
    const expectedTier = Math.min(Math.floor(bp.xp / 500) + 1, 4);
    if (bp.tier !== expectedTier) {
      throw new Error(`Tier calculation wrong: expected ${expectedTier}, got ${bp.tier}`);
    }
    log('PASS', '✓ XP to tier calculation correct');

    testsPassed++;
    log('PASS', 'Battle Pass system test passed');
  } catch (err) {
    testsFailed++;
    log('FAIL', 'Battle Pass system test failed', { error: err.message });
    throw err;
  }
}

async function testOfflineGameplay(server) {
  log('TEST', '5. Testing Offline Gameplay');

  return new Promise((resolve, reject) => {
    const playerName = `GameTester${Date.now()}`;
    let socket;
    let gameStarted = false;
    let shipsPlaced = false;
    let attackMade = false;
    let finished = false;

    // Create attack queue to systematically attack all cells
    const attackQueue = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        attackQueue.push({ row, col });
      }
    }
    let attackIndex = 0;

    const cleanup = () => {
      if (socket) socket.disconnect();
    };

    const finish = (error) => {
      if (finished) return;
      finished = true;
      cleanup();

      if (error) {
        testsFailed++;
        log('FAIL', 'Offline gameplay test failed', { error: error.message });
        reject(error);
      } else {
        testsPassed++;
        log('PASS', 'Offline gameplay test passed');
        resolve();
      }
    };

    const timeout = setTimeout(() => {
      finish(new Error('Test timed out after 60s'));
    }, 60000);

    try {
      socket = io(`http://${HOST}:${PORT}`, { transports: ['websocket'] });

      socket.on('connect', () => {
        log('SOCKET', 'Connected to server', { socketId: socket.id });
        socket.emit('join', { name: playerName, mode: 'offline' });
      });

      socket.on('botJoined', (data) => {
        log('GAME', 'Bot opponent joined', data);
        log('INFO', 'Placing ships...');
        socket.emit('placeShips', buildShips());
      });

      socket.on('placementConfirmed', () => {
        shipsPlaced = true;
        log('PASS', '✓ Ship placement accepted');
      });

      socket.on('placementError', (data) => {
        clearTimeout(timeout);
        finish(new Error(`Ship placement rejected: ${data?.message || 'unknown'}`));
      });

      socket.on('battleStart', (data) => {
        gameStarted = true;
        log('GAME', 'Battle started', data);
        log('PASS', '✓ Game initialized');

        if (data.isYourTurn) {
          const attack = attackQueue[attackIndex++];
          socket.emit('attack', attack);
        }
      });

      socket.on('turnChange', (data) => {
        if (data.isYourTurn) {
          if (attackIndex < attackQueue.length) {
            const attack = attackQueue[attackIndex++];
            socket.emit('attack', attack);
          }
        }
      });

      socket.on('attackResult', (data) => {
        log('GAME', `Attack result: ${data.hit ? 'HIT' : 'MISS'}`, {
          position: `(${data.row}, ${data.col})`,
          hit: data.hit,
          sunk: data.sunk
        });
        log('PASS', '✓ Attack processed');

        // Mark attack as made after first attack result
        if (!attackMade && data.isAttacker) {
          attackMade = true;
        }
      });

      socket.on('gameOver', (data) => {
        clearTimeout(timeout);
        const won = data.winner === socket.id;
        log('GAME', `Game ended: ${won ? 'VICTORY' : 'DEFEAT'}`, data);

        // Validate Battle Pass update
        if (data.battlepass) {
          log('DATA', 'Battle Pass updated', data.battlepass);
          log('PASS', '✓ Battle Pass XP awarded');
        }

        if (!shipsPlaced) {
          finish(new Error('Ships were not placed'));
        } else if (!gameStarted) {
          finish(new Error('Game did not start'));
        } else {
          finish();
        }
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        finish(new Error(`Connection error: ${err.message}`));
      });

      socket.on('disconnect', (reason) => {
        if (!finished && reason !== 'client namespace disconnect') {
          clearTimeout(timeout);
          finish(new Error(`Disconnected: ${reason}`));
        }
      });

    } catch (err) {
      clearTimeout(timeout);
      finish(err);
    }
  });
}

async function testLeaderboards(server) {
  log('TEST', '6. Testing Leaderboards');

  try {
    // Test offline leaderboard
    log('INFO', 'Testing offline leaderboard...');
    const offlineRes = await fetch(`http://${HOST}:${PORT}/api/v1/leaderboard/offline`);
    if (!offlineRes.ok) {
      throw new Error(`Offline leaderboard returned HTTP ${offlineRes.status}`);
    }

    const offlineData = await offlineRes.json();
    if (!Array.isArray(offlineData)) {
      throw new Error('Offline leaderboard not an array');
    }
    log('PASS', `✓ Offline leaderboard working (${offlineData.length} entries)`);

    // Test online leaderboard
    log('INFO', 'Testing online leaderboard...');
    const onlineRes = await fetch(`http://${HOST}:${PORT}/api/v1/leaderboard/online`);
    if (!onlineRes.ok) {
      throw new Error(`Online leaderboard returned HTTP ${onlineRes.status}`);
    }

    const onlineData = await onlineRes.json();
    if (!Array.isArray(onlineData)) {
      throw new Error('Online leaderboard not an array');
    }
    log('PASS', `✓ Online leaderboard working (${onlineData.length} entries)`);

    // Validate leaderboard entry structure
    if (offlineData.length > 0) {
      const entry = offlineData[0];
      const requiredFields = ['name', 'wins', 'losses', 'games'];
      for (const field of requiredFields) {
        if (!(field in entry)) {
          throw new Error(`Leaderboard entry missing field: ${field}`);
        }
      }
      log('PASS', '✓ Leaderboard entry structure valid');
    }

    testsPassed++;
    log('PASS', 'Leaderboards test passed');
  } catch (err) {
    testsFailed++;
    log('FAIL', 'Leaderboards test failed', { error: err.message });
    throw err;
  }
}

async function testLiveStats(server) {
  log('TEST', '7. Testing Live Stats API');

  try {
    const res = await fetch(`http://${HOST}:${PORT}/api/v1/stats/live`);
    if (!res.ok) {
      throw new Error(`Live stats returned HTTP ${res.status}`);
    }

    const stats = await res.json();

    const requiredFields = [
      'totalConnections',
      'gamesPlayed',
      'offlineGamesPlayed',
      'totalHits',
      'totalMisses',
      'activeGames',
      'queue'
    ];

    for (const field of requiredFields) {
      if (!(field in stats)) {
        throw new Error(`Stats missing field: ${field}`);
      }
    }

    log('PASS', '✓ Live stats structure valid');
    log('DATA', 'Current stats', {
      connections: stats.totalConnections,
      games: stats.gamesPlayed,
      accuracy: stats.accuracy
    });

    testsPassed++;
    log('PASS', 'Live stats test passed');
  } catch (err) {
    testsFailed++;
    log('FAIL', 'Live stats test failed', { error: err.message });
    throw err;
  }
}

async function run() {
  const startTime = Date.now();
  log('START', '═══════════════════════════════════════════════');
  log('START', 'COMPREHENSIVE USER INTERACTION TEST SUITE');
  log('START', '═══════════════════════════════════════════════');

  let server;

  try {
    server = await startServer();
    log('PASS', 'Server started successfully\n');

    // Run all tests sequentially
    await testHomepageUI(server);
    console.log('');

    await testAvatarSystem(server);
    console.log('');

    const { user, token } = await testProfileSystem(server);
    console.log('');

    await testBattlePassSystem(server, token);
    console.log('');

    await testOfflineGameplay(server);
    console.log('');

    await testLeaderboards(server);
    console.log('');

    await testLiveStats(server);
    console.log('');

  } catch (err) {
    log('FAIL', 'Test suite failed', { error: err.message });
  } finally {
    if (server) {
      server.kill('SIGTERM');
      log('INFO', 'Server stopped');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(50));
    log('DATA', 'TEST RESULTS');
    console.log('═'.repeat(50));
    log('PASS', `Passed: ${testsPassed}`);
    if (testsFailed > 0) {
      log('FAIL', `Failed: ${testsFailed}`);
    }
    log('INFO', `Duration: ${duration}s`);
    console.log('═'.repeat(50) + '\n');

    if (testsFailed > 0) {
      log('FAIL', 'Some tests failed');
      process.exit(1);
    } else {
      log('PASS', 'All tests passed! ✨');
      process.exit(0);
    }
  }
}

run().catch(err => {
  log('FAIL', 'Fatal error', { error: err.message });
  process.exit(1);
});

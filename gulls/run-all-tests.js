/**
 * Test Runner - Runs all comprehensive user-facing tests
 * Executes existing test files in sequence to verify all features
 */

const { spawn } = require('child_process');

const tests = [
  { name: 'Homepage UI', file: 'homepage-ui-test.js', port: 3201 },
  { name: 'Profile & Avatars', file: 'profile-api-test.js', port: 3202 },
  { name: 'Battle Pass Integration', file: 'offline-battlepass-test.js', port: 3203 },
  { name: 'Leaderboards API', file: 'leaderboards-endpoint-test.js', port: 3204 },
  { name: 'Queue System', file: 'queue-system-test.js', port: 3205 }
];

let passed = 0;
let failed = 0;

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function runTest(test) {
  return new Promise((resolve) => {
    log('🧪', `Running: ${test.name}`);

    const child = spawn('node', [`gulls/${test.file}`], {
      env: {
        ...process.env,
        TEST_PORT: String(test.port)
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        passed++;
        log('✅', `${test.name} PASSED`);
        // Show last line of output if verbose
        const lines = output.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine && lastLine.includes('passed')) {
          console.log(`   └─ ${lastLine}`);
        }
      } else {
        failed++;
        log('❌', `${test.name} FAILED`);
        // Show error output
        const lines = output.trim().split('\n');
        const errorLines = lines.filter(l => l.includes('error') || l.includes('fail') || l.includes('Error'));
        if (errorLines.length > 0) {
          errorLines.slice(0, 3).forEach(line => {
            console.log(`   └─ ${line}`);
          });
        }
      }
      console.log('');
      resolve();
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();

  console.log('');
  log('🚀', '═'.repeat(60));
  log('🚀', 'COMPREHENSIVE USER TESTING SUITE');
  log('🚀', '═'.repeat(60));
  console.log('');

  for (const test of tests) {
    await runTest(test);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('═'.repeat(60));
  log('📊', 'TEST RESULTS');
  console.log('═'.repeat(60));
  log('✅', `Passed: ${passed}/${tests.length}`);
  if (failed > 0) {
    log('❌', `Failed: ${failed}/${tests.length}`);
  }
  log('⏱️', `Duration: ${duration}s`);
  console.log('═'.repeat(60));
  console.log('');

  if (failed > 0) {
    log('❌', 'Some tests failed - check output above for details');
    process.exit(1);
  } else {
    log('✅', 'All comprehensive tests passed! ✨');
    log('ℹ️', 'All user-facing features verified');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  log('❌', `Fatal error: ${err.message}`);
  process.exit(1);
});

#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function showBanner() {
  log('\n' + '='.repeat(60), COLORS.cyan);
  log('  🎮 SPATULETAIL GAME 🎮', COLORS.bright + COLORS.green);
  log('  2-Player Turn-Based Battleship with 3D Graphics', COLORS.blue);
  log('='.repeat(60) + '\n', COLORS.cyan);
}

function showHelp() {
  showBanner();
  log('USAGE:', COLORS.bright + COLORS.yellow);
  log('  spatuletail [command]\n', COLORS.reset);
  log('COMMANDS:', COLORS.bright + COLORS.yellow);
  log('  start     Start the game server (default)', COLORS.reset);
  log('  setup     Run setup wizard to configure .env', COLORS.reset);
  log('  help      Show this help message\n', COLORS.reset);
  log('EXAMPLES:', COLORS.bright + COLORS.yellow);
  log('  spatuletail           # Start the server', COLORS.reset);
  log('  spatuletail setup     # Run setup wizard', COLORS.reset);
  log('  npx spatuletail       # Quick start without installing\n', COLORS.reset);
}

async function runSetup() {
  const packageDir = path.join(__dirname, '..');
  const setupPath = path.join(packageDir, 'setup.js');

  if (!fs.existsSync(setupPath)) {
    log('✗ Setup script not found!', COLORS.red);
    return;
  }

  const setup = spawn('node', [setupPath], {
    stdio: 'inherit',
    cwd: packageDir
  });

  setup.on('close', (code) => {
    if (code !== 0) {
      log(`\n✗ Setup failed with code ${code}`, COLORS.red);
    }
  });
}

async function startServer() {
  const packageDir = path.join(__dirname, '..');
  const serverPath = path.join(packageDir, 'server.js');
  const envPath = path.join(packageDir, '.env');

  showBanner();

  // Check if .env exists in package directory
  if (!fs.existsSync(envPath)) {
    log('⚠ No .env file found in package directory!', COLORS.yellow);
    log('  Expected location: ' + envPath, COLORS.cyan);
    log('Running setup wizard first...\n', COLORS.blue);

    await new Promise((resolve) => {
      const setup = spawn('node', [path.join(__dirname, '..', 'setup.js')], {
        stdio: 'inherit',
        cwd: packageDir
      });

      setup.on('close', () => resolve());
    });

    // Check again after setup
    if (!fs.existsSync(envPath)) {
      log('\n✗ Setup did not create .env file.', COLORS.red);
      log('Please run: spatuletail setup\n', COLORS.yellow);
      log('Or manually copy example.env to .env in: ' + packageDir + '\n', COLORS.yellow);
      process.exit(1);
    }

    log('\n' + '─'.repeat(60) + '\n', COLORS.cyan);
  } else {
    log('✓ Using .env from: ' + envPath + '\n', COLORS.green);
  }

  log('🚀 Starting Spatuletail Game Server...\n', COLORS.bright + COLORS.green);

  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: packageDir
  });

  server.on('close', (code) => {
    if (code !== 0) {
      log(`\n✗ Server exited with code ${code}`, COLORS.red);
    }
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    log('\n\n👋 Shutting down Spatuletail Game Server...', COLORS.yellow);
    server.kill('SIGINT');
    process.exit(0);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'start';

switch (command) {
  case 'start':
    startServer();
    break;
  case 'setup':
    runSetup();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    log(`✗ Unknown command: ${command}\n`, COLORS.red);
    showHelp();
    process.exit(1);
}

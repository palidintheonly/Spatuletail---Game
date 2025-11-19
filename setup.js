#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function banner() {
  log('\n' + '='.repeat(60), COLORS.cyan);
  log('  SPATULETAIL GAME - SETUP WIZARD', COLORS.bright + COLORS.cyan);
  log('='.repeat(60) + '\n', COLORS.cyan);
}

async function setupEnv() {
  // Primary .env location (package directory where server.js runs)
  const packageEnvPath = path.join(__dirname, '.env');
  const exampleEnvPath = path.join(__dirname, 'example.env');

  // Check if .env already exists in package directory
  if (fs.existsSync(packageEnvPath)) {
    log('✓ .env file already exists in package directory.', COLORS.green);
    log('  Location: ' + packageEnvPath, COLORS.cyan);
    log('  To reconfigure, delete .env and run: spatuletail setup\n', COLORS.yellow);
    return;
  }

  // Check if example.env exists
  if (!fs.existsSync(exampleEnvPath)) {
    log('✗ example.env not found!', COLORS.red);
    log('  Please ensure example.env exists in the package directory.\n', COLORS.yellow);
    return;
  }

  banner();

  log('Welcome to Spatuletail Game!', COLORS.bright);
  log('This wizard will help you set up your environment configuration.\n', COLORS.blue);

  // Copy example.env to package directory .env
  try {
    fs.copyFileSync(exampleEnvPath, packageEnvPath);
    log('✓ Created .env file from example.env', COLORS.green);
    log('  Location: ' + packageEnvPath + '\n', COLORS.cyan);
    log('─'.repeat(60), COLORS.cyan);
    log('NEXT STEPS:', COLORS.bright + COLORS.yellow);
    log('─'.repeat(60) + '\n', COLORS.cyan);
    log('1. Edit the .env file with your preferred configuration:', COLORS.blue);
    log('   - Set your PORT (default: 3000)', COLORS.reset);
    log('   - Set your ADMIN_PASSWORD for the admin dashboard', COLORS.reset);
    log('   - Configure SESSION_SECRET (use a random string)', COLORS.reset);
    log('   - Adjust game settings (MAX_ROUNDS, TURN_TIMER_SECONDS, etc.)\n', COLORS.reset);
    log('2. Start the server:', COLORS.blue);
    log('   spatuletail start\n', COLORS.bright + COLORS.green);
    log('3. Open your browser to:', COLORS.blue);
    log('   http://localhost:3000 (or your configured PORT)\n', COLORS.bright + COLORS.green);
    log('─'.repeat(60) + '\n', COLORS.cyan);
    log('For more information, see README.md', COLORS.yellow);
    log('Happy gaming! 🎮\n', COLORS.green);
  } catch (error) {
    log('✗ Failed to create .env file:', COLORS.red);
    log(error.message, COLORS.red);
    log('\nPlease manually copy example.env to .env\n', COLORS.yellow);
  }
}

// Only run setup if not in CI environment and not a dependency install
if (!process.env.CI && !process.env.npm_config_global) {
  setupEnv().catch(console.error);
} else {
  // Silent in CI or global installs
  log('Skipping interactive setup (CI or global install detected)', COLORS.yellow);
}

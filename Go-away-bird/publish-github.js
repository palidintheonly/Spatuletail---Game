#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

try {
  const root = path.join(__dirname, '..');
  const packagePath = path.join(root, 'package.json');
  const githubPackagePath = path.join(root, 'package-github.json');
  const backupPath = path.join(root, 'package-npm.json');

  log('\n' + '='.repeat(60), COLORS.cyan);
  log('  Publishing to GitHub Packages', COLORS.green);
  log('='.repeat(60) + '\n', COLORS.cyan);

  // Step 1: Backup current package.json
  log('1. Backing up package.json...', COLORS.blue);
  fs.copyFileSync(packagePath, backupPath);
  log('   ✓ Created backup: package-npm.json\n', COLORS.green);

  // Step 2: Copy GitHub package config
  log('2. Using GitHub package configuration...', COLORS.blue);
  fs.copyFileSync(githubPackagePath, packagePath);
  log('   ✓ Switched to package-github.json\n', COLORS.green);

  // Step 3: Publish to GitHub
  log('3. Publishing to GitHub Packages...', COLORS.blue);
  execSync('npm publish', { stdio: 'inherit', cwd: root });
  log('   ✓ Published to GitHub Packages\n', COLORS.green);

  // Step 4: Restore original package.json
  log('4. Restoring package.json...', COLORS.blue);
  fs.copyFileSync(backupPath, packagePath);
  fs.unlinkSync(backupPath);
  log('   ✓ Restored original package.json\n', COLORS.green);

  log('='.repeat(60), COLORS.cyan);
  log('  ✓ Successfully published to GitHub Packages!', COLORS.green);
  log('='.repeat(60) + '\n', COLORS.cyan);

} catch (error) {
  console.error('\n✗ Publishing failed:', error.message);

  // Attempt to restore package.json
  try {
    const root = path.join(__dirname, '..');
    const backupPath = path.join(root, 'package-npm.json');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, path.join(root, 'package.json'));
      fs.unlinkSync(backupPath);
      log('✓ Restored original package.json', COLORS.yellow);
    }
  } catch (restoreError) {
    console.error('✗ Failed to restore package.json:', restoreError.message);
  }

  process.exit(1);
}

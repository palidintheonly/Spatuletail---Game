#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }

  return parts.join('.');
}

try {
  const root = path.join(__dirname, '..');
  const packagePath = path.join(root, 'package.json');
  const githubPackagePath = path.join(root, 'package-github.json');

  const bumpType = process.argv[2] || 'patch';

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    log('✗ Invalid bump type. Use: major, minor, or patch', COLORS.red);
    process.exit(1);
  }

  log('\n' + '='.repeat(60), COLORS.cyan);
  log('  Version Bump Utility', COLORS.green);
  log('='.repeat(60) + '\n', COLORS.cyan);

  // Read both package files
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const githubPkg = JSON.parse(fs.readFileSync(githubPackagePath, 'utf8'));

  const oldVersion = pkg.version;
  const newVersion = bumpVersion(oldVersion, bumpType);

  log(`Current version: ${oldVersion}`, COLORS.blue);
  log(`New version:     ${newVersion}`, COLORS.green);
  log(`Bump type:       ${bumpType}\n`, COLORS.yellow);

  // Update versions
  pkg.version = newVersion;
  githubPkg.version = newVersion;

  // Write back
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync(githubPackagePath, JSON.stringify(githubPkg, null, 2) + '\n');

  log('✓ Updated package.json', COLORS.green);
  log('✓ Updated package-github.json\n', COLORS.green);

  log('='.repeat(60), COLORS.cyan);
  log(`  Version bumped: ${oldVersion} → ${newVersion}`, COLORS.bright + COLORS.green);
  log('='.repeat(60) + '\n', COLORS.cyan);

  log('Next steps:', COLORS.yellow);
  log('  1. Review the changes', COLORS.reset);
  log('  2. Commit: git add . && git commit -m "Bump version to ' + newVersion + '"', COLORS.reset);
  log('  3. Tag: git tag v' + newVersion, COLORS.reset);
  log('  4. Publish: npm run publish:both\n', COLORS.reset);

} catch (error) {
  log('\n✗ Version bump failed:', COLORS.red);
  log(error.message, COLORS.red);
  process.exit(1);
}

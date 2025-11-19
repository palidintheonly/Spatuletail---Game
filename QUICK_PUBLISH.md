# Quick Publishing Reference

## Publish to NPM (Public Registry)

```bash
npm login
npm publish
```

Package will be available as: `spatuletail-game`

Install command: `npm install spatuletail-game` or `npx spatuletail-game`

---

## Publish to GitHub Packages

### One-Time Setup

1. Create GitHub Personal Access Token with `write:packages` permission
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select: `write:packages`, `read:packages`

2. Configure npm with your token:
   ```bash
   npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN_HERE
   ```

### Publish Using Script (Recommended)

**Windows:**
```cmd
publish-to-github.bat
```

**Mac/Linux:**
```bash
chmod +x publish-to-github.sh
./publish-to-github.sh
```

### Publish Manually

```bash
# Temporarily use GitHub package config
cp package-github.json package.json
npm publish
# Restore original
git checkout package.json
```

Package will be available as: `@palidintheonly/spatuletail-game`

---

## Publish to BOTH Registries

### Option 1: Manual (Safest)

1. Publish to NPM first:
   ```bash
   npm publish --registry https://registry.npmjs.org
   ```

2. Then publish to GitHub Packages:
   ```bash
   publish-to-github.bat    # Windows
   ./publish-to-github.sh   # Mac/Linux
   ```

### Option 2: Automated (GitHub Actions)

Create a release on GitHub and the workflows will automatically publish to both:

1. Create a git tag:
   ```bash
   git tag v2.0.3
   git push origin v2.0.3
   ```

2. Create a release on GitHub using that tag

3. GitHub Actions will automatically publish to:
   - NPM (requires `NPM_TOKEN` secret)
   - GitHub Packages (uses built-in `GITHUB_TOKEN`)

**Setup GitHub Secrets:**
- Go to: https://github.com/palidintheonly/Spatuletail---Game/settings/secrets/actions
- Add secret: `NPM_TOKEN` with your npm access token

---

## Installation Commands

### From NPM
```bash
npm install spatuletail-game
npx spatuletail-game
```

### From GitHub Packages

Users need to create `.npmrc` in their project:
```
@palidintheonly:registry=https://npm.pkg.github.com
```

Then:
```bash
npm install @palidintheonly/spatuletail-game
npx @palidintheonly/spatuletail-game
```

---

## Current Version

**2.0.3**

Update version before publishing:
```bash
npm version patch   # 2.0.3 -> 2.0.4
npm version minor   # 2.0.3 -> 2.1.0
npm version major   # 2.0.3 -> 3.0.0
```

---

## Quick Links

- **NPM Package**: https://www.npmjs.com/package/spatuletail-game
- **GitHub Packages**: https://github.com/palidintheonly/Spatuletail---Game/packages
- **Repository**: https://github.com/palidintheonly/Spatuletail---Game

---

## Files Reference

- `package.json` - NPM registry version (unscoped name)
- `package-github.json` - GitHub Packages version (scoped name `@palidintheonly/`)
- `PUBLISHING.md` - Detailed NPM publishing guide
- `GITHUB_PACKAGES.md` - Detailed GitHub Packages guide
- `.github/workflows/publish-npm.yml` - Auto-publish to NPM
- `.github/workflows/publish-github-packages.yml` - Auto-publish to GitHub Packages

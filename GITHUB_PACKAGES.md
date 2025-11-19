# Publishing to GitHub Packages

This guide will help you publish `spatuletail-game` to GitHub Packages in addition to (or instead of) npm.

## Prerequisites

1. **GitHub Account** with your repository at https://github.com/palidintheonly/Spatuletail---Game
2. **Personal Access Token** with `write:packages` and `read:packages` permissions

## Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "NPM Package Publishing"
4. Select scopes:
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `read:packages` (Download packages from GitHub Package Registry)
   - ✅ `delete:packages` (Delete packages from GitHub Package Registry - optional)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

## Step 2: Configure NPM Authentication

Add your token to your local npm configuration:

```bash
npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
```

Replace `YOUR_GITHUB_TOKEN` with the token you just created.

## Step 3: Update package.json for GitHub Packages

The package name needs to be scoped to your GitHub username. Update `package.json`:

```json
{
  "name": "@palidintheonly/spatuletail-game",
  "version": "2.0.3",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

## Step 4: Create .npmrc in Your Project

Create a `.npmrc` file in your project root:

```
@palidintheonly:registry=https://npm.pkg.github.com
```

This tells npm to look for packages in the `@palidintheonly` scope on GitHub Packages.

## Step 5: Publish to GitHub Packages

```bash
npm publish
```

That's it! Your package will now be published to GitHub Packages.

## Publishing to BOTH NPM and GitHub Packages

If you want to publish to both registries:

### Option 1: Publish to Each Registry Separately

**For GitHub Packages:**
```bash
# Make sure package.json has scoped name and publishConfig
npm publish
```

**For NPM Registry:**
```bash
# Remove or comment out publishConfig from package.json
# Use unscoped name "spatuletail-game"
npm publish --registry https://registry.npmjs.org
```

### Option 2: Use npm Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "publish:github": "npm publish",
    "publish:npm": "npm publish --registry https://registry.npmjs.org"
  }
}
```

Then publish with:
```bash
npm run publish:github  # Publish to GitHub Packages
npm run publish:npm     # Publish to npm
```

## Installing from GitHub Packages

Users will need to configure their npm to use GitHub Packages for your scope:

**Create `.npmrc` in their project:**
```
@palidintheonly:registry=https://npm.pkg.github.com
```

**For public packages:**
```bash
npm install @palidintheonly/spatuletail-game
```

**For private packages, they need authentication:**
```bash
npm config set //npm.pkg.github.com/:_authToken THEIR_GITHUB_TOKEN
npm install @palidintheonly/spatuletail-game
```

## Using npx with GitHub Packages

```bash
npx @palidintheonly/spatuletail-game
```

## Viewing Your Package on GitHub

After publishing, view your package at:
```
https://github.com/palidintheonly/Spatuletail---Game/packages
```

## GitHub Packages vs NPM

### GitHub Packages Advantages:
- Integrated with your GitHub repository
- Easy access control for private packages
- Free for public packages
- Unified ecosystem (code + packages)

### NPM Advantages:
- More discoverable (npmjs.com is the standard)
- No authentication needed for installation
- Better for public open-source projects
- Simpler for users (no .npmrc configuration)

## Recommended Approach

For maximum reach, publish to **both**:
1. **NPM** with name `spatuletail-game` (for easy public access)
2. **GitHub Packages** with name `@palidintheonly/spatuletail-game` (for GitHub integration)

## Troubleshooting

### Error: 404 Not Found
- Make sure your package name is scoped: `@palidintheonly/spatuletail-game`
- Verify your token has `write:packages` permission
- Check that the repository exists and you have access

### Error: 401 Unauthorized
- Verify your token is correctly set: `npm config get //npm.pkg.github.com/:_authToken`
- Make sure your token hasn't expired
- Regenerate token if needed

### Error: 403 Forbidden
- You may not have permission to publish to this scope
- Verify you own the GitHub account/organization

## Security Notes

- **Never commit** your Personal Access Token to git
- Add `.npmrc` with tokens to `.gitignore`
- Use environment variables for CI/CD pipelines
- Rotate tokens regularly for security

## CI/CD with GitHub Actions

To automatically publish on release, add this to `.github/workflows/publish.yml`:

```yaml
name: Publish to GitHub Packages

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

**Ready to publish to GitHub Packages?** Follow the steps above!

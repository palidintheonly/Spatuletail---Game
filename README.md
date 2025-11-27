<div align="center">

# ⚓ Spatuletail - Game

**A 2-player turn-based battleship game with real-time multiplayer**

[![NPM Version](https://img.shields.io/npm/v/spatuletail-game?style=flat&logo=npm&color=CB3837)](https://www.npmjs.com/package/spatuletail-game)
[![GitHub Release](https://img.shields.io/github/v/release/palidintheonly/Spatuletail---Game?style=flat&logo=github&color=181717)](https://github.com/palidintheonly/Spatuletail---Game/releases)
[![Node Version](https://img.shields.io/node/v/spatuletail-game?style=flat&logo=node.js&color=339933)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Custom-orange?style=flat)](./LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/palidintheonly/Spatuletail---Game?style=flat&logo=github)](https://github.com/palidintheonly/Spatuletail---Game/issues)
[![GitHub Stars](https://img.shields.io/github/stars/palidintheonly/Spatuletail---Game?style=flat&logo=github)](https://github.com/palidintheonly/Spatuletail---Game/stargazers)
[![Downloads](https://img.shields.io/npm/dt/spatuletail-game?style=flat&logo=npm&color=CB3837)](https://www.npmjs.com/package/spatuletail-game)

[🎮 Features](#-features) • [📦 Installation](#-installation) • [⚙️ Configuration](#%EF%B8%8F-configuration) • [🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🚀 Development](#-development--publishing)

</div>

---

## 🎮 Features

- **🤖 AI Training Mode** - Practise against AI opponents with adaptive targeting
- **📊 Live Statistics** - Real-time game analytics and leaderboards
- **🎨 Modern UI** - Sleek design with particle effects and animations
- **🔒 Security** - Rate limiting, admin protection, and input validation
- **⚡ Fast Setup** - Run with `npx` in seconds - no installation required!
- **📱 Responsive** - Full mobile and desktop support
- **🎯 Classic Gameplay** - Traditional 5-ship battleship with 10x10 grid
- **📄 Legal Pages** - Built-in Terms of Service and Privacy Policy

---

## 📦 Installation

### ⚡ Fastest Method - Using npx (Recommended)

Run the game instantly without installation:

```bash
npx spatuletail-game
```

That's it! The server starts automatically on `http://localhost:3010`

### 📥 Install via NPM

```bash
npm install spatuletail-game
```

Or from GitHub Packages:

```bash
npm install @palidintheonly/spatuletail-game --registry=https://npm.pkg.github.com
```

### 🌍 Install Globally

```bash
npm install -g spatuletail-game
spatuletail        # Start the server
spatuletail setup  # Run setup wizard
spatuletail help   # Show help
```

### 🛠️ Local Project Installation

```bash
npm install spatuletail-game
cd node_modules/spatuletail-game
cp egret.env .egret.env
# Edit .egret.env with your configuration
npm start
```

### 🔧 Clone from GitHub

For development or customization:

```bash
git clone https://github.com/palidintheonly/Spatuletail---Game.git
cd Spatuletail---Game
npm install
cp egret.env .egret.env
# Edit .egret.env with your configuration
npm start
```

> 💡 **For Developers:** See the [Development & Publishing](#-development--publishing) section for version management and publishing workflows.

---

## ⚙️ Configuration

Before running the server, configure your environment variables:

1. **Copy the egret environment file:**
   ```bash
   cp egret.env .egret.env
```

2. **Edit `.egret.env` and configure required variables:**

   | Variable | Default | Description |
   |----------|---------|-------------|
   | `PORT` | `3010` | Server port |
   | `HOST` | `0.0.0.0` | Server host |
   | `NODE_ENV` | `alpha-prebuild-canary` | Environment mode |
   | `ADMIN_PASSWORD` | `admin123` | Admin dashboard password ⚠️ **CHANGE THIS!** |
   | `SESSION_SECRET` | `your-secret-key` | Session encryption key |
   | `MAX_ROUNDS` | `3` | Maximum game rounds |
   | `TURN_TIMER_SECONDS` | `30` | Turn timer duration |

   > 💡 **Tip:** See `egret.env` for all available configuration options

---

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Access the game:**
   - Main Menu: `http://localhost:3010`
   - Offline Mode: `http://localhost:3010/offline`
   - Admin Panel: `http://localhost:3010/admin`

3. **Legal Pages:**
   - Terms of Service: `http://localhost:3010/terms`
   - Privacy Policy: `http://localhost:3010/privacy-policy`

---

## 📚 Documentation

### 📂 Project Structure

```
Spatuletail-Game/
├── QuakerBeak/          # Game client files
│   ├── assets/          # CSS, JS, images
│   └── views/           # HTML pages
├── waterbird/           # Game data (leaderboards, logs)
├── secretarybird/       # Legal pages (Terms, Privacy)
├── Go-away-bird/        # Publishing & version management scripts
├── robin/               # CLI executable (spatuletail command)
├── osprey.js            # Main server file
├── sparrow.js           # Interactive setup wizard
├── package.json         # NPM package config
├── albatross.json       # GitHub Packages config
├── egret.env            # Environment template
├── .npmrc               # NPM authentication (git-ignored)
├── LICENSE              # License information
├── TERMS.md             # Terms of Service (GitHub)
└── PRIVACY.md           # Privacy Policy (GitHub)
```

### 🎯 Game Modes

| Mode | Description | Players |
|------|-------------|---------|
| **Offline Mode** | Practise against AI opponents with adaptive targeting | 1 Player + AI |

**Note:** Online multiplayer and spectator modes are temporarily disabled and not currently available.

### 🚢 Ship Types

| Ship | Length | Symbol | Cells |
|------|--------|--------|-------|
| Carrier | 5 | 🚢 | █████ |
| Battleship | 4 | ⚓ | ████ |
| Cruiser | 3 | 🛥️ | ███ |
| Submarine | 3 | 🔱 | ███ |
| Destroyer | 2 | ⛵ | ██ |

**Total:** 17 cells per player (equal for both sides)

### 🔐 Admin Panel

Access the admin dashboard at `/admin` with your configured password:

- Live server statistics
- Active games monitoring
- Player analytics
- System information
- Game logs

---

## 🛡️ Security Features

- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Password-protected admin panel
- ✅ Input validation and sanitization
- ✅ Connection limits per IP (max 10)
- ✅ Session timeouts
- ✅ No data sent to external servers

---

## 📄 Legal & Privacy

This game includes built-in legal documentation:

- **[Terms of Service](./TERMS.md)** - Usage terms and conditions
- **[Privacy Policy](./PRIVACY.md)** - Data collection and privacy practises
- **Web Pages:** Available at `/terms` and `/privacy-policy` when server is running

> ℹ️ **Data Collection:** We only collect player names, game statistics, leaderboards, and temporary session data. See [PRIVACY.md](./PRIVACY.md) for full details.

---

## 🔧 Dependencies

| Package | Purpose |
|---------|---------|
| **express** | Web server framework |
| **socket.io** | Real-time communication |
| **gsap** | Animation platform |
| **howler** | Audio library |
| **chart.js** | Statistics visualization |
| **cannon-es** | Physics engine |
| **matter-js** | 2D physics engine |
| **particles.js** | Particle effects |
| **aos** | Scroll animations |
| **dotenv** | Environment configuration |

---

## 🚀 Development & Publishing

### Version Management

Bump version numbers automatically in both `package.json` and `albatross.json`:

```bash
npm run version:patch  # Bug fixes (3.0.0 → 3.0.1)
npm run version:minor  # New features (3.0.0 → 3.1.0)
npm run version:major  # Breaking changes (3.0.0 → 4.0.0)
```

### Publishing

Publish to npm and/or GitHub Packages:

```bash
npm run publish:npm      # Publish to npm registry
npm run publish:github   # Publish to GitHub Packages
npm run publish:both     # Publish to both registries
```

### Complete Release Workflow

```bash
# 1. Bump version
npm run version:patch

# 2. Commit changes
git add .
git commit -m "Bump version to 3.0.1"

# 3. Create git tag
git tag v3.0.1

# 4. Push to GitHub
git push && git push --tags

# 5. Publish packages
npm run publish:both
```

> 📝 **Note:** Publishing requires authentication tokens configured in `.npmrc`. See project documentation for setup details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

> ⚠️ **Important:** You may NOT rebrand or remove the "Spatuletail Game" name and branding. See [LICENSE](./LICENSE) for details.

---

## 📋 Requirements

- **Node.js** >= 14.0.0
- **Modern web browser** with WebGL support
- **Network connection** for multiplayer features

---

## 🐛 Issues & Support

Encountered a bug or have a question?

- 📝 [Open an Issue](https://github.com/palidintheonly/Spatuletail---Game/issues)
- 💬 [Discussions](https://github.com/palidintheonly/Spatuletail---Game/discussions)
- 📦 [NPM Package](https://www.npmjs.com/package/spatuletail-game)

---

## 📜 License

**Custom License** - See [LICENSE](./LICENSE) file for full details.

### ⚖️ Key Points:

- ✅ Free to use, modify, and distribute
- ✅ Can be used for personal or commercial purposes
- ❌ **Cannot** rebrand or remove "Spatuletail Game" name/branding
- ❌ **Cannot** claim as your own original creation
- ✅ **Must** retain attribution to original author (palidintheonly)

For rebranding permission, contact via [GitHub](https://github.com/palidintheonly/Spatuletail---Game).

---

## 👨‍💻 Author

**palidintheonly**

- GitHub: [@palidintheonly](https://github.com/palidintheonly)
- Repository: [Spatuletail---Game](https://github.com/palidintheonly/Spatuletail---Game)

---

## 🌟 Changelog

### v3.5.0 (Latest)
- 🌍 Converted all user-facing text to British English spelling
- 🎮 Focussed game on offline AI mode only
- 🛡️ Updated legal pages with current game features and British English
- 📦 Removed outdated multiplayer and spectator mode references
- 🎨 Fixed UI overlapping issues with legend repositioning
- 🔧 Improved status message visibility system
- 💫 Updated homepage with accurate feature descriptions
- 📝 Comprehensive British English conversion in CSS (colour, centre)
- ⚙️ Fixed z-index layering for better UI interaction
- 🚀 Updated package descriptions to reflect offline-only gameplay

### v3.0.0
- 🚀 Major version release with loading screen improvements
- 🛡️ Added multiple failsafe timeouts to prevent infinite loading screens
- 📦 Aligned npm and GitHub package descriptions to "2D grid system"
- 🛠️ Added automated publishing scripts (`Go-away-bird/` directory)
- 🔧 New version management commands (`npm run version:patch/minor/major`)
- 📝 Automated package publishing with `npm run publish:npm/github/both`
- 🎨 Updated CLI banner text to match package description
- 📋 Added comprehensive publishing documentation
- 🔐 Configured authentication for both npm and GitHub Packages registries

### v2.3.5
- 🐛 Fixed infinite loading screens with timeout handlers
- ⚠️ Added connection error handling for all game modes
- 🔄 Auto-updating GitHub badges with live stats
- 📊 Improved error feedback for users

### v2.3.1
- ✨ Added Terms of Service and Privacy Policy pages
- 📄 New `/terms` and `/privacy-policy` endpoints
- 📁 Added `secretarybird/` directory for legal documents
- 🔗 Footer links to legal pages on all game views
- 📚 GitHub documentation: `TERMS.md` and `PRIVACY.md`
- 🔄 Updated API version references

### v2.1.0
- 🎮 Enhanced game mechanics
- 🐛 Bug fixes and improvements

---

<div align="center">

**Made with ❤️ for multiplayer gaming enthusiasts**

[![GitHub](https://img.shields.io/badge/GitHub-palidintheonly-181717?logo=github&style=for-the-badge)](https://github.com/palidintheonly/Spatuletail---Game)
[![NPM](https://img.shields.io/badge/NPM-spatuletail--game-CB3837?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/spatuletail-game)
[![Node.js](https://img.shields.io/badge/Node.js-14+-339933?logo=node.js&style=for-the-badge)](https://nodejs.org)

**[⬆ Back to Top](#-spatuletail---game)**

</div>

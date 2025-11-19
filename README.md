# Spatuletail Game

A 2-player turn-based battleship game with stunning Three.js 3D graphics and real-time multiplayer functionality powered by Socket.IO.

## NPM Package Installation

### Fastest Method - Using npx (No Installation Required!)

```bash
npx spatuletail-game
```

This single command downloads and runs the game server instantly!

### Install via NPM

```bash
npm install spatuletail-game
```

### Install Globally

```bash
npm install -g spatuletail-game
spatuletail
```

### Local Project Installation

```bash
npm install spatuletail-game
cd node_modules/spatuletail-game
cp example.env .env
# Edit .env with your configuration
npm start
```

## Features

- Real-time multiplayer gameplay
- Beautiful 3D graphics using Three.js
- Turn-based battleship mechanics
- WebSocket communication via Socket.IO
- Configurable game settings
- Admin dashboard
- Rate limiting and security features

## Clone from GitHub

If you prefer to clone the source code:

```bash
git clone https://github.com/palidintheonly/Spatuletail---Game.git
cd Spatuletail---Game
npm install
cp example.env .env
# Edit .env with your configuration
npm start
```

## Configuration

Before running the server, you need to configure your environment variables:

1. Copy `example.env` to `.env`:
   ```bash
   cp example.env .env
   ```

2. Edit `.env` and configure the following required variables:
   - `PORT` - Server port (default: 3000)
   - `HOST` - Server host (default: localhost)
   - `NODE_ENV` - Environment (development/production)
   - `ADMIN_PASSWORD` - Admin dashboard password
   - `SESSION_SECRET` - Session secret key
   - `MAX_ROUNDS` - Maximum game rounds
   - `TURN_TIMER_SECONDS` - Turn timer in seconds

## Usage

Start the server:

```bash
npm start
```

The game will be available at `http://localhost:PORT` (where PORT is defined in your .env file).

## Requirements

- Node.js >= 14.0.0
- Modern web browser with WebGL support

## Package Contents

This NPM package includes:
- Game server (`server.js`)
- Game client files
- Example configuration (`example.env`)
- Setup script

## Development

To contribute or modify:

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Test locally
5. Submit a pull request

## Dependencies

- **express** - Web server framework
- **socket.io** - Real-time communication
- **three.js** - 3D graphics (via three-orbit-controls)
- **anime.js** - Animation library
- **gsap** - Animation platform
- **howler** - Audio library
- **chart.js** - Statistics visualization
- **cannon-es** - Physics engine
- **matter-js** - 2D physics engine
- **particles.js** - Particle effects

## License

Custom License - See LICENSE file for details. You may use, modify, and distribute this software, but you may NOT rebrand or remove the "Spatuletail Game" name and branding.

## Support

For issues, questions, or contributions, please visit:
- NPM Package: [npmjs.com/package/spatuletail-game](https://www.npmjs.com/package/spatuletail-game)
- Issues: [GitHub Issues](https://github.com/palidintheonly/Spatuletail---Game/issues)
- Repository: [GitHub](https://github.com/palidintheonly/Spatuletail---Game)

## Credits

Created with love for multiplayer gaming enthusiasts!

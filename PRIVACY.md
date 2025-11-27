# PRIVACY POLICY

**Spatuletail - Game v3.0.0**

*Effective Date: November 19, 2025*

---

## Our Commitment to 100% Transparency

**This privacy policy discloses EXACTLY what data we collect, where it's stored, who can see it, and how to delete it. We are committed to complete honesty about all data practices. If something is not listed here, we do NOT collect it.**

---

## 1. Introduction

This Privacy Policy explains how Spatuletail - Game ("we," "us," or "the Game") collects, uses, and protects your information when you use our online battleship game.

By using the Game, you agree to the collection and use of information in accordance with this policy.

## 2. Complete List of Data We Collect

We collect ONLY the data listed below. This list is exhaustive and complete:

### 2.1 Data Stored Permanently (JSON Files)

| Data Type | What We Store | Purpose | Storage Location | Retention |
|-----------|---------------|---------|------------------|-----------|
| **Player Names** | Your chosen username | Display in-game and on leaderboards | `waterbird/online-leaderboard.json` `waterbird/offline-leaderboard.json` | Indefinitely (top 100 per mode) |
| **Game Statistics** | Wins, losses, games played | Track rankings and achievements | Same as above | Indefinitely (top 100 per mode) |
| **Game Logs** | Player names, socket IDs, game events, moves (row/col), timestamps, hits/misses | Debugging and game improvement | `waterbird/game-log.json` | Rolling window (last 2,000 games) |
| **Event Logs** | Player joins, disconnects, attacks, all game events with timestamps | Server monitoring and debugging | Same as above | Rolling window (last 2,000 events) |

### 2.2 Data Stored Temporarily (Server Memory Only)

| Data Type | What We Store | Purpose | Retention Period |
|-----------|---------------|---------|------------------|
| **Socket.IO Session IDs** | Random session identifier (e.g., "abc123xyz") | Maintain game connection | Duration of active session only |
| **IP Addresses** | Your IP address | Rate limiting and abuse prevention | 15 minutes (via express-rate-limit) |
| **Player Activity Data** | Last activity timestamp, warning count, active/inactive status | Detect and kick inactive players | Duration of active session only |
| **Game State** | Current game boards, ships, turns | Enable gameplay | Duration of active game only |

### 2.3 Data Visible in Console Logs (If Server Admin Saves Them)

The server logs the following to the console (visible to anyone with server access):
- Player names
- Socket IDs
- IP addresses
- Connection events
- Game events
- Error messages
- Timestamps

**Important:** If the server administrator saves console output to a file, this data may be retained longer than the session.

### 2.4 Simulated Players (Transparency Disclosure)

**The "active players" count includes 1-47 simulated bot players that are NOT real users.**

- **Purpose:** Testing metric stability and server load simulation
- **Disclosure:** These are fake placeholder players to test game systems
- **Removal:** Will be removed in upcoming updates
- **Self-Hosted:** Users running their own server can disable this by modifying `MAX_SIMULATED_PLAYERS` in `.egret.env`

## 3. Data We DO NOT Collect

We explicitly **DO NOT** collect:

- ❌ Email addresses or contact information
- ❌ Passwords or authentication credentials (no accounts required)
- ❌ Payment information or financial data
- ❌ Device identifiers or fingerprints
- ❌ Precise location data (only IP address for rate limiting)
- ❌ Persistent cookies or tracking technologies (only session cookies)
- ❌ Social media profiles or third-party account data
- ❌ Browsing history or external website activity
- ❌ Any other personal identifiable information not explicitly listed above

## 4. How We Use Your Information

We use the collected data exclusively for:

- **Game Functionality:** Enabling multiplayer features, matchmaking, and game state management
- **Leaderboards:** Displaying player rankings and statistics
- **Security:** Preventing abuse, cheating, and server overload through rate limiting
- **Debugging:** Analyzing game logs to fix bugs and improve gameplay
- **Administration:** Monitoring server health and active games
- **Testing:** Simulated players for metric stability testing (temporary)

**We do NOT:**
- ❌ Sell or trade your data
- ❌ Share data with third parties
- ❌ Use data for marketing or advertising
- ❌ Track you across other websites
- ❌ Create user profiles beyond game statistics

## 5. Who Can Access Your Data

### 5.1 Public Data

The following data is publicly visible to all players:
- Player names on leaderboards
- Win/loss statistics on leaderboards
- Live game statistics (active players count, games played)

### 5.2 Admin Access

**Server administrators (palidintheonly) can access:**
- All data listed in Section 2
- Admin panel with system information, game logs, leaderboards, and live stats
- Console logs with player names, socket IDs, and IP addresses
- Raw JSON files containing all persistent data

### 5.3 No Third-Party Access

We do NOT share data with any third parties, analytics services, or advertising networks.

## 6. Third-Party Libraries and Services

The Game uses the following third-party software (all run locally on our server, no external data transmission):

| Library | Purpose | Data Sent to Third Party |
|---------|---------|--------------------------|
| **Socket.io** | Real-time communication | None (local server only) |
| **Express.js** | Web server framework | None (local server only) |
| **express-rate-limit** | Rate limiting and IP tracking | None (local server only) |
| **Particles.js** | Visual effects | None (client-side only) |
| **AOS** | Scroll animations | None (client-side only) |
| **GSAP** | Game animations | None (client-side only) |
| **Howler.js** | Sound effects | None (client-side only) |

**Important:** All game functionality runs on our server. We do NOT use external analytics (Google Analytics, etc.), tracking services, advertising networks, or cloud storage.

## 7. Data Storage and Security

### 7.1 Storage Methods

- **Persistent Storage:** JSON files in `waterbird/` directory
- **Temporary Storage:** Server RAM (cleared on disconnect or restart)
- **No Database:** We use simple JSON files, not a database
- **No Encryption:** Data is stored in plain text JSON (it's a game, not sensitive personal data)

### 7.2 Security Measures

We implement the following security measures:

- **Rate Limiting:** Prevents abuse and DDoS attacks (100 requests per 15 minutes per IP by default)
- **Admin Protection:** Password-protected admin panel with session timeouts
- **Input Validation:** All user inputs are validated to prevent injection attacks
- **Connection Limits:** Maximum connections per IP address (10 by default)
- **Session Isolation:** Game states are isolated between sessions

### 7.3 Limitations

**We are a small indie game project. Our security is basic:**
- No encryption at rest (data stored in plain text)
- No HTTPS/SSL (unless you configure it yourself)
- No two-factor authentication
- No security audits or penetration testing
- Server access is limited to the project owner

**If you need enterprise-grade security, do not use this game.**

## 8. Your Rights and Data Control

### 8.1 Access

- ✅ View your leaderboard data on the public leaderboards
- ✅ Request copies of your game logs

### 8.2 Deletion

**You can request deletion of your data:**

1. **Option 1:** Open a GitHub issue at https://github.com/palidintheonly/Spatuletail---Game/issues
2. **Option 2:** Email monkeybyteshosting@gmail.com

**We will delete:**
- Your leaderboard entries
- Game logs containing your player name
- Any other stored data associated with your username

**We cannot delete:**
- Data already removed by automatic rotation (logs older than 2,000 entries)
- Data in console logs saved by administrators
- Temporary session data (automatically deleted when you disconnect)

**Processing time:** Up to 7 business days

### 8.3 Object and Opt-Out

- ✅ Choose not to participate by not playing the Game
- ✅ Use a fake/anonymous name (e.g., "Player123")
- ✅ Self-host and control your own data

### 8.4 Anonymous Play

**You can play anonymously:**
- No account required
- No email required
- Choose any username (we don't verify identity)
- If you don't provide a name, you'll be assigned "Guest####" with random numbers

## 9. Children's Privacy

The Game does not knowingly collect personal information from children under 13.

**Parents:** If you believe your child has provided us with personal information, please contact us via GitHub or email and we will delete it promptly.

## 10. Data Controller

The data controller for Spatuletail - Game is:

**palidintheonly**
GitHub: https://github.com/palidintheonly/Spatuletail---Game
Email: monkeybyteshosting@gmail.com

## 11. Self-Hosting and Data Control

**If you run your own server:**
- ✅ You control all data collection settings via `.egret.env` configuration
- ✅ You can disable simulated players (`MAX_SIMULATED_PLAYERS=0`)
- ✅ You can adjust log retention (`MAX_GAME_LOGS`, `MAX_EVENT_LOGS`)
- ✅ You control who has admin access
- ✅ You can delete JSON files manually

**You are responsible for:**
- Your own data privacy compliance
- Informing your users about data collection
- Securing your own server

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Effective Date."

**Version-controlled transparency:** This policy is tracked in git, so you can see the full history of changes on GitHub.

Continued use of the Game after changes constitutes acceptance of the updated policy.

## 13. Contact Us

If you have questions about this Privacy Policy or wish to exercise your rights:

**GitHub Issues:** https://github.com/palidintheonly/Spatuletail---Game/issues
**Email:** monkeybyteshosting@gmail.com

**Response time:** We aim to respond within 7 business days.

## 14. Legal Compliance

This Privacy Policy complies with general data protection principles. We are committed to:

- **Transparency:** Being 100% clear about what data we collect
- **Minimization:** Collecting only necessary data for game functionality
- **Purpose Limitation:** Using data only for stated purposes
- **Accuracy:** Maintaining accurate records
- **Storage Limitation:** Not keeping data longer than necessary (rolling logs)
- **Security:** Protecting data with appropriate measures
- **Accountability:** Taking responsibility for data practices

---

**Last Updated:** November 19, 2025
**Version:** 3.0.0
**Copyright © 2025 palidintheonly. All rights reserved.**

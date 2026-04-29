# VTT Coalizao

**Virtual Tabletop Program** for the **Coalizao** homebrew RPG system.

A complete virtual tabletop — offline-first, no registration, no mandatory server. Runs in the browser, supports local multiplayer (LAN/VPN) and online via WebSocket relay.

---

## Summary

- [Features](#features)
- [Stack](#stack)
- [Installation and Usage](#installation-and-usage)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Coalizao System — Basic Rules](#coalizao-system--basic-rules)
- [Deployment](#deployment)

---

## Features

| Module | Description |
|--------|-----------:|
| **GM's Table (Dashboard)** | Dashboard with active entities, dice, logs, quick actions, and system reference |
| **Hero Sheets** | 4-step wizard: Identity, Class & Attributes, Equipment, Review |
| **Bestiary** | 82 creatures + 15 special ones pre-registered, searchable and editable |
| **NPCs** | 70+ NPCs separated by location, with relations and private GM notes |
| **Abilities** | ~140 abilities (Legacy, Active, Passive, Myth, Single Use, Lineage) |
| **Items** | ~184 items with 41 types of modifications, rarities, and full stats |
| **Tactical Map** | 3000×3000 Canvas, multi-tabs, configurable grid, fog of war, tokens, walls |
| **Assisted Combat** | Melee / Ranged / Magic — automatic rolls with damage application |
| **Initiative Tracker** | Turn order, turn-by-turn effect counting, action checklist, stealth alert |
| **Effects and Conditions** | Apply/remove effects with per-turn duration; visible badges on tokens |
| **Investigation & Stealth** | 4 types of investigation + 3 stealth modes with Coalizao classification |
| **Rest and Recovery** | 1d20 → Critical/Good/Normal/Bad/Disaster with automatic HP recovery |
| **Token Visibility** | Configurable radius, 120° cone with free angle, ray casting against walls |
| **Domain System** | CP (Command Points) = INT bonus + CHA bonus; 6 command actions; coalition mechanics |
| **Evolution & TransEvolution** | 3 Lv5 paths + 3 Lv10 paths with applied mechanical effects |
| **Player Mode** | Player View with 6 tabs: Dice, Initiative, Sheet, Combat, Notes, Log |
| **Local Server** | Node.js + WebSocket for LAN/VPN sessions — no internet required |
| **Online Relay** | Stateless multi-room server for internet sessions |
| **PWA** | Works offline after first load, installable on desktop/mobile |
| **Export/Import** | Full campaign export to JSON for backup and transfer |
| **Error Logging** | Persistent error capture (frontend + backend) with daily log files |

---

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite 8 |
| Styling | Pure CSS with Design System (tokens, dark/light mode) |
| Local Storage | IndexedDB via Dexie.js 4 |
| Icons | Lucide React |
| Fonts | Inter (UI) · Cinzel (titles) · JetBrains Mono (stats) |
| Local Server | Node.js + Express 5 + ws |
| Online Relay | Node.js + Express 5 + ws (stateless, multi-room) |
| PWA | Cache-first Service Worker |

**Node.js 18+** is required for the server/relay. For the frontend, any modern browser works.

---

## Installation and Usage

### 1. Install Dependencies

```bash
npm install
```

### 2. Solo Mode (No Server)

Works entirely in the browser. Data is saved to the browser's IndexedDB.

```bash
npm run dev
# Opens at http://localhost:5173
```

### 3. Local Multiplayer Mode (LAN/VPN)

**Terminal 1 — WebSocket Server:**
```bash
npm run server:dev     # hot-reload
# or
npm run server         # production (uses /dist)
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

The server displays your local IP and a session code (e.g., `GH4K9X`).

- GM: `http://localhost:5173`
- Players (same network): `http://{GM_IP}:3001/#/player`
- Players via VPN (Hamachi/ZeroTier/Tailscale): same address, using the VPN IP

### 4. Online Multiplayer Mode (Relay)

Requires deploying the relay on a cloud service. See [`host/relay/README.md`](host/relay/README.md).

After deployment:
- **GM:** Server Tab → toggle "Online (Relay)" → input the relay's `wss://` URL → Connect
- **Players:** Access VTP → toggle "Online" → input the URL + code provided by the GM

---

## Available Scripts

| Script | Description |
|--------|-----------:|
| `npm run dev` | Vite development server (localhost:5173) |
| `npm run build` | Production build in `/dist` |
| `npm run preview` | Local preview of the production build |
| `npm run server` | Local server (port 3001, uses /dist) |
| `npm run server:dev` | Local server with hot-reload (node --watch) |
| `npm run relay` | Relay server (default port 4001) |
| `npm run relay:dev` | Relay server with hot-reload |

---

## Project Structure

```
VTT Coalizão/
│
├── host/                              # Server + relay + shared code
│   ├── server/                        # Local server (Express + WS, Phase 7A)
│   │   ├── index.js                   # Main server entry point
│   │   ├── sessionManager.js          # Code generation + IP detection
│   │   ├── masterHandlers.js          # WS message handlers for Master
│   │   ├── playerHandlers.js          # WS message handlers for Players
│   │   ├── serverLogger.js            # Persistent logging to logs/error/
│   │   └── autoSave.js               # Session auto-save heartbeat
│   ├── relay/                         # Stateless multi-room relay (Phase 7B)
│   │   ├── index.js                   # Relay entry point
│   │   ├── Procfile                   # Railway/Heroku deploy
│   │   ├── railway.json               # Railway config
│   │   └── render.yaml                # Render config
│   ├── shared/                        # Code shared by both Master & Player
│   │   ├── components/                # Modal, SearchBar, FilterBar, ConfirmDialog
│   │   ├── context/                   # ThemeContext, LanguageContext
│   │   ├── hooks/                     # useWebSocket.js (auto-reconnect, keepalive)
│   │   ├── utils/                     # diceRoller, combatUtils, errorLogger
│   │   ├── styles/                    # CSS Design System (4 files)
│   │   └── i18n/                      # UI translations (pt-br + en-us)
│   └── services/                      # database.js (Dexie), dataSeeder.js, campaignIO.js
│
├── user/
│   ├── master/                        # Master (GM) interface
│   │   ├── src/
│   │   │   ├── App.jsx                # Master app with tabs and providers
│   │   │   ├── pages/                 # Dashboard, Map, Characters, NPCs,
│   │   │   │                          # Bestiary, Abilities, Items, Campaign,
│   │   │   │                          # Domain, Server
│   │   │   ├── components/            # All master-only components
│   │   │   ├── context/               # CampaignContext, ServerContext
│   │   │   └── utils/                 # characterUtils, visionUtils
│   │   ├── access/                    # masterAuth.js, sessionGuard.jsx
│   │   └── memory/                    # temp/ (drafts, undo) + saves/ (exports)
│   │
│   └── player/                        # Player interface
│       ├── src/
│       │   ├── main.jsx               # Standalone player entry point
│       │   ├── pages/                 # PlayerLoginPage, PlayerDashboard
│       │   ├── components/            # PlayerMap, dice, combat (limited)
│       │   └── context/               # PlayerContext (stub)
│       ├── access/                    # playerAuth.js, codeValidator.js,
│       │                              # characterSelector.jsx
│       └── memory/                    # temp/ (cached WS data) + saves/ (notes)
│
├── src/                               # Legacy entry point (stubs → host/shared)
│   ├── main.jsx                       # Master entry point (seeds DB + mounts React)
│   ├── App.jsx                        # Hash router → MasterApp or PlayerApp
│   └── [stubs]                        # Re-exports to canonical files in host/user
│
├── database/                          # Pre-populated game data (I18N: pt-br + en-us)
│   └── infodata/                      # skills, items, creatures, NPCs, effects,
│                                      # modifications, ambients, biomes, classes,
│                                      # auras, species, heroes, elements, domains
│
├── logs/                              # Server error logs (daily .txt files)
│   └── error/                         # Auto-created by serverLogger
│
├── public/                            # PWA manifest + service worker
├── scripts/                           # migrate-imports.mjs (import audit)
│
├── index.html                         # Master entry HTML
├── player.html                        # Player entry HTML
├── vite.config.js                     # Multi-page build, aliases, code splitting
└── package.json                       # v8.0.0
```

---

## Coalizao System — Basic Rules

### Dice Used

The system uses **only D20 and D4**.

**D20 Classification:**

| Result | Classification | Color |
|-----------|---------------|-----|
| 20 | Critical | 🟢 Green |
| 13–19 | Good | 🟢 Light Green |
| 10–12 | Normal | 🟡 Yellow |
| 2–9 | Bad | 🔴 Light Red |
| 1 | Disaster | 🔴 Red |

### 8 Attributes

| Code | Name | Main Use |
|--------|------|--------------:|
| `VIT` | Vitality | HP, damage resistance |
| `DEX` | Dexterity | Dodge, movement, initiative |
| `CHA` | Charisma | Persuasion, social stealth |
| `STR` | Strength | Melee, wielding |
| `INT` | Intelligence | Investigation, logic, domain |
| `RES` | Resilience | Magic defense |
| `PRE` | Precision | Ranged, magic formation |
| `ENR` | Energy | Magic power |

**Bonus** = `⌊finalValue / 5⌋`  
**Final Value** = `basePoints × classMultiplier`

### Combat

| Type | Attack | Defense |
|------|--------|--------|
| Melee | 1d20 + STR bonus | 1d20 + STR bonus |
| Ranged | 1d20 + PRE bonus | 1d20 + DEX bonus |
| Magic | Formation PRE ≥ 12, then 1d20 + ENR | 1d20 + RES bonus |

**Damage:** 1d4 (applied to defender's HP if total attack > total defense)  
**Dodge/Evade:** 1d20 + DEX bonus > attack total (before applying damage)

### Evolution

- **Level 5** — Class Evolution: Focused (×+0.2 to primary mult.) | Balanced (+0.05 to all) | Legacy (+3 INT or CHA)
- **Level 10** — TransEvolution (requires base sum > 43): Ascendant | Transcendent | Descendant

### Command Points (Domain)

`CP = INT bonus + CHA bonus`

6 available actions (see Domain System in the Campaign tab).

---

## Deployment

### Frontend — GitHub Pages

1. Adjust `base` in `vite.config.js` to your repository's name:
   ```js
   base: '/your-repo-name/'
   ```
2. Build and deploy:
   ```bash
   npm run build
   # Deploy /dist to your gh-pages branch
   ```

### Relay Server — Railway / Render / Fly.io

See full instructions in [`host/relay/README.md`](host/relay/README.md).

Quick summary (Railway):
```bash
cd host/relay
# Create a Railway project, connect the repository
# Set the root directory to host/relay/
# The PORT variable is defined automatically
```

### Local Server — No Router Configuration

Use a peer-to-peer VPN:
- [ZeroTier](https://www.zerotier.com/) (recommended, free)
- [Tailscale](https://tailscale.com/) (free for personal use)
- [Hamachi](https://www.vpn.net/) (classic alternative)

---

*Build v8.0.0 · Phases 1–12 Complete · Architectural Transition Done · 2543 modules · 0 errors*

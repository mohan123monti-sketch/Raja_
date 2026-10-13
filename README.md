# 👑 Raja Rani Online — Royal Multiplayer Paper-Chit Game

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

> A production-quality, real-time online multiplayer platform based on the traditional South Indian **Raja Rani** paper-chit game. Built with Next.js 14, Node.js, Express, Socket.IO, Prisma ORM, and SQLite.

---

## 🏛️ Project Highlights

- **Traditional Heritage Gameplay**: Authentic recreation of the folded paper-chit game with Raja (King), Rani (Queen), Manthiri (Minister), Police, and Thirudan (Thief).
- **5, 6 & 7-Player Variants**: Configurable roles and points supporting Senapathi (Commander) and Prajai (Citizen) variants.
- **Server-Authoritative Game Engine**: Absolute role secrecy. Roles are assigned and concealed in server memory; only individual authorized player sockets receive their private chits. Zero client-side tampering.
- **Real-Time Multiplayer with Socket.IO**: Live room lobbies, ready states, royal card unfolding animations, King's proclamation, Police accusation phase, and round resolutions.
- **Persistent Teams & Guilds**: Permanent player guilds with unique invitation codes (`TMXXXX`).
- **Player Profiles & Unique Codes**: Automatic generation of unique alphanumeric player IDs (e.g., `RR7K9A2`).
- **Global Leaderboard & Match History**: Elo-style rating adjustments, match count, win rate, and total points accumulated.
- **Royal Visual Identity**: Immersive dark royal theme with royal blues, deep purples, gold accents, glassmorphic panels, and animated paper chits.

---

## 📂 Monorepo Architecture

```
raja-rani-online/
├── apps/
│   ├── web/                     # Next.js 14 frontend (App Router + Tailwind CSS)
│   └── server/                  # Node.js + Express backend (Socket.IO + Prisma)
├── packages/
│   └── shared/                  # Shared TypeScript types, Zod schemas, socket events
├── prisma/
│   ├── schema.prisma            # Normalized SQLite schema
│   └── seed.ts                  # Seed script with test players and demo team
├── docs/
│   ├── setup.md                 # Local development & setup guide
│   ├── architecture.md          # Technical design & state machine
│   └── deployment.md            # Production deployment & backup instructions
├── .env.example                 # Example environment variables
├── package.json                 # Monorepo workspaces definition
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Build Shared Package & Generate Database
```bash
npm run build --workspace=@raja-rani/shared
npx prisma db push --schema=./prisma/schema.prisma
npx tsx prisma/seed.ts
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend Server (Port 4000)
npm run dev:server

# Terminal 2: Next.js Frontend (Port 3000)
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) to enter the realm.

---

## 🧪 Automated Testing

All tests are verified and passing:

```bash
# Run all Vitest suites
npx vitest run

# Run specific suites
npx vitest run apps/server/test/gameEngine.test.ts  # Role secrecy & scoring
npx vitest run apps/server/test/api.test.ts         # Auth & Teams REST API
npx vitest run apps/server/test/socket_e2e.test.ts  # Multi-client 5-player live match
```

---

## 📜 Documentation
- [Setup & Development](file:///c:/Users/HP/Desktop/RAJA_RANI/docs/setup.md)
- [Architecture & Mechanics](file:///c:/Users/HP/Desktop/RAJA_RANI/docs/architecture.md)
- [Production Deployment & Backups](file:///c:/Users/HP/Desktop/RAJA_RANI/docs/deployment.md)

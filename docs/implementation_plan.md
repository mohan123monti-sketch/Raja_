# Implementation Plan — Raja Rani Online

## 1. Overview & Monorepo Architecture
We will build a high-performance, robust, and royal-themed real-time multiplayer application based on the traditional South Indian Raja Rani paper chit game.
The project will be structured as an npm workspaces monorepo:
- `packages/shared`: Shared TypeScript types, Zod schemas, game constants, role definitions, and socket events.
- `apps/server`: Node.js + Express + TypeScript + Socket.IO + Prisma + SQLite.
- `apps/web`: Next.js 14+ (App Router) + React + Tailwind CSS + Lucide icons + Socket.io-client.
- `prisma`: SQLite schema, migrations, seed script.
- `docs`: Architecture, setup, deployment, rules documentation.

## 2. Core Game Rules & Mechanics (Authoritative Server Engine)
Traditional paper chit game adapted for 5, 6, and 7 players:
- **5-Player Default**:
  - Raja (King): 1000 pts (Reveals role publicly immediately: "Who is my Minister?")
  - Rani (Queen): 900 pts
  - Manthiri (Minister): 800 pts (Revealed or designated, must guess the Thirudan)
  - Police: 700 pts (or in variant, Police guesses Thirudan; configurable!)
  - Thirudan (Thief): 0 pts (if caught) or gets Police/Minister points (if guessing fails)
- **Configurable Mode Engine**:
  - Configurable roles & point values:
    - 5 Players: Raja (1000), Rani (800), Manthiri/Police (700), Bhatta/Soldier (500), Thirudan (0)
    - 6 Players: Adds Senapathi (Commander: 600) or Joker (-100) or Kaval/Guard
    - 7 Players: Adds Prajai (Citizen: 300)
  - Turn Flow & Phases:
    1. Chits Distributed (Roles assigned randomly & secretly on server).
    2. Chit Reveal: Raja reveals himself automatically or manually.
    3. The Calling: King calls upon Police/Minister to find the Thief.
    4. Accusation / Guessing Phase: Police/Minister inspects active players and submits guess.
    5. Resolution Phase: If Police correctly identifies Thirudan -> Police keeps points, Thief gets 0. If Police guesses wrong -> Thief gets Police's points, Police gets 0!
    6. Multi-round scoring: Accumulate points across rounds until target score (e.g. 3000 pts or fixed rounds).
- Absolute role secrecy: Only the authorized user socket receives their role chit. Public socket payloads only contain masked player statuses.

## 3. Technology & Database Design
- Prisma ORM with SQLite file storage (`file:./dev.db`).
- Entities:
  - `User`, `Session`, `PasswordResetToken`
  - `Team`, `TeamMembership`
  - `GameRoom`, `GamePlayer`, `GameAction`, `MatchResult`, `PlayerStat`
- Passwords hashed with `bcryptjs`.
- HTTP-only signed/secure cookies for session auth.
- Socket.IO connection authenticated via session token.

## 4. Execution Phases
- **Phase 1**: Workspace setup, root package.json, npm workspaces, TypeScript configs.
- **Phase 2**: `packages/shared` - Types, DTOs, Zod schemas, game state machines, and socket contracts.
- **Phase 3**: Prisma SQLite schema, migrations, seed data.
- **Phase 4**: `apps/server` - Express app, authentication, teams, matchmaking, game engine, Socket.IO gateway, and automated tests (Vitest/Supertest).
- **Phase 5**: `apps/web` - Next.js frontend, royal aesthetic (rich golds, deep royals, royal cards/chits, animations), dashboard, lobby, game screen, leaderboards, profile, and teams.
- **Phase 6**: Verification, end-to-end multi-client game test, documentation, and operational guides.

# Architecture & Technical Design — Raja Rani Online

## 1. System Overview
Raja Rani Online is structured as an npm workspaces monorepo containing:
- `packages/shared`: Shared contracts, Zod schemas, game state machine definitions, and role specifications.
- `apps/server`: Authoritative Node.js + Express backend with Socket.IO gateway, Prisma ORM, and SQLite.
- `apps/web`: Next.js 14 App Router client with Tailwind CSS, royal theme tokens, and socket.io-client.

```
                           +---------------------------+
                           |  Next.js 14 Client (web)  |
                           +-------------+-------------+
                                         |
                   HTTP / REST (Cookies) | Socket.IO (WebSockets)
                                         |
                           +-------------v-------------+
                           | Node.js / Express Server  |
                           |   (Socket Gateway / API)  |
                           +-------------+-------------+
                                         |
                                         | In-Memory Engine & Prisma ORM
                                         |
                           +-------------v-------------+
                           |   SQLite Database (File)  |
                           +---------------------------+
```

## 2. Server-Authoritative Game Engine
- **Chit Secrecy**: Chits are shuffled and assigned strictly in server memory. Public state broadcasts (`room:state`) only expose non-secret fields (e.g. `revealedRole` is undefined for hidden chits). Secret chits are dispatched through private individual socket messages (`game:chit-assigned`).
- **State Machine**:
  `LOBBY` -> `CHIT_PICKING` -> `KING_REVEAL` -> `POLICE_GUESSING` -> `ROUND_RESULTS` -> `MATCH_FINISHED`
- **Validation**: All actions (King reveal, Police accusation) are checked against the caller's authorized player role and room state.

## 3. Database Schema
- **User**: Player identity with unique `playerCode` (e.g. `RR7K9A2`).
- **Session**: Secure 32-byte tokens with expiration.
- **PlayerStat**: Transactionally updated wins, losses, rating, and points.
- **Team & TeamMembership**: Permanent player guilds and invite codes.
- **GameRoom & GamePlayer**: Room metadata and player session records.
- **GameAction & MatchResult**: Audit log of gameplay actions and completed matches.

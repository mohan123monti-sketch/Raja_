# Setup & Local Development Guide — Raja Rani Online

## Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on v24)
- npm (v9+ or v10+)
- SQLite3 (handled natively by Prisma)

## Quick Start (Local Setup)

1. **Clone & Install Dependencies**
```bash
npm install
```

2. **Initialize Environment Variables**
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` is set to:
```env
DATABASE_URL="file:./prisma/dev.db"
PORT=4000
JWT_SECRET=super_secret_jwt_raja_rani_royal_key_2026
SESSION_SECRET=royal_raja_rani_session_secret_key_8719
CLIENT_URL=http://localhost:3000
```

3. **Build Shared Packages**
```bash
npm run build --workspace=@raja-rani/shared
```

4. **Initialize Database & Seed Data**
```bash
npx prisma db push --schema=./prisma/schema.prisma
npx tsx prisma/seed.ts
```

5. **Run Development Servers**
In terminal 1 (Backend API & Socket.IO Gateway on port 4000):
```bash
npm run dev:server
```

In terminal 2 (Next.js Frontend on port 3000):
```bash
npm run dev:web
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests
Run all unit, integration, and multiplayer socket E2E tests:
```bash
npx vitest run
```
Or run individually:
- Game Engine Unit Tests: `npx vitest run apps/server/test/gameEngine.test.ts`
- REST API Integration Tests: `npx vitest run apps/server/test/api.test.ts`
- Multiplayer Socket.IO E2E Flow: `npx vitest run apps/server/test/socket_e2e.test.ts`

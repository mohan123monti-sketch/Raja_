import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { Server } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { prisma } from "../src/db";
import { setupSocketGateway } from "../src/socket/gateway";
import { RoomManager } from "../src/game/RoomManager";
import { generateSessionToken } from "../src/utils/crypto";
import bcrypt from "bcryptjs";

describe("Socket.IO Multiplayer E2E Game Flow Test", () => {
  let ioServer: Server;
  let httpServer: any;
  let port: number;

  const users: Array<{ id: string; username: string; token: string; socket?: ClientSocket }> = [];

  beforeAll(async () => {
    // Spin up isolated test server
    httpServer = createServer();
    ioServer = new Server(httpServer);
    setupSocketGateway(ioServer as any);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });

    const passHash = await bcrypt.hash("pass123", 10);

    // Create 5 distinct players in SQLite
    for (let i = 1; i <= 5; i++) {
      const u = await prisma.user.upsert({
        where: { email: `e2e_player_${i}@rajaranionline.com` },
        update: {},
        create: {
          username: `E2EPlayer${i}`,
          email: `e2e_player_${i}@rajaranionline.com`,
          passwordHash: passHash,
          playerCode: `RRE2E0${i}`,
          avatar: "avatar_1",
        },
      });

      const token = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      await prisma.session.create({
        data: { userId: u.id, token, expiresAt },
      });

      users.push({ id: u.id, username: u.username, token });
    }
  });

  afterAll(async () => {
    users.forEach((u) => u.socket?.disconnect());
    ioServer.close();
    httpServer.close();
  });

  it("should connect 5 distinct clients, form room, ready up, and start round with private chits", async () => {
    // 1. Host creates room via RoomManager
    const roomManager = RoomManager.getInstance();
    const room = await roomManager.createRoom(
      { id: users[0].id, username: users[0].username, playerCode: "RRE2E01", avatar: "avatar_1" },
      { maxPlayers: 5, isPrivate: true, targetScore: 3000, roundsToPlay: 3 }
    );

    expect(room.roomCode).toBeDefined();

    // 2. Connect all 5 sockets with their respective session tokens
    for (const u of users) {
      u.socket = ioc(`http://localhost:${port}`, {
        auth: { token: u.token },
        transports: ["websocket"],
      });

      await new Promise<void>((resolve) => {
        u.socket!.on("connect", () => resolve());
      });
    }

    // 3. All 5 join the room
    const roomStates: any[] = [];
    users.forEach((u, idx) => {
      u.socket!.emit("room:join", room.roomCode);
      u.socket!.on("room:state", (state: any) => {
        roomStates[idx] = state;
      });
    });

    // Wait for all to join
    await new Promise((r) => setTimeout(r, 800));

    // 4. Players 2-5 mark ready
    for (let i = 1; i < 5; i++) {
      users[i].socket!.emit("room:toggle-ready");
    }

    await new Promise((r) => setTimeout(r, 600));

    // 5. Host starts game
    const chitsReceived: Record<string, any> = {};
    users.forEach((u) => {
      u.socket!.on("game:chit-assigned", (chit: any) => {
        chitsReceived[u.id] = chit;
      });
    });

    users[0].socket!.emit("room:start-game");

    await new Promise((r) => setTimeout(r, 1000));

    // Verify all 5 received their private chits
    expect(Object.keys(chitsReceived)).toHaveLength(5);

    // Verify roles distributed match 5-player role set
    const assignedRoles = Object.values(chitsReceived).map((c) => c.role);
    expect(assignedRoles).toContain("RAJA");
    expect(assignedRoles).toContain("POLICE");
    expect(assignedRoles).toContain("THIRUDAN");
    expect(assignedRoles).toContain("RANI");
    expect(assignedRoles).toContain("MANTHIRI");

    // 6. Identify King player and reveal
    const kingUserId = Object.keys(chitsReceived).find((uid) => chitsReceived[uid].role === "RAJA")!;
    const raniUserId = Object.keys(chitsReceived).find((uid) => chitsReceived[uid].role === "RANI")!;
    const thiefUserId = Object.keys(chitsReceived).find((uid) => chitsReceived[uid].role === "THIRUDAN")!;
    const kingSocket = users.find((u) => u.id === kingUserId)!.socket!;

    kingSocket.emit("game:reveal-king");
    await new Promise((r) => setTimeout(r, 600));

    // Test Card Swap: King guesses Thief instead of Rani!
    let cardSwapReceived: any = null;
    kingSocket.on("game:card-swapped", (swap: any) => {
      cardSwapReceived = swap;
    });

    kingSocket.emit("game:make-guess", thiefUserId);
    await new Promise((r) => setTimeout(r, 600));

    // Verify card swapped!
    expect(cardSwapReceived).toBeDefined();
    expect(cardSwapReceived.newRole).toBe("RAJA");

    // Thief is now the new Raja!
    const newKingUserId = thiefUserId;
    const newKingSocket = users.find((u) => u.id === newKingUserId)!.socket!;

    // New Raja now guesses Rani correctly!
    newKingSocket.emit("game:make-guess", raniUserId);
    await new Promise((r) => setTimeout(r, 600));

    // Rani is now the guesser looking for Manthiri!
    const manthiriUserId = Object.keys(chitsReceived).find((uid) => chitsReceived[uid].role === "MANTHIRI")!;
    const raniSocket = users.find((u) => u.id === raniUserId)!.socket!;
    raniSocket.emit("game:make-guess", manthiriUserId);
    await new Promise((r) => setTimeout(r, 600));

    // Manthiri guesses Police!
    const policeUserId = Object.keys(chitsReceived).find((uid) => chitsReceived[uid].role === "POLICE")!;
    const manthiriSocket = users.find((u) => u.id === manthiriUserId)!.socket!;
    manthiriSocket.emit("game:make-guess", policeUserId);
    await new Promise((r) => setTimeout(r, 600));

    // Police guesses former Raja (who now holds Thirudan chit after the swap!)
    let roundResultReceived: any = null;
    const policeSocket = users.find((u) => u.id === policeUserId)!.socket!;
    policeSocket.on("game:round-ended", (res: any) => {
      roundResultReceived = res;
    });

    policeSocket.emit("game:make-guess", kingUserId);
    await new Promise((r) => setTimeout(r, 1000));

    expect(roundResultReceived).toBeDefined();
    expect(roundResultReceived.isCorrect).toBe(true);
  }, 20000);
});

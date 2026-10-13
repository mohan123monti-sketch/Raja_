import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "../db";
import { RoomManager } from "../game/RoomManager";
import { GameEngine, ActivePlayerState } from "../game/GameEngine";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  DEFAULT_ROLE_CONFIGS,
} from "@raja-rani/shared";

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  user?: {
    id: string;
    username: string;
    playerCode: string;
    avatar: string;
  };
}

export function setupSocketGateway(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
  const roomManager = RoomManager.getInstance();

  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
        parseCookie(socket.handshake.headers.cookie || "")["session_token"];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              playerCode: true,
              avatar: true,
            },
          },
        },
      });

      if (!session || session.expiresAt < new Date()) {
        return next(new Error("Session expired or invalid"));
      }

      socket.user = session.user;
      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`[Socket] User connected: ${user.username} (${user.id})`);

    // Helper to send state to room and individual private chits
    const broadcastRoomUpdate = (roomCode: string) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      const publicView = GameEngine.getPublicRoomView(room);
      io.to(roomCode).emit("room:state", publicView);

      // Distribute private chits to individual connected sockets
      for (const player of room.players.values()) {
        if (player.socketId && player.assignedRole) {
          const chit = GameEngine.getPrivateChit(player);
          if (chit) {
            io.to(player.socketId).emit("game:chit-assigned", chit);
          }
        }
      }
    };

    // Client joins room
    socket.on("room:join", async (roomCode: string) => {
      try {
        const code = roomCode.toUpperCase();
        const room = await roomManager.joinRoom(code, user);

        const player = room.players.get(user.id);
        if (player) {
          player.socketId = socket.id;
          player.isConnected = true;
        }

        socket.join(code);
        broadcastRoomUpdate(code);
      } catch (err: any) {
        socket.emit("error:message", { code: "JOIN_FAILED", message: err.message || "Failed to join room" });
      }
    });

    // Toggle ready
    socket.on("room:toggle-ready", () => {
      const room = roomManager.getRoomForUser(user.id);
      if (!room || room.state !== "LOBBY") return;

      const player = room.players.get(user.id);
      if (player && !player.isHost) {
        player.isReady = !player.isReady;
        broadcastRoomUpdate(room.roomCode);
      }
    });

    // Host starts game
    socket.on("room:start-game", async () => {
      const room = roomManager.getRoomForUser(user.id);
      if (!room) {
        return socket.emit("error:message", { code: "NO_ROOM", message: "You are not in a room" });
      }

      if (room.hostId !== user.id) {
        return socket.emit("error:message", { code: "NOT_HOST", message: "Only the host can start the game" });
      }

      if (room.players.size < room.maxPlayers) {
        return socket.emit("error:message", {
          code: "NOT_ENOUGH_PLAYERS",
          message: `Need ${room.maxPlayers} players to start. Current: ${room.players.size}`,
        });
      }

      // Check all ready
      for (const p of room.players.values()) {
        if (!p.isHost && !p.isReady) {
          return socket.emit("error:message", {
            code: "PLAYERS_NOT_READY",
            message: "All players must be ready before starting",
          });
        }
      }

      // Start Round 1
      room.currentRound = 1;
      for (const p of room.players.values()) {
        p.score = 0;
      }

      GameEngine.startRound(room);

      // Persist state update in DB
      await prisma.gameRoom.update({
        where: { roomCode: room.roomCode },
        data: { status: "PLAYING" },
      }).catch(console.error);

      broadcastRoomUpdate(room.roomCode);
    });

    // Raja reveals role and initiates the chain to find Rani
    socket.on("game:reveal-king", () => {
      const room = roomManager.getRoomForUser(user.id);
      if (!room || room.state !== "CHIT_PICKING") return;

      if (room.kingPlayerId !== user.id) {
        return socket.emit("error:message", { code: "NOT_KING", message: "Only the Raja can reveal and start the search!" });
      }

      const kingPlayer = room.players.get(user.id);
      if (kingPlayer) {
        kingPlayer.revealedRole = "RAJA";
      }

      room.state = "GUESSING_PHASE";
      room.currentGuesserId = user.id;
      room.currentGuesserRole = "RAJA";
      room.currentTargetRole = "RANI";
      room.lastAnnouncement = `👑 Raja (${kingPlayer?.username}) has revealed himself! Raja must now guess who holds the Rani chit!`;

      broadcastRoomUpdate(room.roomCode);
    });

    // Hierarchical Guessing Handler (Raja -> Rani -> Manthiri -> Police -> Thief)
    const handleMakeGuess = async (suspectUserId: string) => {
      const room = roomManager.getRoomForUser(user.id);
      if (!room || (room.state !== "GUESSING_PHASE" && room.state !== "POLICE_GUESSING")) return;

      if (room.currentGuesserId !== user.id) {
        return socket.emit("error:message", { code: "NOT_YOUR_TURN", message: "It is not your turn to make a guess!" });
      }

      if (suspectUserId === user.id) {
        return socket.emit("error:message", { code: "INVALID_SUSPECT", message: "You cannot suspect yourself" });
      }

      if (room.confirmedRoleUsers?.has(suspectUserId)) {
        return socket.emit("error:message", { code: "INVALID_SUSPECT", message: "That player's identity is already confirmed!" });
      }

      try {
        const result = GameEngine.makeChainGuess(room, user.id, suspectUserId);

        // Record action in DB
        const dbRoom = await prisma.gameRoom.findUnique({ where: { roomCode: room.roomCode } });
        if (dbRoom) {
          await prisma.gameAction.create({
            data: {
              gameRoomId: dbRoom.id,
              playerId: user.id,
              actionType: result.swapped ? "CARD_SWAP" : "CORRECT_GUESS",
              payload: JSON.stringify({
                guesserUserId: user.id,
                suspectUserId,
                isCorrect: result.isCorrect,
                swapped: result.swapped,
                announcement: result.announcement,
              }),
              round: room.currentRound,
            },
          });
        }

        // If card was swapped, emit swap event
        if (result.swapped && result.swapData) {
          io.to(room.roomCode).emit("game:card-swapped", result.swapData);
        }

        // If round ended
        if (result.isRoundFinished && result.roundResult) {
          io.to(room.roomCode).emit("game:round-ended", result.roundResult);
        }

        broadcastRoomUpdate(room.roomCode);

        // If match finished
        if (result.isMatchFinished) {
          await finalizeMatch(room);
          io.to(room.roomCode).emit("game:match-finished", {
            winnerId: room.winnerPlayerId || "",
            finalScores: result.roundResult?.scores || {},
          });
        } else if (result.isRoundFinished) {
          // Schedule next round after review interval
          setTimeout(() => {
            if ((room.state as string) === "ROUND_RESULTS") {
              room.currentRound += 1;
              GameEngine.startRound(room);
              broadcastRoomUpdate(room.roomCode);
            }
          }, 7000);
        }
      } catch (err: any) {
        socket.emit("error:message", { code: "GUESS_FAILED", message: err.message });
      }
    };

    socket.on("game:make-guess", handleMakeGuess);
    socket.on("game:police-guess", handleMakeGuess);

    // Chat
    socket.on("room:send-chat", (message: string) => {
      const room = roomManager.getRoomForUser(user.id);
      if (!room || !message.trim()) return;

      io.to(room.roomCode).emit("room:chat", {
        userId: user.id,
        username: user.username,
        message: message.trim().slice(0, 150),
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    // Rematch
    socket.on("game:rematch-request", () => {
      const room = roomManager.getRoomForUser(user.id);
      if (!room || room.state !== "MATCH_FINISHED" || room.hostId !== user.id) return;

      room.state = "LOBBY";
      room.currentRound = 1;
      room.winnerPlayerId = undefined;
      room.roundScores = undefined;
      for (const p of room.players.values()) {
        p.score = 0;
        p.assignedRole = undefined;
        p.revealedRole = undefined;
        p.isReady = p.isHost;
      }
      broadcastRoomUpdate(room.roomCode);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${user.username}`);
      const room = roomManager.getRoomForUser(user.id);
      if (room) {
        const player = room.players.get(user.id);
        if (player) {
          player.isConnected = false;
        }

        // If in LOBBY, remove player
        if (room.state === "LOBBY") {
          roomManager.leaveRoom(user.id);
          broadcastRoomUpdate(room.roomCode);
        } else {
          // In active match, keep player state for reconnection
          broadcastRoomUpdate(room.roomCode);
        }
      }
    });
  });

  async function finalizeMatch(room: any) {
    try {
      const dbRoom = await prisma.gameRoom.findUnique({ where: { roomCode: room.roomCode } });
      if (!dbRoom) return;

      const finalScores: Record<string, number> = {};
      for (const p of room.players.values()) {
        finalScores[p.userId] = p.score;
      }

      await prisma.$transaction(async (tx) => {
        await tx.gameRoom.update({
          where: { id: dbRoom.id },
          data: { status: "FINISHED" },
        });

        await tx.matchResult.create({
          data: {
            gameRoomId: dbRoom.id,
            winnerId: room.winnerPlayerId || null,
            totalRounds: room.currentRound,
            finalScoreJson: JSON.stringify(finalScores),
          },
        });

        // Update player stats and ratings transactionally
        for (const p of room.players.values()) {
          const isWinner = p.userId === room.winnerPlayerId;
          const ratingChange = isWinner ? 25 : -10;

          await tx.playerStat.upsert({
            where: { userId: p.userId },
            update: {
              gamesPlayed: { increment: 1 },
              wins: { increment: isWinner ? 1 : 0 },
              losses: { increment: isWinner ? 0 : 1 },
              totalPoints: { increment: p.score },
              rating: { increment: ratingChange },
            },
            create: {
              userId: p.userId,
              gamesPlayed: 1,
              wins: isWinner ? 1 : 0,
              losses: isWinner ? 0 : 1,
              totalPoints: p.score,
              rating: 1200 + ratingChange,
            },
          });

          await tx.gamePlayer.updateMany({
            where: { gameRoomId: dbRoom.id, userId: p.userId },
            data: { score: p.score },
          });
        }
      });
    } catch (err) {
      console.error("Failed to finalize match:", err);
    }
  }
}

function parseCookie(cookieStr: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieStr) return list;
  cookieStr.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift()!.trim()] = decodeURI(parts.join("="));
  });
  return list;
}

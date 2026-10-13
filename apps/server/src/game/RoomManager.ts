import { ActiveRoomState, ActivePlayerState, GameEngine } from "./GameEngine";
import { prisma } from "../db";
import { generateRoomCode } from "../utils/crypto";

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, ActiveRoomState> = new Map(); // roomCode -> ActiveRoomState
  private userToRoom: Map<string, string> = new Map(); // userId -> roomCode

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public getRoom(roomCode: string): ActiveRoomState | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public getRoomForUser(userId: string): ActiveRoomState | undefined {
    const code = this.userToRoom.get(userId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  public async createRoom(
    hostUser: { id: string; username: string; playerCode: string; avatar: string },
    options: {
      maxPlayers?: number;
      isPrivate?: boolean;
      targetScore?: number;
      roundsToPlay?: number;
      teamId?: string;
    }
  ): Promise<ActiveRoomState> {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const maxPlayers = options.maxPlayers || 5;
    const isPrivate = options.isPrivate ?? false;
    const targetScore = options.targetScore || 3000;
    const roundsToPlay = options.roundsToPlay || 5;

    // Persist in DB
    const dbRoom = await prisma.gameRoom.create({
      data: {
        roomCode,
        hostId: hostUser.id,
        isPrivate,
        status: "LOBBY",
        maxPlayers,
        targetScore,
        roundsToPlay,
        teamId: options.teamId || null,
      },
    });

    const hostPlayer: ActivePlayerState = {
      userId: hostUser.id,
      playerCode: hostUser.playerCode,
      username: hostUser.username,
      avatar: hostUser.avatar,
      isHost: true,
      isReady: true,
      score: 0,
      isConnected: true,
    };

    const roomState: ActiveRoomState = {
      roomCode,
      isPrivate,
      maxPlayers,
      hostId: hostUser.id,
      state: "LOBBY",
      currentRound: 1,
      totalRounds: roundsToPlay,
      targetScore,
      players: new Map([[hostUser.id, hostPlayer]]),
    };

    this.rooms.set(roomCode, roomState);
    this.userToRoom.set(hostUser.id, roomCode);

    // Also persist host in GamePlayer
    await prisma.gamePlayer.upsert({
      where: {
        gameRoomId_userId: {
          gameRoomId: dbRoom.id,
          userId: hostUser.id,
        },
      },
      update: { isReady: true, status: "ACTIVE" },
      create: {
        gameRoomId: dbRoom.id,
        userId: hostUser.id,
        isReady: true,
        status: "ACTIVE",
      },
    });

    return roomState;
  }

  public async joinRoom(
    roomCode: string,
    user: { id: string; username: string; playerCode: string; avatar: string }
  ): Promise<ActiveRoomState> {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.state !== "LOBBY" && !room.players.has(user.id)) {
      throw new Error("Match has already started in this room");
    }

    if (!room.players.has(user.id) && room.players.size >= room.maxPlayers) {
      throw new Error("Room is already full");
    }

    const existingPlayer = room.players.get(user.id);
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      this.userToRoom.set(user.id, code);
      return room;
    }

    const newPlayer: ActivePlayerState = {
      userId: user.id,
      playerCode: user.playerCode,
      username: user.username,
      avatar: user.avatar,
      isHost: false,
      isReady: false,
      score: 0,
      isConnected: true,
    };

    room.players.set(user.id, newPlayer);
    this.userToRoom.set(user.id, code);

    // Save to DB
    const dbRoom = await prisma.gameRoom.findUnique({ where: { roomCode: code } });
    if (dbRoom) {
      await prisma.gamePlayer.upsert({
        where: {
          gameRoomId_userId: {
            gameRoomId: dbRoom.id,
            userId: user.id,
          },
        },
        update: { isReady: false, status: "ACTIVE" },
        create: {
          gameRoomId: dbRoom.id,
          userId: user.id,
          isReady: false,
          status: "ACTIVE",
        },
      });
    }

    return room;
  }

  public leaveRoom(userId: string): { roomCode: string; roomDeleted: boolean; newHostId?: string } | null {
    const code = this.userToRoom.get(userId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) {
      this.userToRoom.delete(userId);
      return null;
    }

    room.players.delete(userId);
    this.userToRoom.delete(userId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return { roomCode: code, roomDeleted: true };
    }

    // Reassign host if host left
    let newHostId: string | undefined;
    if (room.hostId === userId) {
      const firstRemaining = room.players.values().next().value as ActivePlayerState;
      if (firstRemaining) {
        room.hostId = firstRemaining.userId;
        firstRemaining.isHost = true;
        firstRemaining.isReady = true;
        newHostId = firstRemaining.userId;
      }
    }

    return { roomCode: code, roomDeleted: false, newHostId };
  }

  public listPublicRooms(): { roomCode: string; maxPlayers: number; currentPlayers: number; hostUsername: string }[] {
    const list: { roomCode: string; maxPlayers: number; currentPlayers: number; hostUsername: string }[] = [];
    for (const room of this.rooms.values()) {
      if (!room.isPrivate && room.state === "LOBBY") {
        const host = room.players.get(room.hostId);
        list.push({
          roomCode: room.roomCode,
          maxPlayers: room.maxPlayers,
          currentPlayers: room.players.size,
          hostUsername: host?.username || "Unknown",
        });
      }
    }
    return list;
  }
}

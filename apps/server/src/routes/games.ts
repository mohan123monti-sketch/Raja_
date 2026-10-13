import { Router, Response } from "express";
import { CreateRoomSchema, JoinRoomSchema } from "@raja-rani/shared";
import { RoomManager } from "../game/RoomManager";
import { MatchmakingQueue } from "../game/MatchmakingQueue";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();
const roomManager = RoomManager.getInstance();
const matchmaking = MatchmakingQueue.getInstance();

// POST /api/rooms (Create Room)
router.post("/rooms", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = CreateRoomSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: "Invalid room parameters", details: parseResult.error.errors });
    }

    const { maxPlayers, isPrivate, targetScore, roundsToPlay, teamId } = parseResult.data;

    const roomState = await roomManager.createRoom(
      {
        id: req.user!.id,
        username: req.user!.username,
        playerCode: req.user!.playerCode,
        avatar: req.user!.avatar,
      },
      { maxPlayers, isPrivate, targetScore, roundsToPlay, teamId }
    );

    return res.status(201).json({
      success: true,
      roomCode: roomState.roomCode,
      room: {
        roomCode: roomState.roomCode,
        maxPlayers: roomState.maxPlayers,
        isPrivate: roomState.isPrivate,
      },
    });
  } catch (error) {
    console.error("Create room error:", error);
    return res.status(500).json({ success: false, error: "Failed to create game room" });
  }
});

// GET /api/rooms (Browse Public Rooms)
router.get("/rooms", requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const list = roomManager.listPublicRooms();
    return res.json({ success: true, rooms: list });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch public rooms" });
  }
});

// GET /api/rooms/:roomCode (Get Room info)
router.get("/rooms/:roomCode", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomCode } = req.params;
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found or expired" });
    }

    return res.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        maxPlayers: room.maxPlayers,
        currentPlayers: room.players.size,
        isPrivate: room.isPrivate,
        state: room.state,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch room" });
  }
});

// POST /api/rooms/:roomCode/join
router.post("/rooms/:roomCode/join", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomCode } = req.params;
    const room = await roomManager.joinRoom(roomCode, {
      id: req.user!.id,
      username: req.user!.username,
      playerCode: req.user!.playerCode,
      avatar: req.user!.avatar,
    });

    return res.json({
      success: true,
      message: "Joined room successfully",
      roomCode: room.roomCode,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message || "Failed to join room" });
  }
});

// POST /api/rooms/:roomCode/leave
router.post("/rooms/:roomCode/leave", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    roomManager.leaveRoom(req.user!.id);
    return res.json({ success: true, message: "Left room" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to leave room" });
  }
});

// Matchmaking
router.post("/matchmaking/join", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const groupSize = Number(req.body.groupSize) || 5;
    if (![5, 6, 7].includes(groupSize)) {
      return res.status(400).json({ success: false, error: "Group size must be 5, 6, or 7" });
    }

    const result = matchmaking.enqueue(
      {
        id: req.user!.id,
        username: req.user!.username,
        playerCode: req.user!.playerCode,
        avatar: req.user!.avatar,
      },
      groupSize
    );

    const status = matchmaking.getQueueStatus(req.user!.id);

    return res.json({
      success: true,
      matched: result.matched,
      status,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Matchmaking error" });
  }
});

router.post("/matchmaking/cancel", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    matchmaking.dequeue(req.user!.id);
    return res.json({ success: true, message: "Removed from matchmaking queue" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to cancel matchmaking" });
  }
});

router.get("/matchmaking/status", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = matchmaking.getQueueStatus(req.user!.id);
    return res.json({ success: true, status });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to get queue status" });
  }
});

// Leaderboard
router.get("/leaderboard", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const topPlayers = await prisma.playerStat.findMany({
      take: 25,
      orderBy: [{ rating: "desc" }, { wins: "desc" }, { totalPoints: "desc" }],
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

    return res.json({
      success: true,
      leaderboard: topPlayers.map((stat, idx) => ({
        rank: idx + 1,
        userId: stat.user.id,
        username: stat.user.username,
        playerCode: stat.user.playerCode,
        avatar: stat.user.avatar,
        rating: stat.rating,
        wins: stat.wins,
        losses: stat.losses,
        totalPoints: stat.totalPoints,
        gamesPlayed: stat.gamesPlayed,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

// Match history
router.get("/matches/history", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await prisma.gamePlayer.findMany({
      where: { userId: req.user!.id },
      take: 20,
      orderBy: { joinedAt: "desc" },
      include: {
        gameRoom: {
          include: {
            matchResults: true,
            players: {
              include: {
                user: { select: { id: true, username: true, playerCode: true } },
              },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      history: history.map((h) => ({
        roomId: h.gameRoomId,
        roomCode: h.gameRoom.roomCode,
        playedAt: h.joinedAt,
        myScore: h.score,
        myRole: h.role,
        status: h.gameRoom.status,
        matchResult: h.gameRoom.matchResults[0] || null,
        players: h.gameRoom.players.map((p) => ({
          userId: p.userId,
          username: p.user.username,
          score: p.score,
          role: p.role,
        })),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to load match history" });
  }
});

export default router;

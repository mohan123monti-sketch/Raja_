import { RoomManager } from "./RoomManager";
import { ActiveRoomState } from "./GameEngine";

export interface QueueEntry {
  userId: string;
  username: string;
  playerCode: string;
  avatar: string;
  groupSize: number; // 5, 6, or 7
  enqueuedAt: number;
}

export class MatchmakingQueue {
  private static instance: MatchmakingQueue;
  // Map of groupSize -> list of waiting players
  private queues: Map<number, QueueEntry[]> = new Map([
    [5, []],
    [6, []],
    [7, []],
  ]);
  private userToSize: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): MatchmakingQueue {
    if (!MatchmakingQueue.instance) {
      MatchmakingQueue.instance = new MatchmakingQueue();
    }
    return MatchmakingQueue.instance;
  }

  public enqueue(
    user: { id: string; username: string; playerCode: string; avatar: string },
    groupSize: number
  ): { matched: boolean; room?: ActiveRoomState } {
    if (![5, 6, 7].includes(groupSize)) {
      throw new Error("Invalid group size for matchmaking. Allowed: 5, 6, 7");
    }

    // Check if already in queue or room
    this.dequeue(user.id);

    const queue = this.queues.get(groupSize)!;
    const entry: QueueEntry = {
      userId: user.id,
      username: user.username,
      playerCode: user.playerCode,
      avatar: user.avatar,
      groupSize,
      enqueuedAt: Date.now(),
    };

    queue.push(entry);
    this.userToSize.set(user.id, groupSize);

    // If queue reaches target size, form match immediately!
    if (queue.length >= groupSize) {
      const matchedPlayers = queue.splice(0, groupSize);
      matchedPlayers.forEach((p) => this.userToSize.delete(p.userId));

      const host = matchedPlayers[0];
      const roomManager = RoomManager.getInstance();

      // Create room synchronously
      // Host creates, others join
      // We will handle the async creation through an internal helper
      return {
        matched: true,
      };
    }

    return { matched: false };
  }

  public async popMatchedRoom(groupSize: number, matchedPlayers: QueueEntry[]): Promise<ActiveRoomState> {
    const host = matchedPlayers[0];
    const roomManager = RoomManager.getInstance();
    const room = await roomManager.createRoom(
      { id: host.userId, username: host.username, playerCode: host.playerCode, avatar: host.avatar },
      { maxPlayers: groupSize, isPrivate: false, targetScore: 3000, roundsToPlay: 5 }
    );

    for (let i = 1; i < matchedPlayers.length; i++) {
      const p = matchedPlayers[i];
      await roomManager.joinRoom(room.roomCode, {
        id: p.userId,
        username: p.username,
        playerCode: p.playerCode,
        avatar: p.avatar,
      });
      // Mark as ready
      const playerObj = room.players.get(p.userId);
      if (playerObj) playerObj.isReady = true;
    }

    return room;
  }

  public dequeue(userId: string): boolean {
    const size = this.userToSize.get(userId);
    if (!size) return false;

    const queue = this.queues.get(size);
    if (queue) {
      const idx = queue.findIndex((e) => e.userId === userId);
      if (idx !== -1) {
        queue.splice(idx, 1);
      }
    }
    this.userToSize.delete(userId);
    return true;
  }

  public getQueueStatus(userId: string): { inQueue: boolean; groupSize?: number; position?: number; totalInQueue?: number } {
    const size = this.userToSize.get(userId);
    if (!size) {
      return { inQueue: false };
    }
    const queue = this.queues.get(size) || [];
    const index = queue.findIndex((e) => e.userId === userId);
    return {
      inQueue: true,
      groupSize: size,
      position: index + 1,
      totalInQueue: queue.length,
    };
  }
}

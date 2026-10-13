import {
  GameRole,
  RoleConfig,
  DEFAULT_ROLE_CONFIGS,
  ROLES_BY_PLAYER_COUNT,
  GUESS_CHAIN_BY_PLAYER_COUNT,
  GameState,
  RoomStateView,
  PublicPlayerInfo,
  PrivateChitData,
} from "@raja-rani/shared";

export interface ActivePlayerState {
  userId: string;
  playerCode: string;
  username: string;
  avatar: string;
  socketId?: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  assignedRole?: GameRole;
  revealedRole?: GameRole;
  isConnected: boolean;
}

export interface ActiveRoomState {
  roomCode: string;
  isPrivate: boolean;
  maxPlayers: number;
  hostId: string;
  state: GameState;
  currentRound: number;
  totalRounds: number;
  targetScore: number;
  timeRemaining?: number;
  players: Map<string, ActivePlayerState>; // userId -> ActivePlayerState
  kingPlayerId?: string;
  policePlayerId?: string;
  suspectPlayerId?: string;
  lastGuessCorrect?: boolean;
  roundScores?: Record<string, { role: GameRole; roundPoints: number; totalScore: number }>;
  winnerPlayerId?: string;

  // Hierarchical Chain Flow
  chainStep?: number;
  currentGuesserId?: string;
  currentGuesserRole?: GameRole;
  currentTargetRole?: GameRole;
  confirmedRoleUsers?: Set<string>;
  lastAnnouncement?: string;
  lastSwap?: {
    player1Name: string;
    player2Name: string;
    newRole: GameRole;
    text: string;
  };
}

export class GameEngine {
  // Generates randomized chit roles for the given number of players
  public static distributeChits(playerCount: number): GameRole[] {
    const roles = ROLES_BY_PLAYER_COUNT[playerCount] || ROLES_BY_PLAYER_COUNT[5];
    const shuffled = [...roles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Returns masked public state safe to broadcast to any player in the room
  public static getPublicRoomView(room: ActiveRoomState): RoomStateView {
    const publicPlayers: PublicPlayerInfo[] = Array.from(room.players.values()).map((p) => {
      // In ROUND_RESULTS or MATCH_FINISHED, everyone's role can be shown
      const showAllRoles = room.state === "ROUND_RESULTS" || room.state === "MATCH_FINISHED";
      const revealedRole = showAllRoles ? p.assignedRole : p.revealedRole;

      return {
        userId: p.userId,
        playerCode: p.playerCode,
        username: p.username,
        avatar: p.avatar,
        isHost: p.isHost,
        isReady: p.isReady,
        score: p.score,
        revealedRole,
        isConnected: p.isConnected,
      };
    });

    return {
      roomCode: room.roomCode,
      isPrivate: room.isPrivate,
      maxPlayers: room.maxPlayers,
      hostId: room.hostId,
      state: room.state,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      targetScore: room.targetScore,
      timeRemaining: room.timeRemaining,
      players: publicPlayers,
      kingPlayerId: room.kingPlayerId,
      policePlayerId: room.policePlayerId,
      suspectPlayerId: room.suspectPlayerId,
      lastGuessCorrect: room.lastGuessCorrect,
      roundScores: room.roundScores,
      winnerPlayerId: room.winnerPlayerId,
      currentGuesserId: room.currentGuesserId,
      currentGuesserRole: room.currentGuesserRole,
      currentTargetRole: room.currentTargetRole,
      confirmedRoleUsers: room.confirmedRoleUsers ? Array.from(room.confirmedRoleUsers) : [],
      lastAnnouncement: room.lastAnnouncement,
      lastSwap: room.lastSwap,
    };
  }

  // Gets private chit for specific player (Strictly secret)
  public static getPrivateChit(player: ActivePlayerState): PrivateChitData | null {
    if (!player.assignedRole) return null;
    return {
      role: player.assignedRole,
      roleConfig: DEFAULT_ROLE_CONFIGS[player.assignedRole],
    };
  }

  // Starts a round: distributes chits, sets initial guesser to King
  public static startRound(room: ActiveRoomState): void {
    const playerArray = Array.from(room.players.values());
    const shuffledRoles = this.distributeChits(playerArray.length);

    room.state = "CHIT_PICKING";
    room.kingPlayerId = undefined;
    room.policePlayerId = undefined;
    room.suspectPlayerId = undefined;
    room.lastGuessCorrect = undefined;
    room.roundScores = undefined;
    room.chainStep = 0;
    room.confirmedRoleUsers = new Set<string>();
    room.lastSwap = undefined;

    playerArray.forEach((player, idx) => {
      const assignedRole = shuffledRoles[idx];
      player.assignedRole = assignedRole;
      player.revealedRole = undefined;

      if (assignedRole === "RAJA") {
        room.kingPlayerId = player.userId;
      }
      if (assignedRole === "POLICE") {
        room.policePlayerId = player.userId;
      }
    });

    const chain = GUESS_CHAIN_BY_PLAYER_COUNT[playerArray.length] || GUESS_CHAIN_BY_PLAYER_COUNT[5];
    room.currentGuesserRole = chain[0].guesserRole; // "RAJA"
    room.currentTargetRole = chain[0].targetRole;   // "RANI"
    room.currentGuesserId = room.kingPlayerId;
    room.lastAnnouncement = "Chits distributed! Waiting for Raja to reveal.";
  }

  // Hierarchical Chain Guessing with Card Swapping
  public static makeChainGuess(
    room: ActiveRoomState,
    guesserUserId: string,
    suspectUserId: string
  ): {
    isCorrect: boolean;
    swapped: boolean;
    announcement: string;
    swapData?: {
      player1Id: string;
      player1Name: string;
      player2Id: string;
      player2Name: string;
      newRole: GameRole;
      message: string;
    };
    isRoundFinished: boolean;
    isMatchFinished: boolean;
    roundResult?: {
      round: number;
      policeId: string;
      thiefId: string;
      suspectId: string;
      isCorrect: boolean;
      scores: Record<string, number>;
      roles: Record<string, GameRole>;
    };
  } {
    if (room.currentGuesserId !== guesserUserId) {
      throw new Error("It is not your turn to make a guess!");
    }
    if (guesserUserId === suspectUserId) {
      throw new Error("You cannot select yourself!");
    }
    if (room.confirmedRoleUsers?.has(suspectUserId)) {
      throw new Error("That player's identity is already confirmed!");
    }

    const guesser = room.players.get(guesserUserId);
    const suspect = room.players.get(suspectUserId);
    if (!guesser || !suspect) {
      throw new Error("Player not found in room");
    }

    const targetRole = room.currentTargetRole || "RANI";
    const guesserRole = room.currentGuesserRole || "RAJA";
    const isCorrect = suspect.assignedRole === targetRole;

    if (isCorrect) {
      // Correct Guess: Guesser earns points, target is confirmed
      const pts = DEFAULT_ROLE_CONFIGS[guesserRole].points;
      guesser.score += pts;
      suspect.revealedRole = targetRole;
      guesser.revealedRole = guesserRole;

      if (!room.confirmedRoleUsers) room.confirmedRoleUsers = new Set();
      // Guesser has successfully identified their target and secured their points
      room.confirmedRoleUsers.add(guesser.userId);
      // Suspect is the active next guesser and can still swap cards if they guess wrong, so do not lock them yet
      room.confirmedRoleUsers.delete(suspect.userId);

      room.lastSwap = undefined;

      // Advance Chain
      const chain = GUESS_CHAIN_BY_PLAYER_COUNT[room.players.size] || GUESS_CHAIN_BY_PLAYER_COUNT[5];
      room.chainStep = (room.chainStep || 0) + 1;

      if (room.chainStep < chain.length) {
        // Suspect becomes the next guesser
        const nextStep = chain[room.chainStep];
        room.currentGuesserId = suspect.userId;
        room.currentGuesserRole = nextStep.guesserRole;
        room.currentTargetRole = nextStep.targetRole;

        const announcement = `👑 ${guesser.username} correctly identified ${suspect.username} as ${DEFAULT_ROLE_CONFIGS[targetRole].name}! ${guesser.username} earns ${pts} pts! Now ${suspect.username} (${DEFAULT_ROLE_CONFIGS[nextStep.guesserRole].name}) must guess who is the ${DEFAULT_ROLE_CONFIGS[nextStep.targetRole].name}!`;
        room.lastAnnouncement = announcement;

        return {
          isCorrect: true,
          swapped: false,
          announcement,
          isRoundFinished: false,
          isMatchFinished: false,
        };
      } else {
        // Final character found (e.g. Police found Thief)!
        room.confirmedRoleUsers.add(suspect.userId);
        const announcement = `🎉 ${guesser.username} correctly caught the ${DEFAULT_ROLE_CONFIGS[targetRole].name} (${suspect.username})! Round complete!`;
        room.lastAnnouncement = announcement;

        const roundScores: Record<string, { role: GameRole; roundPoints: number; totalScore: number }> = {};
        const rolesMap: Record<string, GameRole> = {};
        const scoresMap: Record<string, number> = {};

        for (const p of room.players.values()) {
          const role = p.assignedRole!;
          rolesMap[p.userId] = role;
          scoresMap[p.userId] = p.score;
          const earned = (role !== "THIRUDAN" && room.confirmedRoleUsers.has(p.userId))
            ? DEFAULT_ROLE_CONFIGS[role].points
            : 0;
          roundScores[p.userId] = {
            role,
            roundPoints: earned,
            totalScore: p.score,
          };
        }

        room.roundScores = roundScores;
        room.state = "ROUND_RESULTS";

        const hasReachedTargetScore = Array.from(room.players.values()).some((p) => p.score >= room.targetScore);
        const hasCompletedAllRounds = room.currentRound >= room.totalRounds;
        let isMatchFinished = false;

        if (hasReachedTargetScore || hasCompletedAllRounds) {
          let maxScore = -1;
          let winnerId = "";
          for (const p of room.players.values()) {
            if (p.score > maxScore) {
              maxScore = p.score;
              winnerId = p.userId;
            }
          }
          room.winnerPlayerId = winnerId;
          room.state = "MATCH_FINISHED";
          isMatchFinished = true;
        }

        const thiefPlayer = Array.from(room.players.values()).find((p) => p.assignedRole === "THIRUDAN");

        return {
          isCorrect: true,
          swapped: false,
          announcement,
          isRoundFinished: true,
          isMatchFinished,
          roundResult: {
            round: room.currentRound,
            policeId: guesser.userId,
            thiefId: thiefPlayer?.userId || suspect.userId,
            suspectId: suspect.userId,
            isCorrect: true,
            scores: scoresMap,
            roles: rolesMap,
          },
        };
      }
    } else {
      // Wrong Guess: SWAP CARDS between Guesser and Suspect!
      const oldGuesserRole = guesser.assignedRole!;
      const oldSuspectRole = suspect.assignedRole!;

      guesser.assignedRole = oldSuspectRole;
      suspect.assignedRole = oldGuesserRole;

      // Both players are actively unconfirmed: guesser now has an unconfirmed role, suspect is active guesser
      room.confirmedRoleUsers?.delete(guesser.userId);
      room.confirmedRoleUsers?.delete(suspect.userId);

      // Suspect is revealed as the guesser role
      suspect.revealedRole = oldGuesserRole;
      guesser.revealedRole = undefined;

      if (oldGuesserRole === "RAJA") {
        room.kingPlayerId = suspect.userId;
      } else if (oldGuesserRole === "POLICE") {
        room.policePlayerId = suspect.userId;
      }

      // Suspect is now the guesser for the current target!
      room.currentGuesserId = suspect.userId;

      const swapMsg = `🔄 Wrong Guess! Cards swapped between ${guesser.username} and ${suspect.username}! ${suspect.username} is now the ${DEFAULT_ROLE_CONFIGS[oldGuesserRole].name}!`;
      room.lastAnnouncement = swapMsg;
      room.lastSwap = {
        player1Name: guesser.username,
        player2Name: suspect.username,
        newRole: oldGuesserRole,
        text: swapMsg,
      };

      return {
        isCorrect: false,
        swapped: true,
        announcement: swapMsg,
        swapData: {
          player1Id: guesser.userId,
          player1Name: guesser.username,
          player2Id: suspect.userId,
          player2Name: suspect.username,
          newRole: oldGuesserRole,
          message: swapMsg,
        },
        isRoundFinished: false,
        isMatchFinished: false,
      };
    }
  }

  // Resolves Police guess
  public static resolveGuess(
    room: ActiveRoomState,
    suspectUserId: string
  ): {
    policeId: string;
    thiefId: string;
    suspectId: string;
    isCorrect: boolean;
    scores: Record<string, number>;
    roles: Record<string, GameRole>;
    isMatchFinished: boolean;
    winnerId?: string;
  } {
    const suspectPlayer = room.players.get(suspectUserId);
    if (!suspectPlayer) {
      throw new Error("Suspect player not found in room");
    }

    const policePlayer = room.players.get(room.policePlayerId || "");
    if (!policePlayer) {
      throw new Error("Police player not found");
    }

    // Find thief
    let thiefPlayer: ActivePlayerState | undefined;
    for (const p of room.players.values()) {
      if (p.assignedRole === "THIRUDAN") {
        thiefPlayer = p;
        break;
      }
    }

    if (!thiefPlayer) {
      throw new Error("Thief not found in match state");
    }

    const isCorrect = suspectPlayer.userId === thiefPlayer.userId;
    room.suspectPlayerId = suspectUserId;
    room.lastGuessCorrect = isCorrect;

    // Calculate Round Points
    const roundScores: Record<string, { role: GameRole; roundPoints: number; totalScore: number }> = {};
    const rolesMap: Record<string, GameRole> = {};
    const scoresMap: Record<string, number> = {};

    const policePts = DEFAULT_ROLE_CONFIGS["POLICE"].points;

    for (const p of room.players.values()) {
      const role = p.assignedRole!;
      rolesMap[p.userId] = role;
      let roundPts = DEFAULT_ROLE_CONFIGS[role].points;

      if (role === "POLICE") {
        roundPts = isCorrect ? policePts : 0;
      } else if (role === "THIRUDAN") {
        roundPts = isCorrect ? 0 : policePts; // Stolen points!
      }

      p.score += roundPts;
      scoresMap[p.userId] = p.score;
      roundScores[p.userId] = {
        role,
        roundPoints: roundPts,
        totalScore: p.score,
      };
    }

    room.roundScores = roundScores;
    room.state = "ROUND_RESULTS";

    // Check match finish condition
    const hasReachedTargetScore = Array.from(room.players.values()).some((p) => p.score >= room.targetScore);
    const hasCompletedAllRounds = room.currentRound >= room.totalRounds;

    if (hasReachedTargetScore || hasCompletedAllRounds) {
      // Find highest score player
      let maxScore = -1;
      let winnerId = "";
      for (const p of room.players.values()) {
        if (p.score > maxScore) {
          maxScore = p.score;
          winnerId = p.userId;
        }
      }
      room.winnerPlayerId = winnerId;
      room.state = "MATCH_FINISHED";
    }

    return {
      policeId: policePlayer.userId,
      thiefId: thiefPlayer.userId,
      suspectId: suspectUserId,
      isCorrect,
      scores: scoresMap,
      roles: rolesMap,
      isMatchFinished: room.state === "MATCH_FINISHED",
      winnerId: room.winnerPlayerId,
    };
  }
}

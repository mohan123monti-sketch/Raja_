import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine, ActiveRoomState, ActivePlayerState } from "../src/game/GameEngine";
import { ROLES_BY_PLAYER_COUNT, DEFAULT_ROLE_CONFIGS } from "@raja-rani/shared";

describe("GameEngine - Unit Tests", () => {
  it("should distribute exactly the correct roles for 5, 6, and 7 players", () => {
    [5, 6, 7].forEach((count) => {
      const roles = GameEngine.distributeChits(count);
      expect(roles).toHaveLength(count);
      expect(roles).toContain("RAJA");
      expect(roles).toContain("POLICE");
      expect(roles).toContain("THIRUDAN");
      expect(roles.sort()).toEqual([...ROLES_BY_PLAYER_COUNT[count]].sort());
    });
  });

  it("should ensure role secrecy in public room view", () => {
    const playersMap = new Map<string, ActivePlayerState>();
    const playerIds = ["u1", "u2", "u3", "u4", "u5"];
    playerIds.forEach((id, idx) => {
      playersMap.set(id, {
        userId: id,
        playerCode: `CODE_${idx}`,
        username: `Player_${idx}`,
        avatar: "avatar_1",
        isHost: idx === 0,
        isReady: true,
        score: 0,
        assignedRole: ROLES_BY_PLAYER_COUNT[5][idx],
        isConnected: true,
      });
    });

    const room: ActiveRoomState = {
      roomCode: "TEST55",
      isPrivate: false,
      maxPlayers: 5,
      hostId: "u1",
      state: "CHIT_PICKING",
      currentRound: 1,
      totalRounds: 5,
      targetScore: 3000,
      players: playersMap,
    };

    const publicView = GameEngine.getPublicRoomView(room);
    // Secret roles must NEVER be exposed during active playing phase!
    publicView.players.forEach((p) => {
      expect(p.revealedRole).toBeUndefined();
    });

    // But private chit for player 0 must be accessible
    const chit0 = GameEngine.getPrivateChit(playersMap.get("u1")!);
    expect(chit0?.role).toBe(ROLES_BY_PLAYER_COUNT[5][0]);
  });

  it("should calculate correct points when Police guesses Thief correctly", () => {
    const playersMap = new Map<string, ActivePlayerState>();
    const roles = ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"] as const;

    roles.forEach((r, idx) => {
      playersMap.set(`u_${r}`, {
        userId: `u_${r}`,
        playerCode: `P${idx}`,
        username: `User_${r}`,
        avatar: "avatar_1",
        isHost: idx === 0,
        isReady: true,
        score: 0,
        assignedRole: r,
        isConnected: true,
      });
    });

    const room: ActiveRoomState = {
      roomCode: "WINPOL",
      isPrivate: false,
      maxPlayers: 5,
      hostId: "u_RAJA",
      state: "POLICE_GUESSING",
      currentRound: 1,
      totalRounds: 5,
      targetScore: 3000,
      players: playersMap,
      policePlayerId: "u_POLICE",
      kingPlayerId: "u_RAJA",
    };

    // Police correctly guesses Thief
    const result = GameEngine.resolveGuess(room, "u_THIRUDAN");
    expect(result.isCorrect).toBe(true);

    // Police keeps points (500), Thief gets 0
    expect(room.players.get("u_POLICE")?.score).toBe(DEFAULT_ROLE_CONFIGS["POLICE"].points);
    expect(room.players.get("u_THIRUDAN")?.score).toBe(0);
    // King gets 1000
    expect(room.players.get("u_RAJA")?.score).toBe(1000);
  });

  it("should give Thief the Police points when Police guesses wrongly", () => {
    const playersMap = new Map<string, ActivePlayerState>();
    const roles = ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"] as const;

    roles.forEach((r, idx) => {
      playersMap.set(`u_${r}`, {
        userId: `u_${r}`,
        playerCode: `P${idx}`,
        username: `User_${r}`,
        avatar: "avatar_1",
        isHost: idx === 0,
        isReady: true,
        score: 0,
        assignedRole: r,
        isConnected: true,
      });
    });

    const room: ActiveRoomState = {
      roomCode: "WINTHF",
      isPrivate: false,
      maxPlayers: 5,
      hostId: "u_RAJA",
      state: "POLICE_GUESSING",
      currentRound: 1,
      totalRounds: 5,
      targetScore: 3000,
      players: playersMap,
      policePlayerId: "u_POLICE",
      kingPlayerId: "u_RAJA",
    };

    // Police wrongly suspects Rani
    const result = GameEngine.resolveGuess(room, "u_RANI");
    expect(result.isCorrect).toBe(false);

    // Police gets 0, Thief gets Police's points!
    expect(room.players.get("u_POLICE")?.score).toBe(0);
    expect(room.players.get("u_THIRUDAN")?.score).toBe(DEFAULT_ROLE_CONFIGS["POLICE"].points);
  });

  it("should SWAP cards between Raja and chosen person when Raja guess is wrong", () => {
    const playersMap = new Map<string, ActivePlayerState>();
    const roles = ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"] as const;

    roles.forEach((r, idx) => {
      playersMap.set(`u_${r}`, {
        userId: `u_${r}`,
        playerCode: `P${idx}`,
        username: `User_${r}`,
        avatar: "avatar_1",
        isHost: idx === 0,
        isReady: true,
        score: 0,
        assignedRole: r,
        isConnected: true,
      });
    });

    const room: ActiveRoomState = {
      roomCode: "SWAPTST",
      isPrivate: false,
      maxPlayers: 5,
      hostId: "u_RAJA",
      state: "GUESSING_PHASE",
      currentRound: 1,
      totalRounds: 5,
      targetScore: 3000,
      players: playersMap,
      chainStep: 0,
      currentGuesserId: "u_RAJA",
      currentGuesserRole: "RAJA",
      currentTargetRole: "RANI",
      confirmedRoleUsers: new Set(),
    };

    // Raja wrongly guesses u_THIRUDAN as Rani!
    const guessResult = GameEngine.makeChainGuess(room, "u_RAJA", "u_THIRUDAN");

    expect(guessResult.isCorrect).toBe(false);
    expect(guessResult.swapped).toBe(true);
    expect(guessResult.announcement).toContain("Cards swapped");
    expect(guessResult.swapData?.newRole).toBe("RAJA");

    // u_THIRUDAN is now RAJA!
    expect(room.players.get("u_THIRUDAN")?.assignedRole).toBe("RAJA");
    expect(room.players.get("u_THIRUDAN")?.revealedRole).toBe("RAJA");
    // Former Raja now has THIRUDAN card!
    expect(room.players.get("u_RAJA")?.assignedRole).toBe("THIRUDAN");

    // The new guesser is now u_THIRUDAN (the new Raja)!
    expect(room.currentGuesserId).toBe("u_THIRUDAN");
    expect(room.currentTargetRole).toBe("RANI");
  });

  it("should grant points to Raja and advance turn to Rani when guess is correct", () => {
    const playersMap = new Map<string, ActivePlayerState>();
    const roles = ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"] as const;

    roles.forEach((r, idx) => {
      playersMap.set(`u_${r}`, {
        userId: `u_${r}`,
        playerCode: `P${idx}`,
        username: `User_${r}`,
        avatar: "avatar_1",
        isHost: idx === 0,
        isReady: true,
        score: 0,
        assignedRole: r,
        isConnected: true,
      });
    });

    const room: ActiveRoomState = {
      roomCode: "CORRECT",
      isPrivate: false,
      maxPlayers: 5,
      hostId: "u_RAJA",
      state: "GUESSING_PHASE",
      currentRound: 1,
      totalRounds: 5,
      targetScore: 3000,
      players: playersMap,
      chainStep: 0,
      currentGuesserId: "u_RAJA",
      currentGuesserRole: "RAJA",
      currentTargetRole: "RANI",
      confirmedRoleUsers: new Set(),
    };

    // Raja correctly guesses u_RANI
    const guessResult = GameEngine.makeChainGuess(room, "u_RAJA", "u_RANI");

    expect(guessResult.isCorrect).toBe(true);
    expect(guessResult.swapped).toBe(false);
    // Raja earns 1,000 points!
    expect(room.players.get("u_RAJA")?.score).toBe(1000);
    // Raja is confirmed!
    expect(room.players.get("u_RANI")?.revealedRole).toBe("RANI");
    expect(room.confirmedRoleUsers?.has("u_RAJA")).toBe(true);
    // Rani is active guesser, not locked in confirmedRoleUsers yet
    expect(room.confirmedRoleUsers?.has("u_RANI")).toBe(false);

    // Turn advances to Rani guessing Manthiri!
    expect(room.currentGuesserId).toBe("u_RANI");
    expect(room.currentGuesserRole).toBe("RANI");
    expect(room.currentTargetRole).toBe("MANTHIRI");
  });
});

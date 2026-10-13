import { describe, it, expect } from "vitest";
import { GameEngine, ActiveRoomState, ActivePlayerState } from "../src/game/GameEngine";

describe("Exact User Scenario Test", () => {
  it("should allow Police to guess Thirudan even after intermediate swaps", () => {
    const playersMap = new Map<string, ActivePlayerState>();
    const roles = ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"] as const;
    const names = ["Loki", "Mohanaprasad", "Gopi", "Lokesh", "mohan"];
    // Initial assignment:
    // Loki: RAJA
    // Mohanaprasad: RANI
    // Gopi: MANTHIRI
    // Lokesh: POLICE
    // mohan: THIRUDAN
    const initialRoles = ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"] as const;

    names.forEach((name, idx) => {
      playersMap.set(name, {
        userId: name,
        playerCode: `P${idx}`,
        username: name,
        avatar: "avatar_1",
        isHost: idx === 0,
        isReady: true,
        score: 0,
        assignedRole: initialRoles[idx],
        isConnected: true,
      });
    });

    const room: ActiveRoomState = {
      roomCode: "TESTRO",
      isPrivate: false,
      maxPlayers: 5,
      hostId: "Loki",
      state: "GUESSING_PHASE",
      currentRound: 1,
      totalRounds: 5,
      targetScore: 3000,
      players: playersMap,
      chainStep: 0,
      currentGuesserId: "Loki",
      currentGuesserRole: "RAJA",
      currentTargetRole: "RANI",
      confirmedRoleUsers: new Set(),
    };

    // Step 1: Loki (RAJA) correctly guesses Mohanaprasad (RANI)
    const r1 = GameEngine.makeChainGuess(room, "Loki", "Mohanaprasad");
    expect(r1.isCorrect).toBe(true);

    // Step 2: Mohanaprasad (RANI) correctly guesses Gopi (MANTHIRI)
    const r2 = GameEngine.makeChainGuess(room, "Mohanaprasad", "Gopi");
    expect(r2.isCorrect).toBe(true);

    // Step 3: Gopi (MANTHIRI) guesses mohan as Police -> WRONG! mohan has THIRUDAN!
    // Gopi and mohan swap cards!
    const r3 = GameEngine.makeChainGuess(room, "Gopi", "mohan");
    expect(r3.isCorrect).toBe(false);
    expect(r3.swapped).toBe(true);
    // mohan is now MANTHIRI, Gopi is now THIRUDAN!
    expect(room.players.get("mohan")?.assignedRole).toBe("MANTHIRI");
    expect(room.players.get("Gopi")?.assignedRole).toBe("THIRUDAN");

    // Step 4: mohan (now MANTHIRI) correctly guesses Lokesh (POLICE)
    const r4 = GameEngine.makeChainGuess(room, "mohan", "Lokesh");
    expect(r4.isCorrect).toBe(true);

    // Step 5: Lokesh (POLICE) guesses Gopi (THIRUDAN)
    console.log("Confirmed role users before Step 5:", Array.from(room.confirmedRoleUsers || []));
    console.log("Is Gopi in confirmedRoleUsers?", room.confirmedRoleUsers?.has("Gopi"));

    // This should NOT throw "That player's identity is already confirmed!"
    const r5 = GameEngine.makeChainGuess(room, "Lokesh", "Gopi");
    expect(r5.isCorrect).toBe(true);
    expect(r5.isRoundFinished).toBe(true);
  });
});

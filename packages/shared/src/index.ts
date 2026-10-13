import { z } from "zod";

// Roles definition
export type GameRole =
  | "RAJA"
  | "RANI"
  | "MANTHIRI"
  | "POLICE"
  | "THIRUDAN"
  | "SENAPATHI"
  | "PRAJAI";

export interface RoleConfig {
  id: GameRole;
  name: string;
  points: number;
  description: string;
  mustReveal: boolean; // Raja must reveal
  isDetective: boolean; // Police or Manthiri guesses
  isTarget: boolean; // Thirudan is target
}

export const DEFAULT_ROLE_CONFIGS: Record<GameRole, RoleConfig> = {
  RAJA: {
    id: "RAJA",
    name: "Raja (King)",
    points: 1000,
    description: "The King. Reveals himself and commands the Police to find the thief.",
    mustReveal: true,
    isDetective: false,
    isTarget: false,
  },
  RANI: {
    id: "RANI",
    name: "Rani (Queen)",
    points: 800,
    description: "The Queen. Safe noble status.",
    mustReveal: false,
    isDetective: false,
    isTarget: false,
  },
  MANTHIRI: {
    id: "MANTHIRI",
    name: "Manthiri (Minister)",
    points: 700,
    description: "The Royal Minister. Wise advisor.",
    mustReveal: false,
    isDetective: false,
    isTarget: false,
  },
  POLICE: {
    id: "POLICE",
    name: "Police (Officer)",
    points: 500,
    description: "The Lawkeeper. Must identify the Thirudan (Thief). If correct, keeps points. If wrong, thief steals points!",
    mustReveal: false,
    isDetective: true,
    isTarget: false,
  },
  THIRUDAN: {
    id: "THIRUDAN",
    name: "Thirudan (Thief)",
    points: 0,
    description: "The Thief. Must hide identity. Wins Police's points if Police fails to identify him!",
    mustReveal: false,
    isDetective: false,
    isTarget: true,
  },
  SENAPATHI: {
    id: "SENAPATHI",
    name: "Senapathi (Commander)",
    points: 400,
    description: "The Army General. Included in 6 & 7-player games.",
    mustReveal: false,
    isDetective: false,
    isTarget: false,
  },
  PRAJAI: {
    id: "PRAJAI",
    name: "Prajai (Citizen)",
    points: 300,
    description: "The loyal Citizen. Included in 7-player games.",
    mustReveal: false,
    isDetective: false,
    isTarget: false,
  },
};

export const ROLES_BY_PLAYER_COUNT: Record<number, GameRole[]> = {
  5: ["RAJA", "RANI", "MANTHIRI", "POLICE", "THIRUDAN"],
  6: ["RAJA", "RANI", "MANTHIRI", "POLICE", "SENAPATHI", "THIRUDAN"],
  7: ["RAJA", "RANI", "MANTHIRI", "POLICE", "SENAPATHI", "PRAJAI", "THIRUDAN"],
};

export interface ChainStep {
  guesserRole: GameRole;
  targetRole: GameRole;
}

export const GUESS_CHAIN_BY_PLAYER_COUNT: Record<number, ChainStep[]> = {
  5: [
    { guesserRole: "RAJA", targetRole: "RANI" },
    { guesserRole: "RANI", targetRole: "MANTHIRI" },
    { guesserRole: "MANTHIRI", targetRole: "POLICE" },
    { guesserRole: "POLICE", targetRole: "THIRUDAN" },
  ],
  6: [
    { guesserRole: "RAJA", targetRole: "RANI" },
    { guesserRole: "RANI", targetRole: "MANTHIRI" },
    { guesserRole: "MANTHIRI", targetRole: "SENAPATHI" },
    { guesserRole: "SENAPATHI", targetRole: "POLICE" },
    { guesserRole: "POLICE", targetRole: "THIRUDAN" },
  ],
  7: [
    { guesserRole: "RAJA", targetRole: "RANI" },
    { guesserRole: "RANI", targetRole: "MANTHIRI" },
    { guesserRole: "MANTHIRI", targetRole: "SENAPATHI" },
    { guesserRole: "SENAPATHI", targetRole: "PRAJAI" },
    { guesserRole: "PRAJAI", targetRole: "POLICE" },
    { guesserRole: "POLICE", targetRole: "THIRUDAN" },
  ],
};

export type GameState =
  | "LOBBY"
  | "STARTING"
  | "CHIT_PICKING" // Chits generated, players receive chits
  | "KING_REVEAL" // King revealed
  | "POLICE_GUESSING" // Legacy Police guessing
  | "GUESSING_PHASE" // Hierarchical Chain: Raja -> Rani -> Manthiri -> Police -> Thief
  | "ROUND_RESULTS" // Scores shown for the round
  | "MATCH_FINISHED";

export interface GameSettings {
  maxPlayers: number; // 5, 6, or 7
  targetScore: number; // e.g. 3000
  roundsToPlay: number; // e.g. 5
  timePerTurnSeconds: number; // e.g. 30
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 5,
  targetScore: 3000,
  roundsToPlay: 5,
  timePerTurnSeconds: 30,
};

// User & Auth Schemas
export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  avatar: z.string().url().or(z.string().regex(/^avatar_[1-9]$/)).optional(),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

// Teams Schemas
export const CreateTeamSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().max(200).optional(),
  avatar: z.string().optional(),
});

export const JoinTeamByCodeSchema = z.object({
  inviteCode: z.string().min(4).max(10),
});

// Rooms Schemas
export const CreateRoomSchema = z.object({
  maxPlayers: z.number().int().min(5).max(7).default(5),
  isPrivate: z.boolean().default(false),
  targetScore: z.number().int().min(1000).max(10000).default(3000),
  roundsToPlay: z.number().int().min(1).max(20).default(5),
  teamId: z.string().optional(),
});

export const JoinRoomSchema = z.object({
  roomCode: z.string().min(4).max(10),
});

// Public Game Player info (Safe for all clients)
export interface PublicPlayerInfo {
  userId: string;
  playerCode: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  revealedRole?: GameRole; // Only revealed when allowed (King in KING_REVEAL, or everyone in ROUND_RESULTS)
  isConnected: boolean;
}

// Room View state sent to clients
export interface RoomStateView {
  roomCode: string;
  isPrivate: boolean;
  maxPlayers: number;
  hostId: string;
  state: GameState;
  currentRound: number;
  totalRounds: number;
  targetScore: number;
  timeRemaining?: number;
  players: PublicPlayerInfo[];
  kingPlayerId?: string;
  policePlayerId?: string;
  suspectPlayerId?: string;
  lastGuessCorrect?: boolean;
  roundScores?: Record<string, { role: GameRole; roundPoints: number; totalScore: number }>;
  winnerPlayerId?: string;

  // Hierarchical Chain Flow
  currentGuesserId?: string;
  currentGuesserRole?: GameRole;
  currentTargetRole?: GameRole;
  confirmedRoleUsers?: string[];
  lastAnnouncement?: string;
  lastSwap?: {
    player1Name: string;
    player2Name: string;
    newRole: GameRole;
    text: string;
  };
}

// Private Player Chit - only sent securely to the specific player!
export interface PrivateChitData {
  role: GameRole;
  roleConfig: RoleConfig;
}

// Socket Events Definition
export interface ServerToClientEvents {
  "room:state": (state: RoomStateView) => void;
  "room:player-joined": (player: PublicPlayerInfo) => void;
  "room:player-left": (userId: string) => void;
  "room:chat": (data: { userId: string; username: string; message: string; timestamp: string }) => void;
  "game:chit-assigned": (chit: PrivateChitData) => void;
  "game:police-called": (data: { policeId: string; message: string }) => void;
  "game:card-swapped": (data: {
    player1Id: string;
    player1Name: string;
    player2Id: string;
    player2Name: string;
    newRole: GameRole;
    message: string;
  }) => void;
  "game:round-ended": (result: {
    round: number;
    policeId: string;
    thiefId: string;
    suspectId: string;
    isCorrect: boolean;
    scores: Record<string, number>;
    roles: Record<string, GameRole>;
  }) => void;
  "game:match-finished": (data: { winnerId: string; finalScores: Record<string, number> }) => void;
  "error:message": (error: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (roomCode: string) => void;
  "room:leave": () => void;
  "room:toggle-ready": () => void;
  "room:start-game": () => void;
  "game:reveal-king": () => void;
  "game:police-guess": (suspectUserId: string) => void;
  "game:make-guess": (suspectUserId: string) => void;
  "room:send-chat": (message: string) => void;
  "game:rematch-request": () => void;
}

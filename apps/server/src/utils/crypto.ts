import crypto from "crypto";

export function generatePlayerCode(): string {
  // e.g. RR7K9A2
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RR";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateRoomCode(): string {
  // e.g. RAJA42, 6 uppercase chars
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateTeamInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TM";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

"use client";

import React, { useState } from "react";
import { PublicPlayerInfo, GameRole, DEFAULT_ROLE_CONFIGS } from "@raja-rani/shared";
import { Shield, Sparkles, Target, Crown, Award } from "lucide-react";

interface RoyalCourt3DProps {
  players: PublicPlayerInfo[];
  currentGuesserId?: string;
  currentTargetRole?: GameRole;
  confirmedRoleUsers?: string[];
  myUserId?: string;
  isMyTurnToGuess: boolean;
  onSelectSuspect: (suspectId: string) => void;
}

export function RoyalCourt3D({
  players,
  currentGuesserId,
  currentTargetRole,
  confirmedRoleUsers = [],
  myUserId,
  isMyTurnToGuess,
  onSelectSuspect,
}: RoyalCourt3DProps) {
  const [hoveredSuspectId, setHoveredSuspectId] = useState<string | null>(null);

  const guesserPlayer = players.find((p) => p.userId === currentGuesserId);
  const targetName = currentTargetRole ? DEFAULT_ROLE_CONFIGS[currentTargetRole].name : "Suspect";

  return (
    <div className="relative p-6 rounded-3xl royal-glass border border-amber-500/30 overflow-hidden select-none">
      {/* Court Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-royal text-lg font-bold text-amber-300 leading-tight">
              The Royal Court
            </h3>
            <span className="text-[10px] tracking-wider text-slate-400 uppercase">
              Throne Room Council • 3D Arena
            </span>
          </div>
        </div>

        {/* Turn Status Banner */}
        {isMyTurnToGuess ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/25 border-2 border-amber-400 text-amber-200 text-xs font-black animate-pulse shadow-lg shadow-amber-500/20">
            <Target className="w-4 h-4 text-amber-300" />
            <span>YOUR TURN! Accuse who has {targetName}!</span>
          </div>
        ) : currentGuesserId ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{guesserPlayer?.username} is interrogating the court...</span>
          </div>
        ) : null}
      </div>

      {/* 3D Round-Table Pedestal Arena */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 lg:gap-5 perspective-1500 py-3 relative z-10">
        {players.map((p) => {
          const isSelf = p.userId === myUserId;
          const isGuesser = p.userId === currentGuesserId;
          const isConfirmed =
            confirmedRoleUsers.includes(p.userId) ||
            (p.revealedRole && p.userId !== currentGuesserId);
          const canGuess = isMyTurnToGuess && !isSelf && !isConfirmed;
          const isTargeted = hoveredSuspectId === p.userId && canGuess;

          return (
            <div
              key={p.userId}
              onMouseEnter={() => canGuess && setHoveredSuspectId(p.userId)}
              onMouseLeave={() => setHoveredSuspectId(null)}
              onClick={() => canGuess && onSelectSuspect(p.userId)}
              style={{
                transform: isGuesser
                  ? "translateY(-8px) translateZ(30px) scale(1.05)"
                  : isTargeted
                  ? "translateY(-6px) translateZ(25px) scale(1.04)"
                  : "translateY(0) translateZ(0)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              className={`relative rounded-2xl p-4 flex flex-col items-center gap-2.5 transition-all preserve-3d ${
                isGuesser
                  ? "bg-gradient-to-b from-amber-500/25 to-indigo-950/90 border-2 border-amber-400 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400/50"
                  : isTargeted
                  ? "bg-amber-500/20 border-2 border-amber-400 shadow-xl shadow-amber-500/30 cursor-pointer"
                  : canGuess
                  ? "bg-amber-500/10 hover:bg-amber-500/20 border-2 border-dashed border-amber-400/70 hover:border-amber-400 cursor-pointer shadow-md"
                  : p.revealedRole
                  ? "bg-indigo-950/60 border border-amber-500/40 opacity-90"
                  : "bg-slate-900/50 border border-slate-800 opacity-80"
              }`}
            >
              {/* Active Guesser Royal Spotlight */}
              {isGuesser && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-indigo-950 font-black text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> Turn Guesser
                </div>
              )}

              {/* Pedestal Top Avatar Disc */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-royal font-black text-lg transition-transform ${
                  isGuesser
                    ? "bg-gradient-to-tr from-amber-600 to-amber-300 text-indigo-950 shadow-lg scale-105"
                    : p.revealedRole
                    ? "bg-amber-500/20 border border-amber-400/50 text-amber-200"
                    : "bg-slate-800/80 border border-slate-700 text-slate-300"
                }`}
              >
                {p.username.slice(0, 2).toUpperCase()}
              </div>

              {/* Username & Score */}
              <div className="text-center w-full">
                <div className="font-bold text-xs truncate text-slate-100">{p.username}</div>
                <div className="font-mono text-[11px] font-semibold text-amber-300">
                  {p.score} Pts
                </div>
              </div>

              {/* Revealed Role Badge */}
              {p.revealedRole ? (
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-400/50 text-amber-200 font-bold uppercase tracking-wider">
                  {p.revealedRole}
                </div>
              ) : isConfirmed ? (
                <div className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold uppercase">
                  Confirmed
                </div>
              ) : null}

              {/* Interactive Accusation Button */}
              {canGuess && (
                <button
                  type="button"
                  className="w-full mt-1 py-1 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/20 transition-transform active:scale-95"
                >
                  Accuse
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { Crown, Lock, Sparkles, Flame } from "lucide-react";
import { sounds } from "@/lib/soundEffects";

export type ClimaxType = "CROWN_DESCEND" | "THIEF_CAPTURED" | "THIEF_ESCAPED" | null;

interface RoleClimaxOverlay3DProps {
  climaxType: ClimaxType;
  playerName?: string;
  onClose: () => void;
}

export function RoleClimaxOverlay3D({ climaxType, playerName, onClose }: RoleClimaxOverlay3DProps) {
  useEffect(() => {
    if (!climaxType) return;

    if (climaxType === "CROWN_DESCEND") {
      sounds.playRoyalFanfare();
    } else if (climaxType === "THIEF_CAPTURED") {
      sounds.playHandcuffsSnap();
    } else if (climaxType === "THIEF_ESCAPED") {
      sounds.playCardSwap();
    }

    const timer = setTimeout(() => {
      onClose();
    }, 3200);

    return () => clearTimeout(timer);
  }, [climaxType, onClose]);

  if (!climaxType) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in select-none cursor-pointer p-4"
    >
      {/* 1. Raja Crown Descend */}
      {climaxType === "CROWN_DESCEND" && (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center shadow-2xl shadow-amber-500/50 mb-6 animate-crown-descend border-4 border-amber-300">
            <Crown className="w-16 h-16 text-indigo-950 fill-indigo-950" />
          </div>
          <h2 className="font-royal text-3xl sm:text-4xl font-black text-gold-gradient mb-2 tracking-wide">
            CROWN REVEAL!
          </h2>
          <p className="text-sm sm:text-base text-amber-200 font-bold max-w-sm">
            {playerName ? `${playerName} has claimed the Royal Throne!` : "Raja has revealed himself to the court!"}
          </p>
        </div>
      )}

      {/* 2. Thief Captured by Police */}
      {climaxType === "THIEF_CAPTURED" && (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 rounded-3xl bg-slate-900 border-4 border-sky-400 flex items-center justify-center shadow-2xl shadow-sky-500/40 mb-6 animate-jail-slam overflow-hidden">
            {/* Iron Jail Bars Overlay */}
            <div className="absolute inset-0 flex justify-evenly pointer-events-none">
              <div className="w-1.5 h-full bg-slate-400 border-r border-slate-600" />
              <div className="w-1.5 h-full bg-slate-400 border-r border-slate-600" />
              <div className="w-1.5 h-full bg-slate-400 border-r border-slate-600" />
            </div>
            <Lock className="w-12 h-12 text-sky-400" />
          </div>

          <div className="px-5 py-2 rounded-xl bg-red-600 text-white font-black font-royal text-2xl tracking-widest shadow-xl rotate-[-4deg] mb-3 border-2 border-white">
            CAPTURED!
          </div>

          <p className="text-sm sm:text-base text-sky-200 font-bold max-w-sm">
            The Police brought justice! The Thirudan ({playerName}) has been caught!
          </p>
        </div>
      )}

      {/* 3. Thief Escapes / Outsmarts Police */}
      {climaxType === "THIEF_ESCAPED" && (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 rounded-full bg-purple-900/60 border-2 border-purple-400 flex items-center justify-center shadow-2xl mb-6">
            {/* Smoke Mist Effect */}
            <div className="absolute inset-0 rounded-full bg-purple-500/40 blur-xl animate-smoke-fade" />
            <Flame className="w-12 h-12 text-purple-300 animate-pulse" />
          </div>

          <div className="px-5 py-1.5 rounded-xl bg-purple-900/80 text-purple-200 font-black font-royal text-xl tracking-wider mb-2 border border-purple-400/50">
            SHADOW ESCAPE!
          </div>

          <p className="text-sm sm:text-base text-purple-200 font-bold max-w-sm">
            The Thirudan outsmarted the court and vanished into the shadows!
          </p>
        </div>
      )}
    </div>
  );
}

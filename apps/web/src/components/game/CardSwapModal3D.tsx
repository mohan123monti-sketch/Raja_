"use client";

import React, { useEffect } from "react";
import { GameRole, DEFAULT_ROLE_CONFIGS } from "@raja-rani/shared";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { sounds } from "@/lib/soundEffects";

interface CardSwapModal3DProps {
  swapData: {
    player1Name: string;
    player2Name: string;
    newRole: GameRole;
    text: string;
  } | null;
  onClose: () => void;
}

export function CardSwapModal3D({ swapData, onClose }: CardSwapModal3DProps) {
  useEffect(() => {
    if (swapData) {
      sounds.playCardSwap();
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [swapData, onClose]);

  if (!swapData) return null;

  const roleName = DEFAULT_ROLE_CONFIGS[swapData.newRole]?.name || swapData.newRole;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-screen-quake p-4 select-none cursor-pointer"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center justify-center text-center max-w-lg w-full"
      >
        {/* Floating 3D Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-indigo-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 mb-8 animate-bounce">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Royal Card Swap!
        </div>

        {/* 3D Mid-Air Crossing Cards Container */}
        <div className="relative w-full h-48 flex items-center justify-center perspective-1000 my-4">
          {/* Card 1: Old Guesser -> moving to Player 2 */}
          <div className="absolute left-8 sm:left-14 w-32 h-44 rounded-2xl bg-[#fdfbf7] text-indigo-950 border-2 border-amber-500 shadow-2xl p-3.5 flex flex-col items-center justify-between animate-swap-arc-left">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              From
            </span>
            <div className="font-royal font-black text-sm text-center text-indigo-950">
              {swapData.player1Name}
            </div>
            <div className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
              {roleName}
            </div>
          </div>

          {/* Central Crossing Spark */}
          <div className="w-12 h-12 rounded-full bg-amber-400/30 blur-lg flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>

          {/* Card 2: Suspect -> moving to Player 1 */}
          <div className="absolute right-8 sm:right-14 w-32 h-44 rounded-2xl bg-[#fdfbf7] text-indigo-950 border-2 border-amber-500 shadow-2xl p-3.5 flex flex-col items-center justify-between animate-swap-arc-right">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              To
            </span>
            <div className="font-royal font-black text-sm text-center text-indigo-950">
              {swapData.player2Name}
            </div>
            <div className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
              New {roleName}
            </div>
          </div>
        </div>

        {/* Description Text */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-100 text-sm sm:text-base font-semibold leading-relaxed max-w-md shadow-lg">
          {swapData.text}
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
        >
          Continue Turn ➔
        </button>
      </div>
    </div>
  );
}

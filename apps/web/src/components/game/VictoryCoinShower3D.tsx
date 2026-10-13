"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Crown, Trophy, Swords, Sparkles } from "lucide-react";
import { sounds } from "@/lib/soundEffects";

interface VictoryCoinShower3DProps {
  winnerName: string;
  finalScores: Record<string, number>;
  onRematch?: () => void;
  isHost?: boolean;
}

export function VictoryCoinShower3D({
  winnerName,
  finalScores,
  onRematch,
  isHost,
}: VictoryCoinShower3DProps) {
  useEffect(() => {
    sounds.playRoyalFanfare();
    sounds.playCoinClink();

    // 3D Gold Coin & Royal Confetti Blast
    const end = Date.now() + 3.5 * 1000;
    const colors = ["#ffd700", "#ca8a04", "#fef08a", "#eab308", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg animate-fade-in p-4 select-none">
      <div className="max-w-md w-full royal-glass p-8 rounded-3xl border-2 border-amber-400 text-center relative shadow-2xl shadow-amber-500/30">
        {/* Top Floating Crown Emblem */}
        <div className="w-20 h-20 mx-auto -mt-16 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-300 flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce">
          <Crown className="w-12 h-12 text-indigo-950 fill-indigo-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest mt-4 mb-2">
          <Trophy className="w-3.5 h-3.5" /> Grand Court Champion
        </div>

        <h2 className="font-royal text-3xl sm:text-4xl font-black text-gold-gradient mb-1">
          {winnerName}
        </h2>
        <p className="text-xs text-slate-300 mb-6">
          Has conquered the match and claimed the Sovereign Throne!
        </p>

        {/* Final Scoreboard */}
        <div className="bg-indigo-950/60 rounded-2xl border border-amber-500/30 p-4 mb-6 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 border-b border-amber-500/20 pb-1">
            Final Scores
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {Object.entries(finalScores)
              .sort(([, a], [, b]) => b - a)
              .map(([id, score], idx) => (
                <div key={id} className="flex justify-between text-xs text-slate-200">
                  <span className="font-medium">
                    #{idx + 1} Player
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{score} Pts</span>
                </div>
              ))}
          </div>
        </div>

        {/* Rematch Action */}
        {isHost && onRematch ? (
          <button
            onClick={onRematch}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-indigo-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4" /> Start Next Match
          </button>
        ) : (
          <div className="text-xs text-amber-300/80 italic">
            Waiting for host to initiate next match...
          </div>
        )}
      </div>
    </div>
  );
}

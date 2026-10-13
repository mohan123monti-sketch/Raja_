"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { sounds } from "@/lib/soundEffects";

interface BrassBowlToss3DProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function BrassBowlToss3D({ isOpen, onComplete }: BrassBowlToss3DProps) {
  const [phase, setPhase] = useState<"shaking" | "flying" | "done">("shaking");

  useEffect(() => {
    if (!isOpen) {
      setPhase("shaking");
      return;
    }

    // Play tumbling sound
    sounds.playBowlTumble();

    // 1. Shake for 1.6s
    const t1 = setTimeout(() => {
      setPhase("flying");
      sounds.playPaperRustle();
    }, 1600);

    // 2. Complete after 2.6s
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, onComplete]);

  if (!isOpen || phase === "done") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 select-none">
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs flex items-center gap-1.5 transition"
      >
        <span>Skip</span>
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex flex-col items-center justify-center text-center">
        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Kulukkal Bowl • Tossing the Paper Chits
        </div>

        {/* 3D Brass Bowl Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Outer Aura Glow */}
          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

          {/* 3D Brass Bowl (Shaking in Phase 1) */}
          <div
            className={`relative w-56 h-56 rounded-full border-4 border-amber-300/80 shadow-2xl flex items-center justify-center overflow-hidden ${
              phase === "shaking" ? "animate-bowl-shake" : ""
            }`}
            style={{
              background:
                "radial-gradient(circle at 40% 35%, #fef08a 0%, #ca8a04 40%, #713f12 75%, #3e1f05 100%)",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 8px 16px rgba(254, 240, 138, 0.6), inset 0 -12px 24px rgba(62, 31, 5, 0.9)",
            }}
          >
            {/* Bowl Inner Shadow Depth */}
            <div
              className="w-40 h-40 rounded-full border-2 border-amber-900/60 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, #451a03 0%, #78350f 60%, #b45309 100%)",
                boxShadow: "inset 0 10px 20px rgba(0, 0, 0, 0.8)",
              }}
            >
              {/* 5 Tumbling Paper Chits */}
              {[
                { rot: "12deg", delay: "0s", target: "-translate-x-36 -translate-y-48" },
                { rot: "-25deg", delay: "0.1s", target: "translate-x-36 -translate-y-48" },
                { rot: "45deg", delay: "0.2s", target: "-translate-x-44 translate-y-36" },
                { rot: "-60deg", delay: "0.15s", target: "translate-x-44 translate-y-36" },
                { rot: "5deg", delay: "0.05s", target: "translate-y-52" },
              ].map((chit, idx) => (
                <div
                  key={idx}
                  className={`absolute w-12 h-8 rounded bg-[#fdfbf7] border border-amber-800 shadow-md flex items-center justify-center font-royal font-black text-[9px] text-amber-950 transition-all duration-700 ease-out ${
                    phase === "shaking"
                      ? "animate-pulse"
                      : `${chit.target} scale-125 opacity-0`
                  }`}
                  style={{
                    transform:
                      phase === "shaking"
                        ? `rotate(${chit.rot}) translate(${(idx - 2) * 8}px, ${
                            ((idx % 2) - 0.5) * 12
                          }px)`
                        : undefined,
                  }}
                >
                  <span className="opacity-75">சீட்டு</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Text */}
        <p className="mt-8 font-royal text-sm sm:text-base text-amber-200 font-bold tracking-wide">
          {phase === "shaking"
            ? "Tossing and shaking the royal chits..."
            : "Distributing chits to the royal court!"}
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { PrivateChitData } from "@raja-rani/shared";
import { Crown, Shield, Eye, EyeOff, Sparkles } from "lucide-react";
import { sounds } from "@/lib/soundEffects";

interface OrigamiChit3DProps {
  chit: PrivateChitData | null;
  isUnfolded: boolean;
  onToggleUnfold: () => void;
}

export function OrigamiChit3D({ chit, isUnfolded, onToggleUnfold }: OrigamiChit3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [sealCracked, setSealCracked] = useState(false);

  // 3D Mouse Parallax & Holographic Glare
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -12; // -12deg to +12deg
    const rotY = ((x - centerX) / centerX) * 12;

    setTilt({ x: rotX, y: rotY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  // Gyroscope tilt on mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        // Clamp angles
        const rotX = Math.max(-15, Math.min(15, e.beta - 45));
        const rotY = Math.max(-15, Math.min(15, e.gamma));
        setTilt({ x: rotX, y: rotY });
        setGlare({
          x: 50 + rotY * 2,
          y: 50 + rotX * 2,
          opacity: 0.25,
        });
      }
    };

    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }
    return () => {
      if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, []);

  const handleClickChit = () => {
    if (!isUnfolded) {
      setSealCracked(true);
      sounds.playWaxCrack();
      sounds.playPaperRustle();
    } else {
      sounds.playPaperRustle();
    }
    onToggleUnfold();
  };

  if (!chit) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-500 text-xs italic">
        Awaiting royal chit distribution...
      </div>
    );
  }

  const role = chit.role;
  const config = chit.roleConfig;

  // Role Theme Accents
  const roleBorder =
    role === "RAJA"
      ? "border-amber-400"
      : role === "RANI"
      ? "border-rose-400"
      : role === "MANTHIRI"
      ? "border-emerald-400"
      : role === "POLICE"
      ? "border-sky-400"
      : "border-purple-400";

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto my-2 select-none">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClickChit}
        className={`preserve-3d relative cursor-pointer rounded-2xl p-5 border-2 ${roleBorder} transition-shadow shadow-2xl overflow-hidden`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`,
          transition: "transform 0.15s ease-out",
          background: "linear-gradient(135deg, #fefae0 0%, #faedcd 50%, #e9edc9 100%)",
          color: "#1e1b4b",
          boxShadow: isUnfolded
            ? "0 20px 40px -10px rgba(234, 179, 8, 0.4), inset 0 0 20px rgba(202, 138, 4, 0.15)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Holographic foil glare reflection */}
        <div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(234, 179, 8, 0.3) 30%, transparent 70%)`,
          }}
        />

        {/* Paper crease lines (Tri-fold appearance) */}
        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-amber-900/15 border-b border-white/60 pointer-events-none z-10" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-amber-900/15 border-b border-white/60 pointer-events-none z-10" />

        {/* Folded Cover State (with Wax Seal) */}
        {!isUnfolded ? (
          <div className="py-7 flex flex-col items-center justify-center text-center relative z-20">
            {/* 3D Wax Seal */}
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-tr from-rose-900 via-rose-700 to-red-500 border-2 border-amber-300/60 flex items-center justify-center shadow-lg mb-3 ${
                sealCracked ? "animate-seal-break" : "hover:scale-110 transition-transform"
              }`}
            >
              <Crown className="w-8 h-8 text-amber-200 fill-amber-200" />
            </div>

            <div className="font-royal font-black text-lg tracking-wider text-amber-950 uppercase">
              Secret Royal Chit
            </div>
            <div className="text-[11px] font-semibold text-amber-900/80 mt-1 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-800" />
              Click to unfold & unveil role
            </div>

            <div className="mt-4 px-3 py-1 rounded-full bg-amber-950/10 border border-amber-900/20 text-[10px] text-amber-900 uppercase font-bold tracking-widest">
              Folded • Confidential
            </div>
          </div>
        ) : (
          /* Unfolded Royal Chit Content */
          <div className="relative z-20 py-2 animate-fade-in">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-700 fill-amber-700" />
                <span className="font-royal text-[11px] font-black uppercase tracking-widest text-amber-900">
                  Royal Decreet
                </span>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-amber-700 text-amber-50 font-mono text-xs font-bold shadow-sm">
                {config.points} PTS
              </div>
            </div>

            {/* Role Title */}
            <div className="text-center my-3">
              <h2 className="font-royal text-2xl sm:text-3xl font-black text-amber-950 tracking-wide">
                {config.name}
              </h2>
              <div className="text-xs font-semibold text-amber-800/90 mt-0.5">
                {role === "RAJA" && "ராஜா • The Sovereign Ruler"}
                {role === "RANI" && "ராணி • The Royal Consort"}
                {role === "MANTHIRI" && "மந்திரி • The Prime Minister"}
                {role === "POLICE" && "போலீஸ் • The Law Enforcer"}
                {role === "THIRUDAN" && "திருடன் • The Elusive Thief"}
              </div>
            </div>

            {/* Role Duty Description */}
            <div className="p-2.5 rounded-xl bg-amber-950/5 border border-amber-900/15 text-[11px] leading-relaxed text-amber-950/80 text-center mb-3">
              {config.description}
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-1 border-t border-amber-900/15 text-[10px] text-amber-800 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700" /> Keep confidential
              </span>
              <span className="flex items-center gap-1 font-bold underline hover:text-amber-950">
                <EyeOff className="w-3 h-3" /> Fold back
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

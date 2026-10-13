"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Crown, Trophy, Users, Swords, LogOut, User, Shield } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0c2a]/80 border-b border-amber-500/20 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <Crown className="w-6 h-6 text-indigo-950 fill-indigo-950" />
          </div>
          <div>
            <span className="font-royal text-xl font-bold tracking-wider text-gold-gradient block leading-none">
              RAJA RANI
            </span>
            <span className="text-[10px] tracking-widest text-amber-200/70 font-semibold uppercase">
              Online Multiplayer
            </span>
          </div>
        </Link>

        {user ? (
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link
              href="/lobby"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-200 hover:text-amber-300 hover:bg-white/5 transition"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Play</span>
            </Link>

            <Link
              href="/teams"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-200 hover:text-amber-300 hover:bg-white/5 transition"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">Teams</span>
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-200 hover:text-amber-300 hover:bg-white/5 transition"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="hidden md:inline">Leaderboard</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition ml-2"
            >
              <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-amber-100 hidden sm:inline">
                {user.username}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono">
                {user.playerCode}
              </span>
            </Link>

            <button
              onClick={() => logout()}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/rules"
              className="text-sm text-slate-300 hover:text-amber-300 hidden sm:block px-3 py-1.5 transition"
            >
              How to Play
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg text-slate-200 hover:text-amber-300 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-bold shadow-md shadow-amber-500/20 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

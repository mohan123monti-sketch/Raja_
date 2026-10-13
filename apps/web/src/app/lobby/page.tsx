"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import {
  Crown,
  Play,
  Users,
  PlusCircle,
  Hash,
  Sparkles,
  Trophy,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

export default function LobbyPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Form states
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Matchmaking
  const [matchmakingSize, setMatchmakingSize] = useState<number | null>(null);
  const [inQueue, setInQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchRooms = async () => {
    if (!token) return;
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPublicRooms(data.rooms);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRooms();
    }
  }, [token]);

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxPlayers,
          isPrivate,
          targetScore: 3000,
          roundsToPlay: 5,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create room");
      }

      router.push(`/game/${data.roomCode}`);
    } catch (err: any) {
      setError(err.message || "Failed to create room");
      setCreating(false);
    }
  };

  // Join Room by Code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !joinCode.trim()) return;
    setJoining(true);
    setError("");

    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to join room");
      }

      router.push(`/game/${code}`);
    } catch (err: any) {
      setError(err.message || "Room not found or cannot join");
      setJoining(false);
    }
  };

  // Matchmaking Queue
  const toggleMatchmaking = async (size: number) => {
    if (!token) return;
    setError("");

    if (inQueue) {
      // Cancel
      await fetch("/api/matchmaking/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setInQueue(false);
      setMatchmakingSize(null);
    } else {
      setInQueue(true);
      setMatchmakingSize(size);
      try {
        const res = await fetch("/api/matchmaking/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ groupSize: size }),
        });
        const data = await res.json();
        if (data.success && data.status) {
          setQueueCount(data.status.totalInQueue || 1);
        }
      } catch (err: any) {
        setError("Matchmaking error");
        setInQueue(false);
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Welcome Banner */}
        <div className="royal-glass p-6 rounded-3xl border border-amber-500/30 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="font-royal text-2xl font-bold text-gold-gradient">
                Welcome, {user.username}
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              Player Code:{" "}
              <span className="font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                {user.playerCode}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/leaderboard")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
            >
              <Trophy className="w-3.5 h-3.5" />
              Leaderboard
            </button>
            <button
              onClick={() => router.push("/teams")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition"
            >
              <Users className="w-3.5 h-3.5" />
              Teams
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions (Create / Join by Code) */}
          <div className="space-y-6">
            {/* Create Room */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5" />
                Host a Match
              </h2>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    Player Count
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 6, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxPlayers(num)}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          maxPlayers === num
                            ? "bg-amber-500/20 border-amber-400 text-amber-300"
                            : "bg-slate-900/60 border-slate-700/60 text-slate-400"
                        }`}
                      >
                        {num} Players
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="isPrivate" className="text-xs text-slate-300 cursor-pointer">
                    Make room private (code only)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-indigo-950" />}
                  Create Royal Room
                </button>
              </form>
            </div>

            {/* Join by Code */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5" />
                Join Private Room
              </h2>

              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                    6-Letter Room Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RAJA42"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white font-mono uppercase tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter Chamber"}
                </button>
              </form>
            </div>
          </div>

          {/* Center/Right: Matchmaking & Public Lobbies */}
          <div className="lg:col-span-2 space-y-6">
            {/* Random Matchmaking Bar */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-royal text-lg font-bold text-gold-gradient flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Quick Matchmaking
                </h2>
                {inQueue && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-300 animate-pulse font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching for court rivals... ({queueCount})
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-4 font-light">
                Queue with other online players for instant multiplayer action across 5, 6, or 7-player variants.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[5, 6, 7].map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleMatchmaking(size)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition border ${
                      inQueue && matchmakingSize === size
                        ? "bg-rose-500/20 border-rose-400 text-rose-300 hover:bg-rose-500/30"
                        : "bg-gradient-to-b from-indigo-950/60 to-slate-900 border-amber-500/30 text-amber-200 hover:border-amber-400"
                    }`}
                  >
                    <span>{size}-Player Match</span>
                    <span className="text-[10px] text-slate-400">
                      {inQueue && matchmakingSize === size ? "Cancel Queue" : "Find Match"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Public Rooms List */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Open Royal Courts
                </h2>

                <button
                  onClick={fetchRooms}
                  disabled={loadingRooms}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-300 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRooms ? "animate-spin" : ""}`} />
                </button>
              </div>

              {loadingRooms ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              ) : publicRooms.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-700/60 rounded-2xl">
                  <Crown className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No public courts currently open.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Host your own match or queue in matchmaking above!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {publicRooms.map((room) => (
                    <div
                      key={room.roomCode}
                      className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-royal font-bold text-amber-200 text-sm">
                            Court of {room.hostUsername}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                            {room.roomCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Players: {room.currentPlayers} / {room.maxPlayers}
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/game/${room.roomCode}`)}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition"
                      >
                        Enter Room
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

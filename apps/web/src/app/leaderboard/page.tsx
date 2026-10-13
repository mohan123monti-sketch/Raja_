"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Medal, Crown, Star, Loader2 } from "lucide-react";

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8 text-indigo-950 fill-indigo-950" />
          </div>
          <h1 className="font-royal text-3xl font-bold text-gold-gradient">Hall of Royals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Top ranked lords and ladies of the realm based on tactical deception and rating
          </p>
        </div>

        <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-500/20 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Lord / Lady</th>
                    <th className="py-3 px-4">Player Code</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Wins</th>
                    <th className="py-3 px-4">Matches</th>
                    <th className="py-3 px-4">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaderboard.map((player) => (
                    <tr
                      key={player.userId}
                      className="hover:bg-amber-500/5 transition text-slate-200"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {player.rank === 1 ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Crown className="w-4 h-4 fill-amber-400" /> #1
                          </span>
                        ) : player.rank === 2 ? (
                          <span className="text-slate-300 font-bold">#2</span>
                        ) : player.rank === 3 ? (
                          <span className="text-amber-600 font-bold">#3</span>
                        ) : (
                          `#${player.rank}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                          {player.username.slice(0, 1).toUpperCase()}
                        </div>
                        {player.username}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-300/80">
                        {player.playerCode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400 font-mono">
                        {player.rating}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">
                        {player.wins}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {player.gamesPlayed}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-200 font-bold">
                        {player.totalPoints.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Crown, Trophy, Swords, Shield, KeyRound, Check, Copy, History } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

export default function ProfilePage() {
  const { user, stats, token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  useEffect(() => {
    if (token) {
      fetch("/api/matches/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setMatchHistory(data.history);
        })
        .catch(console.error);
    }
  }, [token]);

  const copyCode = async () => {
    if (!user) return;
    await copyToClipboard(user.playerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    setPassErr("");

    try {
      const res = await fetch("/api/players/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setPassMsg("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPassErr(err.message || "Failed to update password");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Profile Card */}
        <div className="royal-glass p-8 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center font-black text-2xl text-indigo-950 shadow-xl shadow-amber-500/30">
            {user.username.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="font-royal text-2xl font-bold text-gold-gradient">{user.username}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                <span>Player Code: {user.playerCode}</span>
                <button onClick={copyCode} className="hover:text-amber-100 transition">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl royal-glass border border-amber-500/30 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Royal Rating</div>
            <div className="font-mono text-xl font-black text-amber-300 mt-1">
              {stats?.rating || 1200}
            </div>
          </div>

          <div className="p-5 rounded-2xl royal-glass border border-emerald-500/30 text-center">
            <Crown className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Wins</div>
            <div className="font-mono text-xl font-black text-emerald-400 mt-1">
              {stats?.wins || 0}
            </div>
          </div>

          <div className="p-5 rounded-2xl royal-glass border border-indigo-500/30 text-center">
            <Swords className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Matches Played</div>
            <div className="font-mono text-xl font-black text-indigo-300 mt-1">
              {stats?.gamesPlayed || 0}
            </div>
          </div>

          <div className="p-5 rounded-2xl royal-glass border border-yellow-500/30 text-center">
            <Shield className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-xs text-slate-400">Total Points</div>
            <div className="font-mono text-xl font-black text-amber-200 mt-1">
              {(stats?.totalPoints || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Match History & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Match History */}
          <div className="md:col-span-2 royal-glass p-6 rounded-3xl border border-amber-500/30">
            <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
              <History className="w-5 h-5" />
              Recent Battles
            </h2>

            {matchHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recorded matches yet.</p>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">Room #{m.roomCode}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(m.playedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-300">{m.myScore} Pts</div>
                      <div className="text-[10px] text-slate-400 uppercase">{m.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
            <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5" />
              Security
            </h2>

            {passMsg && <p className="text-xs text-emerald-400 mb-3">{passMsg}</p>}
            {passErr && <p className="text-xs text-rose-400 mb-3">{passErr}</p>}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/30 transition mt-2"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

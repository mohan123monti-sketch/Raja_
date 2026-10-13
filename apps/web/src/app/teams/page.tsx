"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Users, Plus, Hash, Shield, Crown, Loader2, AlertCircle } from "lucide-react";

export default function TeamsPage() {
  const { token, user } = useAuth();
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [publicTeams, setPublicTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTeams = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMyTeams(data.myTeams);
        setPublicTeams(data.publicTeams);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTeams();
  }, [token]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: teamName, description: teamDesc }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setSuccess(`Team ${data.team.name} created! Invite code: ${data.team.inviteCode}`);
      setTeamName("");
      setTeamDesc("");
      fetchTeams();
    } catch (err: any) {
      setError(err.message || "Failed to create team");
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/teams/join-by-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setSuccess(data.message);
      setInviteCode("");
      fetchTeams();
    } catch (err: any) {
      setError(err.message || "Failed to join team");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-400 to-amber-200 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users className="w-8 h-8 text-indigo-950 fill-indigo-950" />
          </div>
          <h1 className="font-royal text-3xl font-bold text-gold-gradient">Royal Guilds & Teams</h1>
          <p className="text-xs text-slate-400 mt-1">
            Form alliances, create guilds, and invite companions for exclusive team matches
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create & Join Forms */}
          <div className="space-y-6">
            {/* Create Team */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5" />
                Establish Guild
              </h2>

              <form onSubmit={handleCreateTeam} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                    Team / Guild Name
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Pallava Royal Guard"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                    Motto or Description
                  </label>
                  <textarea
                    rows={2}
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    placeholder="Our realm fears no thief..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-bold text-xs shadow-md shadow-amber-500/20 transition"
                >
                  Create Guild
                </button>
              </form>
            </div>

            {/* Join by Code */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5" />
                Join via Invitation Code
              </h2>

              <form onSubmit={handleJoinByCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TMROYAL"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white font-mono uppercase tracking-widest text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition"
                >
                  Join Team
                </button>
              </form>
            </div>
          </div>

          {/* Teams List (My Teams & Directory) */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Teams */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5" />
                My Memberships
              </h2>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              ) : myTeams.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">
                  You have not joined any teams yet. Create one or join using an invite code.
                </p>
              ) : (
                <div className="space-y-3">
                  {myTeams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-royal font-bold text-slate-100 text-sm">{team.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                            {team.inviteCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{team.description || "No motto"}</p>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Role: <span className="text-amber-300">{team.myRole}</span> · Members: {team.memberCount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Public Teams Directory */}
            <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
              <h2 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" />
                Guild Directory
              </h2>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {publicTeams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-royal font-bold text-slate-100 text-sm">{team.name}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{team.description}</p>
                        <span className="text-[11px] text-slate-500">
                          Leader: {team.owner.username} · {team.memberCount} members
                        </span>
                      </div>

                      <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded">
                        {team.inviteCode}
                      </span>
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

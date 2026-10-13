import Link from "next/link";
import { Crown, Sparkles, Shield, Users, Flame, Dice5 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden">
          {/* Subtle Ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Traditional South Indian Paper-Chit Game — Reimagined
            </div>

            <h1 className="font-royal text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Bluff, Accuse, & Claim the{" "}
              <span className="text-gold-gradient block sm:inline">Royal Throne</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Experience the nostalgic paper-chit game online in real-time. Unfold secret roles, command the Police, outsmart the Thirudan, and rise on global leaderboards.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-indigo-950 font-extrabold text-base shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
              >
                Start Playing Free
              </Link>
              <Link
                href="/rules"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-amber-500/30 bg-white/5 hover:bg-white/10 text-amber-200 font-semibold text-base transition"
              >
                Explore Rules & Roles
              </Link>
            </div>
          </div>
        </section>

        {/* Traditional Chits Showcase */}
        <section className="py-16 px-4 bg-[#0d0f30]/60 border-y border-amber-500/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-royal text-2xl sm:text-3xl font-bold text-amber-300 mb-2">
                The Royal Paper Chits
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Folded secretly and tossed into the bowl. Each player pulls a chit that dictates their destiny.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
              {[
                {
                  role: "RAJA",
                  name: "Raja (King)",
                  pts: "1000 Pts",
                  desc: "Commands the royal court and exposes the thief through the police.",
                  color: "border-amber-400 bg-amber-500/10 text-amber-300",
                },
                {
                  role: "RANI",
                  name: "Rani (Queen)",
                  pts: "800 Pts",
                  desc: "The Queen of the realm. Safe status and royal grace.",
                  color: "border-rose-400 bg-rose-500/10 text-rose-300",
                },
                {
                  role: "MANTHIRI",
                  name: "Manthiri (Minister)",
                  pts: "700 Pts",
                  desc: "Wise councillor and court strategist.",
                  color: "border-purple-400 bg-purple-500/10 text-purple-300",
                },
                {
                  role: "POLICE",
                  name: "Police (Inspector)",
                  pts: "500 Pts",
                  desc: "Must accuse and find the Thief. Guess right to keep points; fail and lose them!",
                  color: "border-sky-400 bg-sky-500/10 text-sky-300",
                },
                {
                  role: "THIRUDAN",
                  name: "Thirudan (Thief)",
                  pts: "0 or 500 Pts",
                  desc: "Must blend in undetected. Steals the Police's points if they fail to guess!",
                  color: "border-emerald-400 bg-emerald-500/10 text-emerald-300",
                },
              ].map((c) => (
                <div
                  key={c.role}
                  className={`p-5 rounded-2xl border ${c.color} royal-glass flex flex-col justify-between hover:scale-105 transition-transform shadow-lg`}
                >
                  <div>
                    <div className="text-[10px] font-mono tracking-widest uppercase opacity-75 mb-1">
                      Paper Chit
                    </div>
                    <div className="font-royal text-lg font-bold mb-1">{c.name}</div>
                    <div className="text-xs font-semibold text-amber-400 mb-3">{c.pts}</div>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl royal-glass border border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Dice5 className="w-6 h-6" />
              </div>
              <h3 className="font-royal text-lg font-bold text-slate-100 mb-2">5, 6 & 7 Player Modes</h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Adaptive role sets that support up to 7 players with Senapathi (Commander) and Prajai (Citizen) variants.
              </p>
            </div>

            <div className="p-6 rounded-2xl royal-glass border border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-royal text-lg font-bold text-slate-100 mb-2">Guilds & Private Rooms</h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Create permanent teams, recruit teammates with invite codes, or host private 6-character room matches.
              </p>
            </div>

            <div className="p-6 rounded-2xl royal-glass border border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-royal text-lg font-bold text-slate-100 mb-2">Authoritative Security</h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Roles are sealed on the backend. Only your personal device receives your private chit. Zero client-side tampering.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-amber-500/10 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Raja Rani Online. Designed with traditional heritage & modern real-time engineering.</p>
      </footer>
    </div>
  );
}

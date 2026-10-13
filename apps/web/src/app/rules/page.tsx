import { Navbar } from "@/components/Navbar";
import { Crown, Sparkles, Shield, AlertTriangle, Dice5 } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-12">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-8 h-8 text-indigo-950 fill-indigo-950" />
          </div>
          <h1 className="font-royal text-3xl sm:text-4xl font-bold text-gold-gradient">
            Rules of the Royal Court
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            The traditional South Indian Raja Rani paper chit game principles and scoring
          </p>
        </div>

        {/* Traditional Heritage Section */}
        <section className="royal-glass p-8 rounded-3xl border border-amber-500/30 space-y-4">
          <h2 className="font-royal text-xl font-bold text-amber-300">
            The Origin & Tradition
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            In traditional South Indian households, during rainy afternoons or festive gatherings, friends and cousins fold small slips of paper into chits. The chits are shaken in the palms and tossed onto the floor. Each player picks one chit, secretly reads their royal role, and hides their expression.
          </p>
        </section>

        {/* Roles Breakdown */}
        <section className="space-y-4">
          <h2 className="font-royal text-xl font-bold text-amber-300">
            Roles & Standard Point System
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="royal-glass p-5 rounded-2xl border border-amber-500/30">
              <div className="font-royal font-bold text-amber-300 text-lg">Raja (King) — 1,000 Pts</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The supreme ruler of the court. Upon receiving the King chit, the Raja reveals himself immediately and commands: <em>"Who is my Police officer? Find the Thirudan!"</em>
              </p>
            </div>

            <div className="royal-glass p-5 rounded-2xl border border-rose-500/30">
              <div className="font-royal font-bold text-rose-300 text-lg">Rani (Queen) — 800 Pts</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Noble companion of the King. Keeps her identity quiet and safely earns 800 points each round without suspicion.
              </p>
            </div>

            <div className="royal-glass p-5 rounded-2xl border border-purple-500/30">
              <div className="font-royal font-bold text-purple-300 text-lg">Manthiri (Minister) — 700 Pts</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Advisor to the King. In some regional variants, the Minister plays the detective role; in standard mode, he holds high ministerial honors.
              </p>
            </div>

            <div className="royal-glass p-5 rounded-2xl border border-sky-500/30">
              <div className="font-royal font-bold text-sky-300 text-lg">Police (Inspector) — 500 Pts</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The lawkeeper called forth by the King. The Police must analyze facial cues and accuse one suspect. If the suspect is indeed the Thirudan, Police keeps 500 points. If wrong, the Police receives 0 points!
              </p>
            </div>

            <div className="royal-glass p-5 rounded-2xl border border-emerald-500/30">
              <div className="font-royal font-bold text-emerald-300 text-lg">Thirudan (Thief) — 0 or 500 Pts</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The cunning trickster. If the Police fails to accuse the Thirudan (accuses an innocent noble instead), the Thirudan steals the entire 500 points from the Police!
              </p>
            </div>

            <div className="royal-glass p-5 rounded-2xl border border-amber-500/30">
              <div className="font-royal font-bold text-amber-200 text-lg">Senapathi & Prajai (6 & 7 Players)</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Senapathi (Commander, 400 pts) and Prajai (Citizen, 300 pts) expand court size to allow larger groups to participate.
              </p>
            </div>
          </div>
        </section>

        {/* Turn Flow */}
        <section className="royal-glass p-8 rounded-3xl border border-amber-500/30 space-y-4">
          <h2 className="font-royal text-xl font-bold text-amber-300">
            Authoritative Turn Mechanics
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
            <li><strong>Chit Distribution:</strong> Each player is secretly assigned a random role on the server.</li>
            <li><strong>Raja Calling:</strong> The player with the Raja chit clicks to reveal themselves.</li>
            <li><strong>Accusation Phase:</strong> The Police reviews suspects and submits their accusation.</li>
            <li><strong>Resolution & Scoring:</strong> Correct accusation grants the Police their points. An incorrect accusation transfers those points directly to the Thief!</li>
            <li><strong>Victory:</strong> Points accumulate over multiple rounds until reaching the target score (3,000 pts) or maximum rounds.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

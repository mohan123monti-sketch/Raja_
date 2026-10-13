"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { Navbar } from "@/components/Navbar";
import {
  RoomStateView,
  PrivateChitData,
  PublicPlayerInfo,
  GameRole,
  DEFAULT_ROLE_CONFIGS,
} from "@raja-rani/shared";
import { copyToClipboard } from "@/lib/clipboard";
import {
  Crown,
  Shield,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  Trophy,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

export default function GameScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user, token } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();

  const [roomState, setRoomState] = useState<RoomStateView | null>(null);
  const [myChit, setMyChit] = useState<PrivateChitData | null>(null);
  const [messages, setMessages] = useState<Array<{ username: string; message: string; timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [isChitFlipped, setIsChitFlipped] = useState(false);

  useEffect(() => {
    if (!socket || !roomCode || !user) return;

    socket.emit("room:join", roomCode.toUpperCase());

    socket.on("room:state", (state) => {
      setRoomState(state);
    });

    socket.on("game:chit-assigned", (chit) => {
      setMyChit(chit);
    });

    socket.on("game:card-swapped", (swap) => {
      setIsChitFlipped(true); // Automatically show flipped chit so player notices role change
    });

    socket.on("room:chat", (msg) => {
      setMessages((prev) => [...prev.slice(-30), msg]);
    });

    socket.on("error:message", (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(""), 4000);
    });

    return () => {
      socket.off("room:state");
      socket.off("game:chit-assigned");
      socket.off("game:card-swapped");
      socket.off("room:chat");
      socket.off("error:message");
    };
  }, [socket, roomCode, user]);

  const copyRoomCode = async () => {
    if (!roomState) return;
    await copyToClipboard(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    socket?.emit("room:toggle-ready");
  };

  const handleStartGame = () => {
    socket?.emit("room:start-game");
  };

  const handleRevealKing = () => {
    socket?.emit("game:reveal-king");
  };

  const handleMakeGuess = (suspectId: string) => {
    socket?.emit("game:make-guess", suspectId);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit("room:send-chat", chatInput.trim());
    setChatInput("");
  };

  const handleRematch = () => {
    socket?.emit("game:rematch-request");
  };

  if (!roomState) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
          <p className="text-amber-200 font-royal text-lg">Entering Court #{roomCode}...</p>
        </div>
      </div>
    );
  }

  const isHost = roomState.hostId === user?.id;
  const isMeKing = myChit?.role === "RAJA";
  const isMyTurnToGuess =
    (roomState.state === "GUESSING_PHASE" || roomState.state === "POLICE_GUESSING") &&
    roomState.currentGuesserId === user?.id;
  const currentGuesserPlayer = roomState.players.find((p) => p.userId === roomState.currentGuesserId);
  const kingPlayer = roomState.players.find((p) => p.userId === roomState.kingPlayerId);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a1a]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left & Center: Game Area (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Room Header Banner */}
          <div className="royal-glass p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-royal text-lg font-bold text-gold-gradient">
                Chamber: {roomState.roomCode}
              </span>
              <button
                onClick={copyRoomCode}
                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1 transition"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-mono">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-400">
                Round <span className="text-amber-300">{roomState.currentRound}</span> / {roomState.totalRounds}
              </span>
              <span className="text-slate-400">
                Phase: <span className="text-amber-400 uppercase tracking-wider">{roomState.state.replace("_", " ")}</span>
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MAIN STAGE BY GAME STATE */}
          {roomState.state === "LOBBY" && (
            <div className="royal-glass p-8 rounded-3xl border border-amber-500/30 text-center">
              <h2 className="font-royal text-2xl font-bold text-amber-300 mb-2">
                Awaiting Royal Assembly
              </h2>
              <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto">
                Need {roomState.maxPlayers} players to begin. Share the code #{roomState.roomCode} with friends.
              </p>

              {/* Player Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                {Array.from({ length: roomState.maxPlayers }).map((_, idx) => {
                  const p = roomState.players[idx];
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition ${
                        p
                          ? "bg-indigo-950/40 border-amber-500/30 text-slate-200"
                          : "border-dashed border-slate-700/60 bg-transparent text-slate-600"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-base text-amber-300">
                        {p ? p.username.slice(0, 2).toUpperCase() : "?"}
                      </div>
                      <div className="text-xs font-bold truncate max-w-[100px]">
                        {p ? p.username : "Empty Seat"}
                      </div>
                      {p && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            p.isHost
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : p.isReady
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-700/40 text-slate-400"
                          }`}
                        >
                          {p.isHost ? "Host" : p.isReady ? "Ready" : "Not Ready"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!isHost && (
                  <button
                    onClick={handleToggleReady}
                    className="px-6 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-bold transition"
                  >
                    {roomState.players.find((p) => p.userId === user?.id)?.isReady ? "Unready" : "Ready Up"}
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={handleStartGame}
                    disabled={roomState.players.length < roomState.maxPlayers}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition disabled:opacity-40"
                  >
                    Start Royal Match ({roomState.players.length}/{roomState.maxPlayers})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE PLAYING: CHIT PICKING & REVEAL */}
          {roomState.state !== "LOBBY" && (
            <div className="space-y-6">
              {/* My Secret Paper Chit Box */}
              <div className="royal-glass p-6 rounded-3xl border border-amber-500/40 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="font-royal text-lg font-bold text-amber-300">
                      Your Royal Chit (Secret)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsChitFlipped(!isChitFlipped)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-white/5 hover:bg-white/10 text-amber-200 transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isChitFlipped ? "Fold Chit" : "Unfold Chit"}
                  </button>
                </div>

                {myChit ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* The Folded / Unfolded Paper Chit Component */}
                    <div
                      onClick={() => setIsChitFlipped(!isChitFlipped)}
                      className={`w-64 h-36 p-5 rounded-2xl cursor-pointer paper-chit flex flex-col justify-between select-none ${
                        isChitFlipped ? "rotate-0 scale-100" : "rotate-2 scale-95"
                      }`}
                    >
                      {isChitFlipped ? (
                        <>
                          <div className="flex justify-between items-start">
                            <span className="font-royal font-extrabold text-xs text-amber-800 tracking-wider">
                              ROYAL CHIT
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-700">
                              {myChit.roleConfig.points} PTS
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="font-royal text-2xl font-black text-indigo-950">
                              {myChit.roleConfig.name}
                            </div>
                            <div className="text-[11px] text-amber-900 mt-1">
                              {myChit.roleConfig.description}
                            </div>
                          </div>
                          <div className="text-[10px] text-center text-slate-500 uppercase tracking-widest">
                            Keep Identity Secret
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <Crown className="w-8 h-8 text-amber-600 mb-1" />
                          <div className="font-royal font-bold text-sm text-indigo-950">
                            Folded Paper Chit
                          </div>
                          <div className="text-[10px] text-amber-800 mt-1">
                            Click to unfold & read role
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs text-slate-300">
                      <p>
                        <strong className="text-amber-300">Phase:</strong>{" "}
                        {roomState.state === "CHIT_PICKING" && "Waiting for Raja to reveal."}
                        {roomState.state === "GUESSING_PHASE" && (
                          <span>
                            {currentGuesserPlayer?.username} is searching for the{" "}
                            <span className="text-amber-300 font-bold uppercase">{roomState.currentTargetRole}</span>!
                          </span>
                        )}
                        {roomState.state === "ROUND_RESULTS" && "Round resolved! Viewing results."}
                      </p>

                      {/* King Action Button */}
                      {roomState.state === "CHIT_PICKING" && isMeKing && (
                        <div className="pt-2">
                          <button
                            onClick={handleRevealKing}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition animate-bounce"
                          >
                            Crown Reveal: "I am Raja! Find Rani!"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Distributing paper chits...
                  </div>
                )}
              </div>

              {/* Card Swap Alert Banner */}
              {roomState.lastSwap && (
                <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-3 animate-pulse shadow-lg shadow-amber-500/20">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/30 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-amber-300 animate-spin" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-amber-300 font-black">
                      🔄 Card Swapped!
                    </div>
                    <div className="text-xs sm:text-sm text-white font-medium mt-0.5">
                      {roomState.lastSwap.text}
                    </div>
                  </div>
                </div>
              )}

              {/* Royal Announcement Bar */}
              {roomState.lastAnnouncement && !roomState.lastSwap && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-amber-500/30 text-xs sm:text-sm text-amber-200 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">{roomState.lastAnnouncement}</span>
                </div>
              )}

              {/* Royal Court / Suspect Table */}
              <div className="royal-glass p-6 rounded-3xl border border-amber-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                  <h3 className="font-royal text-lg font-bold text-amber-300 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    The Royal Court
                  </h3>

                  {isMyTurnToGuess ? (
                    <span className="text-xs px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border-2 border-amber-400 font-bold animate-pulse shadow-md">
                      🎯 YOUR TURN! Guess who has {roomState.currentTargetRole ? DEFAULT_ROLE_CONFIGS[roomState.currentTargetRole].name : "the role"}!
                    </span>
                  ) : (roomState.state === "GUESSING_PHASE" || roomState.state === "POLICE_GUESSING") ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold">
                      ⏳ {currentGuesserPlayer?.username} ({roomState.currentGuesserRole ? DEFAULT_ROLE_CONFIGS[roomState.currentGuesserRole].name : "Guesser"}) is searching...
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {roomState.players.map((p) => {
                    const isSelf = p.userId === user?.id;
                    const isConfirmed =
                      roomState.confirmedRoleUsers?.includes(p.userId) ||
                      (p.revealedRole && p.userId !== roomState.currentGuesserId);
                    const canGuess = isMyTurnToGuess && !isSelf && !isConfirmed;

                    return (
                      <div
                        key={p.userId}
                        onClick={() => canGuess && handleMakeGuess(p.userId)}
                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 relative transition ${
                          canGuess
                            ? "cursor-pointer hover:border-amber-400 hover:bg-amber-500/20 hover:scale-105 border-2 border-dashed border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 animate-pulse"
                            : p.revealedRole
                            ? "border bg-amber-500/10 border-amber-400"
                            : "border bg-slate-900/40 border-slate-800"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-base text-amber-300">
                          {p.username.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="text-xs font-bold truncate max-w-[110px] text-slate-200">
                          {p.username}
                        </div>

                        <div className="text-[11px] font-mono text-amber-400">
                          {p.score} Pts
                        </div>

                        {/* Revealed Role badge */}
                        {p.revealedRole && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold uppercase">
                            {p.revealedRole}
                          </span>
                        )}

                        {canGuess && (
                          <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40">
                            Guess as {roomState.currentTargetRole}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Round Results Display */}
              {roomState.state === "ROUND_RESULTS" && (
                <div className="royal-glass p-6 rounded-3xl border border-amber-500/40 text-center animate-fade-in">
                  <h3 className="font-royal text-xl font-bold text-gold-gradient mb-2">
                    Round {roomState.currentRound} Resolution
                  </h3>
                  <p className="text-sm text-slate-300 mb-6">
                    {roomState.lastGuessCorrect
                      ? "The Police correctly caught the Thirudan (Thief)! Justice prevailed."
                      : "The Police failed! The Thirudan outsmarted the court and stole the Police's points!"}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
                    {roomState.roundScores &&
                      Object.entries(roomState.roundScores).map(([uid, scoreData]) => {
                        const player = roomState.players.find((p) => p.userId === uid);
                        return (
                          <div key={uid} className="p-3 rounded-xl bg-white/5 border border-amber-500/20">
                            <div className="text-xs font-bold text-slate-200 truncate">
                              {player?.username}
                            </div>
                            <div className="text-[10px] text-amber-300 uppercase font-semibold">
                              {scoreData.role}
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                              +{scoreData.roundPoints}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Match Finished Display */}
              {roomState.state === "MATCH_FINISHED" && (
                <div className="royal-glass p-8 rounded-3xl border border-amber-500/50 text-center animate-royal-glow">
                  <Crown className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                  <h2 className="font-royal text-3xl font-extrabold text-gold-gradient mb-2">
                    Match Concluded!
                  </h2>
                  <p className="text-sm text-slate-300 mb-6">
                    The Crown of Victory belongs to:{" "}
                    <span className="text-amber-300 font-bold">
                      {roomState.players.find((p) => p.userId === roomState.winnerPlayerId)?.username}
                    </span>
                  </p>

                  {isHost && (
                    <button
                      onClick={handleRematch}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-indigo-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition"
                    >
                      Rematch in this Court
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Chat & Scoreboard (1 Col) */}
        <div className="space-y-6">
          {/* Live Standings */}
          <div className="royal-glass p-5 rounded-3xl border border-amber-500/30">
            <h3 className="font-royal text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Live Standings
            </h3>
            <div className="space-y-2">
              {[...roomState.players]
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-amber-400 font-bold w-4">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[100px]">
                        {p.username}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-300">{p.score}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Court Chat */}
          <div className="royal-glass p-5 rounded-3xl border border-amber-500/30 flex flex-col h-80">
            <h3 className="font-royal text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Court Whispers
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3 text-xs">
              {messages.length === 0 ? (
                <p className="text-slate-500 text-[11px] text-center pt-8">No whispers yet...</p>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-bold text-amber-300">{m.username}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="text-slate-200 break-words">{m.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Whisper to court..."
                maxLength={100}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

// Live quiz card + live leaderboard shown beside the live video (2026-10-28).
// `quiz` comes from GET /api/live-qa/:liveClassId (refreshed every few seconds).

const LETTERS = "ABCDEF";
const MEDAL = ["🥇", "🥈", "🥉"];

const useCountdown = (closesAt, offsetMs) => {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!closesAt) return undefined;
    const tick = () => setLeft(Math.max(0, Math.ceil((new Date(closesAt).getTime() - (Date.now() + offsetMs)) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [closesAt, offsetMs]);
  return left;
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export const Leaderboard = ({ lb, compact = false }) => {
  if (!lb) return null;
  const top = lb.top || [];
  const max = Math.max(1, ...top.map((r) => r.points));
  return (
    <div className="rounded-xl bg-[#0F2A3D] text-white p-3">
      <div className="flex items-center justify-between mb-2">
        <b className="text-sm">🏆 Live leaderboard</b>
        <span className="text-[11px] opacity-70">this class</span>
      </div>
      {top.length === 0 ? (
        <p className="text-xs opacity-80">Answer the teacher's questions to get on the board!</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {top.map((r, i) => (
            <div key={`${r.name}-${i}`} className={`rounded-lg px-2 py-1 ${r.me ? "bg-[#F2A93B] text-[#2A1A00]" : "bg-white/10"}`}>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-6 text-center">{MEDAL[r.rank - 1] || r.rank}</span>
                <span className="flex-1 truncate font-semibold">{r.me ? "You" : r.name}</span>
                <span className="tabular-nums font-bold">{r.points}</span>
              </div>
              {!compact && (
                <div className="h-1 mt-1 rounded bg-white/15 overflow-hidden">
                  <i className="block h-full transition-all duration-700" style={{ width: `${(r.points / max) * 100}%`, background: r.me ? "#0F2A3D" : "#7DC4F0" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {lb.me && !top.some((r) => r.me) && (
        <div className="mt-2 rounded-lg bg-[#F2A93B] text-[#2A1A00] px-2 py-1 text-sm font-semibold">
          You: #{lb.me.rank} of {lb.me.of} · {lb.me.points} pts{lb.me.aheadBy ? ` · ${lb.me.aheadBy} pts to move up` : ""}
        </div>
      )}
    </div>
  );
};

const LiveQuizCard = ({ quiz, offsetMs, onAnswered }) => {
  const poll = quiz?.currentPoll || quiz?.lastPoll || null;
  const left = useCountdown(poll?.open ? poll.closesAt : null, offsetMs);
  const [choice, setChoice] = useState(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setChoice(null);
    setValue("");
    setErr("");
  }, [poll?._id]);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.post(`/live-qa/polls/${poll._id}/answer`, poll.kind === "mcq" ? { choice } : { value });
      onAnswered?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const mine = poll?.myAnswer;
  const live = poll?.open && left > 0;

  return (
    <div className="flex flex-col gap-3">
      {!poll && (
        <div className="rounded-xl bg-[#F6F8FA] p-3 text-sm text-gray-600">
          When the teacher asks a question, it pops up here. Answer fast — correct + quick = more points!
        </div>
      )}
      {poll && (
        <div className={`rounded-xl p-3 border-2 ${live ? "border-[#F2A93B] bg-[#FFF8EC]" : "border-[#E3E8EE] bg-white"}`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-[#9A5B00]">🎯 {live ? "Question from teacher" : "Last question"} · {poll.points} pts</span>
            {live ? (
              <span className={`tabular-nums text-sm ${left <= 10 ? "text-[#B42318]" : "text-[#13202B]"}`}>⏱ {fmt(left)}</span>
            ) : (
              <span className="text-gray-500">Time up</span>
            )}
          </div>
          <div className="text-[15px] font-semibold mb-2 break-words">{poll.text || "Answer the question on the screen."}</div>

          {poll.kind === "mcq" ? (
            <div className="grid grid-cols-2 gap-1.5">
              {poll.options.map((o, i) => {
                const picked = mine ? mine.choice === i : choice === i;
                const right = !live && poll.correctIndex === i;
                const bg = right ? "#2E9E5B" : picked ? "#1F4E78" : "#ffffff";
                const fg = right || picked ? "#ffffff" : "#13202B";
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!live || !!mine}
                    onClick={() => setChoice(i)}
                    className="rounded-lg border border-[#D5DCE4] px-2 py-2 text-left text-sm font-semibold disabled:cursor-default"
                    style={{ background: bg, color: fg }}
                  >
                    {LETTERS[i]}{o ? `. ${o}` : ""}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              inputMode="decimal"
              disabled={!live || !!mine}
              value={mine ? String(mine.value ?? "") : value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type your answer (number)"
              className="w-full border border-[#D5DCE4] rounded-lg px-3 py-2 text-sm"
            />
          )}

          {live && !mine && (
            <button
              type="button"
              disabled={busy || (poll.kind === "mcq" ? choice === null : value.trim() === "")}
              onClick={submit}
              className="mt-2 w-full rounded-lg py-2 text-sm font-bold bg-[#F2A93B] text-[#2A1A00] disabled:opacity-40"
            >
              Lock my answer
            </button>
          )}
          {live && mine && <p className="mt-2 text-sm font-semibold text-[#1F4E78]">✓ Answer locked. Result when time is up.</p>}
          {!live && mine && (
            <p className={`mt-2 text-sm font-bold ${mine.correct ? "text-[#1E7B47]" : "text-[#B42318]"}`}>
              {mine.correct ? `✅ Correct! +${mine.points} pts` : `❌ Not correct${poll.kind === "numeric" ? ` — answer: ${poll.correctValue}` : ""} · +${mine.points} pt for trying`}
            </p>
          )}
          {!live && !mine && (
            <p className="mt-2 text-sm text-gray-600">
              You didn't answer this one.{poll.kind === "numeric" && poll.correctValue !== undefined ? ` Answer: ${poll.correctValue}` : ""}
            </p>
          )}
          {err && <p className="mt-1 text-xs text-[#B42318]">{err}</p>}
        </div>
      )}
      <Leaderboard lb={quiz?.leaderboard} />
    </div>
  );
};

export default LiveQuizCard;

import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import api from "../../../../api/axios";

// Admin → Live Q&A (2026-10-28).
// Keep this open on your phone or a second screen while teaching. Questions
// from students watching the live class appear within ~3 seconds.
//   • Answered / Pin (shows on every student's screen) / Hide
//   • "Same doubt" votes put the most-asked questions on top
//   • "Confused now" = students who tapped "I didn't understand" in the last 2 minutes
//   • After class: open questions stay here — type a reply and students see it.

const POLL_MS = 3000;
const timeOf = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const dayOf = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const Btn = ({ onClick, children, tone = "plain" }) => {
  const tones = {
    plain: "bg-[#EEF1F4] text-[#13202B]",
    green: "bg-[#2E9E5B] text-white",
    amber: "bg-[#F2A93B] text-[#2A1A00]",
    grey: "bg-[#D5DCE4] text-[#3A4754]",
  };
  return (
    <button type="button" onClick={onClick} className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 ${tones[tone]}`}>
      {children}
    </button>
  );
};

// ── Live quiz: ask a question, watch answers come in, close, see the board ──
const LETTERS = "ABCDEF";
const TIME_CHOICES = [[30, "30 sec"], [60, "1 min"], [120, "2 min"], [180, "3 min"], [300, "5 min"], [600, "10 min"]];
const MEDAL = ["🥇", "🥈", "🥉"];

const useLeft = (closesAt) => {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!closesAt) return undefined;
    const tick = () => setLeft(Math.max(0, Math.ceil((new Date(closesAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [closesAt]);
  return left;
};

const PollStats = ({ poll, onClose }) => {
  const left = useLeft(poll.open ? poll.closesAt : null);
  const st = poll.stats || { answered: 0, correct: 0, choices: {} };
  const pctRight = st.answered ? Math.round((st.correct / st.answered) * 100) : 0;
  return (
    <div className={`rounded-xl border-2 p-3 ${poll.open ? "border-[#F2A93B] bg-[#FFF8EC]" : "border-[#E3E8EE]"}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <b className="flex-1 min-w-[200px]">{poll.text || "(question on screen)"}</b>
        {poll.open ? <span className="font-bold tabular-nums">⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span> : <span className="text-gray-500">Closed</span>}
        {poll.open && <Btn tone="amber" onClick={onClose}>Close now & show answer</Btn>}
      </div>
      <div className="text-sm mt-1">
        <b>{st.answered}</b> answered · <b style={{ color: pctRight >= 60 ? "#1E7B47" : "#B42318" }}>{pctRight}% correct</b>
        {poll.kind === "numeric" && <span className="text-gray-500"> · answer {poll.correctValue}{poll.tolerance ? ` ± ${poll.tolerance}` : ""}</span>}
      </div>
      {poll.kind === "mcq" && (
        <div className="flex flex-col gap-1 mt-2">
          {poll.options.map((o, i) => {
            const n = st.choices[i] || 0;
            const w = st.answered ? (n / st.answered) * 100 : 0;
            return (
              <div key={i} className="grid items-center gap-2 text-sm" style={{ gridTemplateColumns: "28px 1fr 40px" }}>
                <b style={{ color: i === poll.correctIndex ? "#1E7B47" : undefined }}>{LETTERS[i]}{i === poll.correctIndex ? "✓" : ""}</b>
                <div className="h-4 rounded bg-[#EEF1F4] overflow-hidden"><i className="block h-full" style={{ width: `${w}%`, background: i === poll.correctIndex ? "#2E9E5B" : "#7DC4F0" }} /></div>
                <span className="tabular-nums text-right">{n}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const QuizComposer = ({ liveClassId, onStarted }) => {
  const [kind, setKind] = useState("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [correctValue, setCorrectValue] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [timeLimitSec, setTime] = useState(60);
  const [points, setPoints] = useState(10);
  const [busy, setBusy] = useState(false);
  const ready = kind === "mcq" ? correctIndex !== null : correctValue.trim() !== "";
  const start = async () => {
    setBusy(true);
    try {
      await api.post(`/live-qa/${liveClassId}/polls`, { kind, text, options, correctIndex, correctValue, tolerance, timeLimitSec, points });
      toast.success("Question sent to students.");
      setText("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(null);
      setCorrectValue("");
      setTolerance("");
      onStarted();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not start.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-[#E3E8EE] p-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <b className="mr-auto">🎯 Ask the class a question</b>
        {[["mcq", "MCQ (A/B/C/D)"], ["numeric", "Number answer (sums)"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${kind === k ? "bg-[#1F4E78] text-white" : "bg-[#EEF1F4]"}`}>{l}</button>
        ))}
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} className="border rounded-lg p-2 text-sm" placeholder="Question (optional — leave blank if it's on your screen/board)" />
      {kind === "mcq" ? (
        <div className="grid sm:grid-cols-2 gap-1.5">
          {options.map((o, i) => (
            <label key={i} className={`flex items-center gap-2 rounded-lg border p-1.5 text-sm ${correctIndex === i ? "border-[#2E9E5B] bg-[#DDF3E5]" : ""}`}>
              <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
              <b>{LETTERS[i]}</b>
              <input value={o} onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} className="flex-1 min-w-0 border rounded p-1" placeholder="option text (optional)" />
            </label>
          ))}
          <span className="text-xs text-gray-500 sm:col-span-2">Tick the correct option.</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <label>Correct answer <input inputMode="decimal" value={correctValue} onChange={(e) => setCorrectValue(e.target.value)} className="border rounded p-1.5 w-28 ml-1" /></label>
          <label>Accept ± <input inputMode="decimal" value={tolerance} onChange={(e) => setTolerance(e.target.value)} className="border rounded p-1.5 w-20 ml-1" placeholder="0" /></label>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <label>Time <select value={timeLimitSec} onChange={(e) => setTime(Number(e.target.value))} className="border rounded p-1.5 ml-1">{TIME_CHOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>Points <input type="number" min={1} max={100} value={points} onChange={(e) => setPoints(Number(e.target.value))} className="border rounded p-1.5 w-16 ml-1" /></label>
        <button type="button" disabled={!ready || busy} onClick={start} className="ml-auto px-4 py-2 rounded-lg bg-[#F2A93B] text-[#2A1A00] font-bold disabled:opacity-40">Send to students</button>
      </div>
    </div>
  );
};

const FullLeaderboard = ({ liveClassId, classRows }) => {
  const [scope, setScope] = useState("class");
  const [dayData, setDayData] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (scope !== "day") return;
    api.get(`/live-qa/${liveClassId}/leaderboard?scope=day`).then((r) => setDayData(r.data?.data)).catch(() => toast.error("Could not load today's board."));
  }, [scope, liveClassId]);
  const rows = scope === "class" ? classRows || [] : dayData?.rows || [];
  const max = Math.max(1, ...rows.map((r) => r.points));
  const download = async () => {
    try {
      const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#0F2A3D" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `Leaderboard_${scope}.png`;
      a.click();
    } catch {
      toast.error("Could not make the image. Take a screenshot instead.");
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <b className="mr-auto">🏆 Leaderboard</b>
        {[["class", "This class"], ["day", "Today (all classes)"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setScope(k)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scope === k ? "bg-[#1F4E78] text-white" : "bg-[#EEF1F4]"}`}>{l}</button>
        ))}
        <Btn tone="amber" onClick={download}>⬇ Image for WhatsApp</Btn>
      </div>
      <div ref={ref} className="rounded-2xl bg-[#0F2A3D] text-white p-4">
        <div className="text-lg font-bold mb-2">🏆 {scope === "class" ? "Live class leaderboard" : `Today's leaderboard${dayData ? ` · ${dayData.classes} class(es)` : ""}`}</div>
        {rows.length === 0 && <p className="text-sm opacity-80">No points yet.</p>}
        <div className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <div key={r.userId} className="grid items-center gap-2 text-sm" style={{ gridTemplateColumns: "34px minmax(90px,180px) 1fr 52px" }}>
              <span className="text-center font-bold">{MEDAL[r.rank - 1] || r.rank}</span>
              <span className="truncate font-semibold">{r.name}</span>
              <div className="h-3 rounded bg-white/15 overflow-hidden"><i className="block h-full" style={{ width: `${(r.points / max) * 100}%`, background: r.rank <= 3 ? "#F2A93B" : "#7DC4F0" }} /></div>
              <span className="text-right font-bold tabular-nums">{r.points}</span>
            </div>
          ))}
        </div>
        {rows.length > 0 && <div className="text-[11px] opacity-70 mt-2">Correct answer = points + speed bonus · try = 1 · good questions & "same doubt" votes earn extra</div>}
      </div>
    </div>
  );
};

const Board = ({ liveClassId, onBack }) => {
  const [board, setBoard] = useState(null);
  const [filter, setFilter] = useState("open");
  const [sort, setSort] = useState("votes");
  const [big, setBig] = useState(false);
  const [replyFor, setReplyFor] = useState(null);
  const [reply, setReply] = useState("");

  const load = useCallback(
    () => api.get(`/live-qa/${liveClassId}`).then((r) => setBoard(r.data?.data)).catch(() => {}),
    [liveClassId]
  );
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const patch = async (q, body) => {
    try {
      await api.patch(`/live-qa/questions/${q._id}`, body);
      load();
    } catch {
      toast.error("Could not save.");
    }
  };

  if (!board) return <p className="text-gray-500">Loading…</p>;
  const all = board.questions;
  const counts = { open: 0, answered: 0, hidden: 0 };
  all.forEach((q) => (counts[q.status] += 1));
  let list = filter === "all" ? all : all.filter((q) => q.status === filter);
  list = [...list].sort((a, b) =>
    sort === "votes" ? b.pinned - a.pinned || b.votes - a.votes || new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)
  );
  const conf = board.confusedNow || 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className="text-sm underline text-[#1F4E78]">← All classes</button>
        <h2 className="text-xl font-bold flex-1 min-w-[200px]">{board.liveClass.title}</h2>
        {board.liveClass.live ? (
          <span className="text-xs font-bold bg-[#D93A2B] text-white rounded-full px-2.5 py-1">● LIVE</span>
        ) : (
          <span className="text-xs font-bold bg-[#EEF1F4] rounded-full px-2.5 py-1">Ended</span>
        )}
      </div>

      <div
        className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ background: conf >= 5 ? "#FDE3E1" : conf > 0 ? "#FFF1C9" : "#DDF3E5", color: conf >= 5 ? "#B42318" : conf > 0 ? "#7A5200" : "#1E7B47" }}
      >
        <span className="text-3xl font-bold tabular-nums">{conf}</span>
        <span className="font-semibold">{conf === 1 ? "student" : "students"} didn't understand (last 2 minutes){conf >= 5 ? " — explain that part again" : ""}</span>
        <span className="text-sm opacity-80 ml-auto">{board.totalConfusedTaps || 0} taps this class</span>
      </div>

      <div className="grid xl:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <QuizComposer liveClassId={liveClassId} onStarted={load} />
          {(board.quiz?.polls || []).slice(0, 5).map((p) => (
            <PollStats key={p._id} poll={p} onClose={() => api.post(`/live-qa/polls/${p._id}/close`).then(load).catch(() => toast.error("Could not close."))} />
          ))}
        </div>
        <FullLeaderboard liveClassId={liveClassId} classRows={board.quiz?.fullLeaderboard} />
      </div>

      <h3 className="text-lg font-bold mt-2">💬 Students' questions</h3>
      <div className="flex flex-wrap items-center gap-2">
        {[["open", `Open (${counts.open})`], ["answered", `Answered (${counts.answered})`], ["hidden", `Hidden (${counts.hidden})`], ["all", `All (${all.length})`]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === k ? "bg-[#1F4E78] text-white" : "bg-[#EEF1F4]"}`}>{l}</button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-lg p-1.5 text-sm ml-auto">
          <option value="votes">Most "same doubt" first</option>
          <option value="new">Newest first</option>
        </select>
        <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={big} onChange={(e) => setBig(e.target.checked)} /> Big text</label>
      </div>

      <div className="flex flex-col gap-2">
        {list.length === 0 && <p className="text-gray-500">No questions here.</p>}
        {list.map((q) => (
          <div key={q._id} className={`rounded-xl border p-3 ${q.pinned ? "border-[#F2A93B] bg-[#FFF8EC]" : "border-[#E3E8EE]"}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <b className="text-[#1F4E78] text-sm">{q.name}</b>
              <span>{timeOf(q.createdAt)}</span>
              {q.votes > 0 && <span className="font-semibold text-[#13202B]">👍 {q.votes} same doubt</span>}
              {q.pinned && <span className="font-semibold text-[#9A5B00]">📌 Pinned</span>}
            </div>
            <div className={`${big ? "text-2xl" : "text-base"} mt-1 break-words`}>{q.text}</div>
            {q.reply && <div className="mt-1 text-[#1E7B47]">↳ {q.reply}</div>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {q.status !== "answered" ? <Btn tone="green" onClick={() => patch(q, { status: "answered" })}>✅ Answered</Btn> : <Btn onClick={() => patch(q, { status: "open" })}>Mark open</Btn>}
              <Btn tone="amber" onClick={() => patch(q, { pinned: !q.pinned })}>{q.pinned ? "Unpin" : "📌 Pin for all"}</Btn>
              {q.status !== "hidden" ? <Btn tone="grey" onClick={() => patch(q, { status: "hidden", pinned: false })}>Hide</Btn> : <Btn onClick={() => patch(q, { status: "open" })}>Show again</Btn>}
              <Btn onClick={() => { setReplyFor(q._id); setReply(q.reply || ""); }}>✍ Reply</Btn>
            </div>
            {replyFor === q._id && (
              <div className="flex gap-2 mt-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} className="flex-1 border rounded-lg p-2 text-sm" placeholder="Short written answer — the student sees it under the question" />
                <Btn tone="green" onClick={() => { patch(q, { reply }); setReplyFor(null); }}>Save</Btn>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LiveQaAdminPage = () => {
  const [classes, setClasses] = useState(null);
  const [open, setOpen] = useState(null);
  const loadClasses = () => api.get("/live-qa/admin/classes").then((r) => setClasses(r.data?.data || [])).catch(() => toast.error("Could not load classes."));
  useEffect(() => {
    loadClasses();
  }, []);

  if (open) return <Board liveClassId={open} onBack={() => { setOpen(null); loadClasses(); }} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Live Q&A</h1>
        <p className="text-gray-600 text-sm">Open a class to see students' questions while you teach. Keep this on your phone or a second screen.</p>
      </div>
      {!classes ? (
        <p className="text-gray-500">Loading…</p>
      ) : classes.length === 0 ? (
        <p className="text-gray-500">No live classes in the last 45 days.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {classes.map((c) => (
            <button key={c._id} type="button" onClick={() => setOpen(c._id)} className="text-left rounded-xl border border-[#E3E8EE] hover:border-[#1F4E78] p-3 flex flex-wrap items-center gap-3">
              {c.live ? <span className="text-xs font-bold bg-[#D93A2B] text-white rounded-full px-2.5 py-1">● LIVE</span> : <span className="text-xs text-gray-500 w-14">{dayOf(c.startedAt)}</span>}
              <span className="font-semibold flex-1 min-w-[180px]">{c.title}</span>
              <span className="text-xs text-gray-500">{c.category}</span>
              <span className={`text-sm font-semibold ${c.counts.open ? "text-[#B42318]" : "text-gray-500"}`}>{c.counts.open} open</span>
              <span className="text-sm text-gray-500">{c.counts.answered} answered</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveQaAdminPage;

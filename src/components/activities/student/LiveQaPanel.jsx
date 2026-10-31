import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../api/axios";
import LiveQuizCard from "./LiveQuizCard";

// Live Q&A panel beside the live class video (2026-10-28).
// Students ask questions, tap "Same doubt" on others' questions, and press
// "I didn't understand" — the teacher sees all of it on Dashboard → Live Q&A.
// Updates every 4 seconds while the player is open.

const POLL_MS = 4000;
const timeOf = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const LiveQaPanel = ({ liveClassId }) => {
  const [board, setBoard] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [confusedUntil, setConfusedUntil] = useState(0);
  const [tab, setTab] = useState("quiz"); // quiz | questions
  const [offsetMs, setOffsetMs] = useState(0); // server clock − phone clock
  const lastPollId = useRef(null);
  const listRef = useRef(null);
  const stickToBottom = useRef(true);

  const load = useCallback(
    () =>
      api
        .get(`/live-qa/${liveClassId}`)
        .then((r) => {
          const d = r.data?.data;
          if (d?.serverTime) setOffsetMs(new Date(d.serverTime).getTime() - Date.now());
          // A new question from the teacher → jump to the quiz tab.
          const pid = d?.quiz?.currentPoll?._id || null;
          if (pid && pid !== lastPollId.current) setTab("quiz");
          lastPollId.current = pid;
          setBoard(d);
        })
        .catch(() => {}),
    [liveClassId]
  );

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [board?.questions?.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (t.length < 2 || sending) return;
    setSending(true);
    setMsg("");
    try {
      await api.post(`/live-qa/${liveClassId}/questions`, { text: t });
      setText("");
      stickToBottom.current = true;
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send. Check your internet.");
    } finally {
      setSending(false);
    }
  };

  const vote = async (q) => {
    setBoard((b) => ({
      ...b,
      questions: b.questions.map((x) => (x._id === q._id ? { ...x, votedByMe: !x.votedByMe, votes: x.votes + (x.votedByMe ? -1 : 1) } : x)),
    }));
    api.post(`/live-qa/questions/${q._id}/upvote`).catch(() => load());
  };

  const confused = async () => {
    setConfusedUntil(Date.now() + 60000);
    try {
      const r = await api.post(`/live-qa/${liveClassId}/confused`);
      setBoard((b) => (b ? { ...b, ...r.data?.data } : b));
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send.");
    }
  };

  const live = board?.liveClass?.live !== false;
  const questions = board?.questions || [];
  const pinned = questions.filter((q) => q.pinned && q.status !== "hidden");
  const coolingDown = Date.now() < confusedUntil;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white text-[#13202B]">
      <div className="px-2 pt-2 border-b border-[#E3E8EE] flex items-end gap-1">
        {[["quiz", `🏆 Quiz & ranks${board?.quiz?.currentPoll?.open && !board.quiz.currentPoll.myAnswer ? " •" : ""}`], ["questions", "💬 Ask"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-t-lg text-sm font-semibold ${tab === k ? "bg-[#EEF1F4] text-[#1F4E78]" : "text-gray-500"}`}>
            {l}
          </button>
        ))}
        {board?.confusedNow > 0 && <span className="ml-auto pb-1.5 text-xs text-[#9A5B00]">😕 {board.confusedNow}</span>}
      </div>

      {tab === "quiz" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          <LiveQuizCard quiz={board?.quiz} offsetMs={offsetMs} onAnswered={load} />
        </div>
      )}
      {tab === "questions" && (<>

      {pinned.length > 0 && (
        <div className="px-3 py-2 bg-[#FFF4E5] border-b border-[#F2A93B] text-sm">
          {pinned.map((q) => (
            <div key={q._id}>📌 <b>{q.name}:</b> {q.text}{q.reply ? <div className="text-[#1E7B47]">↳ {q.reply}</div> : null}</div>
          ))}
        </div>
      )}

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-2"
      >
        {!board && <p className="text-sm text-gray-500">Loading…</p>}
        {board && questions.length === 0 && <p className="text-sm text-gray-500">No questions yet. Ask anything you didn't follow — the teacher sees it right away.</p>}
        {questions.map((q) => (
          <div key={q._id} className={`rounded-xl px-3 py-2 text-sm ${q.mine ? "bg-[#E8F1F8]" : "bg-[#F6F8FA]"}`}>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-[#1F4E78]">{q.mine ? "You" : q.name}</span>
              <span>{timeOf(q.createdAt)}</span>
              {q.status === "answered" && <span className="text-[#1E7B47] font-semibold">✅ Answered</span>}
              {q.status === "hidden" && <span className="text-gray-400">(hidden by teacher)</span>}
            </div>
            <div className="mt-0.5 break-words">{q.text}</div>
            {q.reply && <div className="mt-1 text-[#1E7B47] break-words">↳ {q.reply}</div>}
            {!q.mine && q.status !== "hidden" && (
              <button
                type="button"
                onClick={() => vote(q)}
                className={`mt-1 text-xs rounded-full px-2 py-0.5 border ${q.votedByMe ? "bg-[#1F4E78] text-white border-[#1F4E78]" : "border-[#D5DCE4] text-[#13202B]"}`}
              >
                👍 Same doubt{q.votes ? ` · ${q.votes}` : ""}
              </button>
            )}
            {q.mine && q.votes > 0 && <div className="mt-1 text-xs text-gray-500">👍 {q.votes} have the same doubt</div>}
          </div>
        ))}
      </div>

      {live ? (
        <div className="border-t border-[#E3E8EE] p-2 flex flex-col gap-2">
          <button
            type="button"
            disabled={coolingDown}
            onClick={confused}
            className="w-full rounded-lg py-2 text-sm font-semibold bg-[#FFF1C9] text-[#7A5200] disabled:opacity-50"
          >
            {coolingDown ? "Teacher has been told 👍" : "😕 I didn't understand this part"}
          </button>
          <form onSubmit={send} className="flex gap-2">
            <input
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your question…"
              className="flex-1 min-w-0 border border-[#D5DCE4] rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" disabled={sending || text.trim().length < 2} className="rounded-lg px-4 py-2 text-sm font-semibold bg-[#1F4E78] text-white disabled:opacity-40">
              Send
            </button>
          </form>
          {msg && <p className="text-xs text-[#B42318]">{msg}</p>}
        </div>
      ) : (
        <p className="border-t border-[#E3E8EE] p-3 text-sm text-gray-500">This class has ended. The teacher can still reply to open questions.</p>
      )}
      </>)}
    </div>
  );
};

export default LiveQaPanel;

import React, { useEffect, useRef, useState } from "react";
import api from "../../../api/axios";

// Attendance check ON TOP OF THE VIDEO (2026-10-31).
// Before, the "I'm present" button was only in the side box, so students
// watching full screen (or with the box scrolled) missed some checks. Now,
// the moment the teacher posts attendance:
//   - a big blinking card covers the video (also in full screen),
//   - the phone vibrates and a soft beep plays every few seconds,
//   - one tap marks them present; a weak network is retried automatically,
//   - then a green "✓ Marked present · 3/4 this class" shows for a moment.
// The server also accepts a tap that arrives up to 15 s late (slow network).

const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!beep.ctx) beep.ctx = new Ctx();
    const ctx = beep.ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {
    /* sound not allowed — the blinking + vibration still work */
  }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const LiveAttendanceOverlay = ({ att, offsetMs = 0, onDone }) => {
  const cur = att?.current || null;
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [markedId, setMarkedId] = useState(null); // shows the green "marked" card
  const [showMarked, setShowMarked] = useState(false);
  const total = cur?.timeLimitSec || 20;

  useEffect(() => {
    if (!cur) return undefined;
    const tick = () =>
      setLeft(Math.max(0, Math.ceil((new Date(cur.closesAt).getTime() - (Date.now() + offsetMs)) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [cur?._id, cur?.closesAt, offsetMs]);

  const waiting = !!cur && !cur.done && left > 0 && markedId !== cur._id;

  // Buzz + beep every 3 s while the check is waiting for this student.
  useEffect(() => {
    if (!waiting) return undefined;
    setErr("");
    const nudge = () => {
      try {
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
      } catch {
        /* ignore */
      }
      beep();
    };
    nudge();
    const t = setInterval(nudge, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, cur?._id]);

  const present = async () => {
    if (!cur || busy) return;
    const id = cur._id;
    setBusy(true);
    setErr("");
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await api.post(`/live-qa/polls/${id}/answer`, { present: true });
        setMarkedId(id);
        setShowMarked(true);
        setTimeout(() => setShowMarked(false), 5000);
        try {
          if (navigator.vibrate) navigator.vibrate(80);
        } catch {
          /* ignore */
        }
        setBusy(false);
        onDone && onDone();
        return;
      } catch (e) {
        const status = e?.response?.status;
        if (status && status < 500) {
          setErr(e.response?.data?.message || "Could not mark.");
          break;
        }
        await wait(1200); // network hiccup — try again by itself
      }
    }
    setBusy(false);
    setErr((m) => m || "No internet right now — tap again.");
  };

  if (waiting) {
    const pct = Math.max(0, Math.min(1, left / total));
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center p-3" style={{ background: "rgba(6,20,38,0.72)" }}>
        <style>{`
          @keyframes adAttRing { 0%,100% { box-shadow: 0 0 0 0 rgba(232,185,74,.95), 0 20px 50px rgba(0,0,0,.5); border-color:#E8B94A; } 50% { box-shadow: 0 0 0 14px rgba(232,185,74,0), 0 20px 50px rgba(0,0,0,.5); border-color:#fff3c4; } }
          @keyframes adAttPulse { 0%,100% { transform: scale(1); background:#C9971F; } 50% { transform: scale(1.05); background:#F2C14E; } }
          .ad-att-card { animation: adAttRing 0.8s ease-in-out infinite; }
          .ad-att-go { animation: adAttPulse 0.8s ease-in-out infinite; }
        `}</style>
        <div className="ad-att-card w-full max-w-sm rounded-3xl border-4 p-4 sm:p-5 text-center" style={{ background: "#0F2A4A", color: "#fff" }}>
          <div className="flex items-center justify-center gap-3">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,.18)" strokeWidth="6" fill="none" />
              <circle
                cx="28" cy="28" r="24" stroke="#E8B94A" strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct)}`}
                transform="rotate(-90 28 28)" style={{ transition: "stroke-dashoffset .25s linear" }}
              />
              <text x="28" y="34" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">{left}</text>
            </svg>
            <div className="text-left">
              <div className="text-lg sm:text-xl font-bold" style={{ color: "#E8B94A" }}>📋 Attendance!</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,.8)" }}>Tap within {left} second{left === 1 ? "" : "s"}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={present}
            disabled={busy}
            className="ad-att-go mt-4 w-full rounded-2xl py-4 text-xl sm:text-2xl font-extrabold"
            style={{ color: "#0F2A4A" }}
          >
            {busy ? "Marking…" : "✋ I'm present"}
          </button>
          {err && <div className="text-sm mt-2" style={{ color: "#FCA5A5" }}>{err}</div>}
        </div>
      </div>
    );
  }

  if (showMarked) {
    return (
      <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 pointer-events-none">
        <div className="rounded-2xl px-4 py-3 text-center shadow-xl" style={{ background: "#DDF3E5", color: "#1E7B47" }}>
          <div className="text-lg font-bold">✓ Marked present</div>
          {att?.total > 0 && (
            <div className="text-sm">
              This class: <b>{att.responded}/{att.total}</b> ({att.percent}%)
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default LiveAttendanceOverlay;

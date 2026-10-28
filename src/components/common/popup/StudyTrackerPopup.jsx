import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { AuthContext } from "../../../context/AuthContext";
import { MathText } from "../../../mathText";
import { StudyBoard, Legend, STATUS_STYLE, fmtDay, pct } from "../../studyTracker/StudyBoard";

// Daily Study Tracker popup (TNPSC JDO, 2026-10-28) — the whole feature lives
// here; there is no separate page. Only for students the admin chose
// (default: every TNPSC JDO student).
//
// When the app opens it shows, in this order, whatever applies:
//   1. "New feature" intro with step-by-step instructions (first time only)
//   2. Missing target dates — the student must fill them (they can't change
//      dates already set; only the admin can)
//   3. A failed check — they must clear it before reporting anything else
//   4. From the reminder time (5:30 PM IST) until today's update is saved:
//      the daily update form
// The navbar "Daily Update" button opens it any time (event "open-study-tracker").
// Inside: Today's update (pick → 10-question check → 75% to save) and My progress.

const SKIP_PATHS = [/^\/attend-exam\//, /^\/profile/, /^\/login/, /^\/signup/];
const SNOOZE_MS = 30 * 60 * 1000;
const POLL_MS = 5 * 60 * 1000;
const STEP_LABELS = { 0.25: "¼ Quarter", 0.5: "½ Half", 0.75: "¾ Three-quarter", 1: "✔ Finished" };

const toAmPm = (hm = "17:30") => {
  const [h, m] = hm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const snoozeKey = (uid) => `studyTrackerSnooze:${uid}`;
const getSnooze = (uid) => {
  try {
    return Number(localStorage.getItem(snoozeKey(uid)) || 0);
  } catch {
    return 0;
  }
};
const setSnooze = (uid) => {
  try {
    localStorage.setItem(snoozeKey(uid), String(Date.now() + SNOOZE_MS));
  } catch {
    /* storage blocked */
  }
};

const Chip = ({ active, onClick, children, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`px-3 py-2 rounded-lg border text-sm font-medium min-h-[40px] ${
      active ? "bg-[#1F4E78] border-[#1F4E78] text-white" : "bg-white border-[#D5DCE4] text-[#13202B] hover:border-[#1F4E78]"
    } disabled:opacity-40`}
  >
    {children}
  </button>
);

const HowItWorks = ({ info }) => (
  <ol className="list-decimal pl-5 space-y-1.5 text-[15px] text-[#13202B]">
    <li>Every day after <b>{toAmPm(info.reminderTime)}</b> this window opens by itself. You can also tap <b>Daily Update</b> at the top any time.</li>
    <li>Pick the <b>subject</b> and the <b>unit</b> you studied today.</li>
    <li>Pick the <b>material</b> (Old notes, New notes, MCQ, PYQ…) and <b>how much</b> of it is finished in total: ¼, ½, ¾ or ✔.</li>
    <li>Tap <b>Start check</b> and answer the {info.quizQuestionCount} questions from that unit.</li>
    <li>Score <b>{info.passPercent}% or more</b> and your progress is saved. Below that, revise and clear the check before you report anything else.</li>
    <li>Repeat for each material you studied today. See everything in <b>My progress</b>.</li>
  </ol>
);

const Shell = ({ eyebrow, title, onClose, closeLabel = "Close", children, tabs }) => (
  <div className="fixed inset-0 z-[1300] bg-black/50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-xl">
      <div className="bg-[#1F4E78] text-white rounded-t-2xl px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest opacity-80">{eyebrow}</div>
          <h2 className="text-xl font-bold mt-1">{title}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5">
            {closeLabel}
          </button>
        )}
      </div>
      {tabs}
      <div className="px-4 sm:px-5 py-4 overflow-y-auto">{children}</div>
    </div>
  </div>
);

const StudyTrackerPopup = () => {
  const { userData } = useContext(AuthContext);
  const location = useLocation();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("update"); // update | progress
  const [introDone, setIntroDone] = useState(false);
  const [tick, setTick] = useState(0);
  // form + check
  const [sel, setSel] = useState({ subject: "", unit: "", material: "", percent: null, topics: "" });
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  // missing dates
  const [newDates, setNewDates] = useState({});

  const isStudent = userData?.role === "student" && userData?.accountType !== "free_trial" && userData?.profileCompleted;
  const uid = userData?._id;
  const skipHere = SKIP_PATHS.some((re) => re.test(location.pathname));

  const load = useCallback(
    () =>
      api
        .get("/study-tracker/me")
        .then((r) => {
          const d = r.data?.data;
          if (!d?.enabled) {
            setInfo(null);
            return null;
          }
          setInfo(d);
          return d;
        })
        .catch(() => null),
    []
  );

  useEffect(() => {
    setInfo(null);
    setOpen(false);
  }, [uid]);

  // Poll every 5 minutes so a student who has the app open at 5:30 PM gets it.
  useEffect(() => {
    if (!isStudent) return undefined;
    const t = setInterval(() => setTick((n) => n + 1), POLL_MS);
    return () => clearInterval(t);
  }, [isStudent]);

  // Decide whether to open by itself.
  useEffect(() => {
    if (!isStudent || !uid || skipHere || open) return;
    let cancelled = false;
    load().then((d) => {
      if (cancelled || !d) return;
      const must = !d.introSeen || d.missingDates.length > 0 || d.pendingCheck;
      const daily = d.reminderDue && Date.now() > getSnooze(uid);
      if (must || daily) {
        setTab("update");
        setOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isStudent, uid, skipHere, tick, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navbar "Daily Update" button.
  useEffect(() => {
    const h = () => {
      load().then((d) => {
        if (!d) return toast.error("The daily update is not open for you.");
        setTab("update");
        setOpen(true);
      });
    };
    window.addEventListener("open-study-tracker", h);
    return () => window.removeEventListener("open-study-tracker", h);
  }, [load]);

  // When a failed check is pending, lock the form onto it.
  useEffect(() => {
    if (info?.pendingCheck && !quiz) {
      const p = info.pendingCheck;
      setSel({ subject: p.subject, unit: p.unit, material: p.material, percent: p.claimedPercent, topics: p.topics || "" });
    }
  }, [info?.pendingCheck]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentMat = useMemo(() => {
    if (!info || !sel.subject || !sel.unit || !sel.material) return 0;
    const u = info.progress.subjects[sel.subject].units.find((x) => x.unit === sel.unit);
    return u?.materials.find((m) => m.material === sel.material)?.percent || 0;
  }, [info, sel]);

  if (!open || !info || skipHere) return null;

  const close = () => {
    setOpen(false);
    setQuiz(null);
    setResult(null);
    if (info.reminderDue) setSnooze(uid);
  };

  // ── 1. Intro ──
  if (!info.introSeen && !introDone) {
    const finish = () => {
      api.post("/study-tracker/me/intro-seen").catch(() => {});
      setIntroDone(true);
      setInfo((i) => ({ ...i, introSeen: true }));
    };
    return (
      <Shell eyebrow="New feature" title="Your Daily Study Update is here">
        <p className="text-[15px] mb-3">
          From today you report what you studied <b>inside the app</b> every day. Each report is checked with a short quiz from your own notes and MCQs, so your progress shows what you really know.
        </p>
        <div className="rounded-xl bg-[#F6F8FA] p-3 mb-4"><HowItWorks info={info} /></div>
        <div className="flex justify-end">
          <button type="button" onClick={finish} className="px-5 py-3 rounded-xl bg-[#F2A93B] text-[#2A1A00] font-bold">I understand, continue</button>
        </div>
      </Shell>
    );
  }

  // ── 2. Missing target dates ──
  if (info.missingDates.length > 0) {
    const today = info.today;
    const allFilled = info.missingDates.every((m) => newDates[m.key]);
    const save = async () => {
      setBusy(true);
      try {
        await api.post("/study-tracker/me/plan", { dates: newDates });
        toast.success("Target dates saved.");
        setNewDates({});
        await load();
      } catch (e) {
        toast.error(e.response?.data?.message || "Could not save your dates.");
      } finally {
        setBusy(false);
      }
    };
    return (
      <Shell eyebrow="Action needed" title="Give your target dates">
        <p className="text-[15px] mb-1">These units don't have a target date yet. Pick the date you will <b>finish all materials</b> of each one.</p>
        <p className="text-sm text-[#9A5B00] mb-3">Choose carefully — once saved, only the academy can change a date.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {info.missingDates.map((m) => (
            <label key={m.key} className="flex items-center justify-between gap-2 rounded-lg bg-[#F6F8FA] px-3 py-2 text-sm">
              <span className="min-w-0"><span className="text-xs text-gray-500 block">{m.subject === "Language" ? "English" : m.subject}</span>{m.label}</span>
              <input type="date" min={today} max={m.maxDate} value={newDates[m.key] || ""} onChange={(e) => setNewDates((d) => ({ ...d, [m.key]: e.target.value }))} className="border rounded p-1.5" />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 mt-4">
          {!allFilled && <span className="text-sm text-gray-600">{info.missingDates.filter((m) => !newDates[m.key]).length} left</span>}
          <button type="button" disabled={!allFilled || busy} onClick={save} className="px-5 py-3 rounded-xl bg-[#1F4E78] text-white font-bold disabled:opacity-40">Save my dates</button>
        </div>
      </Shell>
    );
  }

  // ── 3/4. Update + check + progress ──
  const syllabus = info.syllabus;
  const pending = info.pendingCheck;
  const units = sel.subject ? syllabus.units[sel.subject] : [];
  const materials = sel.subject ? syllabus.materials[sel.subject] : [];
  const ready = sel.subject && sel.unit && sel.material && sel.percent;
  const todayCount = info.todayLog?.entries?.length || 0;

  const start = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await api.post("/study-tracker/me/check/start", sel);
      const d = r.data?.data;
      if (d?.noQuestions) {
        toast.success("Saved. (No check questions are linked to this unit yet.)");
        setSel((s) => ({ ...s, material: "", percent: null, topics: "" }));
        await load();
      } else {
        setQuiz(d);
        setAnswers({});
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not start the check.");
    } finally {
      setBusy(false);
    }
  };
  const pick = (q, i) =>
    setAnswers((a) => {
      if (q.questionType === "MSQ") {
        const cur = a[q._id] || [];
        return { ...a, [q._id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
      }
      return { ...a, [q._id]: [i] };
    });
  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.post("/study-tracker/me/check/submit", {
        attemptId: quiz.attemptId,
        answers: quiz.questions.map((q) => ({ questionId: q._id, indexes: answers[q._id] || [] })),
      });
      setResult(r.data?.data);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not submit.");
    } finally {
      setBusy(false);
    }
  };
  const nextMaterial = () => {
    setQuiz(null);
    setResult(null);
    setSel((s) => ({ ...s, material: "", percent: null, topics: "" }));
  };

  const tabs = !quiz ? (
    <div className="flex gap-1 px-4 pt-3 border-b border-[#EEF1F4]">
      {[["update", "Today's update"], ["progress", "My progress"]].map(([k, l]) => (
        <button key={k} type="button" onClick={() => setTab(k)} className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${tab === k ? "bg-[#EEF1F4] text-[#1F4E78]" : "text-gray-500"}`}>
          {l}
        </button>
      ))}
    </div>
  ) : null;

  // ── The check ──
  if (quiz) {
    const review = result ? new Map(result.review.map((r) => [String(r.questionId), r])) : null;
    const answered = quiz.questions.filter((q) => (answers[q._id] || []).length).length;
    return (
      <Shell eyebrow={`Check · pass mark ${quiz.passPercent}%`} title={`${sel.unit} · ${sel.material}`}>
        {result && (
          result.passed ? (
            <div className="mb-4 rounded-2xl p-4 bg-[#DDF3E5] text-[#1E7B47]">
              <div className="text-2xl font-bold">🎉 Well done! {result.scorePercent}%</div>
              <div className="mt-1">{result.correct} of {result.total} correct. Your progress for <b>{sel.unit} · {sel.material}</b> is saved.</div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={nextMaterial} className="px-4 py-2.5 rounded-xl bg-[#1F4E78] text-white font-semibold">Add another material</button>
                <button type="button" onClick={() => { nextMaterial(); setTab("progress"); }} className="px-4 py-2.5 rounded-xl border border-[#1E7B47] font-semibold">See my progress</button>
                <button type="button" onClick={close} className="px-4 py-2.5 rounded-xl border border-[#D5DCE4] font-semibold text-[#13202B]">Done for today</button>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-2xl p-4 bg-[#FFF4E5] text-[#7A4100] border border-[#F2A93B]">
              <div className="text-xl font-bold">📖 Not cleared yet — {result.scorePercent}%</div>
              <p className="mt-1">
                You got {result.correct} of {result.total}. You need <b>{result.passPercent}%</b>. Go back to your <b>{sel.material}</b> for <b>{sel.unit}</b>, revise the questions you missed (correct answers are in green below), then take the check again.
              </p>
              <p className="mt-1 text-sm">You must clear this check before you can report anything else.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" disabled={busy} onClick={start} className="px-4 py-2.5 rounded-xl bg-[#F2A93B] text-[#2A1A00] font-bold">I've revised — try again</button>
                <button type="button" onClick={close} className="px-4 py-2.5 rounded-xl border border-[#D5DCE4] font-semibold text-[#13202B]">Revise now, try later</button>
              </div>
            </div>
          )
        )}
        <div className="flex flex-col gap-5">
          {quiz.questions.map((q, qi) => {
            const rv = review?.get(String(q._id));
            return (
              <div key={q._id} className="border-b border-[#EEF1F4] pb-4">
                <div className="font-semibold mb-2 flex gap-2">
                  <span>{qi + 1}.</span>
                  <div className="min-w-0"><MathText text={q.questionText} /></div>
                </div>
                {q.image && <img src={q.image} alt="" className="max-h-40 mb-2" />}
                {q.questionType === "MSQ" && <p className="text-xs text-gray-500 italic mb-1">Select all that apply.</p>}
                <div className="grid sm:grid-cols-2 gap-2">
                  {(q.options || []).map((opt, i) => {
                    const text = typeof opt === "object" && opt !== null ? opt.text : opt;
                    const img = typeof opt === "object" && opt !== null ? opt.image : null;
                    const chosen = (answers[q._id] || []).includes(i);
                    const right = rv?.correctIndexes?.includes(i);
                    const bg = rv ? (right ? "#DDF3E5" : chosen ? "#FDE3E1" : "#fff") : chosen ? "#E8F1F8" : "#fff";
                    const border = rv ? (right ? "#2E9E5B" : chosen ? "#D93A2B" : "#D5DCE4") : chosen ? "#1F4E78" : "#D5DCE4";
                    return (
                      <button key={i} type="button" disabled={!!result} onClick={() => pick(q, i)} className="text-left rounded-xl border p-3 flex gap-2 items-start" style={{ background: bg, borderColor: border }}>
                        <b>{String.fromCharCode(65 + i)}.</b>
                        <span className="min-w-0"><MathText text={text} />{img && <img src={img} alt="" className="max-h-20 mt-1" />}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {!result && (
          <div className="sticky bottom-0 bg-white pt-3 flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy} onClick={submit} className="px-5 py-3 rounded-xl bg-[#1F4E78] text-white font-bold disabled:opacity-50">Submit answers</button>
            <span className="text-sm text-gray-600">{answered} of {quiz.questions.length} answered</span>
          </div>
        )}
      </Shell>
    );
  }

  // ── Progress tab ──
  if (tab === "progress") {
    const items = [...info.progress.items].sort((a, b) => {
      const rank = { overdue: 0, due_soon: 1, in_progress: 2, not_started: 3, done_late: 4, done_on_time: 5, done: 6 };
      return (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || String(a.target).localeCompare(String(b.target));
    });
    return (
      <Shell eyebrow="TNPSC JDO" title="My progress" onClose={close} tabs={tabs}>
        <div className="flex flex-col gap-4">
          <Legend />
          <StudyBoard progress={info.progress} tests={info.tests} />
          <p className="text-xs text-gray-500">Test average = marks ÷ {info.testTotalMarks} for each test (latest attempt).</p>
          <div>
            <h3 className="font-bold mb-2">My target dates</h3>
            <div className="flex flex-col gap-1.5">
              {items.map((it) => {
                const st = STATUS_STYLE[it.status] || STATUS_STYLE.not_started;
                const note =
                  it.status === "overdue" ? `${it.days} day(s) late` :
                  it.status === "due_soon" ? (it.days === 0 ? "due today" : `due in ${it.days} day(s)`) :
                  it.status === "done_late" ? `finished ${it.days} day(s) late` : st.label;
                return (
                  <div key={`${it.subject}-${it.unit}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F6F8FA] px-3 py-2 text-sm">
                    <span className="font-medium flex-1 min-w-[150px]">{it.unit}</span>
                    <span className="text-gray-600 tabular-nums">{fmtDay(it.target)} · {pct(it.percent)}</span>
                    <span className="text-xs font-semibold rounded-md px-2 py-1" style={{ background: st.bg, color: st.fg }}>{note}</span>
                    {it.missing?.length > 0 && <span className="text-xs text-gray-600 w-full">Still to do: {it.missing.join(", ")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Update tab ──
  return (
    <Shell
      eyebrow={pending ? "Clear your pending check" : `Daily update · after ${toAmPm(info.reminderTime)}`}
      title={pending ? "Finish this check to move on" : "What did you study today?"}
      onClose={close}
      closeLabel={pending ? "Revise first" : info.reminderDue ? "Remind me later" : "Close"}
      tabs={tabs}
    >
      <div className="flex flex-col gap-4">
        <div className={`rounded-xl px-4 py-2 text-sm font-semibold ${todayCount ? "bg-[#DDF3E5] text-[#1E7B47]" : "bg-[#FDE3E1] text-[#B42318]"}`}>
          {todayCount ? `✔ ${todayCount} update(s) saved today — add more if you studied more.` : "No update saved today yet."}
          {info.progress.counts.overdue > 0 && <span className="block text-[#B42318]">{info.progress.counts.overdue} unit(s) are past the target date.</span>}
        </div>

        {pending ? (
          <div className="rounded-2xl border border-[#F2A93B] bg-[#FFF4E5] p-4 text-[#7A4100]">
            <div className="font-bold text-lg">📖 {pending.unit} · {pending.material} ({pct(pending.claimedPercent)})</div>
            <p className="mt-1">Last time you scored {pending.scorePercent}% — you need {pending.passPercent}%. Revise this material and take the check again. You can report other materials only after you clear this one.</p>
            <button type="button" disabled={busy} onClick={start} className="mt-3 px-5 py-3 rounded-xl bg-[#F2A93B] text-[#2A1A00] font-bold">I've revised — start the check</button>
          </div>
        ) : (
          <>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">1. Subject</div>
              <div className="flex flex-wrap gap-2">
                {syllabus.subjects.map((s) => (
                  <Chip key={s} active={sel.subject === s} onClick={() => setSel({ subject: s, unit: "", material: "", percent: null, topics: "" })}>{syllabus.labels[s]}</Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">2. Unit</div>
              <select className="w-full sm:w-96 border border-[#D5DCE4] rounded-lg p-2.5 bg-white" value={sel.unit} disabled={!sel.subject} onChange={(e) => setSel((s) => ({ ...s, unit: e.target.value, material: "", percent: null }))}>
                <option value="">{sel.subject ? "Choose the unit" : "Pick a subject first"}</option>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">3. Material</div>
              <div className="flex flex-wrap gap-2">
                {materials.map((m) => (
                  <Chip key={m} disabled={!sel.unit} active={sel.material === m} onClick={() => setSel((s) => ({ ...s, material: m, percent: null }))}>{m}</Chip>
                ))}
                {!sel.subject && <span className="text-sm text-gray-400">Pick a subject first</span>}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                4. How much is finished in total?
                {currentMat > 0 && <span className="normal-case tracking-normal font-normal"> (saved so far: {pct(currentMat)})</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {syllabus.steps.map((p) => (
                  <Chip key={p} disabled={!sel.material || p <= currentMat} active={sel.percent === p} onClick={() => setSel((s) => ({ ...s, percent: p }))}>{STEP_LABELS[p]}</Chip>
                ))}
              </div>
            </div>
            <input className="w-full border border-[#D5DCE4] rounded-lg p-2.5" placeholder="Topics covered (optional)" value={sel.topics} maxLength={300} onChange={(e) => setSel((s) => ({ ...s, topics: e.target.value }))} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={!ready || busy} onClick={start} className="px-5 py-3 rounded-xl bg-[#1F4E78] text-white font-bold disabled:opacity-40">Start check ({info.quizQuestionCount} questions)</button>
              <span className="text-sm text-gray-600">Score {info.passPercent}% or more to save it.</span>
            </div>
            <details className="rounded-xl bg-[#F6F8FA] p-3">
              <summary className="cursor-pointer font-semibold text-sm">How it works</summary>
              <div className="mt-2"><HowItWorks info={info} /></div>
            </details>
          </>
        )}
      </div>
    </Shell>
  );
};

export default StudyTrackerPopup;

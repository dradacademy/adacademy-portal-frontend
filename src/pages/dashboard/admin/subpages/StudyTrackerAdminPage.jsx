import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import api from "../../../../api/axios";
import { StudyBoard, Legend, fmtDay, pct } from "../../../../components/studyTracker/StudyBoard";

// Admin → Study Tracker (TNPSC JDO daily study tracker, 2026-10-28).
// Students use only the in-app popup (components/common/popup/StudyTrackerPopup.jsx).
// Tabs:
//   Today      — whole-class summary, ready to screenshot / download as images
//   Student    — one student's full detail, reports, checks, target dates
//   Students   — who gets the feature (tick list)
//   Questions  — which question-bank subtopics feed each unit's check
//   Settings   — pass mark, number of questions, reminder time, test subjects, import
// Data: /api/study-tracker/admin/*

const IST_TODAY = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const daysTo = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const Tab = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-semibold text-sm ${active ? "bg-[#1F4E78] text-white" : "bg-[#EEF1F4] text-[#13202B] hover:bg-[#E3E8EE]"}`}
  >
    {children}
  </button>
);

// ─────────────────────────── Today (summary) ───────────────────────────
const SummaryTab = ({ onOpenStudent }) => {
  const [day, setDay] = useState(IST_TODAY());
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const pagesRef = useRef([]);

  useEffect(() => {
    setData(null);
    api
      .get(`/study-tracker/admin/summary?day=${day}`)
      .then((r) => setData(r.data?.data))
      .catch(() => toast.error("Could not load the summary."));
  }, [day]);

  const rows = data?.rows || [];
  const notUpdated = rows.filter((r) => !r.updatedToday);
  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < rows.length; i += 2) out.push(rows.slice(i, i + 2));
    return out;
  }, [rows]);

  const download = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < pages.length; i += 1) {
        const node = pagesRef.current[i];
        if (!node) continue;
        const url = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#0F2A3D" });
        const a = document.createElement("a");
        a.href = url;
        a.download = `JDO_Progress_${day}_${i + 1}.png`;
        a.click();
      }
      toast.success(`${pages.length} image(s) downloaded. Send them to the WhatsApp group with HD on.`);
    } catch {
      toast.error("Could not make the images. Take a screenshot instead.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <p className="text-gray-500">Loading…</p>;

  const gsDays = daysTo(day, data.exams.gs);
  const civilDays = daysTo(day, data.exams.civil);
  const overdueAll = rows.reduce((a, r) => a + r.progress.counts.overdue, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">
          Day{" "}
          <input type="date" value={day} max={IST_TODAY()} onChange={(e) => setDay(e.target.value)} className="border rounded-lg p-2 ml-1" />
        </label>
        <button type="button" disabled={saving || !rows.length} onClick={download} className="px-4 py-2 rounded-lg bg-[#F2A93B] text-[#2A1A00] font-bold disabled:opacity-50">
          {saving ? "Making images…" : "⬇ Download WhatsApp images"}
        </button>
        <span className="text-sm text-gray-600">
          {rows.length} students · {rows.length - notUpdated.length} updated · {overdueAll} overdue unit(s)
        </span>
      </div>

      {/* quick table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 border-b">
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Today</th>
              <th className="py-2 pr-3">Checks</th>
              <th className="py-2 pr-3">GS</th>
              <th className="py-2 pr-3">Civil</th>
              <th className="py-2 pr-3">Apt</th>
              <th className="py-2 pr-3">Tamil</th>
              <th className="py-2 pr-3">Overdue</th>
              <th className="py-2 pr-3">Tests GS / Civil / Apt&Lang</th>
              <th className="py-2 pr-3">Last update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student._id} className="border-b hover:bg-[#F6F8FA] cursor-pointer" onClick={() => onOpenStudent(r.student._id)}>
                <td className="py-2 pr-3 font-semibold text-[#1F4E78] underline">{r.student.username}</td>
                <td className="py-2 pr-3">{r.updatedToday ? <span className="text-[#1E7B47] font-semibold">✔ {r.todayEntries}</span> : <span className="text-[#B42318] font-semibold">No update</span>}</td>
                <td className="py-2 pr-3 tabular-nums">{r.checksToday.passed} pass / {r.checksToday.failed} fail</td>
                {["GS", "Civil", "Aptitude", "Language"].map((s) => (
                  <td key={s} className="py-2 pr-3 tabular-nums">{pct(r.progress.subjects[s].percent)}</td>
                ))}
                <td className="py-2 pr-3 tabular-nums" style={{ color: r.progress.counts.overdue ? "#B42318" : undefined, fontWeight: r.progress.counts.overdue ? 700 : 400 }}>
                  {r.progress.counts.overdue}
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {["GS", "Civil", "Apt & Lang"].map((t) => (r.tests[t].average === null ? "–" : `${r.tests[t].average}%`)).join(" / ")}
                </td>
                <td className="py-2 pr-3">{r.lastUpdate ? fmtDay(r.lastUpdate) : "Never"}{!r.hasPlan && <span className="ml-1 text-xs text-[#9A5B00]">(no target dates)</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* screenshot pages */}
      <p className="text-sm text-gray-600">The pages below are what students see in the WhatsApp group. Screenshot them or use the download button.</p>
      <div className="flex flex-col gap-6 overflow-x-auto">
        {pages.map((pg, pi) => (
          <div key={pi} ref={(el) => (pagesRef.current[pi] = el)} className="bg-[#0F2A3D] p-6 rounded-2xl" style={{ width: 900, minWidth: 900 }}>
            <div className="flex justify-between items-end text-white mb-4">
              <div>
                <div className="text-3xl font-bold">TNPSC JDO · Daily Progress</div>
                <div className="opacity-80 mt-1">{new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Dr. A.D. Academy of Excellence</div>
              </div>
              <div className="flex gap-2">
                <div className="bg-[#F2A93B] text-[#2A1A00] rounded-xl px-3 py-2 text-center font-bold"><div className="text-3xl leading-none">{gsDays}</div><div className="text-xs">days to GS</div></div>
                <div className="bg-[#7DC4F0] text-[#06263A] rounded-xl px-3 py-2 text-center font-bold"><div className="text-3xl leading-none">{civilDays}</div><div className="text-xs">days to Civil</div></div>
              </div>
            </div>
            {pi === 0 && notUpdated.length > 0 && (
              <div className="bg-[#B42318] text-white rounded-xl px-4 py-3 font-semibold mb-3">
                📵 No update: {notUpdated.map((r) => r.student.username).join(", ")} — update between 5:30 and 6:30 PM
              </div>
            )}
            {pi === 0 && <div className="mb-3"><Legend dark /></div>}
            <div className="flex flex-col gap-3">
              {pg.map((r) => (
                <div key={r.student._id} className="bg-white rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-2xl font-bold flex-1">{r.student.username}</h3>
                    {r.updatedToday ? (
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#DDF3E5] text-[#1E7B47]">✔ Updated today</span>
                    ) : (
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#FDE3E1] text-[#B42318]">📵 No update today</span>
                    )}
                    {r.progress.counts.overdue > 0 && <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#B42318] text-white">{r.progress.counts.overdue} overdue</span>}
                  </div>
                  <StudyBoard progress={r.progress} tests={r.tests} />
                </div>
              ))}
            </div>
            <div className="text-white text-center mt-4 opacity-90">A unit turns green only when all materials are done · Keep going! 💪 · Page {pi + 1} of {pages.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────── One student ───────────────────────────
const StudentTab = ({ studentId, students, onPick }) => {
  const [data, setData] = useState(null);
  const [dates, setDates] = useState({});
  const [civilTrack, setCivilTrack] = useState("jdo");
  const [saving, setSaving] = useState(false);
  const [syllabus, setSyllabus] = useState(null);
  const [fix, setFix] = useState({ subject: "GS", unit: "", material: "", percent: 1, day: IST_TODAY() });

  const load = () => {
    if (!studentId) return;
    api.get(`/study-tracker/admin/student/${studentId}`).then((r) => {
      setData(r.data?.data);
      setDates(r.data?.data?.planDates || {});
      setCivilTrack(r.data?.data?.civilTrack || "jdo");
    });
  };
  useEffect(() => {
    setData(null);
    load();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get("/study-tracker/admin/config").then((r) => setSyllabus(r.data?.data?.syllabus)).catch(() => {});
  }, []);

  const savePlan = async () => {
    setSaving(true);
    try {
      await api.put(`/study-tracker/admin/plan/${studentId}`, { dates, civilTrack });
      toast.success("Target dates saved.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };
  const addFix = async () => {
    try {
      await api.post("/study-tracker/admin/entry", { ...fix, studentId });
      toast.success("Added.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not add.");
    }
  };
  const removeEntry = async (id) => {
    await api.delete(`/study-tracker/admin/entry/${id}`);
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <select value={studentId || ""} onChange={(e) => onPick(e.target.value)} className="border rounded-lg p-2 w-72">
        <option value="">Choose a student</option>
        {students.map((s) => (
          <option key={s._id} value={s._id}>{s.username}</option>
        ))}
      </select>
      {!studentId ? null : !data ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="rounded-2xl border p-4">
            <h3 className="text-xl font-bold mb-2">{data.student.username}</h3>
            <Legend />
            <div className="mt-3"><StudyBoard progress={data.progress} tests={data.tests} /></div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-lg font-bold">Target dates (only you can change these)</h3>
              <button type="button" disabled={saving} onClick={savePlan} className="px-4 py-2 rounded-lg bg-[#1F4E78] text-white font-semibold">Save target dates</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
              <b>Civil syllabus:</b>
              {Object.entries(syllabus?.civilTracks || { jdo: { label: "TNPSC JDO Civil" } }).map(([k, t]) => (
                <button key={k} type="button" onClick={() => setCivilTrack(k)} className={`px-3 py-1.5 rounded-lg font-semibold ${civilTrack === k ? "bg-[#1F4E78] text-white" : "bg-[#EEF1F4]"}`}>{t.label}</button>
              ))}
              <span className="text-gray-500">Change, then Save target dates.</span>
            </div>
            {syllabus && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[...syllabus.units.GS.map((u) => ["GS", u]), ...((syllabus.civilTracks?.[civilTrack]?.units) || syllabus.units.Civil).map((u) => ["Civil", u]), ["Aptitude", "Aptitude"], ["Language", "Language"]].map(([s, k]) => (
                  <label key={k} className="flex items-center justify-between gap-2 text-sm bg-[#F6F8FA] rounded-lg px-3 py-1.5">
                    <span className="min-w-0 truncate"><span className="text-xs text-gray-500">{s === "Language" ? "Tamil" : s}</span> {k === "Language" ? "Tamil (all)" : k === "Aptitude" ? "Aptitude (all)" : k}</span>
                    <input type="date" value={dates[k] || ""} onChange={(e) => setDates((d) => ({ ...d, [k]: e.target.value }))} className="border rounded p-1" />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-4">
            <h3 className="text-lg font-bold mb-2">Add a correction</h3>
            {syllabus && (
              <div className="flex flex-wrap gap-2 items-center text-sm">
                <select value={fix.subject} onChange={(e) => setFix((f) => ({ ...f, subject: e.target.value, unit: "", material: "" }))} className="border rounded p-2">
                  {syllabus.subjects.map((s) => <option key={s} value={s}>{syllabus.labels[s]}</option>)}
                </select>
                <select value={fix.unit} onChange={(e) => setFix((f) => ({ ...f, unit: e.target.value }))} className="border rounded p-2">
                  <option value="">Unit</option>
                  {syllabus.units[fix.subject].map((u) => <option key={u}>{u}</option>)}
                </select>
                <select value={fix.material} onChange={(e) => setFix((f) => ({ ...f, material: e.target.value }))} className="border rounded p-2">
                  <option value="">Material</option>
                  {syllabus.materials[fix.subject].map((m) => <option key={m}>{m}</option>)}
                </select>
                <select value={fix.percent} onChange={(e) => setFix((f) => ({ ...f, percent: Number(e.target.value) }))} className="border rounded p-2">
                  {[0.25, 0.5, 0.75, 1].map((p) => <option key={p} value={p}>{pct(p)}</option>)}
                </select>
                <input type="date" value={fix.day} onChange={(e) => setFix((f) => ({ ...f, day: e.target.value }))} className="border rounded p-2" />
                <button type="button" onClick={addFix} disabled={!fix.unit || !fix.material} className="px-3 py-2 rounded-lg bg-[#1F4E78] text-white font-semibold disabled:opacity-40">Add</button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-4 overflow-x-auto">
            <h3 className="text-lg font-bold mb-2">Checks taken</h3>
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-gray-500 border-b"><th className="py-1.5 pr-3">Day</th><th className="pr-3">Unit · Material</th><th className="pr-3">Claimed</th><th className="pr-3">Score</th><th>Result</th></tr></thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr key={a._id} className="border-b">
                    <td className="py-1.5 pr-3">{fmtDay(a.day)}</td>
                    <td className="pr-3">{a.unit} · {a.material}</td>
                    <td className="pr-3">{pct(a.claimedPercent)}</td>
                    <td className="pr-3 tabular-nums">{a.correct}/{a.total} ({a.scorePercent}%)</td>
                    <td className="font-semibold" style={{ color: a.passed ? "#1E7B47" : "#B42318" }}>{a.passed ? "Passed" : "Not passed"}</td>
                  </tr>
                ))}
                {!data.attempts.length && <tr><td colSpan={5} className="py-2 text-gray-500">No checks yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border p-4 overflow-x-auto">
            <h3 className="text-lg font-bold mb-2">Saved progress</h3>
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-gray-500 border-b"><th className="py-1.5 pr-3">Day</th><th className="pr-3">Unit · Material</th><th className="pr-3">Amount</th><th className="pr-3">How</th><th></th></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e._id} className="border-b">
                    <td className="py-1.5 pr-3">{fmtDay(e.day)}</td>
                    <td className="pr-3">{e.unit} · {e.material}{e.topics ? <span className="text-gray-500"> — {e.topics}</span> : null}</td>
                    <td className="pr-3">{pct(e.percent)}</td>
                    <td className="pr-3">{{ quiz: "Passed check", no_quiz: "No check (no questions linked)", migrated: "From old tracker", admin: "Added by admin" }[e.source]}</td>
                    <td><button type="button" onClick={() => removeEntry(e._id)} className="text-xs text-[#B42318] underline">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────── Who gets it ───────────────────────────
const StudentsTab = ({ cfg, reload }) => {
  const [chosen, setChosen] = useState(new Set(cfg.studentIds));
  const [q, setQ] = useState("");
  const list = cfg.candidates.filter((c) => !q || `${c.username} ${c.email} ${c.category}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => setChosen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const save = async () => {
    await api.put("/study-tracker/admin/config", { studentIds: [...chosen] });
    toast.success(`Saved. ${chosen.size} student(s) get the study tracker.`);
    reload();
  };
  const selectJdo = () => setChosen(new Set(cfg.candidates.filter((c) => c.category === "tnpsc-jdo").map((c) => c._id)));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Tick the students who should get the daily popup and My Study Plan page.
        {!cfg.chosenList && " Right now every TNPSC JDO student gets it (nothing saved yet)."}
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or course" className="border rounded-lg p-2 w-72" />
        <button type="button" onClick={selectJdo} className="px-3 py-2 rounded-lg bg-[#EEF1F4] font-semibold text-sm">Tick all TNPSC JDO</button>
        <button type="button" onClick={() => setChosen(new Set())} className="px-3 py-2 rounded-lg bg-[#EEF1F4] font-semibold text-sm">Untick all</button>
        <button type="button" onClick={save} className="px-4 py-2 rounded-lg bg-[#1F4E78] text-white font-semibold">Save ({chosen.size})</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto">
        {list.map((c) => (
          <label key={c._id} className="flex items-center gap-2 rounded-lg bg-[#F6F8FA] px-3 py-2 text-sm cursor-pointer">
            <input type="checkbox" checked={chosen.has(c._id)} onChange={() => toggle(c._id)} />
            <span className="font-medium">{c.username}</span>
            <span className="text-xs text-gray-500 ml-auto">{c.category}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────── Question links ───────────────────────────
const QuestionsTab = ({ cfg, reload }) => {
  const [pools, setPools] = useState(cfg.questionPools || {});
  const [subject, setSubject] = useState("GS");
  const [unit, setUnit] = useState(cfg.syllabus.units.GS[0]);
  const key = (m) => `${subject}::${unit}::${m}`;
  const allSubtopics = useMemo(
    () => cfg.sources.flatMap((s) => s.subtopics.map((t) => ({ subject: String(s._id), subTopic: String(t._id), label: `${s.name} › ${t.name}`, n: t.questions }))),
    [cfg.sources]
  );
  const countFor = (refs) => (refs || []).reduce((a, r) => a + (allSubtopics.find((t) => t.subject === r.subject && t.subTopic === r.subTopic)?.n || 0), 0);
  const toggle = (m, t) =>
    setPools((p) => {
      const cur = p[key(m)] || [];
      const has = cur.some((r) => r.subject === t.subject && r.subTopic === t.subTopic);
      return { ...p, [key(m)]: has ? cur.filter((r) => !(r.subject === t.subject && r.subTopic === t.subTopic)) : [...cur, { subject: t.subject, subTopic: t.subTopic }] };
    });
  const save = async () => {
    await api.put("/study-tracker/admin/config", { questionPools: pools });
    toast.success("Question links saved.");
    reload();
  };
  const [filter, setFilter] = useState("");
  const shown = allSubtopics.filter((t) => !filter || t.label.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        For each unit and material, tick the question-bank subtopics the check should take questions from (MCQ and MSQ only).
        "Old notes" uses the "New notes" questions when nothing is ticked for it.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setUnit(cfg.syllabus.units[e.target.value][0]); }} className="border rounded-lg p-2">
          {cfg.syllabus.subjects.map((s) => <option key={s} value={s}>{cfg.syllabus.labels[s]}</option>)}
        </select>
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="border rounded-lg p-2">
          {cfg.syllabus.units[subject].map((u) => <option key={u}>{u}</option>)}
        </select>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter subtopics" className="border rounded-lg p-2 w-56" />
        <button type="button" onClick={save} className="px-4 py-2 rounded-lg bg-[#1F4E78] text-white font-semibold">Save question links</button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {cfg.syllabus.materials[subject].map((m) => {
          const refs = pools[key(m)] || [];
          const fallback = !refs.length && cfg.syllabus.poolFallback[m] ? pools[key(cfg.syllabus.poolFallback[m])] || [] : null;
          return (
            <div key={m} className="rounded-xl border p-3">
              <div className="flex justify-between mb-2">
                <b>{m}</b>
                <span className="text-sm" style={{ color: (fallback ? countFor(fallback) : countFor(refs)) >= 5 ? "#1E7B47" : "#B42318" }}>
                  {fallback ? `uses New notes: ${countFor(fallback)} questions` : `${countFor(refs)} questions`}
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                {shown.map((t) => (
                  <label key={`${t.subject}-${t.subTopic}`} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={refs.some((r) => r.subject === t.subject && r.subTopic === t.subTopic)} onChange={() => toggle(m, t)} />
                    <span className="flex-1">{t.label}</span>
                    <span className="text-xs text-gray-500">{t.n}</span>
                  </label>
                ))}
                {!shown.length && <span className="text-sm text-gray-500">No TNPSC JDO subtopics found.</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────── Settings + import ───────────────────────────
const SettingsTab = ({ cfg, reload, students }) => {
  const [s, setS] = useState(cfg.settings);
  const [types, setTypes] = useState(cfg.testSubjectTypes || {});
  const [importText, setImportText] = useState("");
  const [mapping, setMapping] = useState({});
  const parsed = useMemo(() => {
    try {
      return importText ? JSON.parse(importText) : null;
    } catch {
      return "bad";
    }
  }, [importText]);
  const oldNames = parsed && parsed !== "bad" ? [...new Set([...(parsed.plans || []).map((p) => p.student), ...(parsed.entries || []).map((e) => e.s)])] : [];
  useEffect(() => {
    if (!oldNames.length) return;
    setMapping((m) => {
      const n = { ...m };
      for (const name of oldNames) {
        if (n[name]) continue;
        const first = name.toLowerCase().split(" ")[0];
        const hit = students.find((st) => st.username.toLowerCase() === name.toLowerCase()) || students.find((st) => st.username.toLowerCase().includes(first));
        if (hit) n[name] = hit._id;
      }
      return n;
    });
  }, [importText]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = async () => {
    await api.put("/study-tracker/admin/config", { settings: s, testSubjectTypes: types });
    toast.success("Settings saved.");
    reload();
  };
  const runImport = async () => {
    try {
      const r = await api.post("/study-tracker/admin/import", { ...parsed, mapping });
      const d = r.data?.data;
      toast.success(`Imported ${d.plans} plan(s) and ${d.entries} report(s).`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Import failed.");
    }
  };
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Study tracker switched on</label>
        <label>Reminder time (IST) <input type="time" value={s.reminderTime} onChange={(e) => setS({ ...s, reminderTime: e.target.value })} className="border rounded p-1 ml-2" /></label>
        <label>Questions per check <input type="number" min={3} max={30} value={s.quizQuestionCount} onChange={(e) => setS({ ...s, quizQuestionCount: Number(e.target.value) })} className="border rounded p-1 ml-2 w-20" /></label>
        <label>Pass mark % <input type="number" min={1} max={100} value={s.passPercent} onChange={(e) => setS({ ...s, passPercent: Number(e.target.value) })} className="border rounded p-1 ml-2 w-20" /></label>
        <label>Test total marks <input type="number" min={1} max={1000} value={s.testTotalMarks} onChange={(e) => setS({ ...s, testTotalMarks: Number(e.target.value) })} className="border rounded p-1 ml-2 w-20" /></label>
        <span />
        <label>GS exam date <input type="date" value={s.gsExamDate} onChange={(e) => setS({ ...s, gsExamDate: e.target.value })} className="border rounded p-1 ml-2" /></label>
        <label>Civil exam date <input type="date" value={s.civilExamDate} onChange={(e) => setS({ ...s, civilExamDate: e.target.value })} className="border rounded p-1 ml-2" /></label>
      </div>
      <div className="rounded-xl border p-4">
        <h3 className="font-bold mb-1">Which test subjects count for test averages</h3>
        <p className="text-sm text-gray-600 mb-2">Test % = marks obtained ÷ test total marks (set above, 50 by default). Latest attempt of each test only.</p>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {cfg.sources.map((src) => (
            <label key={src._id} className="flex items-center justify-between gap-2 text-sm bg-[#F6F8FA] rounded-lg px-3 py-1.5">
              <span>{src.name}</span>
              <select value={types[src._id] || ""} onChange={(e) => setTypes((t) => ({ ...t, [src._id]: e.target.value }))} className="border rounded p-1">
                <option value="">Don't count</option>
                <option>GS</option>
                <option>Civil</option>
                <option>Apt & Lang</option>
              </select>
            </label>
          ))}
        </div>
      </div>
      <button type="button" onClick={saveSettings} className="self-start px-4 py-2 rounded-lg bg-[#1F4E78] text-white font-semibold">Save settings</button>

      <div className="rounded-xl border p-4 flex flex-col gap-2">
        <h3 className="font-bold">Import from the old tracker page</h3>
        <p className="text-sm text-gray-600">Paste the import file Claude gave you, check each name is matched to the right student, then Import. Running it again replaces the earlier import (students' own reports are never touched).</p>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} className="border rounded-lg p-2 font-mono text-xs" placeholder='{"plans":[...],"entries":[...]}' />
        {parsed === "bad" && <span className="text-sm text-[#B42318]">This is not a valid import file.</span>}
        {oldNames.map((name) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <span className="w-40">{name}</span>→
            <select value={mapping[name] || ""} onChange={(e) => setMapping((m) => ({ ...m, [name]: e.target.value }))} className="border rounded p-1">
              <option value="">Skip</option>
              {students.map((st) => <option key={st._id} value={st._id}>{st.username}</option>)}
            </select>
          </label>
        ))}
        {oldNames.length > 0 && (
          <button type="button" onClick={runImport} className="self-start px-4 py-2 rounded-lg bg-[#F2A93B] text-[#2A1A00] font-bold">Import</button>
        )}
      </div>
    </div>
  );
};

const StudyTrackerAdminPage = () => {
  const [tab, setTab] = useState("today");
  const [studentId, setStudentId] = useState("");
  const [cfg, setCfg] = useState(null);
  const loadCfg = () => api.get("/study-tracker/admin/config").then((r) => setCfg(r.data?.data)).catch(() => toast.error("Could not load settings."));
  useEffect(() => {
    loadCfg();
  }, []);
  const students = cfg ? cfg.candidates : [];
  const tracked = cfg ? students.filter((c) => cfg.studentIds.includes(c._id)) : [];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Study Tracker</h1>
        <p className="text-gray-600 text-sm">Daily study updates checked by a short quiz · target dates · test averages</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Tab active={tab === "today"} onClick={() => setTab("today")}>Today</Tab>
        <Tab active={tab === "student"} onClick={() => setTab("student")}>Student detail</Tab>
        <Tab active={tab === "students"} onClick={() => setTab("students")}>Who gets it</Tab>
        <Tab active={tab === "questions"} onClick={() => setTab("questions")}>Question links</Tab>
        <Tab active={tab === "settings"} onClick={() => setTab("settings")}>Settings & import</Tab>
      </div>
      {tab === "today" && <SummaryTab onOpenStudent={(id) => { setStudentId(id); setTab("student"); }} />}
      {tab === "student" && <StudentTab studentId={studentId} students={tracked} onPick={setStudentId} />}
      {tab !== "today" && tab !== "student" && !cfg && <p className="text-gray-500">Loading…</p>}
      {tab === "students" && cfg && <StudentsTab cfg={cfg} reload={loadCfg} />}
      {tab === "questions" && cfg && <QuestionsTab cfg={cfg} reload={loadCfg} />}
      {tab === "settings" && cfg && <SettingsTab cfg={cfg} reload={loadCfg} students={tracked.length ? tracked : students} />}
    </div>
  );
};

export default StudyTrackerAdminPage;

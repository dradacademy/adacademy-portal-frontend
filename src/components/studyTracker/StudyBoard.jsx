import React from "react";

// Daily Study Tracker (TNPSC JDO) — shared colour board used on the student
// page and the admin summary (2026-10-28). Plain hex colours (not Tailwind
// palette colours) so old phones that don't understand oklch() still show them.

export const STATUS_STYLE = {
  done_on_time: { bg: "#2E9E5B", fg: "#ffffff", label: "Finished on time" },
  done: { bg: "#2E9E5B", fg: "#ffffff", label: "Finished" },
  done_late: { bg: "#7BC48F", fg: "#0b3d1d", label: "Finished late" },
  overdue: { bg: "#D93A2B", fg: "#ffffff", label: "Overdue" },
  due_soon: { bg: "#F2A93B", fg: "#2A1A00", label: "Due in 2 days" },
  in_progress: { bg: "#FFF1C9", fg: "#7A5200", label: "Started" },
  not_started: { bg: "#EEF1F4", fg: "#6A7785", label: "Not started" },
};

const SHORT = {
  "General Science": "Sci",
  Geography: "Geo",
  "History (India)": "Hist",
  INM: "INM",
  Polity: "Polity",
  Economy: "Eco",
  "Unit 6 (TN History)": "Unit 6",
};
const MAT_SHORT = {
  "Old notes": "Old",
  "New notes": "New",
  "New notes MCQ": "NN-MCQ",
  "Presentation MCQ": "Pres",
  "MCQ book": "MCQ",
  PYQ: "PYQ",
  "New sums": "Sums",
};

export const pct = (x) => `${Math.round((x || 0) * 100)}%`;

export const fmtDay = (ymd) => {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const Legend = ({ dark = false }) => (
  <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${dark ? "text-white" : "text-[#3A4754]"}`}>
    {["done_on_time", "done_late", "overdue", "due_soon", "in_progress", "not_started"].map((k) => (
      <span key={k} className="flex items-center gap-1.5">
        <i className="inline-block w-3.5 h-3.5 rounded" style={{ background: STATUS_STYLE[k].bg, border: "1px solid #0001" }} />
        {STATUS_STYLE[k].label}
      </span>
    ))}
  </div>
);

const Bar = ({ label, value }) => (
  <div className="grid items-center gap-2" style={{ gridTemplateColumns: "84px 1fr 44px" }}>
    <span className="text-sm text-[#3A4754]">{label}</span>
    <div className="h-2.5 rounded-full bg-[#E3E8EE] overflow-hidden">
      <i className="block h-full" style={{ width: pct(value), background: "linear-gradient(90deg,#2C7BB6,#2E9E5B)" }} />
    </div>
    <b className="text-sm text-right tabular-nums">{pct(value)}</b>
  </div>
);

// progress = buildStudentProgress() output from the backend.
export const StudyBoard = ({ progress, tests, showMissing = true }) => {
  if (!progress) return null;
  const gs = progress.subjects.GS.units;
  const civil = progress.subjects.Civil.units;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[11px] font-semibold tracking-widest uppercase text-[#6A7785] mb-1.5">GS units</div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
          {gs.map((u) => {
            const st = STATUS_STYLE[u.status] || STATUS_STYLE.not_started;
            const missing = u.materials.filter((m) => m.percent < 1).map((m) => MAT_SHORT[m.material] || m.material);
            return (
              <div
                key={u.unit}
                title={`${u.unit} — ${pct(u.percent)}${u.target ? ` · target ${fmtDay(u.target)}` : ""}`}
                className="rounded-lg px-1 py-1.5 text-center min-h-[58px]"
                style={{ background: st.bg, color: st.fg }}
              >
                <div className="text-xs font-bold leading-tight">{SHORT[u.unit] || u.unit}</div>
                <div className="text-base font-bold leading-tight tabular-nums">{pct(u.percent)}</div>
                {showMissing && u.percent > 0 && u.percent < 1 && (u.status === "overdue" || u.status === "due_soon") && (
                  <div className="text-[9px] leading-tight mt-0.5">needs {missing.join(", ")}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-semibold tracking-widest uppercase text-[#6A7785] mb-1.5">Civil units</div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(10, minmax(0,1fr))" }}>
          {civil.map((u, i) => {
            const st = STATUS_STYLE[u.status] || STATUS_STYLE.not_started;
            return (
              <div
                key={u.unit}
                title={`${u.unit} — ${pct(u.percent)}${u.target ? ` · target ${fmtDay(u.target)}` : ""}`}
                className="rounded-md h-9 flex flex-col items-center justify-center"
                style={{ background: st.bg, color: st.fg }}
              >
                <span className="text-xs font-bold leading-none">C{i + 1}</span>
                <span className="text-[10px] leading-none mt-0.5 tabular-nums">{pct(u.percent)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        <Bar label="GS" value={progress.subjects.GS.percent} />
        <Bar label="Civil" value={progress.subjects.Civil.percent} />
        <Bar label="Aptitude" value={progress.subjects.Aptitude.percent} />
        <Bar label="English" value={progress.subjects.Language.percent} />
      </div>
      {tests && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#3A4754]">
          <span>📝 Test average:</span>
          {["GS", "Civil", "Apt & Lang"].map((t) => {
            const v = tests[t]?.average;
            const low = v !== null && v !== undefined && v < 50;
            return (
              <span key={t} className="rounded-md px-2 py-0.5" style={{ background: low ? "#FDE3E1" : "#E8F1F8", color: low ? "#B42318" : "#13202B" }}>
                {t} <b>{v === null || v === undefined ? "–" : `${v}%`}</b>
                {tests[t]?.count ? <span className="text-xs opacity-70"> ({tests[t].count})</span> : null}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudyBoard;

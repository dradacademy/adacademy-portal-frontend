import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getCategoryLabel } from "../../../constants/examCategories";

// Subject → Subtopic → Theory / Problems picker (2026-10-31), shared by
// Go Live, Edit Live, Add/Edit Recording and bulk "Group into subject".
//   - Uses the same Subjects as the test series (Subjects page).
//   - "+ New" next to Subject / Subtopic adds one right here (saved to the
//     Subjects page too), so a new topic taught in live class doesn't need
//     the Subjects page first.
//   - Theory / Problems / Theory + Problems says which part of the
//     subtopic the class covers.
// value = { subject, subtopic, part }   (part: "", "theory", "problems", "both",
// or null = "don't change" when `keepPartOption` is on, for bulk edits).

export const PART_LABELS = { theory: "Theory", problems: "Problems", both: "Theory + Problems" };
export const PART_STYLES = {
  theory: { background: "#e8f0fb", color: "#16365e", border: "1px solid #b9cbe1" },
  problems: { background: "#fdf3dc", color: "#8a6410", border: "1px solid #ecd28f" },
  both: { background: "#eaf6ee", color: "#1d6b3a", border: "1px solid #a9d8b9" },
};
const PART_ICON = { theory: "📘 ", problems: "✏️ ", both: "📘✏️ " };
// Does a class with `part` belong under a Theory / Problems filter? A
// "both" class shows under each.
export const matchesPart = (part, filter) => part === filter || (part === "both" && (filter === "theory" || filter === "problems"));

export const PartBadge = ({ part, className = "" }) =>
  PART_LABELS[part] ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`} style={PART_STYLES[part]}>
      {PART_ICON[part]}
      {PART_LABELS[part]}
    </span>
  ) : null;

const selectCls =
  "border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white text-sm disabled:opacity-60 w-full";
const inputCls = "border border-stone-300 py-2 px-3 focus:outline-stone-300 rounded-xl bg-white text-sm flex-1 min-w-0";

const AddInline = ({ placeholder, onAdd, onCancel, busy }) => {
  const [text, setText] = useState("");
  const submit = () => text.trim() && onAdd(text.trim());
  return (
    <div className="flex gap-2 mt-1">
      <input
        autoFocus
        className={inputCls}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onCancel();
        }}
        disabled={busy}
      />
      <button type="button" onClick={submit} disabled={busy || !text.trim()} className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 disabled:opacity-50">
        {busy ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className="px-2 text-sm text-stone-500">
        Cancel
      </button>
    </div>
  );
};

const SubjectTopicPicker = ({
  subjects,
  category,
  value,
  onChange,
  onSubjectSaved,
  disabled,
  showCategory,
  allowNone = true,
  showPart = true,
  keepPartOption = false,
}) => {
  const [adding, setAdding] = useState(null); // "subject" | "subtopic" | null
  const [busy, setBusy] = useState(false);
  const subject = subjects.find((s) => String(s._id) === String(value.subject));
  const canQuickAdd = !!category && !disabled;

  const quickAdd = async (body) => {
    setBusy(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_APP_API_URL}/subjects/quick-add`, { category, ...body });
      onSubjectSaved && onSubjectSaved(data.subject);
      return data;
    } catch (error) {
      toast.error(error?.response?.data?.error || "Couldn't add it.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const addSubject = async (name) => {
    const data = await quickAdd({ subjectName: name });
    if (data) {
      onChange({ ...value, subject: data.subject._id, subtopic: "" });
      setAdding(null);
      toast.success(`Subject "${data.subject.name}" ready — it's on the Subjects page too.`);
    }
  };
  const addSubtopic = async (name) => {
    const data = await quickAdd({ subjectId: subject._id, subtopicName: name });
    if (data) {
      onChange({ ...value, subtopic: data.subtopicId });
      setAdding(null);
      toast.success(`Subtopic "${name}" added to ${data.subject.name}.`);
    }
  };

  const partOptions = [
    ...(keepPartOption ? [[null, "Don't change"]] : []),
    ["", "Not set"],
    ["theory", "📘 Theory"],
    ["problems", "✏️ Problems"],
    ["both", "📘✏️ Theory + Problems"],
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm text-stone-500 font-medium">Subject</label>
            {canQuickAdd && adding !== "subject" && (
              <button type="button" className="text-xs font-semibold text-indigo-600" onClick={() => setAdding("subject")}>
                + New subject
              </button>
            )}
          </div>
          <select
            className={selectCls}
            value={value.subject || ""}
            onChange={(e) => onChange({ ...value, subject: e.target.value, subtopic: "" })}
            disabled={disabled}
          >
            {allowNone && <option value="">— Not grouped —</option>}
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
                {showCategory ? ` (${getCategoryLabel(s.category)})` : ""}
              </option>
            ))}
          </select>
          {adding === "subject" && (
            <AddInline placeholder="e.g. Engineering Hydrology" busy={busy} onAdd={addSubject} onCancel={() => setAdding(null)} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm text-stone-500 font-medium">Subtopic</label>
            {canQuickAdd && subject && adding !== "subtopic" && (
              <button type="button" className="text-xs font-semibold text-indigo-600" onClick={() => setAdding("subtopic")}>
                + New subtopic
              </button>
            )}
          </div>
          <select
            className={selectCls}
            value={value.subtopic || ""}
            onChange={(e) => onChange({ ...value, subtopic: e.target.value })}
            disabled={disabled || !subject}
          >
            <option value="">{subject ? "— General (no subtopic) —" : "Pick a subject first"}</option>
            {(subject?.subtopics || []).map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          {adding === "subtopic" && subject && (
            <AddInline placeholder={`New subtopic in ${subject.name}`} busy={busy} onAdd={addSubtopic} onCancel={() => setAdding(null)} />
          )}
        </div>
      </div>

      {showPart && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-stone-500 font-medium">This class covers</label>
          <div className="flex flex-wrap gap-2">
            {partOptions.map(([v, label]) => {
              const on = (value.part === undefined ? (keepPartOption ? null : "") : value.part) === v;
              return (
                <button
                  key={String(v)}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...value, part: v })}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors"
                  style={
                    on
                      ? v && PART_STYLES[v]
                        ? { ...PART_STYLES[v], borderWidth: 2 }
                        : { background: "#0f2a4a", color: "#fff", borderColor: "#0f2a4a" }
                      : { background: "#fff", color: "#5b6675", borderColor: "#e7e1d2" }
                  }
                  aria-pressed={on}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {subjects.length === 0 && (
        <p className="text-xs text-amber-600">
          No subjects in this exam category yet — tap "+ New subject", or load the full GATE syllabus on the Subjects page.
        </p>
      )}
    </div>
  );
};

export default SubjectTopicPicker;

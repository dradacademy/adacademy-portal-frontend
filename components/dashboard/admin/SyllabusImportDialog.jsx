import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { EXAM_CATEGORY_OPTIONS } from "../../../constants/examCategories";

// "Load GATE syllabus" (2026-10-31) — shows the built-in GATE Civil
// syllabus (subjects → subtopics) next to what's already on the Subjects
// page, and adds what's missing. Existing subjects (matched by name or a
// common other name, e.g. "Strength of Materials" = "Solid Mechanics") only
// get their missing subtopics; nothing is renamed or deleted, so exams and
// the test series are untouched.

const SyllabusImportDialog = ({ open, onClose, onImported, defaultCategory = "gate" }) => {
  const [category, setCategory] = useState(defaultCategory);
  const [plan, setPlan] = useState(null);
  const [picked, setPicked] = useState({});
  const [saving, setSaving] = useState(false);
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPlan(null);
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/subjects/syllabus`, { params: { category } })
      .then((r) => {
        const rows = r.data?.data || [];
        setPlan(rows);
        setPicked(Object.fromEntries(rows.map((p) => [p.name, !p.existingId || p.missingSubtopics.length > 0])));
      })
      .catch(() => {
        toast.error("Couldn't load the syllabus.");
        setPlan([]);
      });
  }, [open, category]);

  const sections = useMemo(() => {
    const m = new Map();
    (plan || []).forEach((p) => m.set(p.section, [...(m.get(p.section) || []), p]));
    return [...m.entries()];
  }, [plan]);

  const chosen = (plan || []).filter((p) => picked[p.name]);
  const newSubjects = chosen.filter((p) => !p.existingId).length;
  const newTopics = chosen.reduce((n, p) => n + (p.existingId ? p.missingSubtopics.length : p.subtopics.length), 0);

  const handleImport = async () => {
    if (!chosen.length) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_APP_API_URL}/subjects/import-syllabus`, {
        category,
        names: chosen.map((p) => p.name),
      });
      toast.success(`Done — ${data.created} new subject(s), ${data.subtopicsAdded} subtopic(s) added.`);
      onImported && onImported();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Couldn't add the syllabus.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <div className="flex flex-col gap-4 p-5 font-inter">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-700 font-poppins">Load GATE Civil syllabus</h1>
            <p className="text-sm text-stone-500 mt-1">
              All GATE CE subjects and subtopics, ready to pick in Go Live and Recorded Classes. Subjects you already
              have only get the subtopics they're missing — nothing is renamed or removed.
            </p>
          </div>
          {!saving && <MdClose onClick={onClose} className="text-stone-500 text-3xl cursor-pointer shrink-0" />}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-500 font-medium">Add to:</span>
          {EXAM_CATEGORY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setCategory(o.value)}
              disabled={saving}
              className={`py-1.5 px-3 rounded-full font-medium ${category === o.value ? "bg-indigo-600 text-white" : "bg-stone-100 text-stone-600"}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {!plan ? (
          <div className="py-10 text-center text-stone-400">Loading…</div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto pr-1 flex flex-col gap-4">
            {sections.map(([section, rows]) => (
              <div key={section}>
                <div className="text-xs font-bold tracking-widest text-amber-700 uppercase mb-2">{section}</div>
                <div className="flex flex-col gap-2">
                  {rows.map((p) => {
                    const upToDate = p.existingId && p.missingSubtopics.length === 0;
                    return (
                      <div key={p.name} className="rounded-xl border border-stone-200 bg-white">
                        <div className="flex items-center gap-3 p-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-indigo-600"
                            checked={!!picked[p.name]}
                            disabled={upToDate || saving}
                            onChange={(e) => setPicked({ ...picked, [p.name]: e.target.checked })}
                          />
                          <button type="button" className="flex-1 text-left" onClick={() => setOpenRow(openRow === p.name ? null : p.name)}>
                            <div className="font-semibold text-stone-800">
                              {p.existingName || p.createAs || p.name}
                              {p.existingName && p.existingName !== p.name && (
                                <span className="text-xs font-normal text-stone-400"> (= {p.name})</span>
                              )}
                            </div>
                            <div className="text-xs mt-0.5">
                              {upToDate ? (
                                <span className="text-emerald-600">✓ Already complete ({p.subtopics.length} subtopics)</span>
                              ) : p.existingId ? (
                                <span className="text-indigo-600">Already here · will add {p.missingSubtopics.length} missing subtopic(s)</span>
                              ) : (
                                <span className="text-amber-700">New subject · {p.subtopics.length} subtopics</span>
                              )}
                              <span className="text-stone-400"> · {openRow === p.name ? "hide" : "see"} subtopics</span>
                            </div>
                          </button>
                        </div>
                        {openRow === p.name && (
                          <ul className="px-10 pb-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            {p.subtopics.map((t) => {
                              const missing = !p.existingId || p.missingSubtopics.includes(t);
                              return (
                                <li key={t} className={missing ? "text-stone-700" : "text-stone-400"}>
                                  {missing ? "＋ " : "✓ "}
                                  {t}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="text-sm text-stone-600">
            {chosen.length ? (
              <>
                Will add <b>{newSubjects}</b> new subject(s) and <b>{newTopics}</b> subtopic(s).
              </>
            ) : (
              "Nothing to add — everything ticked is already here."
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving} className="border border-indigo-400 text-indigo-500 font-medium py-2 px-4 rounded-xl">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={saving || !chosen.length || !plan}
              className="bg-indigo-600 text-white font-medium py-2 px-5 rounded-xl disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add to Subjects"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SyllabusImportDialog;

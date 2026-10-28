import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { Search, Download, RefreshCw, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../../../api/axios";
import { EXAM_CATEGORY_OPTIONS, getCategoryLabel } from "../../../../constants/examCategories";

// Video Tracker (2026-10-28) — one screen showing, for every student:
// how many recorded classes they finished / half-watched / never opened,
// and whether they are keeping the "finish by" dates they promised in the
// Pending Videos popup. Data: GET /video-commitments/admin (one call; the
// backend works everything out — see utils/videoCommitments.js).
// "Finished" = watched 75% or more (same rule as attendance).

const VERDICTS = {
  missed: { label: "Missed date", bg: "#fee2e2", fg: "#b91c1c", dot: "🔴" },
  no_date: { label: "No date yet", bg: "#fef3c7", fg: "#92400e", dot: "🟠" },
  on_track: { label: "On track", bg: "#dbeafe", fg: "#1e40af", dot: "🔵" },
  all_done: { label: "All done", bg: "#dcfce7", fg: "#166534", dot: "🟢" },
  no_videos: { label: "No videos", bg: "#f3f4f6", fg: "#4b5563", dot: "⚪" },
};

const ITEM_STATUS = {
  missed: { label: "Date missed", bg: "#fee2e2", fg: "#b91c1c" },
  no_date: { label: "No date given", bg: "#fef3c7", fg: "#92400e" },
  upcoming: { label: "Planned", bg: "#dbeafe", fg: "#1e40af" },
  done_on_time: { label: "Done on time", bg: "#dcfce7", fg: "#166534" },
  done_late: { label: "Done late", bg: "#ffedd5", fg: "#9a3412" },
  done: { label: "Done", bg: "#dcfce7", fg: "#166534" },
};

const fmtYmd = (ymd) => {
  if (!ymd) return "—";
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const daysAgo = (value) => {
  if (!value) return "Never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const Pill = ({ bg, fg, children }) => (
  <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: bg, color: fg }}>
    {children}
  </span>
);

const Bar = ({ percent, color = "#6366f1" }) => (
  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, percent || 0))}%`, backgroundColor: color }} />
  </div>
);

const Card = ({ title, value, hint, active, onClick, color }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-white rounded-xl p-4 border shadow-sm transition"
    style={{ borderColor: active ? color : "#e5e7eb", boxShadow: active ? `0 0 0 2px ${color}` : undefined }}
  >
    <p className="text-xs text-gray-500">{title}</p>
    <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </button>
);

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename, header, rows) => {
  const text = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const VideoTrackerAdminPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [batch, setBatch] = useState("");
  const [search, setSearch] = useState("");
  const [verdict, setVerdict] = useState("");
  const [notWatching, setNotWatching] = useState(false);
  const [tab, setTab] = useState("students");
  const [selected, setSelected] = useState(new Set());
  const [batchInput, setBatchInput] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);
  const [openVideo, setOpenVideo] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ popupEnabled: true, maxDaysAhead: 30 });
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (batch) params.batch = batch;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/video-commitments/admin", { params });
      setData(res.data?.data || null);
      if (res.data?.data?.settings) setSettings(res.data.data.settings);
      setSelected(new Set());
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load the video tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, batch, search]);

  useEffect(() => {
    if (!detailId) return;
    setDetail(null);
    setDetailLoading(true);
    api
      .get(`/video-commitments/admin/student/${detailId}`)
      .then((res) => setDetail(res.data?.data || null))
      .catch(() => toast.error("Failed to load student details."))
      .finally(() => setDetailLoading(false));
  }, [detailId]);

  const summary = data?.summary;
  const weekAgo = Date.now() - 7 * 86400000;

  const students = useMemo(() => {
    let rows = data?.students || [];
    if (verdict) rows = rows.filter((r) => r.verdict === verdict);
    if (notWatching) {
      rows = rows.filter((r) => r.pending > 0 && (!r.lastWatchedAt || new Date(r.lastWatchedAt).getTime() < weekAgo));
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, verdict, notWatching]);

  const toggleCard = (v) => {
    setNotWatching(false);
    setVerdict((cur) => (cur === v ? "" : v));
    setTab("students");
  };

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = students.length > 0 && students.every((s) => selected.has(s.studentId));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.studentId)));

  const applyBatch = async () => {
    if (selected.size === 0) return;
    const value = batchInput.trim();
    const ok = window.confirm(
      value
        ? `Set batch "${value}" for ${selected.size} student(s)?`
        : `Clear the batch for ${selected.size} student(s)?`
    );
    if (!ok) return;
    try {
      setSavingBatch(true);
      const res = await api.patch("/video-commitments/admin/batch", {
        studentIds: [...selected],
        batch: value,
      });
      toast.success(res.data?.message || "Batch updated.");
      setBatchInput("");
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update batch.");
    } finally {
      setSavingBatch(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await api.patch("/video-commitments/admin/settings", {
        popupEnabled: !!settings.popupEnabled,
        maxDaysAhead: Number(settings.maxDaysAhead),
      });
      setSettings(res.data?.data || settings);
      toast.success("Settings saved.");
      setSettingsOpen(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const exportStudents = () => {
    downloadCsv(
      `video-tracker-students-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Student", "Register No", "Email", "Course", "Batch", "Status", "Finished", "Total videos", "Half watched", "Not started",
        "Pending", "Date missed (now)", "No date", "Planned", "Next date", "Done on time", "Done late", "Dates missed (ever)",
        "Last watched", "Last login"],
      students.map((r) => [
        r.name, r.registerNumber || "", r.email, getCategoryLabel(r.category), r.batch, VERDICTS[r.verdict]?.label,
        r.done, r.total, r.partial, r.notStarted, r.pending, r.missed, r.noDate, r.upcoming,
        r.nextDate ? fmtDate(r.nextDate) : "", r.doneOnTime, r.doneLate, r.datesMissedEver,
        r.lastWatchedAt ? fmtDate(r.lastWatchedAt) : "Never", r.lastLoginAt ? fmtDate(r.lastLoginAt) : "Never",
      ])
    );
  };

  const exportVideos = () => {
    const rows = [];
    (data?.videos || []).forEach((v) => {
      if (v.pendingStudents.length === 0) {
        rows.push([v.title, v.subject || "", v.subtopic || "", fmtDate(v.recordedDate), v.done, v.students, "", "", "", ""]);
      }
      v.pendingStudents.forEach((p) =>
        rows.push([v.title, v.subject || "", v.subtopic || "", fmtDate(v.recordedDate), v.done, v.students, p.name, p.batch,
          `${Math.round(p.percentWatched)}%`, `${ITEM_STATUS[p.status]?.label || p.status}${p.targetDate ? ` (${fmtYmd(p.targetDate)})` : ""}`])
      );
    });
    downloadCsv(
      `video-tracker-videos-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Video", "Subject", "Subtopic", "Class date", "Students finished", "Students total", "Pending student", "Batch", "Watched", "Promise"],
      rows
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Video Tracker</h1>
          <p className="text-sm text-gray-500">
            Who finished, who is half-way, who never opened — and are they keeping the dates they promised?
            A video counts as finished at 75% watched.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm">
            <Settings2 className="w-4 h-4" /> Popup settings
            <span className="ml-1 text-xs font-semibold" style={{ color: settings.popupEnabled ? "#166534" : "#b91c1c" }}>
              ({settings.popupEnabled ? "ON" : "OFF"})
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
          <option value="">All courses</option>
          {EXAM_CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={batch} onChange={(e) => setBatch(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
          <option value="">All batches</option>
          {(data?.batches || []).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value="__none__">No batch set</option>
        </select>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / email / reg no" className="outline-none text-sm w-52" />
        </div>
        {loading && <span className="text-sm text-gray-400">Loading…</span>}
      </div>

      {/* Summary cards */}
      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Card title="Students tracked" value={summary.studentsTracked} hint={`${summary.pendingVideos} videos pending in total`}
              active={!verdict && !notWatching} color="#4f46e5" onClick={() => { setVerdict(""); setNotWatching(false); }} />
            <Card title="🔴 Missed their date" value={summary.missedDate} hint="Click to see who" active={verdict === "missed"} color="#b91c1c" onClick={() => toggleCard("missed")} />
            <Card title="🟠 No date given yet" value={summary.noDateYet} hint="Haven't opened the app since" active={verdict === "no_date"} color="#b45309" onClick={() => toggleCard("no_date")} />
            <Card title="🔵 On track" value={summary.onTrack} hint="All pending videos planned" active={verdict === "on_track"} color="#1d4ed8" onClick={() => toggleCard("on_track")} />
            <Card title="🟢 All videos done" value={summary.allDone} active={verdict === "all_done"} color="#15803d" onClick={() => toggleCard("all_done")} />
            <Card title="😴 Not watched in 7 days" value={summary.notWatching7Days} hint="Has pending videos" active={notWatching} color="#6b7280"
              onClick={() => { setVerdict(""); setNotWatching((v) => !v); setTab("students"); }} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill bg="#f3f4f6" fg="#374151">Not started: {summary.notStartedVideos}</Pill>
            <Pill bg="#f3f4f6" fg="#374151">Half watched: {summary.partialVideos}</Pill>
            <Pill bg="#dcfce7" fg="#166534">Promises kept: {summary.doneOnTime}</Pill>
            <Pill bg="#ffedd5" fg="#9a3412">Finished late: {summary.doneLate}</Pill>
            <Pill bg="#fee2e2" fg="#b91c1c">Overdue now: {summary.missedNow}</Pill>
            {summary.studentsNotTracked > 0 && (
              <Pill bg="#f3f4f6" fg="#4b5563">
                {summary.studentsNotTracked} student(s) not tracked (no active course / Test Series Only)
              </Pill>
            )}
          </div>
          {summary.videosWithoutDuration > 0 && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
              ⚠️ {summary.videosWithoutDuration} video(s) have no duration, so they can't be tracked:{" "}
              {(data.noDuration || []).slice(0, 5).map((v) => v.title).join(", ")}
              {data.noDuration.length > 5 ? "…" : ""}. Add the duration in Recorded Classes → Edit.
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          ["students", `Students (${students.length})`],
          ["videos", `Videos (${data?.videos?.length || 0})`],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className="px-4 py-2 text-sm font-semibold -mb-px border-b-2"
            style={{ borderColor: tab === key ? "#4f46e5" : "transparent", color: tab === key ? "#4f46e5" : "#6b7280" }}>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button type="button" onClick={tab === "students" ? exportStudents : exportVideos}
          className="flex items-center gap-1 px-3 py-1.5 mb-1 rounded-lg border border-gray-300 bg-white text-sm">
          <Download className="w-4 h-4" /> Download (Excel)
        </button>
      </div>

      {tab === "students" && (
        <>
          {/* Bulk batch */}
          <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <span className="text-gray-600">
              {selected.size > 0 ? `${selected.size} selected —` : "Tick students to"} set their batch:
            </span>
            <input list="vt-batches" value={batchInput} onChange={(e) => setBatchInput(e.target.value)}
              placeholder='e.g. 2026 – Academy' className="border border-gray-300 rounded-lg px-2 py-1 w-56" />
            <datalist id="vt-batches">
              {(data?.batches || []).map((b) => <option key={b} value={b} />)}
            </datalist>
            <button type="button" disabled={selected.size === 0 || savingBatch} onClick={applyBatch}
              className="px-3 py-1 rounded-lg text-white font-medium"
              style={{ backgroundColor: selected.size === 0 ? "#a5b4fc" : "#4f46e5" }}>
              {savingBatch ? "Saving…" : "Apply"}
            </button>
            <span className="text-xs text-gray-400">Batch is only for reports — videos and tests stay the same.</span>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Finished</th>
                  <th className="px-3 py-2 text-center">Half watched</th>
                  <th className="px-3 py-2 text-center">Not started</th>
                  <th className="px-3 py-2 text-left">Promised dates</th>
                  <th className="px-3 py-2 text-left">Next date</th>
                  <th className="px-3 py-2 text-left">Last watched</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">{loading ? "Loading…" : "No students match."}</td></tr>
                )}
                {students.map((r) => {
                  const v = VERDICTS[r.verdict] || VERDICTS.no_videos;
                  return (
                    <tr key={r.studentId} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={selected.has(r.studentId)} onChange={() => toggleSelect(r.studentId)} />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-400">{getCategoryLabel(r.category)}{r.batch ? ` · ${r.batch}` : " · no batch"}</p>
                      </td>
                      <td className="px-3 py-2"><Pill bg={v.bg} fg={v.fg}>{v.dot} {v.label}</Pill></td>
                      <td className="px-3 py-2">
                        <p className="text-gray-700">{r.done}/{r.total}</p>
                        <Bar percent={r.donePercent} color={r.donePercent >= 75 ? "#16a34a" : r.donePercent >= 40 ? "#f59e0b" : "#ef4444"} />
                      </td>
                      <td className="px-3 py-2 text-center">{r.partial}</td>
                      <td className="px-3 py-2 text-center">{r.notStarted}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {r.missed > 0 && <Pill bg="#fee2e2" fg="#b91c1c">{r.missed} missed</Pill>}
                          {r.noDate > 0 && <Pill bg="#fef3c7" fg="#92400e">{r.noDate} no date</Pill>}
                          {r.upcoming > 0 && <Pill bg="#dbeafe" fg="#1e40af">{r.upcoming} planned</Pill>}
                          {r.doneOnTime > 0 && <Pill bg="#dcfce7" fg="#166534">{r.doneOnTime} kept</Pill>}
                          {r.doneLate > 0 && <Pill bg="#ffedd5" fg="#9a3412">{r.doneLate} late</Pill>}
                        </div>
                        {r.datesMissedEver > 0 && (
                          <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>Broke a promise {r.datesMissedEver} time(s)</p>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.nextDate ? fmtDate(r.nextDate) : "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{daysAgo(r.lastWatchedAt)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setDetailId(r.studentId)} className="px-3 py-1 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: "#4f46e5" }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "videos" && (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Video</th>
                <th className="px-3 py-2 text-left">Class date</th>
                <th className="px-3 py-2 text-left">Finished</th>
                <th className="px-3 py-2 text-center">Half watched</th>
                <th className="px-3 py-2 text-center">Not started</th>
                <th className="px-3 py-2 text-center">Date missed</th>
                <th className="px-3 py-2 text-center">No date</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(data?.videos || []).length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">{loading ? "Loading…" : "No videos."}</td></tr>
              )}
              {(data?.videos || []).map((v) => {
                const isOpen = openVideo === v.videoId;
                return (
                  <React.Fragment key={v.videoId}>
                    <tr className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-800">{v.title}</p>
                        <p className="text-xs text-gray-400">{[getCategoryLabel(v.category), v.subject, v.subtopic].filter(Boolean).join(" › ")}</p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(v.recordedDate)}</td>
                      <td className="px-3 py-2">
                        <p>{v.done}/{v.students}</p>
                        <Bar percent={v.donePercent} color={v.donePercent >= 75 ? "#16a34a" : v.donePercent >= 40 ? "#f59e0b" : "#ef4444"} />
                      </td>
                      <td className="px-3 py-2 text-center">{v.partial}</td>
                      <td className="px-3 py-2 text-center">{v.notStarted}</td>
                      <td className="px-3 py-2 text-center" style={{ color: v.missed ? "#b91c1c" : undefined }}>{v.missed}</td>
                      <td className="px-3 py-2 text-center">{v.noDate}</td>
                      <td className="px-3 py-2">
                        {v.pendingStudents.length > 0 && (
                          <button type="button" onClick={() => setOpenVideo(isOpen ? null : v.videoId)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#4f46e5" }}>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {v.pendingStudents.length} not finished
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            {v.pendingStudents.map((p) => {
                              const st = ITEM_STATUS[p.status] || ITEM_STATUS.no_date;
                              return (
                                <button key={p.studentId} type="button" onClick={() => setDetailId(p.studentId)}
                                  className="text-left bg-white border border-gray-200 rounded-lg px-3 py-2">
                                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {p.percentWatched > 0 ? `${Math.round(p.percentWatched)}% watched` : "Not started"}
                                    {p.batch ? ` · ${p.batch}` : ""}
                                  </p>
                                  <Pill bg={st.bg} fg={st.fg}>{st.label}{p.targetDate ? ` · ${fmtYmd(p.targetDate)}` : ""}</Pill>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Student detail */}
      <Dialog open={!!detailId} onClose={() => setDetailId(null)} maxWidth="md" fullWidth>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{detail?.student?.name || "Student"}</h2>
              {detail?.student && (
                <p className="text-xs text-gray-500">
                  {getCategoryLabel(detail.student.category)} · {detail.student.batch || "no batch"} · {detail.student.email}
                  {" · "}Last login: {detail.student.lastLoginAt ? fmtDate(detail.student.lastLoginAt) : "Never"}
                </p>
              )}
            </div>
            <button type="button" onClick={() => setDetailId(null)} aria-label="Close"><MdClose className="w-6 h-6 text-gray-500" /></button>
          </div>
          {detailLoading && <p className="py-8 text-center text-gray-400">Loading…</p>}
          {detail && !detail.tracked && (
            <p className="py-6 text-center text-gray-500">Not tracked: {detail.reason}</p>
          )}
          {detail && detail.tracked && (
            <>
              <div className="flex flex-wrap gap-2 my-3 text-xs">
                <Pill bg="#dcfce7" fg="#166534">Finished {detail.summary.done}/{detail.summary.total}</Pill>
                <Pill bg="#f3f4f6" fg="#374151">Half watched {detail.summary.partial}</Pill>
                <Pill bg="#f3f4f6" fg="#374151">Not started {detail.summary.notStarted}</Pill>
                <Pill bg="#fee2e2" fg="#b91c1c">Date missed {detail.summary.missed}</Pill>
                <Pill bg="#dcfce7" fg="#166534">Kept {detail.summary.doneOnTime}</Pill>
                <Pill bg="#ffedd5" fg="#9a3412">Late {detail.summary.doneLate}</Pill>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Video</th>
                      <th className="px-3 py-2 text-left">Watched</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Promised date</th>
                      <th className="px-3 py-2 text-left">Date history</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((it) => {
                      const st = ITEM_STATUS[it.status] || ITEM_STATUS.no_date;
                      return (
                        <tr key={it.videoId} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-800">{it.title}</p>
                            <p className="text-xs text-gray-400">{[it.subject, it.subtopic].filter(Boolean).join(" › ")} · {fmtDate(it.recordedDate)}</p>
                          </td>
                          <td className="px-3 py-2">
                            <p>{Math.round(it.percentWatched)}%</p>
                            <Bar percent={it.percentWatched} />
                          </td>
                          <td className="px-3 py-2"><Pill bg={st.bg} fg={st.fg}>{st.label}</Pill></td>
                          <td className="px-3 py-2 whitespace-nowrap">{fmtYmd(it.targetDate)}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            {it.history.length === 0
                              ? it.targetDate ? "Not changed" : "—"
                              : it.history.map((h, i) => (
                                  <span key={i} className="block">
                                    {fmtYmd(h.targetDate)} {h.missed ? <b style={{ color: "#b91c1c" }}>(missed)</b> : "(changed early)"}
                                  </span>
                                ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Popup settings */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Pending Videos popup</h2>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!settings.popupEnabled} onChange={(e) => setSettings((s) => ({ ...s, popupEnabled: e.target.checked }))} />
            <span className="text-sm text-gray-700">Show the popup to students every time they open the app</span>
          </label>
          <label className="block text-sm text-gray-700">
            Students can pick a date up to
            <input type="number" min={1} max={365} value={settings.maxDaysAhead}
              onChange={(e) => setSettings((s) => ({ ...s, maxDaysAhead: e.target.value }))}
              className="mx-2 w-20 border border-gray-300 rounded-lg px-2 py-1" />
            days ahead (never later than the video's last available day).
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Cancel</button>
            <button type="button" onClick={saveSettings} disabled={savingSettings} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#4f46e5" }}>
              {savingSettings ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default VideoTrackerAdminPage;

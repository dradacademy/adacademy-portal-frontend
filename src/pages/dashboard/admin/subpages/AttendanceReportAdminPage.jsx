import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  ClipboardCheck,
} from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

// Same click-to-sort header used on the Test Tracking page — first click
// ascending, second click on the same column flips to descending, a
// different column starts fresh ascending. Kept as a local copy (not a
// shared import) since these two pages' tables are otherwise unrelated and
// this is a small, self-contained piece.
const SortableTh = ({ label, sortKey, sort, onSort, className = "" }) => {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 uppercase tracking-wide font-semibold hover:text-indigo-600 duration-150 ${
          active ? "text-indigo-600" : ""
        }`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

const STATUS_STYLES = {
  Present: "bg-emerald-100 text-emerald-700",
  "Partially Watched": "bg-amber-100 text-amber-700",
  Absent: "bg-rose-100 text-rose-700",
  "—": "bg-gray-100 text-gray-500",
};

// Admin attendance report — automatically derived from actual watch time
// (never manually set anywhere): every row here reflects the SAME
// Present/Partially Watched/Absent verdict a student's own watch
// percentage produces, for both recorded classes and live classes.
// >=75% watched -> Present, 50-74% -> Partially Watched, <50% -> Absent.
const AttendanceReportAdminPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all | Recorded | Live
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/attendance/report`,
        { params: categoryFilter !== "all" ? { category: categoryFilter } : {} }
      );
      setRows(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load the attendance report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.sessionType === typeFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.attendanceStatus === statusFilter);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(term) ||
          r.contentTitle?.toLowerCase().includes(term) ||
          r.studentEmail?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [rows, typeFilter, statusFilter, search]);

  // One value-extractor per sortable column — name-wise (student, class
  // name, type, status) and value-wise (duration, watched time, watch %,
  // last watched) alike.
  const SORTERS = {
    studentName: (r) => (r.studentName || "").toLowerCase(),
    contentTitle: (r) => (r.contentTitle || "").toLowerCase(),
    sessionType: (r) => (r.sessionType || "").toLowerCase(),
    durationSeconds: (r) => r.durationSeconds ?? null,
    watchedSeconds: (r) => r.watchedSeconds ?? null,
    watchPercent: (r) => r.watchPercent ?? null,
    attendanceStatus: (r) => (r.attendanceStatus || "").toLowerCase(),
    lastWatchedAt: (r) => (r.lastWatchedAt ? new Date(r.lastWatchedAt).getTime() : null),
  };

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const sortedRows = useMemo(() => {
    if (!sort.key || !SORTERS[sort.key]) return filteredRows;
    const getValue = SORTERS[sort.key];
    const dirMultiplier = sort.dir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "string" || typeof vb === "string") {
        return String(va).localeCompare(String(vb)) * dirMultiplier;
      }
      return (va - vb) * dirMultiplier;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows, sort]);

  const handleExportCsv = () => {
    if (sortedRows.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    const headers = [
      "Student Name",
      "Student Email",
      "Session Type",
      "Video/Class Name",
      "Duration",
      "Watched Time",
      "Watch %",
      "Attendance Status",
      "Last Watched",
    ];
    const csvRows = sortedRows.map((r) => [
      r.studentName,
      r.studentEmail,
      r.sessionType,
      r.contentTitle,
      formatDuration(r.durationSeconds),
      formatDuration(r.watchedSeconds),
      `${r.watchPercent}%`,
      r.attendanceStatus,
      formatDateTime(r.lastWatchedAt),
    ]);
    const csvContent = [headers, ...csvRows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 w-full font-inter">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-indigo-500" />
            Attendance Report
          </h1>
          <p className="text-stone-400 font-medium">
            Automatically computed from actual watch time — nothing here is
            manually marked. ≥75% watched = Present, 50–74% = Partially
            Watched, below 50% = Absent.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 text-nowrap bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search student or class name…"
          className="border border-stone-300 py-2 px-4 rounded-xl bg-white text-sm min-w-[220px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-stone-300 py-2 px-3 rounded-xl bg-white text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {EXAM_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="border border-stone-300 py-2 px-3 rounded-xl bg-white text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Recorded + Live</option>
          <option value="Recorded">Recorded only</option>
          <option value="Live">Live only</option>
        </select>
        <select
          className="border border-stone-300 py-2 px-3 rounded-xl bg-white text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Partially Watched">Partially Watched</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              <SortableTh label="Student Name" sortKey="studentName" sort={sort} onSort={handleSort} />
              <SortableTh label="Video / Class Name" sortKey="contentTitle" sort={sort} onSort={handleSort} />
              <SortableTh label="Type" sortKey="sessionType" sort={sort} onSort={handleSort} />
              <SortableTh label="Duration" sortKey="durationSeconds" sort={sort} onSort={handleSort} />
              <SortableTh label="Watched Time" sortKey="watchedSeconds" sort={sort} onSort={handleSort} />
              <SortableTh label="Watch %" sortKey="watchPercent" sort={sort} onSort={handleSort} />
              <SortableTh label="Attendance Status" sortKey="attendanceStatus" sort={sort} onSort={handleSort} />
              <SortableTh label="Last Watched" sortKey="lastWatchedAt" sort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  No attendance records yet.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => (
                <tr
                  key={`${row.studentId}-${row.contentId}-${idx}`}
                  className="border-t border-gray-50 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.studentName}</p>
                    <p className="text-xs text-gray-400">{row.studentEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.contentTitle}</td>
                  <td className="px-4 py-3 text-gray-600">{row.sessionType}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDuration(row.durationSeconds)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDuration(row.watchedSeconds)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.watchPercent}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLES[row.attendanceStatus] || STATUS_STYLES["—"]
                      }`}
                    >
                      {row.attendanceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDateTime(row.lastWatchedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReportAdminPage;

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, ClipboardCheck } from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

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

  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
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
    const csvRows = filteredRows.map((r) => [
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
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Video / Class Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Watched Time</th>
              <th className="px-4 py-3">Watch %</th>
              <th className="px-4 py-3">Attendance Status</th>
              <th className="px-4 py-3">Last Watched</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  No attendance records yet.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
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

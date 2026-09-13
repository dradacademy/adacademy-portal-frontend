import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { EXAM_CATEGORY_OPTIONS } from "../../../../constants/examCategories";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// Full per-test / per-student tracking matrix: which tests are planned,
// when posted/scheduled/made available, who completed them, when, on-time
// vs late, who's pending, and how everyone performed — with filters by
// Test, Student, Date, Completed/Pending, On-time/Late, and Performance.
const TestTrackingAdminPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [testFilter, setTestFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onTimeFilter, setOnTimeFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/test-tracking/admin`,
          {
            params:
              activeCategory !== "all" ? { category: activeCategory } : {},
          }
        );
        setRecords(response.data?.data || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch test tracking data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCategory]);

  const testOptions = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (!map.has(r.examId)) {
        map.set(r.examId, `${r.subjectName} — ${r.subTopicName} (Order ${r.order})`);
      }
    });
    return [...map.entries()];
  }, [records]);

  const studentOptions = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (r.studentId && !map.has(r.studentId)) {
        map.set(r.studentId, r.studentName);
      }
    });
    return [...map.entries()];
  }, [records]);

  const filtered = useMemo(() => {
    let rows = [...records];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.subjectName?.toLowerCase().includes(term) ||
          r.subTopicName?.toLowerCase().includes(term) ||
          r.examCode?.toLowerCase().includes(term) ||
          r.studentName?.toLowerCase().includes(term) ||
          r.studentEmail?.toLowerCase().includes(term)
      );
    }

    if (testFilter !== "all") rows = rows.filter((r) => r.examId === testFilter);
    if (studentFilter !== "all")
      rows = rows.filter((r) => r.studentId === studentFilter);
    if (statusFilter !== "all")
      rows = rows.filter((r) => r.status === statusFilter);

    if (onTimeFilter === "On Time") rows = rows.filter((r) => r.onTime === true);
    else if (onTimeFilter === "Late") rows = rows.filter((r) => r.onTime === false);
    else if (onTimeFilter === "Unscheduled")
      rows = rows.filter((r) => r.status === "Completed" && r.onTime === null);

    if (performanceFilter === "Good")
      rows = rows.filter((r) => r.status === "Completed" && r.percentage >= 75);
    else if (performanceFilter === "Average")
      rows = rows.filter(
        (r) => r.status === "Completed" && r.percentage >= 40 && r.percentage < 75
      );
    else if (performanceFilter === "Weak")
      rows = rows.filter((r) => r.status === "Completed" && r.percentage < 40);

    if (dateFrom)
      rows = rows.filter(
        (r) => r.completedAt && new Date(r.completedAt) >= new Date(dateFrom)
      );
    if (dateTo)
      rows = rows.filter(
        (r) =>
          r.completedAt &&
          new Date(r.completedAt) <= new Date(`${dateTo}T23:59:59.999`)
      );

    return rows;
  }, [
    records,
    searchTerm,
    testFilter,
    studentFilter,
    statusFilter,
    onTimeFilter,
    performanceFilter,
    dateFrom,
    dateTo,
  ]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter((r) => r.status === "Completed").length;
    const pending = total - completed;
    const onTime = filtered.filter((r) => r.onTime === true).length;
    const late = filtered.filter((r) => r.onTime === false).length;
    const completedRows = filtered.filter((r) => r.status === "Completed");
    const avgPercentage = completedRows.length
      ? Math.round(
          (completedRows.reduce((sum, r) => sum + (r.percentage || 0), 0) /
            completedRows.length) *
            10
        ) / 10
      : 0;
    return { total, completed, pending, onTime, late, avgPercentage };
  }, [filtered]);

  const clearFilters = () => {
    setSearchTerm("");
    setTestFilter("all");
    setStudentFilter("all");
    setStatusFilter("all");
    setOnTimeFilter("all");
    setPerformanceFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">
            Loading test tracking...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 font-poppins">{error}</p>;
  }

  return (
    <div className="font-inter flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-poppins">
          Test Tracking
        </h1>
        <p className="text-gray-600 text-base font-rubik">
          Which tests are planned, when posted/scheduled/made available, who
          completed them and when, who's pending, on-time vs late, and how
          each student performed.
        </p>
      </div>

      {/* Category tabs — same convention as Exam Dashboard */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
            activeCategory === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
          }`}
        >
          All Categories
        </button>
        {EXAM_CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveCategory(opt.value)}
            className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
              activeCategory === opt.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Rows" value={stats.total} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock3} label="Pending" value={stats.pending} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={TrendingUp} label="On Time" value={stats.onTime} tone="bg-indigo-50 text-indigo-600" />
        <StatCard icon={TrendingDown} label="Late" value={stats.late} tone="bg-rose-50 text-rose-600" />
        <StatCard icon={Target} label="Avg Score" value={`${stats.avgPercentage}%`} tone="bg-purple-50 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by subject, topic, exam code, or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <select
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Tests</option>
            {testOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Students</option>
            {studentOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          >
            <option value="all">Completed / Pending</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={onTimeFilter}
            onChange={(e) => setOnTimeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          >
            <option value="all">On-time / Late</option>
            <option value="On Time">On Time</option>
            <option value="Late">Late</option>
            <option value="Unscheduled">Unscheduled</option>
          </select>
          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Performance</option>
            <option value="Good">Good (≥75%)</option>
            <option value="Average">Average (40–74%)</option>
            <option value="Weak">Weak (&lt;40%)</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Completed from"
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Completed to"
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Posted</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Made Available</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Completed On</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">On Time?</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={`${row.examId}-${row.studentId}`}
                className="border-t border-gray-50 hover:bg-gray-50/60"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800 capitalize">
                    {row.subjectName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {row.subTopicName} · Order {row.order} ·{" "}
                    <span className="font-mono">{row.examCode}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-800">{row.studentName}</div>
                  <div className="text-xs text-gray-400">{row.studentEmail}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDateTime(row.postedDate)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.scheduledDate ? (
                    formatDateTime(row.scheduledDate)
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDateTime(row.madeAvailableDate)}
                </td>
                <td className="px-4 py-3">
                  {row.status === "Completed" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.status === "Completed" ? formatDateTime(row.completedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.status === "Completed" ? (
                    <span
                      className={`font-medium ${
                        row.percentage >= 75
                          ? "text-emerald-600"
                          : row.percentage < 40
                          ? "text-rose-600"
                          : "text-gray-800"
                      }`}
                    >
                      {row.obtainedMark}/{row.totalPossibleMarks} ({row.percentage}%)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.onTime === null || row.onTime === undefined ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : row.onTime ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      On Time
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                      Late
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-10">
            No records match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTrackingAdminPage;

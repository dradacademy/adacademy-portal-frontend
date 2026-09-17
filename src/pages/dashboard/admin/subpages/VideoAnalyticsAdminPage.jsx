import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye, Users, Clock } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatSeconds = (seconds) => {
  if (!seconds) return "0m";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
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

// Per-student, per-video watch-time roll-up — "who watched what, how much,
// and when" — the admin's "Video Analytics" requirement. This is the
// roll-up table across every student/video; the per-student breakdown also
// folds into StudentDetailedDashboard.jsx's Video Engagement section.
const VideoAnalyticsAdminPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/recorded-classes/analytics`
        );
        setRows(response.data?.data || []);
      } catch (error) {
        // handled by empty state below
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(term) ||
        r.studentEmail?.toLowerCase().includes(term) ||
        r.videoTitle?.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(rows.map((r) => r.studentId)).size;
    const uniqueVideos = new Set(rows.map((r) => r.videoId)).size;
    const avgPercent = rows.length
      ? Math.round(
          (rows.reduce((sum, r) => sum + (r.percentWatched || 0), 0) / rows.length) * 10
        ) / 10
      : 0;
    return { uniqueStudents, uniqueVideos, avgPercent };
  }, [rows]);

  return (
    <div className="font-inter flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-poppins">
          Video Analytics
        </h1>
        <p className="text-gray-600 text-base font-rubik">
          Per-student, per-class watch time — how much of each recording was
          actually watched, how many sessions, and when they last watched.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Students with activity" value={stats.uniqueStudents} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Eye} label="Videos watched" value={stats.uniqueVideos} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Avg. % watched" value={`${stats.avgPercent}%`} tone="bg-purple-50 text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by student name, email, or class title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">% Watched</th>
              <th className="px-4 py-3">Total Watch Time</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">Last Watched</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  No watch activity recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr
                  key={`${row.studentId}-${row.videoId}-${idx}`}
                  className="border-t border-gray-50 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3">
                    <div className="text-gray-800">{row.studentName}</div>
                    <div className="text-xs text-gray-400">{row.studentEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.videoTitle}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.min(100, row.percentWatched || 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {row.percentWatched}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatSeconds(row.totalWatchSeconds)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.sessionCount}</td>
                  <td className="px-4 py-3 text-gray-600">
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

export default VideoAnalyticsAdminPage;

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import {
  Trophy,
  Users,
  Gauge,
  Target,
  BookOpen,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  LineChart as LineChartIcon,
  Compass,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

// Fixed split for the Speed vs. Accuracy quadrant — matches the app's own
// existing "Good ≥75%" performance band (already used on Test Tracking's
// Performance filter), so "fast"/"accurate" means the same threshold here
// as it does everywhere else in the app, not a new number invented just
// for this chart.
const QUADRANT_SPLIT = 75;

const quadrantLabel = (speed, accuracy) => {
  if (speed >= QUADRANT_SPLIT && accuracy >= QUADRANT_SPLIT) return "Ready";
  if (speed >= QUADRANT_SPLIT && accuracy < QUADRANT_SPLIT) return "Rushing";
  if (speed < QUADRANT_SPLIT && accuracy >= QUADRANT_SPLIT) return "Needs pacing";
  return "Needs fundamentals";
};

const quadrantColor = (speed, accuracy) => {
  if (speed >= QUADRANT_SPLIT && accuracy >= QUADRANT_SPLIT) return "#10b981"; // emerald
  if (speed >= QUADRANT_SPLIT && accuracy < QUADRANT_SPLIT) return "#f59e0b"; // amber
  if (speed < QUADRANT_SPLIT && accuracy >= QUADRANT_SPLIT) return "#0ea5e9"; // sky
  return "#f43f5e"; // rose
};

const formatShortDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// A small "you vs. category average" delta pill — the core visual language
// of this whole page, reused everywhere a student's own number is shown
// next to the category's. Green when ahead, rose when behind, gray for a
// dead heat (within 0.5 points, to avoid a meaningless "+0.1%" reading as a
// real signal).
const DeltaPill = ({ mine, avg }) => {
  if (mine === null || mine === undefined || avg === null || avg === undefined) {
    return null;
  }
  const diff = Math.round((mine - avg) * 10) / 10;
  if (Math.abs(diff) < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <Minus className="h-3 w-3" /> On par
      </span>
    );
  }
  const ahead = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        ahead ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {ahead ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {ahead ? "+" : ""}
      {diff}% vs. batch
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, tone = "indigo" }) => {
  const toneClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneClasses}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
};

// Readiness tier styling — deliberately shown as a tier label, not the raw
// composite score, so it reads as guidance rather than a number to
// over-interpret. See computeStudentAttemptHistory on the backend for how
// the tier is derived (recency-weighted accuracy + topic coverage +
// consistency).
const READINESS_TIER_STYLES = {
  "Not Started": { bg: "bg-gray-100", text: "text-gray-500", dot: "#9ca3af" },
  Building: { bg: "bg-rose-50", text: "text-rose-600", dot: "#f43f5e" },
  "On Track": { bg: "bg-amber-50", text: "text-amber-600", dot: "#f59e0b" },
  "Exam Ready": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "#10b981" },
};

const ReadinessBadge = ({ readiness }) => {
  if (!readiness) return null;
  const style = READINESS_TIER_STYLES[readiness.tier] || READINESS_TIER_STYLES["Not Started"];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${style.bg}`}>
      <Sparkles className={`h-4 w-4 ${style.text}`} />
      <div>
        <p className={`text-sm font-semibold ${style.text}`}>{readiness.tier}</p>
        {readiness.tier !== "Not Started" && (
          <p className="text-xs text-gray-500">
            {readiness.topicsAttempted}/{readiness.totalTopics} topics covered
          </p>
        )}
      </div>
    </div>
  );
};

// Dedicated student-facing page whose entire purpose — per the admin's own
// framing — is comparative: not "how did I do" in isolation, but "how do I
// stack up against every other student enrolled in my own exam category
// (GATE / TNPSC AE / TNPSC JDO / SSC-RRB-JE)". Every number on this page is
// computed by utils/performanceAnalyticsHelper.js's computeCategoryPerformance,
// scoped to the student's own category peers only — never the whole
// student body, and never another category's students.
const PerformanceAnalyticsStudent = () => {
  const { userData } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leaderboards are loaded independently of the comparison data above —
  // they're a public "who's on top" view, not tied to whether this student
  // has attempted anything themselves, so there's no reason to block one on
  // the other.
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(null);

  // Trend + quadrant both read from the same "my attempt history" fetch —
  // they're two different charts over the exact same underlying data, no
  // reason to ask the backend for it twice.
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/performance-analytics/me`
        );
        setData(response.data?.data || null);
        setError(null);
      } catch (err) {
        setError("Failed to load your performance analytics.");
      } finally {
        setLoading(false);
      }
    };
    if (userData?._id) fetchData();
  }, [userData]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/performance-analytics/leaderboards/me`
        );
        setLeaderboardData(response.data?.data || null);
        setLeaderboardError(null);
      } catch (err) {
        setLeaderboardError("Failed to load the leaderboard.");
      } finally {
        setLeaderboardLoading(false);
      }
    };
    if (userData?._id) fetchLeaderboards();
  }, [userData]);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setTrendLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/performance-analytics/trend/me`
        );
        setTrendData(response.data?.data || null);
        setTrendError(null);
      } catch (err) {
        setTrendError("Failed to load your attempt history.");
      } finally {
        setTrendLoading(false);
      }
    };
    if (userData?._id) fetchTrend();
  }, [userData]);

  const trendChartData = (trendData?.attempts || []).map((a, i) => ({
    label: `#${i + 1} · ${formatShortDate(a.completedAt)}`,
    percentage: a.percentage,
    speedPercent: a.speedPercent,
    accuracyPercent: a.accuracyPercent,
    examCode: a.examCode,
    subjectName: a.subjectName,
  }));

  const quadrantChartPoints = (trendData?.attempts || [])
    .filter((a) => a.speedPercent !== null && a.accuracyPercent !== null)
    .map((a) => ({
      speedPercent: a.speedPercent,
      accuracyPercent: a.accuracyPercent,
      percentage: a.percentage,
      examCode: a.examCode,
      subjectName: a.subjectName,
      date: formatShortDate(a.completedAt),
      fill: quadrantColor(a.speedPercent, a.accuracyPercent),
    }));

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-5xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
              Performance Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              {data?.hasCategory && data?.categoryLabel
                ? `How you compare to every other student enrolled in ${data.categoryLabel} — not just your own score in isolation.`
                : "How you compare to every other student in your exam category."}
            </p>
          </div>
          {!trendLoading && !trendError && trendData?.hasCategory && (
            <ReadinessBadge readiness={trendData.readiness} />
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-500 py-16">{error}</div>
        ) : !data?.hasCategory ? (
          <div className="text-center text-gray-400 py-16">
            No exam category is set on your account yet — contact the academy to
            get this set up.
          </div>
        ) : !data.hasData ? (
          <div className="text-center text-gray-400 py-16">
            No completed tests yet in your category — once you and your batchmates
            start attempting tests, your comparison will appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Overall rank/percentile banner — the headline number this
                whole page exists for. */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-100 text-sm mb-1">
                  <Trophy className="h-4 w-4" />
                  Your rank in {data.categoryLabel}
                </div>
                <div className="text-4xl font-bold">
                  {data.overall ? `#${data.overall.rank}` : "—"}
                  <span className="text-lg font-medium text-indigo-100">
                    {" "}
                    of {data.overall?.totalStudents ?? "—"}
                  </span>
                </div>
                {data.overall?.percentile !== null && (
                  <p className="text-indigo-100 text-sm mt-1">
                    You're scoring better than {data.overall.percentile}% of your
                    batchmates, on average.
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-sm">Your average</p>
                <p className="text-3xl font-bold">{data.overall?.avgPercentage ?? "—"}%</p>
                <p className="text-indigo-100 text-xs mt-1">
                  Batch average: {data.overall?.categoryAvgPercentage ?? "—"}%
                </p>
              </div>
            </div>

            {/* Speed & Accuracy vs. category average */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <StatCard
                icon={Gauge}
                label="Your Speed %"
                value={data.speedAccuracy?.myAvgSpeed ?? "—"}
                sub={`Batch average: ${data.speedAccuracy?.categoryAvgSpeed ?? "—"}%`}
                tone="sky"
              />
              <StatCard
                icon={Target}
                label="Your Accuracy %"
                value={data.speedAccuracy?.myAvgAccuracy ?? "—"}
                sub={`Batch average: ${data.speedAccuracy?.categoryAvgAccuracy ?? "—"}%`}
                tone="violet"
              />
            </div>

            {/* Per-topic comparison */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                Subject / Topic — you vs. your batch
              </h2>
              {data.perTopic.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No topics attempted yet.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-50">
                  {data.perTopic.map((t) => (
                    <div
                      key={`${t.subjectName}-${t.subTopicName}`}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">
                          {t.subjectName}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{t.subTopicName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Rank #{t.rank} of {t.totalStudents}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {t.myAvgPercentage}%
                        </span>
                        <span className="text-xs text-gray-400">
                          (batch: {t.categoryAvgPercentage}%)
                        </span>
                        <DeltaPill mine={t.myAvgPercentage} avg={t.categoryAvgPercentage} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Per-exam comparison */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <div className="p-5 pb-0">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <ListChecks className="h-4.5 w-4.5 text-indigo-500" />
                  Per-test comparison
                </h2>
              </div>
              <table className="w-full text-sm min-w-[700px] mt-3">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Test</th>
                    <th className="px-5 py-3">Your Score</th>
                    <th className="px-5 py-3">Batch Avg</th>
                    <th className="px-5 py-3">Your Rank</th>
                    <th className="px-5 py-3">Speed / Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perExam.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-10">
                        No tests completed yet.
                      </td>
                    </tr>
                  ) : (
                    data.perExam.map((exam) => (
                      <tr key={exam.examId} className="border-t border-gray-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 capitalize">
                            {exam.subjectName}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {exam.subTopicName} ·{" "}
                            <span className="font-mono">{exam.examCode}</span>
                          </p>
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800">
                          {exam.myPercentage}%
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {exam.categoryAvgPercentage}%
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            <Users className="h-3 w-3" />#{exam.rank} of {exam.totalParticipants}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {exam.mySpeed ?? "—"}% / {exam.myAccuracy ?? "—"}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leaderboard — top 10 per test, visible to every student in the
            same category, independent of whether THIS student attempted a
            given test or has any completed submissions at all. */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              Leaderboard
            </h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Top 10 scorers on every test
            {leaderboardData?.hasCategory && leaderboardData?.categoryLabel
              ? ` in ${leaderboardData.categoryLabel}`
              : " in your category"}
            .
          </p>

          {leaderboardLoading ? (
            <div className="text-center text-gray-400 py-10">Loading…</div>
          ) : leaderboardError ? (
            <div className="text-center text-red-500 py-10">{leaderboardError}</div>
          ) : !leaderboardData?.hasCategory ? (
            <div className="text-center text-gray-400 py-10">
              No exam category is set on your account yet.
            </div>
          ) : !leaderboardData.hasData || leaderboardData.leaderboards.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No completed tests yet in your category — leaderboards will appear
              here once results start coming in.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {leaderboardData.leaderboards.map((board) => (
                <div
                  key={board.examId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {board.subjectName}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {board.subTopicName} ·{" "}
                        <span className="font-mono">{board.examCode}</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 shrink-0">
                      <Users className="h-3 w-3" />
                      {board.totalParticipants}
                    </span>
                  </div>

                  <div className="flex flex-col divide-y divide-gray-50">
                    {board.topPerformers.map((p) => (
                      <div
                        key={p.rank}
                        className={`py-2 flex items-center justify-between gap-2 rounded-lg ${
                          p.isMe ? "bg-indigo-50 px-2 -mx-2" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {p.rank <= 3 ? (
                            <Medal
                              className={`h-4 w-4 shrink-0 ${
                                p.rank === 1
                                  ? "text-amber-500"
                                  : p.rank === 2
                                  ? "text-gray-400"
                                  : "text-amber-700"
                              }`}
                            />
                          ) : (
                            <span className="w-4 text-xs text-gray-400 text-center shrink-0">
                              {p.rank}
                            </span>
                          )}
                          <span
                            className={`text-sm truncate ${
                              p.isMe ? "font-semibold text-indigo-700" : "text-gray-700"
                            }`}
                          >
                            {p.name}
                            {p.isMe && " (You)"}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-semibold shrink-0 ${
                            p.isMe ? "text-indigo-700" : "text-gray-800"
                          }`}
                        >
                          {p.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {!board.attemptedByMe ? (
                    <p className="text-xs text-gray-400 mt-3">
                      You haven't attempted this test yet.
                    </p>
                  ) : board.myRank > 10 ? (
                    <p className="text-xs text-gray-500 mt-3">
                      You're ranked #{board.myRank} of {board.totalParticipants} ({board.myPercentage}%).
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Trend — the one dimension the rest of this page
            doesn't cover: how a student's own score, speed, and accuracy
            move across their attempts over time, not just where they stand
            right now. */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              Performance Trend
            </h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Your score, speed, and accuracy across every attempt, in order.
          </p>

          {trendLoading ? (
            <div className="text-center text-gray-400 py-10">Loading…</div>
          ) : trendError ? (
            <div className="text-center text-red-500 py-10">{trendError}</div>
          ) : !trendData?.hasCategory ? (
            <div className="text-center text-gray-400 py-10">
              No exam category is set on your account yet.
            </div>
          ) : !trendData.hasData || trendChartData.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No completed attempts yet — your trend will appear here once
              you complete your first test.
            </div>
          ) : trendChartData.length === 1 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center text-gray-400 text-sm">
              Just one completed attempt so far ({trendChartData[0].percentage}%)
              — the trend line will start showing once you've completed a
              couple more tests.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    formatter={(value, name) => [
                      value === null || value === undefined ? "—" : `${value}%`,
                      name,
                    ]}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload
                        ? `${payload[0].payload.subjectName} · ${payload[0].payload.examCode}`
                        : label
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="percentage" name="Score %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="speedPercent" name="Speed %" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="accuracyPercent" name="Accuracy %" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Speed vs. Accuracy Quadrant — the most actionable single view on
            this page: "low score" alone doesn't say what kind of practice a
            student actually needs, but which quadrant their attempts fall
            in does (rushing needs careful reading, not more speed drills;
            slow-but-accurate needs pacing practice, not more revision). */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              Speed vs. Accuracy
            </h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Where each of your attempts falls — split at {QUADRANT_SPLIT}% on
            both axes, the same "Good" threshold used elsewhere in the app.
          </p>

          {trendLoading ? (
            <div className="text-center text-gray-400 py-10">Loading…</div>
          ) : trendError ? (
            <div className="text-center text-red-500 py-10">{trendError}</div>
          ) : !trendData?.hasCategory ? (
            <div className="text-center text-gray-400 py-10">
              No exam category is set on your account yet.
            </div>
          ) : quadrantChartPoints.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No completed attempts with speed/accuracy data yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    dataKey="speedPercent"
                    name="Speed"
                    unit="%"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{ value: "Speed %", position: "insideBottom", offset: -5, fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="accuracyPercent"
                    name="Accuracy"
                    unit="%"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{ value: "Accuracy %", angle: -90, position: "insideLeft", fontSize: 12, fill: "#94a3b8" }}
                  />
                  <ZAxis range={[80, 80]} />
                  <ReferenceLine x={QUADRANT_SPLIT} stroke="#e2e8f0" />
                  <ReferenceLine y={QUADRANT_SPLIT} stroke="#e2e8f0" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={() => ""}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-100 shadow-sm rounded-lg px-3 py-2 text-xs">
                          <p className="font-semibold text-gray-800">
                            {p.subjectName} · {p.examCode}
                          </p>
                          <p className="text-gray-500">{p.date}</p>
                          <p className="text-gray-700 mt-1">
                            Speed {p.speedPercent}% · Accuracy {p.accuracyPercent}%
                          </p>
                          <p className="font-medium mt-1" style={{ color: p.fill }}>
                            {quadrantLabel(p.speedPercent, p.accuracyPercent)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={quadrantChartPoints} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} />
                  Ready (fast + accurate)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                  Rushing (fast, inaccurate)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#0ea5e9" }} />
                  Needs pacing (slow, accurate)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f43f5e" }} />
                  Needs fundamentals (slow + inaccurate)
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PerformanceAnalyticsStudent;

import React, { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  HelpCircle,
} from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Clock3 className="h-3.5 w-3.5" /> Pending
    </span>
  );
};

const OnTimeBadge = ({ onTime }) => {
  if (onTime === null || onTime === undefined) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  return onTime ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      On Time
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
      Late
    </span>
  );
};

const MetricBadge = ({ value, tone }) => {
  if (value === null || value === undefined) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const toneClasses =
    tone === "speed"
      ? "bg-sky-100 text-sky-700"
      : "bg-violet-100 text-violet-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${toneClasses}`}>
      {Number(value).toFixed(1)}%
    </span>
  );
};

// Consolidated "Test Index" — every test assigned to this student (currently
// unlocked, or already completed) in one table: when it was posted,
// scheduled, and made available, whether it's completed or pending, when
// it was attended, the score, and on-time vs late. Each exam can now have
// up to 3 independent attempts (more with an admin grant); the summary row
// shows the latest attempt and expands to reveal every attempt with its
// own Speed %/Accuracy % and score.
const StudentTestIndexTable = ({ data, searchTerm, loading }) => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [onTimeFilter, setOnTimeFilter] = useState("All");
  const [expandedExamIds, setExpandedExamIds] = useState(() => new Set());

  const toggleExpanded = (examId) => {
    setExpandedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let rows = [...(data || [])];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.subjectName?.toLowerCase().includes(term) ||
          r.subTopicName?.toLowerCase().includes(term) ||
          r.examCode?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    // On-time/late filtering considers a match if ANY attempt matches —
    // an exam attempted 3 times might be late once and on time another.
    if (onTimeFilter === "On Time") {
      rows = rows.filter((r) => (r.attempts || []).some((a) => a.onTime === true));
    } else if (onTimeFilter === "Late") {
      rows = rows.filter((r) => (r.attempts || []).some((a) => a.onTime === false));
    } else if (onTimeFilter === "Unscheduled") {
      rows = rows.filter(
        (r) => r.status === "Completed" && (r.attempts || []).some((a) => a.onTime === null)
      );
    }

    return rows;
  }, [data, searchTerm, statusFilter, onTimeFilter]);

  if (loading) {
    return (
      <div className="md:col-span-12 bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
        Loading your test index…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="md:col-span-12 bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-500 flex flex-col items-center gap-2">
        <HelpCircle className="h-8 w-8 text-gray-300" />
        No tests have been assigned to you yet.
      </div>
    );
  }

  return (
    <div className="md:col-span-12 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        {["All", "Completed", "Pending"].map((opt) => (
          <button
            key={opt}
            onClick={() => setStatusFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === opt
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {opt}
          </button>
        ))}
        <span className="w-px h-5 bg-gray-200 mx-1" />
        {["All", "On Time", "Late", "Unscheduled"].map((opt) => (
          <button
            key={opt}
            onClick={() => setOnTimeFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              onTimeFilter === opt
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1050px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Subject / Topic</th>
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Posted</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Made Available</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempt #</th>
              <th className="px-4 py-3">Attended</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Speed %</th>
              <th className="px-4 py-3">Accuracy %</th>
              <th className="px-4 py-3">On Time?</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const attempts = row.attempts || [];
              const hasMultiple = attempts.length > 1;
              const isExpanded = expandedExamIds.has(row.examId);
              const latest = attempts.length
                ? attempts[attempts.length - 1]
                : null;

              return (
                <React.Fragment key={row.examId}>
                  <tr
                    className={`border-t border-gray-50 hover:bg-gray-50/60 ${
                      hasMultiple ? "cursor-pointer" : ""
                    }`}
                    onClick={() => hasMultiple && toggleExpanded(row.examId)}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {hasMultiple ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 capitalize">
                        {row.subjectName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {row.subTopicName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">Order {row.order}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {row.examCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(row.postedDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.scheduledDate ? (
                        formatDateTime(row.scheduledDate)
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" /> Not set
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(row.madeAvailableDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {attempts.length > 0
                        ? hasMultiple
                          ? `${attempts.length} attempts`
                          : `#${latest.attemptNumber}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {latest ? formatDateTime(latest.completedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {latest ? (
                        <>
                          <span className="font-medium text-gray-800">
                            {latest.obtainedMark}
                          </span>
                          {" / "}
                          {row.totalPossibleMarks}
                          <span className="text-xs text-gray-400 ml-1">
                            ({latest.percentage}%)
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MetricBadge value={latest?.speedPercent} tone="speed" />
                    </td>
                    <td className="px-4 py-3">
                      <MetricBadge value={latest?.accuracyPercent} tone="accuracy" />
                    </td>
                    <td className="px-4 py-3">
                      <OnTimeBadge onTime={latest?.onTime} />
                    </td>
                  </tr>

                  {hasMultiple &&
                    isExpanded &&
                    attempts.map((attempt) => (
                      <tr
                        key={`${row.examId}-${attempt.attemptNumber}`}
                        className="border-t border-gray-50 bg-gray-50/40 text-gray-600"
                      >
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 text-xs text-gray-400" colSpan={2}>
                          ↳ Attempt {attempt.attemptNumber}
                        </td>
                        <td className="px-4 py-2" colSpan={3}></td>
                        <td className="px-4 py-2">
                          <StatusBadge status="Completed" />
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          #{attempt.attemptNumber}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {formatDateTime(attempt.completedAt)}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          <span className="font-medium text-gray-800">
                            {attempt.obtainedMark}
                          </span>
                          {" / "}
                          {row.totalPossibleMarks}
                          <span className="text-xs text-gray-400 ml-1">
                            ({attempt.percentage}%)
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <MetricBadge value={attempt.speedPercent} tone="speed" />
                        </td>
                        <td className="px-4 py-2">
                          <MetricBadge value={attempt.accuracyPercent} tone="accuracy" />
                        </td>
                        <td className="px-4 py-2">
                          <OnTimeBadge onTime={attempt.onTime} />
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No tests match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTestIndexTable;

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Clock,
  Trophy,
  Users,
  Bookmark,
  MessageCircleQuestion,
  Phone,
  Send,
} from "lucide-react";

// Question-level analysis, bookmarks and Ask-a-doubt for the exam review
// pages (2026-10-08). One request loads everything for a submission
// (GET /question-insights/:examSubmissionId); used by both
// CompletedExamSubmissionDetail and AttemptedExamSubmissionDetail.

const API = import.meta.env.VITE_APP_API_URL;

export const formatSecs = (s) => {
  if (s === null || s === undefined) return "—";
  const total = Math.max(0, Math.round(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
};

const DIFFICULTY_STYLE = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};

export const useQuestionInsights = (examSubmissionId) => {
  const [insights, setInsights] = useState(null);

  const load = useCallback(async () => {
    if (!examSubmissionId) return;
    try {
      const { data } = await axios.get(`${API}/question-insights/${examSubmissionId}`);
      setInsights(data?.data || null);
    } catch {
      setInsights(null); // analysis is optional — the page still works
    }
  }, [examSubmissionId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBookmark = async (questionId, examId) => {
    const isOn = insights?.bookmarkedQuestionIds?.includes(String(questionId));
    try {
      await axios.post(`${API}/notebook/bookmark`, { questionId, examId, bookmarked: !isOn });
      setInsights((prev) => ({
        ...prev,
        bookmarkedQuestionIds: isOn
          ? prev.bookmarkedQuestionIds.filter((id) => id !== String(questionId))
          : [...prev.bookmarkedQuestionIds, String(questionId)],
      }));
      toast.success(isOn ? "Removed from My Notebook" : "Saved to My Notebook");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't update bookmark.");
    }
  };

  const askDoubt = async (questionId, message) => {
    try {
      await axios.post(`${API}/doubts`, { examSubmissionId, questionId, message });
      toast.success("Doubt sent. You'll get a notification when it's answered.");
      await load();
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't send your doubt.");
      return false;
    }
  };

  return { insights, toggleBookmark, askDoubt };
};

// Card shown above the question list: rank, topper, and (free test) a
// "join the batch" call to action.
export const InsightsSummary = ({ insights }) => {
  if (!insights) return null;
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-indigo-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Your rank</p>
            <p className="text-lg font-semibold text-gray-900">
              {insights.rank} <span className="text-sm font-normal text-gray-500">of {insights.totalStudents}</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Topper's score</p>
            <p className="text-lg font-semibold text-gray-900">
              {insights.topperMark ?? "—"}
              <span className="text-sm font-normal text-gray-500"> · you {insights.yourMark}</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Topper's total time</p>
            <p className="text-lg font-semibold text-gray-900">{formatSecs(insights.topperTimeSeconds)}</p>
          </div>
        </div>
      </div>
      {insights.isFreeTrial && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-emerald-800">
            Liked this test? Our full test series has topic-wise, subject-wise and full-length tests with the same
            analysis, plus live and recorded classes.
          </p>
          <div className="flex gap-2 shrink-0">
            <a
              href="tel:+919566818665"
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-emerald-700"
            >
              <Phone className="h-4 w-4" /> Call to join
            </a>
            <a
              href="https://wa.me/919566818665?text=Hi%2C%20I%20took%20the%20free%20test%20and%20want%20to%20join%20the%20test%20series."
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-100"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Strip shown inside each question card.
export const QuestionInsightsPanel = ({ questionId, examId, insights, onToggleBookmark, onAskDoubt }) => {
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  if (!insights) return null;

  const qid = String(questionId);
  const stats = insights.questions?.[qid];
  const bookmarked = insights.bookmarkedQuestionIds?.includes(qid);
  const threads = (insights.doubt?.threads || []).filter((d) => String(d.questionId) === qid);

  const submit = async () => {
    if (text.trim().length < 5) {
      toast.error("Please describe your doubt.");
      return;
    }
    setSending(true);
    const ok = await onAskDoubt(questionId, text.trim());
    setSending(false);
    if (ok) {
      setText("");
      setAsking(false);
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-2">
      {stats && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            Your time <b className="text-gray-800">{formatSecs(stats.yourTimeSeconds)}</b>
          </span>
          <span>
            Topper <b className="text-gray-800">{formatSecs(stats.topperTimeSeconds)}</b>
          </span>
          <span>
            Average <b className="text-gray-800">{formatSecs(stats.averageTimeSeconds)}</b>
          </span>
          <span>
            <b className="text-gray-800">{stats.percentCorrect}%</b> of students got it right
          </span>
          {stats.difficulty && (
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${DIFFICULTY_STYLE[stats.difficulty]}`}>
              {stats.difficulty}
            </span>
          )}
        </div>
      )}

      {insights.isOwner && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleBookmark(questionId, examId)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${
              bookmarked
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          {insights.doubt?.eligible ? (
            <button
              type="button"
              onClick={() => setAsking((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <MessageCircleQuestion className="h-3.5 w-3.5" /> Ask a doubt
            </button>
          ) : (
            insights.doubt?.reason &&
            !insights.isFreeTrial && (
              <span className="text-[11px] text-gray-400" title={insights.doubt.reason}>
                Ask-a-doubt: {insights.doubt.reason}
              </span>
            )
          )}
        </div>
      )}

      {asking && (
        <div className="flex flex-col gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="What is your doubt in this question? (which step, which formula…)"
            className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white focus:outline-indigo-300"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={submit}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> {sending ? "Sending…" : "Send to faculty"}
            </button>
          </div>
        </div>
      )}

      {threads.map((d) => (
        <div key={d._id} className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
          <p className="text-gray-700">
            <span className="text-xs font-semibold text-gray-500">Your doubt: </span>
            {d.message}
          </p>
          {d.reply ? (
            <p className="mt-2 text-gray-800 whitespace-pre-line border-l-2 border-emerald-400 pl-2">
              <span className="text-xs font-semibold text-emerald-600">Faculty reply: </span>
              {d.reply}
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-600">Waiting for faculty reply…</p>
          )}
        </div>
      ))}
    </div>
  );
};

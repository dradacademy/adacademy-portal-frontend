import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, Send, Eye } from "lucide-react";
import { AuthContext } from "../../../../context/AuthContext";
import { EXAM_CATEGORY_OPTIONS, getCategoryLabel } from "../../../../constants/examCategories";
import { MathText, AnswerKeyText } from "../../../../utils/mathText";

// Doubts inbox (2026-10-08). Students who qualify (regular in tests and
// classes, or switched on below) ask about a question from a completed
// test; reply here and they get a notification. The "Doubt access" panel
// lets you force Allow/Block for a student, or leave it on Auto.

const API = import.meta.env.VITE_APP_API_URL;
const optionText = (opt) => (typeof opt === "string" ? opt : opt?.text || "");

const formatAnswer = (a) => {
  if (a === null || a === undefined || a === "" || (Array.isArray(a) && !a.length)) return "Not answered";
  return Array.isArray(a) ? a.join(", ") : String(a);
};

const DoubtCard = ({ doubt, onSaved }) => {
  const [reply, setReply] = useState(doubt.reply || "");
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const q = doubt.questionId || {};

  const send = async () => {
    if (!reply.trim()) return toast.error("Write a reply first.");
    setSaving(true);
    try {
      await axios.patch(`${API}/doubts/${doubt._id}/reply`, { reply: reply.trim() });
      toast.success("Reply sent — the student has been notified.");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send reply.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status) => {
    try {
      await axios.patch(`${API}/doubts/${doubt._id}/status`, { status });
      onSaved();
    } catch (e) {
      toast.error("Failed to update.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-gray-800">{doubt.userId?.username || "Student"}</span>
        <span className="text-gray-400 text-xs">{doubt.userId?.email}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
          {getCategoryLabel(doubt.category || doubt.userId?.category) || "—"}
        </span>
        {doubt.examId?.examCode && <span className="text-xs text-gray-500">Test {doubt.examId.examCode}</span>}
        <span className="ml-auto text-xs text-gray-400">
          {new Date(doubt.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
        <MathText text={q.questionText || ""} />
        {q.image && <img src={q.image} alt="" className="mt-2 max-h-48 object-contain" />}
        {(q.questionType === "MCQ" || q.questionType === "MSQ") && (
          <ol className="mt-2 list-[upper-alpha] pl-6 text-gray-600">
            {(q.options || []).map((o, i) => (
              <li key={i}>
                <MathText text={optionText(o)} />
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Student's answer: <b className="text-gray-700">{formatAnswer(doubt.studentAttempt?.studentAnswer)}</b>
          {doubt.studentAttempt?.isRight ? ` (${doubt.studentAttempt.isRight})` : ""} · Correct:{" "}
          <b className="text-emerald-700">{(q.correctAnswers || []).join(", ") || "—"}</b>
        </p>
        {(q.answerKeyText || q.answerKeyImage) && (
          <button type="button" onClick={() => setShowKey((v) => !v)} className="mt-1 flex items-center gap-1 text-xs text-indigo-600">
            <Eye className="h-3.5 w-3.5" /> {showKey ? "Hide" : "Show"} answer key
          </button>
        )}
        {showKey && (
          <div className="mt-2 text-sm">
            {q.answerKeyText && <AnswerKeyText text={q.answerKeyText} />}
            {q.answerKeyImage && <img src={q.answerKeyImage} alt="" className="mt-2 max-h-72 object-contain" />}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-800">
        <span className="text-xs font-semibold text-gray-500">Doubt: </span>
        {doubt.message}
      </p>

      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Type your explanation for the student…"
        className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-indigo-300"
      />
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {doubt.repliedAt && (
          <span className="mr-auto text-xs text-gray-400">
            Replied {new Date(doubt.repliedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {doubt.repliedBy?.username ? ` by ${doubt.repliedBy.username}` : ""}
          </span>
        )}
        {doubt.status !== "closed" ? (
          <button type="button" onClick={() => setStatus("closed")} className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            Close without reply
          </button>
        ) : (
          <button type="button" onClick={() => setStatus("open")} className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            Reopen
          </button>
        )}
        <button
          type="button"
          onClick={send}
          disabled={saving}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {saving ? "Sending…" : doubt.reply ? "Update reply" : "Send reply"}
        </button>
      </div>
    </div>
  );
};

const DoubtAccessPanel = () => {
  const { allUsersData } = useContext(AuthContext);
  const students = useMemo(
    () => (allUsersData || []).filter((u) => u.role === "student").sort((a, b) => (a.username || "").localeCompare(b.username || "")),
    [allUsersData]
  );
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const matches = students.filter((s) =>
    `${s.username} ${s.email} ${s.registerNumber || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!studentId) return setInfo(null);
    axios
      .get(`${API}/doubts/access/${studentId}`)
      .then(({ data }) => setInfo(data.data))
      .catch(() => setInfo(null));
  }, [studentId]);

  const setAccess = async (doubtAccess) => {
    setBusy(true);
    try {
      const { data } = await axios.patch(`${API}/doubts/access/${studentId}`, { doubtAccess });
      setInfo(data.data);
      toast.success("Updated.");
    } catch {
      toast.error("Failed to update.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800">Doubt access per student</h2>
      <p className="text-xs text-gray-500">
        Auto = allowed when, in the last 30 days, the student completed at least 4 tests (or all tests posted, if fewer)
        and watched at least 60% of classes. Allow / Block override that.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white max-w-xs"
        >
          <option value="">Select a student…</option>
          {matches.slice(0, 300).map((s) => (
            <option key={s._id} value={s._id}>
              {s.username} — {s.email}
            </option>
          ))}
        </select>
      </div>
      {info && (
        <div className="flex flex-col gap-2 text-sm">
          <p className={info.eligible ? "text-emerald-700" : "text-amber-700"}>
            {info.eligible ? "Can ask doubts." : "Cannot ask doubts."} {info.reason}
          </p>
          {info.stats && (
            <p className="text-xs text-gray-500">
              Last 30 days: {info.stats.testsAttempted} test(s) completed (needs {info.stats.testsRequired}),{" "}
              {info.stats.classesWatched}/{info.stats.classesTotal} classes watched ({info.stats.classPercent}%).
            </p>
          )}
          <div className="flex gap-2">
            {["auto", "allow", "block"].map((v) => (
              <button
                key={v}
                type="button"
                disabled={busy}
                onClick={() => setAccess(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  info.override === v ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v === "auto" ? "Auto" : v === "allow" ? "Always allow" : "Block"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DoubtsAdminPage = () => {
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("");
  const [doubts, setDoubts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/doubts`, { params: { status, category: category || undefined } });
      setDoubts(data.data || []);
      setCounts(data.counts || {});
    } catch {
      toast.error("Failed to load doubts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category]);

  return (
    <div className="flex flex-col gap-6 w-full font-inter">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-stone-700 font-bold font-poppins flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-indigo-500" /> Doubts
        </h1>
        <p className="text-stone-400 font-medium">
          Questions from regular students on completed tests. Your reply reaches the student as a notification and
          appears under that question in their test review and in My Notebook.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          ["open", "Open"],
          ["answered", "Answered"],
          ["closed", "Closed"],
          ["all", "All"],
        ].map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setStatus(v)}
            className={`py-1.5 px-4 rounded-full text-sm font-medium ${
              status === v ? "bg-indigo-500 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {label}
            {v !== "all" && counts[v] ? ` (${counts[v]})` : ""}
          </button>
        ))}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="ml-auto border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All categories</option>
          {EXAM_CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      ) : doubts.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No {status === "all" ? "" : status} doubts.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {doubts.map((d) => (
            <DoubtCard key={d._id} doubt={d} onSaved={load} />
          ))}
        </div>
      )}

      <DoubtAccessPanel />
    </div>
  );
};

export default DoubtsAdminPage;

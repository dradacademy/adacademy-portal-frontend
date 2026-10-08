import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Bookmark, CheckCircle2, XCircle, RotateCcw, Eye, MessageSquare } from "lucide-react";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import { MathText, AnswerKeyText } from "../../../utils/mathText";

// "My Notebook" (2026-10-08): every question the student got wrong or
// partly wrong in their latest attempt of each test, plus bookmarked
// questions, grouped by subject and topic. Each can be re-attempted (checked
// on the server with the same grading as real tests), its solution shown,
// and a mistake marked "mastered" once learnt. A third tab lists the
// student's doubts and the faculty replies.

const API = import.meta.env.VITE_APP_API_URL;

const optionText = (opt) => (typeof opt === "string" ? opt : opt?.text || "");
const optionImage = (opt) => (typeof opt === "object" && opt ? opt.image : null);

const isCorrectOption = (q, i) => {
  if (Array.isArray(q.correctOptionIndexes) && q.correctOptionIndexes.length) {
    return q.correctOptionIndexes.includes(i);
  }
  return (q.correctAnswers || []).includes(optionText(q.options?.[i]));
};

const correctAnswerText = (q) => {
  if (q.natAnswerMode === "range" && q.rangeMin != null && q.rangeMax != null) {
    return `Any value from ${q.rangeMin} to ${q.rangeMax}`;
  }
  return (q.correctAnswers || []).join(", ");
};

const formatYourAnswer = (item) => {
  const a = item.yourAnswer;
  if (a === null || a === undefined || a === "" || (Array.isArray(a) && !a.length)) return "Not answered";
  return Array.isArray(a) ? a.join(", ") : String(a);
};

const RESULT_STYLE = {
  Incorrect: "bg-rose-50 text-rose-700",
  "Partially Correct": "bg-amber-50 text-amber-700",
  Correct: "bg-emerald-50 text-emerald-700",
  Skipped: "bg-gray-100 text-gray-600",
};

const NotebookCard = ({ item, onChange }) => {
  const q = item.question;
  const isChoice = q.questionType === "MCQ" || q.questionType === "MSQ";
  const [picked, setPicked] = useState([]);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const pick = (i) => {
    setResult(null);
    if (q.questionType === "MSQ") {
      setPicked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
    } else {
      setPicked([i]);
    }
  };

  const check = async () => {
    let studentAnswer;
    let studentAnswerIndexes;
    if (isChoice) {
      if (!picked.length) return toast.error("Choose an option first.");
      studentAnswerIndexes = [...picked].sort((a, b) => a - b);
      const texts = studentAnswerIndexes.map((i) => optionText(q.options[i]));
      studentAnswer = q.questionType === "MSQ" ? texts : texts[0];
    } else {
      if (!typed.trim()) return toast.error("Type your answer first.");
      studentAnswer = typed.trim();
    }
    setChecking(true);
    try {
      const { data } = await axios.post(`${API}/notebook/practice`, {
        questionId: item.questionId,
        studentAnswer,
        studentAnswerIndexes,
      });
      setResult(data.data.status);
      onChange(item.questionId, { practiceCount: item.practiceCount + 1, lastPracticeCorrect: data.data.correct });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't check your answer.");
    } finally {
      setChecking(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      await axios.post(`${API}/notebook/bookmark`, {
        questionId: item.questionId,
        examId: item.examId,
        bookmarked: !item.bookmarked,
      });
      onChange(item.questionId, { bookmarked: !item.bookmarked });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't update bookmark.");
    }
  };

  const toggleMastered = async () => {
    try {
      await axios.post(`${API}/notebook/mastered`, { questionId: item.questionId, mastered: !item.mastered });
      onChange(item.questionId, { mastered: !item.mastered });
      if (!item.mastered) toast.success("Marked as mastered — hidden from your mistakes list.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't update.");
    }
  };

  const answerImages = (q.answerKeyImages && q.answerKeyImages.length ? q.answerKeyImages : [q.answerKeyImage]).filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-2xs p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {item.result && (
          <span className={`px-2 py-0.5 rounded-full font-medium ${RESULT_STYLE[item.result] || RESULT_STYLE.Skipped}`}>
            {item.result}
          </span>
        )}
        <span className="text-gray-400">
          {q.questionType}
          {item.examCode ? ` · Test ${item.examCode}` : ""}
        </span>
        {item.practiceCount > 0 && (
          <span className={item.lastPracticeCorrect ? "text-emerald-600" : "text-gray-400"}>
            · Practised {item.practiceCount}× {item.lastPracticeCorrect ? "(last: correct)" : ""}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleBookmark}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
              item.bookmarked ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${item.bookmarked ? "fill-current" : ""}`} />
            {item.bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          {item.isMistake && (
            <button
              type="button"
              onClick={toggleMastered}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                item.mastered ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {item.mastered ? "Mastered" : "Mark mastered"}
            </button>
          )}
        </div>
      </div>

      <div className="text-gray-900">
        <MathText text={q.questionText} />
        {q.image && <img src={q.image} alt="" className="mt-2 max-h-48 object-contain" />}
      </div>

      {isChoice ? (
        <div className="flex flex-col gap-1.5">
          {(q.options || []).map((opt, i) => {
            const chosen = picked.includes(i);
            const reveal = showSolution && isCorrectOption(q, i);
            return (
              <button
                type="button"
                key={i}
                onClick={() => pick(i)}
                className={`text-left flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  reveal
                    ? "border-emerald-300 bg-emerald-50"
                    : chosen
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="font-semibold text-gray-500">{String.fromCharCode(65 + i)}.</span>
                <span className="flex-1">
                  <MathText text={optionText(opt)} />
                  {optionImage(opt) && <img src={optionImage(opt)} alt="" className="mt-1 max-h-28 object-contain" />}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setResult(null);
          }}
          placeholder="Type your answer"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm max-w-xs"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" /> {checking ? "Checking…" : "Check my answer"}
        </button>
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" /> {showSolution ? "Hide solution" : "Show solution"}
        </button>
        {result && (
          <span
            className={`flex items-center gap-1 text-sm font-medium ${
              result === "Correct" ? "text-emerald-600" : result === "Partially Correct" ? "text-amber-600" : "text-rose-600"
            }`}
          >
            {result === "Correct" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {result}
          </span>
        )}
      </div>

      {showSolution && (
        <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3 text-sm flex flex-col gap-2">
          <p>
            <span className="text-gray-500">Your answer in the test: </span>
            <span className="font-medium text-gray-800">{formatYourAnswer(item)}</span>
          </p>
          {!isChoice && (
            <p>
              <span className="text-gray-500">Correct answer: </span>
              <span className="font-medium text-emerald-700">{correctAnswerText(q)}</span>
            </p>
          )}
          {q.answerKeyText && <AnswerKeyText text={q.answerKeyText} />}
          {answerImages.map((src) => (
            <img key={src} src={src} alt="Solution" className="max-h-96 object-contain" />
          ))}
        </div>
      )}
    </div>
  );
};

const MyNotebookStudent = () => {
  const { userData } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mistakes");
  const [subject, setSubject] = useState("all");
  const [showMastered, setShowMastered] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const isFreeTrial = userData?.accountType === "free_trial";

  useEffect(() => {
    (async () => {
      try {
        const [nb, dbt] = await Promise.all([
          axios.get(`${API}/notebook`),
          isFreeTrial ? Promise.resolve({ data: { data: [] } }) : axios.get(`${API}/doubts/mine`).catch(() => ({ data: { data: [] } })),
        ]);
        setItems(nb.data?.data || []);
        setDoubts(dbt.data?.data || []);
      } catch {
        toast.error("Couldn't load your notebook.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isFreeTrial]);

  const updateItem = (questionId, patch) =>
    setItems((prev) => prev.map((it) => (it.questionId === questionId ? { ...it, ...patch } : it)));

  const subjects = useMemo(() => [...new Set(items.map((i) => i.subjectName))].sort(), [items]);
  const mistakesCount = items.filter((i) => i.isMistake && !i.mastered).length;
  const bookmarkCount = items.filter((i) => i.bookmarked).length;

  const visible = items.filter((i) => {
    if (subject !== "all" && i.subjectName !== subject) return false;
    if (tab === "mistakes") return i.isMistake && (showMastered || !i.mastered);
    if (tab === "bookmarks") return i.bookmarked;
    return false;
  });

  const grouped = [];
  for (const item of visible) {
    const key = `${item.subjectName} › ${item.subTopicName}`;
    let g = grouped.find((x) => x.key === key);
    if (!g) grouped.push((g = { key, items: [] }));
    g.items.push(item);
  }

  const tabBtn = (id, label, count) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-full text-sm font-medium ${
        tab === id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
      {count !== undefined && <span className="ml-1.5 opacity-80">({count})</span>}
    </button>
  );

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">My Notebook</h1>
          <p className="text-gray-600 mt-1">
            Questions you got wrong in your latest attempt of each test, and questions you bookmarked — grouped by
            topic. Try them again until you get them right.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabBtn("mistakes", "My Mistakes", mistakesCount)}
          {tabBtn("bookmarks", "Bookmarked", bookmarkCount)}
          {!isFreeTrial && tabBtn("doubts", "My Doubts", doubts.length)}
        </div>

        {tab !== "doubts" && (
          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {tab === "mistakes" && (
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" checked={showMastered} onChange={(e) => setShowMastered(e.target.checked)} />
                Show mastered questions too
              </label>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        ) : tab === "doubts" ? (
          doubts.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              No doubts yet. Open a completed test and use “Ask a doubt” under any question.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {doubts.map((d) => (
                <div key={d._id} className="bg-white rounded-xl border border-gray-100 p-4 text-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {d.examId?.examCode ? `Test ${d.examId.examCode} · ` : ""}
                    {new Date(d.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full font-medium ${
                        d.status === "answered" ? "bg-emerald-50 text-emerald-700" : d.status === "open" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {d.status === "open" ? "Waiting for reply" : d.status === "answered" ? "Answered" : "Closed"}
                    </span>
                  </div>
                  {d.questionId?.questionText && (
                    <div className="text-gray-500 line-clamp-2">
                      <MathText text={d.questionId.questionText} />
                    </div>
                  )}
                  <p className="text-gray-800">
                    <span className="text-xs font-semibold text-gray-500">Your doubt: </span>
                    {d.message}
                  </p>
                  {d.reply && (
                    <p className="text-gray-800 whitespace-pre-line border-l-2 border-emerald-400 pl-2">
                      <span className="text-xs font-semibold text-emerald-600">Faculty reply: </span>
                      {d.reply}
                    </p>
                  )}
                  <Link to={`/activities/attempted/${d.examSubmissionId}`} className="text-xs text-indigo-600 hover:underline self-start">
                    Open the test review
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : grouped.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            {tab === "mistakes"
              ? "No mistakes to revise here. Wrong answers from your tests appear here automatically."
              : "No bookmarks yet. Use “Bookmark” under any question in a completed test."}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {grouped.map((g) => (
              <section key={g.key}>
                <h2 className="text-sm font-semibold text-indigo-700 mb-3">
                  {g.key} <span className="text-gray-400 font-normal">({g.items.length})</span>
                </h2>
                <div className="flex flex-col gap-4">
                  {g.items.map((item) => (
                    <NotebookCard key={item.questionId} item={item} onChange={updateItem} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyNotebookStudent;

import axios from "axios";
import download from "downloadjs";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import {
  Search,
  ArrowUpDown,
  Users,
  Settings2,
  FileText,
  Video,
  Paperclip,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

const SORT_OPTIONS = [
  { value: "name", label: "Student Name" },
  { value: "overallProgress", label: "Overall Progress %" },
  { value: "examPercent", label: "Exam Completion %" },
  { value: "videoPercent", label: "Video Completion %" },
  { value: "attachmentPercent", label: "Attachment Completion %" },
];

const COMPLETION_OPTIONS = [
  { value: "", label: "Any" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
];

const ACTIVE_OPTIONS = [
  { value: "", label: "All Students" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

const ProgressBar = ({ percent }) => (
  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-indigo-500 rounded-full"
      style={{ width: `${Math.min(100, Math.max(0, percent || 0))}%` }}
    />
  </div>
);

const CompletionCell = ({ completed, total, percent }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-gray-700">
      {completed}/{total}
    </span>
    <ProgressBar percent={percent} />
  </div>
);

// Student Progress & Learning Analytics Dashboard — every student, with
// dynamically computed exam/video/attachment completion and a configurable-
// weight Overall Progress %. All figures come from GET /student-progress,
// which shares its computation (utils/studentProgressHelper.js on the
// backend) with the "View Detail" panel below and the student's own
// My Progress page — so a number here can never disagree with what a
// student sees for themselves.
const StudentProgressDashboardAdminPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [batch, setBatch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [examStatus, setExamStatus] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState("");
  const [progressMin, setProgressMin] = useState("");
  const [progressMax, setProgressMax] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const [detailStudentId, setDetailStudentId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const [weightsOpen, setWeightsOpen] = useState(false);
  const [weights, setWeights] = useState({ examWeight: 40, videoWeight: 40, attachmentWeight: 20 });
  const [savingWeights, setSavingWeights] = useState(false);

  // Category Performance Rollup — a period-based, category-wide view
  // (pass rate, avg marks/speed/accuracy, most-missed topics) across every
  // exam in a category at once, complementing the per-exam Exam Dashboard.
  // Deliberately kept on this same page as a dialog rather than a new
  // sidebar entry, per the "one tab, not sidebar sprawl" approach this was
  // scoped under.
  const [rollupOpen, setRollupOpen] = useState(false);
  const [rollupCategory, setRollupCategory] = useState(EXAM_CATEGORY_OPTIONS[0]?.value || "");
  const [rollupFromDate, setRollupFromDate] = useState("");
  const [rollupToDate, setRollupToDate] = useState("");
  const [rollupData, setRollupData] = useState(null);
  const [rollupLoading, setRollupLoading] = useState(false);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (batch) params.batch = batch;
      if (activeStatus) params.activeStatus = activeStatus;
      if (examStatus) params.examStatus = examStatus;
      if (videoStatus) params.videoStatus = videoStatus;
      if (attachmentStatus) params.attachmentStatus = attachmentStatus;
      if (progressMin !== "") params.progressMin = progressMin;
      if (progressMax !== "") params.progressMax = progressMax;
      params.sortBy = sortBy;
      params.sortDir = sortDir;

      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/student-progress`,
        { params }
      );
      setRows(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load student progress.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchRows, 300); // debounce search/filter changes
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    category,
    batch,
    activeStatus,
    examStatus,
    videoStatus,
    attachmentStatus,
    progressMin,
    progressMax,
    sortBy,
    sortDir,
  ]);

  const openDetail = async (studentId) => {
    setDetailStudentId(studentId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/student-progress/${studentId}`
      );
      setDetail(response.data?.data || null);
    } catch (error) {
      toast.error("Failed to load student detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailStudentId(null);
    setDetail(null);
  };

  // Admin-only Performance Report PDF — same fetch-as-blob + downloadjs
  // pattern already used for the Student Profile PDF export
  // (StudentProfilesAdminPage.jsx's handleDownloadPdf), never wired up
  // anywhere on the student-facing Performance page.
  const handleDownloadReport = async () => {
    if (!detailStudentId) return;
    try {
      setDownloadingReport(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/performance-analytics/${detailStudentId}/pdf`,
        { responseType: "blob" }
      );
      const filenameSafeName = (detail?.student?.name || "student")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase();
      download(response.data, `${filenameSafeName}-performance-report.pdf`, "application/pdf");
    } catch (error) {
      toast.error("Failed to generate the performance report PDF.");
    } finally {
      setDownloadingReport(false);
    }
  };

  const openWeights = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/student-progress/weights`
      );
      const data = response.data?.data;
      if (data) {
        setWeights({
          examWeight: data.examWeight,
          videoWeight: data.videoWeight,
          attachmentWeight: data.attachmentWeight,
        });
      }
      setWeightsOpen(true);
    } catch (error) {
      toast.error("Failed to load weight configuration.");
    }
  };

  const saveWeights = async () => {
    setSavingWeights(true);
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/student-progress/weights`,
        weights
      );
      toast.success("Weighting updated.");
      setWeightsOpen(false);
      fetchRows();
    } catch (error) {
      toast.error("Failed to update weighting.");
    } finally {
      setSavingWeights(false);
    }
  };

  const fetchRollup = async (categoryOverride) => {
    const cat = categoryOverride || rollupCategory;
    if (!cat) return;
    setRollupLoading(true);
    try {
      const params = {};
      if (rollupFromDate) params.fromDate = rollupFromDate;
      if (rollupToDate) params.toDate = rollupToDate;
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/performance-analytics/rollup/${cat}`,
        { params }
      );
      setRollupData(response.data?.data || null);
    } catch (error) {
      toast.error("Failed to load category rollup.");
    } finally {
      setRollupLoading(false);
    }
  };

  const openRollup = () => {
    setRollupOpen(true);
    fetchRollup(rollupCategory);
  };

  const batchOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.batch).filter(Boolean));
    return [...set];
  }, [rows]);

  return (
    <div className="flex flex-col gap-6 w-full font-inter">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Student Progress
          </h1>
          <p className="text-stone-400 font-medium">
            Overall progress, exam/video/attachment completion — computed
            live from real activity, never static.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openRollup}
            className="flex items-center gap-2 text-nowrap bg-stone-100 text-stone-600 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:bg-stone-200 duration-300"
          >
            <BarChart3 className="h-4 w-4" /> Category Rollup
          </button>
          <button
            onClick={openWeights}
            className="flex items-center gap-2 text-nowrap bg-stone-100 text-stone-600 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:bg-stone-200 duration-300"
          >
            <Settings2 className="h-4 w-4" /> Weighting
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, register number…"
            className="flex-1 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Courses</option>
          {EXAM_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
        >
          <option value="">All Batches</option>
          {batchOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value)}
        >
          {ACTIVE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-sm">
          <FileText className="h-3.5 w-3.5 text-blue-400" />
          <select
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm"
            value={examStatus}
            onChange={(e) => setExamStatus(e.target.value)}
          >
            {COMPLETION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Video className="h-3.5 w-3.5 text-rose-400" />
          <select
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm"
            value={videoStatus}
            onChange={(e) => setVideoStatus(e.target.value)}
          >
            {COMPLETION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Paperclip className="h-3.5 w-3.5 text-amber-400" />
          <select
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm"
            value={attachmentStatus}
            onChange={(e) => setAttachmentStatus(e.target.value)}
          >
            {COMPLETION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Min %"
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm w-20"
            value={progressMin}
            onChange={(e) => setProgressMin(e.target.value)}
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max %"
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm w-20"
            value={progressMax}
            onChange={(e) => setProgressMax(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <select
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="border border-stone-200 rounded-xl px-2 py-2 text-sm"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course / Batch</th>
              <th className="px-4 py-3">Overall Progress</th>
              <th className="px-4 py-3">Exams</th>
              <th className="px-4 py-3">Videos</th>
              <th className="px-4 py-3">Attachments</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10 flex-col">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Users className="h-6 w-6 text-gray-300" />
                    No students match these filters.
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.studentId} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{getCategoryLabel(row.category)}</p>
                    {row.batch && <p className="text-xs text-gray-400">{row.batch}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 w-10">
                        {row.overallProgress}%
                      </span>
                      <ProgressBar percent={row.overallProgress} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CompletionCell
                      completed={row.exams.completed}
                      total={row.exams.total}
                      percent={row.exams.percent}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <CompletionCell
                      completed={row.videos.completed}
                      total={row.videos.total}
                      percent={row.videos.percent}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <CompletionCell
                      completed={row.attachments.completed}
                      total={row.attachments.total}
                      percent={row.attachments.percent}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.isDisabled
                          ? "bg-gray-200 text-gray-600"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {row.isDisabled ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(row.studentId)}
                      className="text-xs font-medium bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Detail dialog */}
      <Dialog open={!!detailStudentId} onClose={closeDetail} maxWidth="md" fullWidth>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-xl font-bold text-stone-700 font-poppins">Student Detail</h2>
            <div className="flex items-center gap-4">
              {!detailLoading && detail && (
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="text-xs font-medium bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600 disabled:opacity-50"
                >
                  {downloadingReport ? "Preparing…" : "Download Performance Report"}
                </button>
              )}
              <MdClose
                onClick={closeDetail}
                className="text-stone-500 font-medium text-3xl cursor-pointer hover:opacity-80 duration-300"
              />
            </div>
          </div>

          {detailLoading ? (
            <div className="text-center text-gray-400 py-10">Loading…</div>
          ) : !detail ? (
            <div className="text-center text-gray-400 py-10">No data.</div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Name</p>
                  <p className="font-medium text-gray-800">{detail.student.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="font-medium text-gray-800">{detail.student.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Course</p>
                  <p className="font-medium text-gray-800">
                    {getCategoryLabel(detail.student.category)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Batch</p>
                  <p className="font-medium text-gray-800">{detail.student.batch || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Last Login</p>
                  <p className="font-medium text-gray-800">
                    {detail.student.lastLoginAt
                      ? new Date(detail.student.lastLoginAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Status</p>
                  <p className="font-medium text-gray-800">
                    {detail.student.isDisabled ? "Inactive" : "Active"}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="font-medium text-indigo-700">Overall Progress</span>
                <span className="text-2xl font-bold text-indigo-700">
                  {detail.progress.overallProgress}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Exams
                  </p>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    {detail.progress.exams.completed}/{detail.progress.exams.total}
                  </p>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {detail.progress.exams.list.map((e) => (
                      <div key={e.examId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-mono truncate">{e.examCode}</span>
                        {e.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" /> Videos
                  </p>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    {detail.progress.videos.completed}/{detail.progress.videos.total}
                  </p>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {detail.progress.videos.list.map((v) => (
                      <div key={v.videoId} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-gray-600 truncate">{v.title}</span>
                        <span className="text-gray-400 shrink-0">{v.percentWatched}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" /> Attachments
                  </p>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    {detail.progress.attachments.completed}/{detail.progress.attachments.total}
                  </p>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {detail.progress.attachments.list.map((a) => (
                      <div
                        key={a.attachmentId}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-600 truncate">{a.title}</span>
                        {a.viewed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Weighting dialog */}
      <Dialog open={weightsOpen} onClose={savingWeights ? undefined : () => setWeightsOpen(false)}>
        <div className="p-6 flex flex-col gap-4 sm:min-w-[400px]">
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-xl font-bold text-stone-700 font-poppins">
              Overall Progress Weighting
            </h2>
            {!savingWeights && (
              <MdClose
                onClick={() => setWeightsOpen(false)}
                className="text-stone-500 font-medium text-3xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <p className="text-sm text-stone-500">
            Weights don't need to sum to 100 — they're combined as a ratio.
          </p>
          {["examWeight", "videoWeight", "attachmentWeight"].map((key) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-stone-600 capitalize">
                {key.replace("Weight", "")}
              </label>
              <input
                type="number"
                min="0"
                className="border border-stone-300 py-2 px-3 rounded-xl w-24"
                value={weights[key]}
                onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                disabled={savingWeights}
              />
            </div>
          ))}
          <button
            onClick={saveWeights}
            disabled={savingWeights}
            className="bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl hover:opacity-85 duration-300 disabled:opacity-50"
          >
            {savingWeights ? "Saving…" : "Save"}
          </button>
        </div>
      </Dialog>

      {/* Category Performance Rollup — pass rate, average marks/speed/
          accuracy, and the most-missed topics across every exam in one
          category, optionally scoped to a date range on completedAt. Reads
          the exact same data ExamSubmission already carries; no new model. */}
      <Dialog open={rollupOpen} onClose={() => setRollupOpen(false)} maxWidth="sm" fullWidth>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-xl font-bold text-stone-700 font-poppins">
              Category Performance Rollup
            </h2>
            <MdClose
              onClick={() => setRollupOpen(false)}
              className="text-stone-500 font-medium text-3xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Category</label>
              <select
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
                value={rollupCategory}
                onChange={(e) => setRollupCategory(e.target.value)}
              >
                {EXAM_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">From (optional)</label>
              <input
                type="date"
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
                value={rollupFromDate}
                onChange={(e) => setRollupFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">To (optional)</label>
              <input
                type="date"
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
                value={rollupToDate}
                onChange={(e) => setRollupToDate(e.target.value)}
              />
            </div>
            <button
              onClick={() => fetchRollup()}
              disabled={rollupLoading}
              className="bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl hover:opacity-85 duration-300 disabled:opacity-50"
            >
              {rollupLoading ? "Loading…" : "Load"}
            </button>
          </div>

          {rollupLoading ? (
            <p className="text-sm text-stone-400 text-center py-6">Loading…</p>
          ) : !rollupData?.hasData ? (
            <p className="text-sm text-stone-400 text-center py-6">
              No completed attempts yet in this category
              {rollupFromDate || rollupToDate ? " for the selected date range" : ""}.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ["Total Attempts", rollupData.totalAttempts],
                  ["Students", rollupData.distinctStudents],
                  ["Pass Rate", rollupData.passRate !== null ? `${rollupData.passRate}%` : "—"],
                  ["Avg Score", `${rollupData.avgPercentage}%`],
                  ["Avg Speed", rollupData.avgSpeed !== null ? `${rollupData.avgSpeed}%` : "—"],
                  ["Avg Accuracy", rollupData.avgAccuracy !== null ? `${rollupData.avgAccuracy}%` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-stone-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-stone-700">{value}</p>
                    <p className="text-xs text-stone-400">{label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-600 mb-2">
                  Most-missed topics (lowest average score, category-wide)
                </p>
                {rollupData.mostMissedTopics.length === 0 ? (
                  <p className="text-xs text-stone-400">
                    No topic-linked completed attempts yet.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-stone-50">
                    {rollupData.mostMissedTopics.map((t, i) => (
                      <div
                        key={`${t.subjectName}-${t.subTopicName}`}
                        className="py-2 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm text-stone-700 capitalize">
                            {i + 1}. {t.subjectName}
                          </p>
                          <p className="text-xs text-stone-400 capitalize">{t.subTopicName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-rose-500">{t.avgPercentage}%</p>
                          <p className="text-xs text-stone-400">{t.attempts} attempts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {rollupData.engagement && (
                <div>
                  <p className="text-sm font-semibold text-stone-600 mb-1">
                    Engagement vs. Performance
                  </p>
                  <p className="text-xs text-stone-400 mb-2">
                    Students who watched a recorded class or opened a study
                    material in the last {rollupData.engagement.windowDays}{" "}
                    days, vs. those who didn't — correlation only, not a
                    claim that engagement causes the difference.
                  </p>
                  {rollupData.engagement.engagedAttempts === 0 &&
                  rollupData.engagement.notEngagedAttempts === 0 ? (
                    <p className="text-xs text-stone-400">
                      Not enough data yet to compare.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-emerald-700">
                          {rollupData.engagement.engagedAvgScore !== null
                            ? `${rollupData.engagement.engagedAvgScore}%`
                            : "—"}
                        </p>
                        <p className="text-xs text-emerald-600">
                          Engaged ({rollupData.engagement.engagedStudents} students,{" "}
                          {rollupData.engagement.engagedAttempts} attempts)
                        </p>
                      </div>
                      <div className="bg-stone-100 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-stone-600">
                          {rollupData.engagement.notEngagedAvgScore !== null
                            ? `${rollupData.engagement.notEngagedAvgScore}%`
                            : "—"}
                        </p>
                        <p className="text-xs text-stone-500">
                          Not engaged ({rollupData.engagement.notEngagedStudents} students,{" "}
                          {rollupData.engagement.notEngagedAttempts} attempts)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default StudentProgressDashboardAdminPage;

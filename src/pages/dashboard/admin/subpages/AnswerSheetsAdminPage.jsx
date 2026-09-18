import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Trash2, CheckCircle2, ClipboardCheck } from "lucide-react";

const MISTAKE_TYPES = [
  { value: "silly", label: "Silly Mistake", color: "bg-amber-500" },
  { value: "concept", label: "Concept Mistake", color: "bg-rose-500" },
  { value: "application", label: "Application Mistake", color: "bg-indigo-500" },
];

const mistakeColor = (type) =>
  MISTAKE_TYPES.find((t) => t.value === type)?.color || "bg-gray-500";

// Fetches one answer-sheet page image through an authenticated request (no
// direct file URL is ever put in an <img src>) and renders it as a blob
// object URL — same pattern as AttachmentViewer.jsx.
const AuthenticatedSheetImage = ({ sheetId, imageIndex, onClick, children }) => {
  const [url, setUrl] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/answer-sheets/${sheetId}/image/${imageIndex}`,
          { responseType: "blob" }
        );
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(response.data);
        objectUrlRef.current = objectUrl;
        setUrl(objectUrl);
      } catch (error) {
        // Silent — the container shows a loading/blank state either way.
      }
    };
    load();
    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, imageIndex]);

  return (
    <div className="relative w-full select-none" onClick={onClick}>
      {url ? (
        <img src={url} alt={`Page ${imageIndex + 1}`} className="w-full rounded-lg" draggable={false} />
      ) : (
        <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
      )}
      {children}
    </div>
  );
};

// Admin review screen for handwritten answer sheets: pick an exam, pick a
// student's submission, click anywhere on the page image to drop a mistake
// pin (silly / concept / application — the three categories the admin
// asked for), then mark the submission reviewed.
const AnswerSheetsAdminPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingType, setPendingType] = useState("silly");
  const [savingMistake, setSavingMistake] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/exams/getAll`)
      .then((response) => setExams(response.data?.data || response.data || []))
      .catch(() => toast.error("Failed to load exams."));
  }, []);

  const fetchSheets = async (examId) => {
    if (!examId) {
      setSheets([]);
      return;
    }
    try {
      setLoadingSheets(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/answer-sheets/exam/${examId}`
      );
      setSheets(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load answer sheets for this exam.");
    } finally {
      setLoadingSheets(false);
    }
  };

  useEffect(() => {
    fetchSheets(selectedExamId);
    setSelectedSheet(null);
  }, [selectedExamId]);

  const openSheet = (sheet) => {
    setSelectedSheet(sheet);
    setActiveImageIndex(0);
  };

  const refreshSelectedSheet = async (sheetId) => {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_URL}/answer-sheets/${sheetId}`
    );
    setSelectedSheet(response.data?.data);
    setSheets((prev) =>
      prev.map((s) => (s._id === sheetId ? { ...s, ...response.data?.data } : s))
    );
  };

  const handleImageClick = async (e) => {
    if (!selectedSheet || savingMistake) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setSavingMistake(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/answer-sheets/${selectedSheet._id}/mistakes`,
        {
          imageIndex: activeImageIndex,
          type: pendingType,
          xPercent,
          yPercent,
        }
      );
      await refreshSelectedSheet(selectedSheet._id);
      toast.success("Mistake marked.");
    } catch (error) {
      toast.error("Failed to mark mistake.");
    } finally {
      setSavingMistake(false);
    }
  };

  const handleRemoveMistake = async (mistakeId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/answer-sheets/${selectedSheet._id}/mistakes/${mistakeId}`
      );
      await refreshSelectedSheet(selectedSheet._id);
    } catch (error) {
      toast.error("Failed to remove marker.");
    }
  };

  const handleToggleReviewed = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/answer-sheets/${selectedSheet._id}/review`,
        { reviewed: !selectedSheet.reviewed }
      );
      await refreshSelectedSheet(selectedSheet._id);
      toast.success(selectedSheet.reviewed ? "Marked as pending review." : "Marked reviewed.");
    } catch (error) {
      toast.error("Failed to update review status.");
    }
  };

  const mistakesOnActiveImage = useMemo(() => {
    if (!selectedSheet) return [];
    return (selectedSheet.mistakes || []).filter((m) => m.imageIndex === activeImageIndex);
  }, [selectedSheet, activeImageIndex]);

  return (
    <div className="flex flex-col gap-6 w-full font-inter">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-stone-700 font-bold font-poppins">Answer Sheets</h1>
        <p className="text-stone-400 font-medium">
          Review students' uploaded handwritten answer sheets and mark silly,
          concept, or application mistakes by clicking directly on the page.
        </p>
      </div>

      <select
        className="border border-stone-200 rounded-xl px-3 py-2 text-sm max-w-md"
        value={selectedExamId}
        onChange={(e) => setSelectedExamId(e.target.value)}
      >
        <option value="">Select an exam…</option>
        {exams.map((exam) => (
          <option key={exam._id} value={exam._id}>
            {exam.examCode} — {exam.subject} / {exam.subTopic}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
          <h2 className="font-semibold text-gray-700 mb-1">Submissions</h2>
          {loadingSheets ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : sheets.length === 0 ? (
            <p className="text-sm text-gray-400">
              {selectedExamId ? "No submissions for this exam yet." : "Select an exam to begin."}
            </p>
          ) : (
            sheets.map((sheet) => (
              <button
                key={sheet._id}
                onClick={() => openSheet(sheet)}
                className={`text-left px-3 py-2 rounded-xl border transition-colors ${
                  selectedSheet?._id === sheet._id
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-medium text-gray-800">
                  {sheet.userId?.username || "Unknown student"}
                </p>
                <p className="text-xs text-gray-400">
                  {sheet.images?.length || 0} page(s) · {sheet.mistakes?.length || 0} marked
                </p>
                {sheet.reviewed && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs mt-1">
                    <CheckCircle2 className="h-3 w-3" /> Reviewed
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
          {!selectedSheet ? (
            <p className="text-sm text-gray-400 text-center py-16">
              Select a submission to review.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(selectedSheet.images || []).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activeImageIndex === idx
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Page {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleToggleReviewed}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                    selectedSheet.reviewed
                      ? "bg-gray-100 text-gray-600"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {selectedSheet.reviewed ? "Mark Pending" : "Mark Reviewed"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Click the page to mark a:</span>
                {MISTAKE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setPendingType(t.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      pendingType === t.value
                        ? `${t.color} text-white border-transparent`
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${t.color}`} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden max-w-xl mx-auto w-full">
                <AuthenticatedSheetImage
                  sheetId={selectedSheet._id}
                  imageIndex={activeImageIndex}
                  onClick={handleImageClick}
                >
                  {mistakesOnActiveImage.map((m) => (
                    <div
                      key={m._id}
                      className="absolute -translate-x-1/2 -translate-y-full group"
                      style={{ left: `${m.xPercent}%`, top: `${m.yPercent}%` }}
                    >
                      <MapPin
                        className={`h-6 w-6 drop-shadow ${mistakeColor(m.type).replace(
                          "bg-",
                          "text-"
                        )}`}
                        fill="currentColor"
                      />
                      <div className="hidden group-hover:flex items-center gap-1 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                        {MISTAKE_TYPES.find((t) => t.value === m.type)?.label}
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleRemoveMistake(m._id);
                          }}
                          className="ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </AuthenticatedSheetImage>
              </div>
              <p className="text-xs text-gray-400 text-center">
                {mistakesOnActiveImage.length} marker(s) on this page — hover a pin to remove it.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerSheetsAdminPage;

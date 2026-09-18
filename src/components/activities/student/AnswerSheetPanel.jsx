import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Upload, MapPin, CheckCircle2, Clock3 } from "lucide-react";

const MISTAKE_LABELS = {
  silly: { label: "Silly Mistake", color: "bg-amber-500", text: "text-amber-500" },
  concept: { label: "Concept Mistake", color: "bg-rose-500", text: "text-rose-500" },
  application: { label: "Application Mistake", color: "bg-indigo-500", text: "text-indigo-500" },
};

// Same authenticated-blob image pattern as the admin's AnswerSheetsAdminPage
// — never a raw file URL, so a student's answer sheet stays behind the same
// login-gated route the backend enforces.
const AuthenticatedImage = ({ sheetId, imageIndex, mistakes }) => {
  const [url, setUrl] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(
        `${import.meta.env.VITE_APP_API_URL}/answer-sheets/${sheetId}/image/${imageIndex}`,
        { responseType: "blob" }
      )
      .then((response) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(response.data);
        objectUrlRef.current = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [sheetId, imageIndex]);

  return (
    <div className="relative w-full">
      {url ? (
        <img src={url} alt={`Page ${imageIndex + 1}`} className="w-full rounded-lg" />
      ) : (
        <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
      )}
      {mistakes.map((m) => (
        <MapPin
          key={m._id}
          className={`absolute -translate-x-1/2 -translate-y-full h-5 w-5 drop-shadow ${
            MISTAKE_LABELS[m.type]?.text || "text-gray-500"
          }`}
          fill="currentColor"
          style={{ left: `${m.xPercent}%`, top: `${m.yPercent}%` }}
        />
      ))}
    </div>
  );
};

// Per-exam panel where a student uploads photos of their handwritten answer
// sheet and, once the admin has reviewed it, sees exactly which parts were
// marked as silly / concept / application mistakes.
const AnswerSheetPanel = ({ examId, attemptNumber, onClose }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/answer-sheets/mine`,
        { params: { examId } }
      );
      setSheets(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load your answer sheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Choose at least one photo of your answer sheet.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("examId", examId);
      if (attemptNumber) formData.append("attemptNumber", attemptNumber);
      files.forEach((f) => formData.append("images", f));

      await axios.post(`${import.meta.env.VITE_APP_API_URL}/answer-sheets`, formData);
      toast.success("Answer sheet uploaded.");
      setFiles([]);
      fetchSheets();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload answer sheet.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Answer Sheet</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Upload your answer sheet photos</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              disabled={uploading}
              className="text-sm"
            />
            {files.length > 0 && (
              <p className="text-xs text-gray-500">{files.length} file(s) selected</p>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="self-start flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-xl disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-600">Your submissions</h3>
            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : sheets.length === 0 ? (
              <p className="text-sm text-gray-400">No answer sheets uploaded yet.</p>
            ) : (
              sheets.map((sheet) => (
                <div key={sheet._id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Uploaded {new Date(sheet.createdAt).toLocaleString()}
                    </span>
                    {sheet.reviewed ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                        <Clock3 className="h-3.5 w-3.5" /> Awaiting review
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sheet.images.map((_, idx) => (
                      <AuthenticatedImage
                        key={idx}
                        sheetId={sheet._id}
                        imageIndex={idx}
                        mistakes={(sheet.mistakes || []).filter((m) => m.imageIndex === idx)}
                      />
                    ))}
                  </div>
                  {sheet.mistakes?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {["silly", "concept", "application"].map((type) => {
                        const count = sheet.mistakes.filter((m) => m.type === type).length;
                        if (!count) return null;
                        return (
                          <span
                            key={type}
                            className={`flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-full ${MISTAKE_LABELS[type].color}`}
                          >
                            {MISTAKE_LABELS[type].label} × {count}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerSheetPanel;

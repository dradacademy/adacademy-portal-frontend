import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import AttachmentViewer from "../../../components/activities/student/AttachmentViewer";
import { Paperclip, FileText, Presentation, Lock, Eye, CheckCircle2 } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Student-facing study materials library — view-only, in-app (see
// AttachmentViewer.jsx). Gated by course-enrollment validity, same pattern
// as RecordedClassesStudent.jsx.
const AttachmentsStudent = () => {
  const { userData } = useContext(AuthContext);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/attachments/available`
      );
      setAttachments(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleCloseViewer = () => {
    setViewing(null);
    // Refresh so the list reflects the updated "viewed" state.
    fetchAttachments();
  };

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Materials
          </h1>
          <p className="text-gray-600 mt-1">
            Study material uploaded by your academy — view only, in-app.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-500 py-16">{error}</div>
        ) : attachments.length === 0 ? (
          <div className="text-center text-gray-400 py-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-2">
            <Paperclip className="h-8 w-8 text-gray-300" />
            No materials are available for your course yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {attachments.map((att) => (
              <div
                key={att._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                  {att.isPreviewable ? (
                    <FileText className="h-10 w-10 text-indigo-300" />
                  ) : (
                    <Presentation className="h-10 w-10 text-amber-300" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-semibold text-gray-800">{att.title}</h3>
                  {att.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{att.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(att.createdAt)}</span>
                    {att.viewed && (
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Viewed
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2">
                    {!att.enrollmentActive ? (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <Lock className="h-3.5 w-3.5" />
                        Enrollment expired — contact the academy to renew
                      </div>
                    ) : att.accessLevel === "test_series_only" ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                        <Lock className="h-3.5 w-3.5" />
                        Test Series Only plan — contact the academy to upgrade
                      </div>
                    ) : (
                      <button
                        onClick={() => setViewing(att)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {viewing && <AttachmentViewer attachment={viewing} onClose={handleCloseViewer} />}
    </div>
  );
};

export default AttachmentsStudent;

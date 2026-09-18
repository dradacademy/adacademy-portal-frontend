import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X, FileText, AlertTriangle } from "lucide-react";

// Blob-based, view-only material viewer. Deliberately never exposes the raw
// file URL: the file is fetched through an authenticated axios request
// (so the same category+enrollment gate the backend enforces on
// GET /attachments/:id/view applies), turned into an in-memory Blob, and
// shown via an object URL that only lives in this browser tab — there is no
// visible <a href> or download button anywhere in this component. This is
// the same honest tradeoff already used for the recorded-class video
// embeds: it removes the easy, obvious download path, not every possible
// one (a screenshot or a browser print-to-PDF still can't be stopped).
//
// Only application/pdf is guaranteed to render inline here — PPT/DOC/DOCX
// don't have an in-browser preview in this version (see
// attachmentController.js's PREVIEWABLE_CONTENT_TYPE comment for why), so
// those show a plain, honest "no in-app preview available yet" notice
// instead of silently failing.
const AttachmentViewer = ({ attachment, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!attachment?.isPreviewable) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/attachments/${attachment._id}/view`,
          { responseType: "blob" }
        );
        if (cancelled) return;
        const url = URL.createObjectURL(response.data);
        objectUrlRef.current = url;
        setBlobUrl(url);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Couldn't load this material. Your enrollment may have expired."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment?._id]);

  if (!attachment) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
            <h2 className="font-semibold text-gray-800 truncate">{attachment.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 bg-gray-50 overflow-hidden">
          {!attachment.isPreviewable ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-gray-600 font-medium">
                In-app preview isn't available yet for this file type.
              </p>
              <p className="text-sm text-gray-400 max-w-md">
                This material was uploaded as a PowerPoint or Word document.
                Ask your academy for another way to access it, or check back
                after a PDF version is uploaded.
              </p>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Loading…
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-8">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
              <p className="text-rose-600 font-medium">{error}</p>
            </div>
          ) : (
            <embed
              src={blobUrl}
              type="application/pdf"
              className="w-full h-full"
              title={attachment.title}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewer;

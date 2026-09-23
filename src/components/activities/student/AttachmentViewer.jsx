import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  X,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";

// Renders PDFs by drawing each page onto a <canvas> with PDF.js, loaded at
// runtime from cdnjs (no npm dependency needed — same "load an external
// script on demand" pattern already used for the YouTube IFrame API in
// LiveClassPlayer.jsx / RecordedClassPlayer.jsx). This replaces an earlier
// version that used <embed type="application/pdf">: that renders fine on
// desktop browsers (which have a built-in PDF plugin), but Android Chrome
// and iOS Safari have no such plugin for embed/object tags — they fall
// back to a generic "open this file" placeholder that hands the PDF off to
// an external app/download, which is exactly the "no download" guarantee
// this feature exists to provide. Canvas-rendered pages have no such
// fallback: there is nothing for the OS to treat as a downloadable file in
// the first place, so this now behaves the same way on every device.
const PDFJS_VERSION = "6.3.289";
const PDFJS_MODULE_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

let pdfjsLibPromise = null;
const loadPdfJs = () => {
  if (pdfjsLibPromise) return pdfjsLibPromise;
  // @vite-ignore — this URL is only known at runtime (a constant built from
  // PDFJS_VERSION), so Vite can't statically bundle it; that's expected,
  // the browser fetches this ES module directly from the CDN.
  pdfjsLibPromise = import(/* @vite-ignore */ PDFJS_MODULE_URL).then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return mod;
  });
  return pdfjsLibPromise;
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.2;

// Leaves a little breathing room around the fitted page inside the
// scrollable viewer area (the canvas itself also has `my-4`, so this is on
// top of that) rather than fitting edge-to-edge.
const FIT_PADDING_PX = 24;

// Blob-based, view-only material viewer. Deliberately never exposes the raw
// file URL: the file is fetched through an authenticated axios request
// (so the same category+enrollment gate the backend enforces on
// GET /attachments/:id/view applies), read into memory, and handed
// straight to PDF.js for rendering — there is no visible <a href> or
// download button anywhere in this component, and nothing ever touches
// disk. This is the same honest tradeoff already used for the
// recorded-class video embeds: it removes the easy, obvious download
// path, not every possible one (a screenshot or a browser print-to-PDF
// still can't be stopped).
//
// Only application/pdf is guaranteed to render inline here — PPT/DOC/DOCX
// don't have an in-browser preview in this version (see
// attachmentController.js's PREVIEWABLE_CONTENT_TYPE comment for why), so
// those show a plain, honest "no in-app preview available yet" notice
// instead of silently failing.
const AttachmentViewer = ({ attachment, onClose }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  // 0/90/180/270, clockwise. Reset per attachment; deliberately NOT reset
  // per page, since a student rotating page 3 to read a landscape diagram
  // almost certainly wants the same rotation on page 4 too.
  const [rotation, setRotation] = useState(0);
  const [rendering, setRendering] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load the PDF once per attachment.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!attachment?.isPreviewable) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [pdfjsLib, response] = await Promise.all([
          loadPdfJs(),
          axios.get(
            `${import.meta.env.VITE_APP_API_URL}/attachments/${attachment._id}/view`,
            { responseType: "arraybuffer" }
          ),
        ]);
        if (cancelled) return;

        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(response.data) })
          .promise;
        if (cancelled) {
          pdfDoc.destroy();
          return;
        }

        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setCurrentPage(1);
        setScale(1);
        setRotation(0);
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
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment?._id]);

  // Auto-fit the page (at the current rotation) to the viewer's available
  // space whenever the page or rotation changes. This is what stops a
  // landscape-oriented page from having its sides cut off: without it, the
  // scale carried over from a portrait page (or the initial scale of 1)
  // has no relationship to how wide the rotated page actually is, so a
  // wide page just overflows and requires scrolling/zooming out manually
  // even at "full zoom out". Manual Zoom In/Out still works afterwards —
  // this only sets the starting point for a given page/rotation.
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    const container = containerRef.current;
    if (!pdfDoc || !container) return;

    let cancelled = false;

    (async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        // rotation is baked into this viewport's width/height already —
        // PDF.js swaps them for us at 90/270, so there's no manual
        // portrait/landscape swapping to get wrong here.
        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const availableWidth = container.clientWidth - FIT_PADDING_PX;
        const availableHeight = container.clientHeight - FIT_PADDING_PX;
        if (availableWidth <= 0 || availableHeight <= 0) return;

        const fitScale = Math.min(
          availableWidth / unscaledViewport.width,
          availableHeight / unscaledViewport.height
        );
        if (!cancelled) {
          setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale)));
        }
      } catch {
        // Non-fatal — worst case the page keeps whatever scale it already
        // had, rather than the viewer breaking.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rotation, numPages]);

  // Render whichever page/scale/rotation is current onto the canvas.
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    setRendering(true);

    const renderPage = async () => {
      // Cancel any in-flight render before starting a new one (e.g. the
      // student clicked Next twice quickly).
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(currentPage);
      if (cancelled) return;

      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const task = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (err) {
        // A cancelled render throws — that's expected when pages/scale
        // change quickly, not a real error.
        if (err?.name !== "RenderingCancelledException") throw err;
      } finally {
        if (!cancelled) renderTaskRef.current = null;
      }
    };

    renderPage()
      .catch(() => {
        if (!cancelled) setError("Couldn't render this page.");
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, scale, rotation, numPages]);

  if (!attachment) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < numPages;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
            <h2 className="font-semibold text-gray-800 truncate">{attachment.title}</h2>
          </div>

          {attachment.isPreviewable && !loading && !error && numPages > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))}
                disabled={scale <= MIN_SCALE}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))}
                disabled={scale >= MAX_SCALE}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                title="Rotate page (portrait ↔ landscape)"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <button
                onClick={() => canGoPrev && setCurrentPage((p) => p - 1)}
                disabled={!canGoPrev}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500 tabular-nums px-1 whitespace-nowrap">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => canGoNext && setCurrentPage((p) => p + 1)}
                disabled={!canGoNext}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 bg-gray-50 overflow-auto flex items-center justify-center"
        >
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
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              Loading…
            </div>
          ) : error ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center px-8">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
              <p className="text-rose-600 font-medium">{error}</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="my-4 shadow-md"
              style={{ opacity: rendering ? 0.6 : 1 }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewer;

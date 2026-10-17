import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  X,
  FileText,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Renders PDFs by drawing pages onto <canvas> elements with PDF.js, loaded at
// runtime from cdnjs (no npm dependency needed — same "load an external
// script on demand" pattern already used for the YouTube IFrame API in
// LiveClassPlayer.jsx / RecordedClassPlayer.jsx). Canvas rendering (instead
// of <embed type="application/pdf">) is what keeps this view-only on
// Android Chrome / iOS Safari, which have no inline PDF plugin and would
// otherwise hand the file off as a download.
//
// Oct 2026 rework — continuous-scroll reader:
//  * All pages are stacked vertically and scroll like a normal PDF reader
//    (mouse wheel / touch swipe). Only pages near the visible area are
//    actually drawn, so a 300-page book stays light on phone memory.
//  * "Go to page" box: type a page number + Enter/Go → jumps there. A number
//    above the page count (or below 1) shows a clear message instead.
//  * Full-screen button: uses the browser's real full-screen mode where it
//    exists (desktop, Android, the Play Store app) and falls back to a
//    full-window view where it doesn't (iPhone Safari).
const PDFJS_VERSION = "6.3.289";
// The "legacy" build is PDF.js's own build for browsers that aren't brand
// new. The regular 6.x build relies on very recent JavaScript (e.g.
// Map.getOrInsertComputed) and silently fails to draw any page on older
// Android Chrome / WebView, so students on older phones saw blank pages.
// It's served from jsDelivr (which mirrors the pdfjs-dist npm package); if
// that ever fails to load, we fall back to the regular build on cdnjs.
const PDFJS_SOURCES = [
  {
    module: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.min.mjs`,
    worker: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.mjs`,
  },
  {
    module: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`,
    worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`,
  },
];

let pdfjsLibPromise = null;
const loadPdfJs = () => {
  if (pdfjsLibPromise) return pdfjsLibPromise;
  pdfjsLibPromise = (async () => {
    let lastError;
    for (const src of PDFJS_SOURCES) {
      try {
        // @vite-ignore — runtime-only CDN URL, intentionally not bundled.
        const mod = await import(/* @vite-ignore */ src.module);
        mod.GlobalWorkerOptions.workerSrc = src.worker;
        return mod;
      } catch (err) {
        lastError = err;
      }
    }
    pdfjsLibPromise = null; // allow a retry next time the viewer opens
    throw lastError;
  })();
  return pdfjsLibPromise;
};

// Zoom is a multiplier on "fit to width" (100% = page fills the viewer's
// width), which is the natural default for scrolling through a book.
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

// Horizontal breathing room around pages (matches px-3 + a few px so the
// page edge never touches the scrollbar).
const SIDE_PADDING_PX = 32;
const PAGE_GAP_PX = 12;
// Pages within this distance of the visible area get drawn ahead of time,
// so scrolling feels instant; pages further away are released.
const PRERENDER_MARGIN = "1200px 0px";
// Cap the device-pixel-ratio boost: sharp text on phones without making
// canvases huge (memory) on 3x screens.
const MAX_DPR = 2;

const isNativeFullscreen = () =>
  !!(document.fullscreenElement || document.webkitFullscreenElement);

// One page slot. The slot always has the page's exact size (so the scroll
// height and "jump to page N" positions are correct before anything is
// drawn); the canvas inside is only drawn while `active`.
const PdfPage = memo(function PdfPage({
  pdfDoc,
  pageNumber,
  cssWidth,
  cssHeight,
  scale,
  rotation,
  active,
  registerSlot,
}) {
  const canvasRef = useRef(null);
  const [drawn, setDrawn] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active || !pdfDoc) {
      setDrawn(false);
      return;
    }
    let cancelled = false;
    let task = null;

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const viewport = page.getViewport({
          scale: scale * dpr,
          rotation: ((page.rotate || 0) + rotation) % 360,
        });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
        await task.promise;
        if (!cancelled) {
          setDrawn(true);
          setFailed(false);
        }
      } catch (err) {
        // A cancelled render (fast scroll/zoom) is expected, not an error.
        if (!cancelled && err?.name !== "RenderingCancelledException") {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (task) task.cancel();
    };
  }, [pdfDoc, pageNumber, scale, rotation, active]);

  return (
    <div
      ref={(el) => registerSlot(pageNumber, el)}
      data-page={pageNumber}
      className="relative flex-none bg-white shadow-md"
      style={{ width: cssWidth, height: cssHeight }}
    >
      {active && (
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: cssWidth, height: cssHeight, opacity: drawn ? 1 : 0 }}
        />
      )}
      {(!active || !drawn) && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 select-none">
          {failed ? "Couldn't show this page" : `Page ${pageNumber}`}
        </div>
      )}
    </div>
  );
});

// Blob-based, view-only material viewer. Deliberately never exposes the raw
// file URL: the file is fetched through an authenticated axios request (so
// the backend's category+enrollment gate on GET /attachments/:id/view
// applies), read into memory and handed straight to PDF.js. It removes the
// easy download path, not every possible one (screenshots can't be stopped).
//
// Only application/pdf renders inline — PPT/DOC/DOCX show an honest "no
// in-app preview" notice. `adminMode` (Attachments admin page only) skips the
// student enrollment check and gives PPT/DOC a "Download to open" button.
const AttachmentViewer = ({ attachment, onClose, adminMode = false }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pdfDoc, setPdfDoc] = useState(null);
  // Unrotated size of every page at scale 1, [{ w, h }], index 0 = page 1.
  const [pageSizes, setPageSizes] = useState([]);
  const numPages = pageSizes.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  // 0/90/180/270 clockwise, applied to every page.
  const [rotation, setRotation] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activePages, setActivePages] = useState(() => new Set());

  const [pageInput, setPageInput] = useState("1");
  const [inputFocused, setInputFocused] = useState(false);
  const [pageMessage, setPageMessage] = useState(null);

  const [isFull, setIsFull] = useState(false);

  const modalRef = useRef(null);
  const containerRef = useRef(null);
  const slotRefs = useRef(new Map());
  // Where the reader is, as { page, frac } (fraction of the way down that
  // page) — used to keep the same spot after zoom/rotate/full-screen.
  const anchorRef = useRef({ page: 1, frac: 0 });
  const messageTimerRef = useRef(null);

  const handleAdminDownload = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/attachments/${attachment._id}/view?download=1`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName || attachment.title || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError("Couldn't download this file.");
    } finally {
      setDownloading(false);
    }
  };

  // ---------- Load the PDF once per attachment ----------
  useEffect(() => {
    let cancelled = false;
    let loadedDoc = null;

    const load = async () => {
      if (!attachment?.isPreviewable) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        setPdfDoc(null);
        setPageSizes([]);
        const [pdfjsLib, response] = await Promise.all([
          loadPdfJs(),
          axios.get(
            `${import.meta.env.VITE_APP_API_URL}/attachments/${attachment._id}/view`,
            { responseType: "arraybuffer" }
          ),
        ]);
        if (cancelled) return;

        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(response.data) })
          .promise;
        loadedDoc = doc;
        if (cancelled) return;

        // Read every page's size up front (cheap — no drawing) so the full
        // scroll height and every page's position are known immediately.
        const sizes = await Promise.all(
          Array.from({ length: doc.numPages }, async (_, i) => {
            const page = await doc.getPage(i + 1);
            const vp = page.getViewport({ scale: 1, rotation: page.rotate || 0 });
            return { w: vp.width, h: vp.height };
          })
        );
        if (cancelled) return;

        anchorRef.current = { page: 1, frac: 0 };
        setPdfDoc(doc);
        setPageSizes(sizes);
        setCurrentPage(1);
        setPageInput("1");
        setZoom(1);
        setRotation(0);
      } catch (err) {
        if (!cancelled) {
          setError(
            adminMode
              ? "Couldn't load this file. It may be missing from storage — try re-uploading it via Edit."
              : err?.response?.data?.message ||
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
      if (loadedDoc) loadedDoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment?._id]);

  // ---------- Track the viewer's width (window resize, full-screen) ----------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, error]);

  // ---------- Sizes ----------
  const rotated = rotation === 90 || rotation === 270;
  const firstPage = pageSizes[0];
  const baseWidth = firstPage ? (rotated ? firstPage.h : firstPage.w) : 1;
  const fitScale =
    containerWidth > 0 ? Math.max(0.1, (containerWidth - SIDE_PADDING_PX) / baseWidth) : 1;
  const scale = fitScale * zoom;

  const pageCss = (i) => {
    const s = pageSizes[i];
    const w = rotated ? s.h : s.w;
    const h = rotated ? s.w : s.h;
    return { width: Math.floor(w * scale), height: Math.floor(h * scale) };
  };

  const registerSlot = useCallback((pageNumber, el) => {
    if (el) slotRefs.current.set(pageNumber, el);
    else slotRefs.current.delete(pageNumber);
  }, []);

  // ---------- Draw only pages near the screen ----------
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !numPages) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setActivePages((prev) => {
          const next = new Set(prev);
          let changed = false;
          entries.forEach((entry) => {
            const n = Number(entry.target.dataset.page);
            if (entry.isIntersecting && !next.has(n)) {
              next.add(n);
              changed = true;
            } else if (!entry.isIntersecting && next.has(n)) {
              next.delete(n);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      },
      { root, rootMargin: PRERENDER_MARGIN }
    );
    slotRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, pdfDoc, loading, containerWidth > 0]);

  // ---------- Which page is on screen (for the "12 / 78" counter) ----------
  const updateFromScroll = useCallback(() => {
    const root = containerRef.current;
    if (!root || !numPages) return;
    // The page under a line 30% down the screen counts as "current".
    const probe = root.scrollTop + root.clientHeight * 0.3;
    let page = 1;
    for (let n = 1; n <= numPages; n++) {
      const el = slotRefs.current.get(n);
      if (!el) continue;
      if (el.offsetTop <= probe) page = n;
      else break;
    }
    const el = slotRefs.current.get(page);
    if (el) {
      const frac = Math.min(
        1,
        Math.max(0, (root.scrollTop - el.offsetTop) / Math.max(1, el.offsetHeight))
      );
      anchorRef.current = { page, frac };
    }
    setCurrentPage(page);
  }, [numPages]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateFromScroll();
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [updateFromScroll]);

  // Keep the reader on the same spot when page sizes change (zoom, rotate,
  // entering/leaving full screen, phone rotation).
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || !numPages) return;
    const { page, frac } = anchorRef.current;
    const el = slotRefs.current.get(page);
    if (!el) return;
    root.scrollTop =
      frac > 0 ? el.offsetTop + frac * el.offsetHeight : Math.max(0, el.offsetTop - PAGE_GAP_PX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, rotation]);

  // Mirror the current page into the box unless the student is typing in it.
  useEffect(() => {
    if (!inputFocused) setPageInput(String(currentPage));
  }, [currentPage, inputFocused]);

  // ---------- Go to page ----------
  const showPageMessage = (text) => {
    setPageMessage(text);
    clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setPageMessage(null), 4000);
  };

  const scrollToPage = (n) => {
    const root = containerRef.current;
    const el = slotRefs.current.get(n);
    if (!root || !el) return;
    anchorRef.current = { page: n, frac: 0 };
    root.scrollTo({ top: Math.max(0, el.offsetTop - PAGE_GAP_PX), behavior: "auto" });
    setCurrentPage(n);
  };

  const handleGoToPage = (e) => {
    e?.preventDefault();
    const raw = pageInput.trim();
    const n = Number(raw);
    if (!raw || !Number.isInteger(n)) {
      showPageMessage(`Please enter a page number between 1 and ${numPages}.`);
      setPageInput(String(currentPage));
      return;
    }
    if (n > numPages) {
      showPageMessage(
        `Page ${n} is not available — this PDF has only ${numPages} page${numPages === 1 ? "" : "s"}.`
      );
      setPageInput(String(currentPage));
      return;
    }
    if (n < 1) {
      showPageMessage(`Page numbers start from 1. Enter 1 to ${numPages}.`);
      setPageInput(String(currentPage));
      return;
    }
    setPageMessage(null);
    scrollToPage(n);
    // Close the phone keyboard after jumping.
    e?.target?.querySelector?.("input")?.blur();
  };

  useEffect(() => () => clearTimeout(messageTimerRef.current), []);

  // ---------- Full screen ----------
  const enterFullScreen = async () => {
    setIsFull(true);
    const el = modalRef.current;
    try {
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch {
      // Not allowed/supported (e.g. iPhone) — the full-window view still applies.
    }
  };

  const exitFullScreen = async () => {
    setIsFull(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
    } catch {
      // ignore
    }
  };

  // If the student leaves browser full screen with Esc / the back gesture,
  // drop our full-window layout too.
  useEffect(() => {
    const onChange = () => {
      if (!isNativeFullscreen()) setIsFull(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Esc leaves the full-window view where the browser has no real full screen.
  useEffect(() => {
    if (!isFull) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !isNativeFullscreen()) setIsFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFull]);

  // Leave browser full screen if the viewer is closed while in it.
  useEffect(
    () => () => {
      if (isNativeFullscreen()) {
        try {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } catch {
          // ignore
        }
      }
    },
    []
  );

  if (!attachment) return null;

  const ready = attachment.isPreviewable && !loading && !error && numPages > 0;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < numPages;
  const iconBtn =
    "p-1.5 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div
      className={`fixed inset-0 bg-black/70 z-50 flex items-center justify-center ${
        isFull ? "p-0" : "p-2 sm:p-4"
      }`}
    >
      <div
        ref={modalRef}
        className={`bg-white flex flex-col overflow-hidden w-full ${
          isFull ? "h-full max-w-none rounded-none" : "max-w-4xl h-[90vh] sm:h-[85vh] rounded-2xl"
        }`}
      >
        {/* Row 1: title + full screen + close */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
            <h2 className="font-semibold text-gray-800 truncate text-sm sm:text-base">
              {attachment.title}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {ready && (
              <button
                onClick={isFull ? exitFullScreen : enterFullScreen}
                className={iconBtn}
                title={isFull ? "Exit full screen" : "Full screen"}
                aria-label={isFull ? "Exit full screen" : "Full screen"}
              >
                {isFull ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            )}
            <button onClick={onClose} className={iconBtn} title="Close" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Row 2: zoom / rotate / page navigation */}
        {ready && (
          <div className="relative border-b border-gray-100 bg-white">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-1.5">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
                  disabled={zoom <= MIN_ZOOM}
                  className={iconBtn}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="text-xs text-gray-600 tabular-nums w-11 text-center rounded hover:bg-gray-100 py-1"
                  title="Fit page width"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
                  disabled={zoom >= MAX_ZOOM}
                  className={iconBtn}
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className={iconBtn}
                  title="Rotate pages"
                  aria-label="Rotate pages"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* noValidate: we show our own friendly message for a wrong
                  page number instead of the browser's min/max tooltip. */}
              <form noValidate onSubmit={handleGoToPage} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => canGoPrev && scrollToPage(currentPage - 1)}
                  disabled={!canGoPrev}
                  className={iconBtn}
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <label className="sr-only" htmlFor="pdf-page-input">
                  Go to page
                </label>
                <input
                  id="pdf-page-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={numPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onFocus={(e) => {
                    setInputFocused(true);
                    e.target.select();
                  }}
                  onBlur={() => setInputFocused(false)}
                  className="w-14 text-center text-sm tabular-nums border border-gray-300 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  title="Type a page number and press Enter"
                />
                <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                  / {numPages}
                </span>
                <button
                  type="submit"
                  className="text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-md px-2.5 py-1"
                >
                  Go
                </button>
                <button
                  type="button"
                  onClick={() => canGoNext && scrollToPage(currentPage + 1)}
                  disabled={!canGoNext}
                  className={iconBtn}
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </form>
            </div>

            {pageMessage && (
              <div
                role="alert"
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg shadow-md w-max max-w-[92%]"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{pageMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Scrolling page area. Pages are centred with min-w-full + w-max
            (not justify-center) so a zoomed-in page wider than the screen
            can still be scrolled fully left and right. */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-0 bg-gray-100 overflow-auto overscroll-contain"
        >
          {!attachment.isPreviewable ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-center px-8">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-gray-600 font-medium">
                In-app preview isn't available yet for this file type.
              </p>
              {adminMode ? (
                <>
                  <p className="text-sm text-gray-400 max-w-md">
                    This is a PowerPoint/Word file. Download it to open it on
                    your computer. Students see a "no preview" note for this
                    file — upload a PDF version if they should read it in-app.
                  </p>
                  <button
                    onClick={handleAdminDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-indigo-500 text-white text-sm font-medium py-2 px-4 rounded-xl hover:opacity-85 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? "Downloading…" : "Download to open"}
                  </button>
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-400 max-w-md">
                  This material was uploaded as a PowerPoint or Word document.
                  Ask your academy for another way to access it, or check back
                  after a PDF version is uploaded.
                </p>
              )}
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
            containerWidth > 0 && (
              <div
                className="min-w-full w-max flex flex-col items-center px-3 py-3"
                style={{ gap: PAGE_GAP_PX }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {pageSizes.map((_, i) => {
                  const { width, height } = pageCss(i);
                  return (
                    <PdfPage
                      key={i + 1}
                      pdfDoc={pdfDoc}
                      pageNumber={i + 1}
                      cssWidth={width}
                      cssHeight={height}
                      scale={scale}
                      rotation={rotation}
                      active={activePages.has(i + 1)}
                      registerSlot={registerSlot}
                    />
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewer;

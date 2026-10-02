import React, { useCallback, useEffect, useState } from "react";

// Shows every answer-key screenshot of a question, stacked at FULL width so a
// long worked solution stays readable (the old single image was squeezed into
// a 192px-high box). Tapping an image opens a full-screen viewer with
// previous/next, "Fit width" / "Actual size" and "Open in new tab".
const AnswerKeyImages = ({ images, className = "" }) => {
  const list = (images || []).filter(Boolean);
  const [openIndex, setOpenIndex] = useState(null);
  const [actualSize, setActualSize] = useState(false);

  const close = useCallback(() => {
    setOpenIndex(null);
    setActualSize(false);
  }, []);

  const move = useCallback(
    (delta) => {
      setOpenIndex((i) => (i === null ? i : (i + delta + list.length) % list.length));
      setActualSize(false);
    },
    [list.length],
  );

  useEffect(() => {
    if (openIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, move]);

  if (list.length === 0) return null;

  return (
    <>
      <div className={`flex flex-col gap-3 ${className}`}>
        {list.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative block w-full text-left cursor-zoom-in rounded border border-gray-200 bg-white p-1"
            title="Click to enlarge"
          >
            {list.length > 1 && (
              <span className="absolute top-2 left-2 text-[11px] font-semibold bg-indigo-600 text-white rounded px-1.5 py-0.5">
                {i + 1} / {list.length}
              </span>
            )}
            <img
              src={src}
              alt={`Answer explanation ${i + 1}`}
              loading="lazy"
              className="block w-full h-auto"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[1400] bg-black/85 flex flex-col"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-black/70 text-white text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              Answer explanation {openIndex + 1} / {list.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {list.length > 1 && (
                <>
                  <button type="button" onClick={() => move(-1)} className="px-3 py-1 rounded bg-white/15 hover:bg-white/25">
                    ← Prev
                  </button>
                  <button type="button" onClick={() => move(1)} className="px-3 py-1 rounded bg-white/15 hover:bg-white/25">
                    Next →
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setActualSize((v) => !v)}
                className="px-3 py-1 rounded bg-white/15 hover:bg-white/25"
              >
                {actualSize ? "Fit width" : "Actual size"}
              </button>
              <a
                href={list[openIndex]}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded bg-white/15 hover:bg-white/25"
              >
                Open in new tab
              </a>
              <button type="button" onClick={close} className="px-3 py-1 rounded bg-white text-black font-semibold">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={list[openIndex]}
              alt={`Answer explanation ${openIndex + 1}`}
              className={actualSize ? "max-w-none mx-auto" : "w-full max-w-5xl h-auto mx-auto"}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AnswerKeyImages;

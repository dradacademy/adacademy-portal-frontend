import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EnrollNowPopup from "../common/popup/EnrollNowPopup";

// Real promotional banners, supplied directly by the academy — no
// fabricated/stock graphics. Update this list (and the images in
// public/banner/) whenever a new announcement banner is ready.
const SLIDES = [
  {
    key: "achievers",
    image: "/banner/gate-2026-achievers.jpg",
    alt: "GATE 2026 Achievers — Shri Hari Varsha S and Priyadarsini S",
    type: "anchor",
    to: "#achievers",
  },
  {
    key: "gate-2027-enrollment",
    image: "/banner/gate-2027-enrollment.jpg",
    alt: "GATE 2027 Batch Enrollment Going On — Contact 95668 18665",
    type: "enroll",
  },
  {
    key: "ots-2027",
    image: "/banner/ots-gate-2027.jpg",
    alt: "Online Test Series for GATE 2027 — Contact 95668 18665",
    type: "route",
    to: "/online-test-series",
  },
  {
    key: "tnpsc-ae-jdo",
    image: "/banner/tnpsc-ae-jdo-batch.jpg",
    alt: "TNPSC AE and JDO Batch Opening Soon",
    type: "anchor",
    to: "#courses",
  },
];

const AUTOPLAY_MS = 5000;

const PromoBannerCarousel = () => {
  const [index, setIndex] = useState(0);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [paused, setPaused] = useState(false);
  const total = SLIDES.length;
  const timerRef = useRef(null);

  const go = (delta) => {
    setIndex((prev) => (prev + delta + total) % total);
  };

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, total]);

  const renderSlide = (slide) => {
    const imageEl = (
      <img
        src={slide.image}
        alt={slide.alt}
        className="w-full h-full object-contain"
        draggable={false}
      />
    );

    if (slide.type === "route") {
      return (
        <Link
          to={slide.to}
          className="block w-full h-full"
          aria-label={slide.alt}
        >
          {imageEl}
        </Link>
      );
    }

    if (slide.type === "enroll") {
      return (
        <button
          type="button"
          onClick={() => setShowEnrollModal(true)}
          className="block w-full h-full cursor-pointer"
          aria-label={slide.alt}
        >
          {imageEl}
        </button>
      );
    }

    return (
      <a href={slide.to} className="block w-full h-full" aria-label={slide.alt}>
        {imageEl}
      </a>
    );
  };

  return (
    <section
      className="relative bg-white rounded-xl border border-line overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full h-[170px] sm:h-[260px] md:h-[340px] lg:h-[420px]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.key}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            aria-hidden={i !== index}
          >
            {renderSlide(slide)}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous banner"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-navy-dark/70 hover:bg-navy-dark text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next banner"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-navy-dark/70 hover:bg-navy-dark text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === index ? "w-6 bg-gold" : "w-2 bg-white/70 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <EnrollNowPopup
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
      />
    </section>
  );
};

export default PromoBannerCarousel;

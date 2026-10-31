import React, { useEffect, useState } from "react";
import axios from "axios";
import { Play, Quote } from "lucide-react";

// "Inside our classroom" (2026-10-30) — Dr. Dinesh's own videos of how a
// class is handled + student testimonials. These are NOT free classes; they
// come from the server as `showcase` (GET /api/public-videos), chosen by the
// academy (YOUTUBE_SHOWCASE on Railway). Each plays right here on the page.
// Vertical (Shorts-style) videos keep their tall shape. Hidden if empty.

const GOLD = "#c9971f";
const GOLD_LIGHT = "#e8b94a";
const NAVY_DARK = "#0a1e36";

const VideoCard = ({ v }) => {
  const [on, setOn] = useState(false);
  const tall = !!v.portrait;
  return (
    <div className={`w-full ${tall ? "max-w-[340px] mx-auto" : ""}`}>
      <div
        className="relative rounded-2xl overflow-hidden bg-black"
        style={{ paddingTop: tall ? "177.78%" : "56.25%", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
      >
        {on ? (
          <iframe
            title={v.title || "Dr. A.D. Academy video"}
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 w-full h-full" aria-label={`Play: ${v.title || "video"}`}>
            <img
              src={`https://i.ytimg.com/vi/${v.id}/${tall ? "hq2" : "maxresdefault"}.jpg`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
              }}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: GOLD, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
            >
              <Play className="w-8 h-8" fill={NAVY_DARK} color={NAVY_DARK} />
            </span>
          </button>
        )}
      </div>
      {v.title && <div className="mt-3 text-white font-semibold leading-snug line-clamp-2">{v.title}</div>}
    </div>
  );
};

// Student success-story videos vs Dr. Dinesh's own videos (2026-10-31):
// split by title, so no extra setting is needed on Railway.
const STUDENT_RE = /success\s*stor|testimonial|student|review|experience|achiever|feedback/i;
let showcasePromise = null; // both sections share one request
const loadShowcase = () => {
  if (!showcasePromise) {
    showcasePromise = axios
      .get(`${import.meta.env.VITE_APP_API_URL}/public-videos`)
      .then((r) => r.data?.showcase || [])
      .catch(() => {
        showcasePromise = null;
        return [];
      });
  }
  return showcasePromise;
};

const TEXT = {
  students: {
    id: "student-stories",
    tag: "Student success stories",
    title: (
      <>
        Hear it from <em style={{ color: GOLD_LIGHT }}>our students.</em>
      </>
    ),
    sub: "Our GATE 2026 achievers talk about how they prepared with us.",
  },
  teacher: {
    id: "inside-our-classroom",
    tag: "Inside our classroom",
    title: (
      <>
        See how we teach — <em style={{ color: GOLD_LIGHT }}>with Dr. A. Dinesh.</em>
      </>
    ),
    sub: "Watch Dr. A. Dinesh explain, guide and answer the questions students ask most.",
  },
};

const ShowcaseVideos = ({ kind = "teacher" }) => {
  const [all, setAll] = useState(null);

  useEffect(() => {
    let alive = true;
    loadShowcase().then((v) => alive && setAll(v));
    return () => {
      alive = false;
    };
  }, []);

  const videos = (all || []).filter((v) => (kind === "students" ? STUDENT_RE.test(v.title || "") : !STUDENT_RE.test(v.title || "")));
  const t = TEXT[kind] || TEXT.teacher;
  if (videos.length === 0) return null;
  // First video big on top; the rest fit in a row below it (2026-10-31).
  const [first, ...rest] = videos;
  const restCols = rest.length === 1 ? "max-w-2xl mx-auto" : rest.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      id={t.id}
      className="py-16 sm:py-20 rounded-3xl text-white relative overflow-hidden"
      style={{ background: "radial-gradient(900px 500px at 15% 0%, #16365e, #0f2a4a 60%, #0a1e36)" }}
    >
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: GOLD_LIGHT }}>
            {t.tag}
          </span>
          <h2 className="font-newsreader font-semibold text-3xl sm:text-5xl mt-2 leading-tight">{t.title}</h2>
          <p className="mt-3 flex items-start gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            <Quote className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
            {t.sub}
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <VideoCard v={first} />
        </div>
        {rest.length > 0 && (
          <div className={`grid gap-8 items-start mt-10 ${restCols}`}>
            {rest.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShowcaseVideos;

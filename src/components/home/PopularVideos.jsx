import React, { useEffect, useState } from "react";
import axios from "axios";
import { Play, Youtube, X, Eye } from "lucide-react";

// "Popular on our YouTube" (2026-10-30) — the academy's most-watched public
// YouTube videos, picked automatically by the server
// (GET /api/public-videos, refreshed every 6 hours). Thumbnails load
// instantly; the YouTube player itself loads only when someone taps a
// video, so the front page stays fast. Hidden if nothing comes back.

const fmtViews = (n) => {
  if (!n) return "";
  if (n >= 100000) return `${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)} lakh views`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K views`;
  return `${n} views`;
};

const PopularVideos = () => {
  const [videos, setVideos] = useState(null);
  const [channelUrl, setChannelUrl] = useState("https://www.youtube.com/@dradacademy");
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/public-videos`)
      .then((r) => {
        setVideos((r.data?.data || []).filter((v) => v.pinned || !v.isShort).slice(0, 6));
        if (r.data?.channelUrl) setChannelUrl(r.data.channelUrl);
      })
      .catch(() => setVideos([]));
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const onKey = (e) => e.key === "Escape" && setPlaying(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  if (!videos || videos.length === 0) return null;
  const [first, ...rest] = videos;

  const Thumb = ({ v, big }) => (
    <button
      type="button"
      onClick={() => setPlaying(v)}
      className="group text-left w-full rounded-2xl overflow-hidden bg-white border border-line hover:shadow-xl transition-shadow"
    >
      <div className="relative" style={{ paddingTop: "56.25%" }}>
        <img
          src={`https://i.ytimg.com/vi/${v.id}/${big ? "maxresdefault" : "hqdefault"}.jpg`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
          }}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${big ? "w-20 h-20" : "w-14 h-14"}`}
          style={{ backgroundColor: "#c9971f", color: "#0a1e36", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}
        >
          <Play className={big ? "w-8 h-8" : "w-6 h-6"} fill="#0a1e36" />
        </span>
        {v.views > 0 && (
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 text-xs font-semibold text-white bg-black/60 rounded-full px-2.5 py-1">
            <Eye className="w-3.5 h-3.5" /> {fmtViews(v.views)}
          </span>
        )}
      </div>
      <div className={big ? "p-5" : "p-4"}>
        <div className={`font-semibold text-ink leading-snug ${big ? "text-lg sm:text-xl font-newsreader" : "text-[15px]"} line-clamp-2`}>{v.title || "Watch on YouTube"}</div>
      </div>
    </button>
  );

  return (
    <section id="videos" className="py-16 sm:py-20 bg-white rounded-3xl">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-gold text-xs font-bold tracking-[0.2em] uppercase">Free classes on YouTube</span>
            <h2 className="font-newsreader font-semibold text-3xl sm:text-5xl text-navy-dark mt-2 leading-tight">
              Learn with us — <em className="text-gold">watch a class now.</em>
            </h2>
            <p className="text-slate mt-2 max-w-xl">Our most-watched videos, picked automatically from our YouTube channel.</p>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-full font-semibold text-white"
            style={{ backgroundColor: "#c4302b" }}
          >
            <Youtube className="w-5 h-5" /> Subscribe
          </a>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
          <Thumb v={first} big />
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {rest.slice(0, 4).map((v) => (
              <Thumb key={v.id} v={v} />
            ))}
          </div>
        </div>
      </div>

      {playing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-8"
          style={{ backgroundColor: "rgba(6,20,38,0.85)" }}
          onClick={() => setPlaying(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-2 text-white">
              <div className="font-semibold truncate">{playing.title}</div>
              <button type="button" onClick={() => setPlaying(null)} aria-label="Close" className="p-1.5 rounded-full bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                title={playing.title}
                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PopularVideos;

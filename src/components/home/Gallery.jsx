import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ImageOff } from "lucide-react";

// The category tabs are shown even for a category with no photos yet, so
// visitors know what's coming — matches the original hand-written gallery.
// Any category name an admin adds via Content Management that isn't in
// this list still shows up too (see categories below).
const BASE_CATEGORIES = [
  "Facility",
  "Classroom Sessions",
  "Faculty",
  "Students",
  "Test Sessions",
  "Workshops",
  "Events",
  "Achievers",
];

// Content is managed from the admin dashboard's Content Management page
// (Phase 3 CMS) — see backend/controllers/contentController.js.
const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState("All");

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/content/public/gallery`)
      .then((res) => {
        if (!cancelled) setPhotos(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const fromPhotos = photos.map((p) => p.subtitle).filter(Boolean);
    const merged = Array.from(new Set([...BASE_CATEGORIES, ...fromPhotos]));
    return ["All", ...merged];
  }, [photos]);

  const visiblePhotos =
    active === "All" ? photos : photos.filter((p) => p.subtitle === active);

  if (!loaded) return null;

  return (
    <section id="gallery" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Academy Gallery
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            A look inside the academy.
          </h2>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium font-inter transition-colors cursor-pointer border ${
                active === cat
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-slate border-line hover:border-navy hover:text-navy"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {visiblePhotos.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {visiblePhotos.map(({ _id, image, title }) => (
              <div
                key={_id}
                className="rounded-xl overflow-hidden border border-line shadow-sm bg-white"
              >
                <img
                  src={image}
                  alt={title}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 bg-white rounded-xl border border-line border-dashed py-16 flex flex-col items-center justify-center text-center">
            <ImageOff className="w-8 h-8 text-slate" />
            <p className="text-sm text-slate mt-3 font-inter">
              Photos for "{active}" are coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;

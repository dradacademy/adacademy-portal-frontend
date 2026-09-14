import React, { useEffect, useState } from "react";
import axios from "axios";

// Content is managed from the admin dashboard's Content Management page
// (Phase 3 CMS) — see backend/controllers/contentController.js. This
// component only reads and renders whatever's active there.
const Achievers = () => {
  const [achievers, setAchievers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/content/public/achiever`)
      .then((res) => {
        if (!cancelled) setAchievers(res.data?.data || []);
      })
      .catch(() => {
        // Fails quietly — a marketing section shouldn't show an error
        // banner to a visitor; it just won't render if content can't load.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show yet (still loading, or the admin hasn't added any) —
  // don't render an empty section with just a heading.
  if (!loaded || achievers.length === 0) return null;

  return (
    <section id="achievers" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Achievers
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Real results from our GATE 2026 batch.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 mt-12 max-w-2xl">
          {achievers.map(({ _id, image, title, subtitle, badge, meta, body }) => (
            <div
              key={_id}
              className="bg-white rounded-xl border border-line shadow-sm overflow-hidden"
            >
              {image && (
                <img
                  src={image}
                  alt={title}
                  className="w-full aspect-[4/3] object-cover"
                />
              )}
              <div className="p-5">
                {(badge || meta) && (
                  <span className="inline-block text-[11px] font-semibold tracking-wide uppercase text-gold bg-gold/10 rounded-full px-2.5 py-1">
                    {badge}
                    {badge && meta ? " · " : ""}
                    {meta}
                  </span>
                )}
                <h3 className="text-base font-semibold text-navy-dark mt-3 font-inter">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate font-inter">{subtitle}</p>
                )}
                {body && (
                  <p className="text-sm text-ink leading-relaxed mt-2.5 font-inter">
                    {body}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievers;

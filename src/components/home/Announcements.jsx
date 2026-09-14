import React, { useEffect, useState } from "react";
import axios from "axios";
import { CalendarClock, Megaphone } from "lucide-react";

// Content is managed from the admin dashboard's Content Management page
// (Phase 3 CMS) — see backend/controllers/contentController.js.
const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/content/public/announcement`)
      .then((res) => {
        if (!cancelled) setAnnouncements(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || announcements.length === 0) return null;

  return (
    <section id="updates" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Latest Updates
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Batches, notifications, and announcements.
          </h2>
        </div>

        <div className="flex flex-col gap-5 mt-12 max-w-3xl">
          {announcements.map(({ _id, subtitle, title, body, ctaLabel, ctaHref }) => (
            <div
              key={_id}
              className="bg-cream rounded-xl border border-line p-6 sm:p-7"
            >
              {subtitle && (
                <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wide font-inter">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {subtitle}
                </div>
              )}
              <h3 className="text-base font-semibold text-navy-dark mt-2.5 font-inter flex items-start gap-2">
                <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0 text-navy" />
                {title}
              </h3>
              {body && (
                <p className="text-sm text-slate leading-relaxed mt-2 font-inter">
                  {body}
                </p>
              )}
              {ctaLabel && ctaHref && (
                <a
                  href={ctaHref}
                  className="inline-block mt-4 text-sm font-medium text-navy hover:text-gold transition-colors"
                >
                  {ctaLabel}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Announcements;

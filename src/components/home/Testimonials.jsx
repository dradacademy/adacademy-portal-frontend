import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

const QuoteMark = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="#C9971F">
    <path d="M0 22V13.2C0 8.8 1.2 5.4 3.6 3 6 .6 9 -0.4 12.6 0v5.4c-2 0-3.5.5-4.5 1.5S6.6 9 6.6 11h6V22H0zm15.4 0V13.2c0-4.4 1.2-7.8 3.6-10.2C21.4.6 24.4-.4 28 0v5.4c-2 0-3.5.5-4.5 1.5S22 9 22 11h6V22H15.4z" />
  </svg>
);

// Content is managed from the admin dashboard's Content Management page
// (Phase 3 CMS) — see backend/controllers/contentController.js.
const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/content/public/testimonial`)
      .then((res) => {
        if (!cancelled) setTestimonials(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = testimonials.length;

  const go = (delta) => {
    setIndex((prev) => (prev + delta + total) % total);
  };

  if (!loaded || total === 0) return null;

  const current = testimonials[index];

  return (
    <section id="testimonials" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Student Testimonials
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            From our students, in their own words.
          </h2>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-cream rounded-xl border border-line p-8 sm:p-10 text-center min-h-[220px] flex flex-col items-center justify-center">
            <QuoteMark />
            <p className="text-[17px] text-ink leading-relaxed mt-5 italic font-inter max-w-xl">
              "{current.body}"
            </p>
            <p className="text-sm font-semibold text-navy-dark mt-5 font-inter">
              {current.title}
            </p>
            {current.subtitle && (
              <p className="text-xs text-slate mt-0.5 font-inter">
                {current.subtitle}
              </p>
            )}
          </div>

          {total > 1 && (
            <div className="flex items-center justify-center gap-5 mt-6">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:border-gold hover:text-gold transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((t, i) => (
                  <button
                    key={t._id}
                    type="button"
                    aria-label={`Go to testimonial ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                      i === index ? "bg-gold" : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:border-gold hover:text-gold transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

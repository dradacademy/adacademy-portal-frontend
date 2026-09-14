import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const QuoteMark = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="#C9971F">
    <path d="M0 22V13.2C0 8.8 1.2 5.4 3.6 3 6 .6 9 -0.4 12.6 0v5.4c-2 0-3.5.5-4.5 1.5S6.6 9 6.6 11h6V22H0zm15.4 0V13.2c0-4.4 1.2-7.8 3.6-10.2C21.4.6 24.4-.4 28 0v5.4c-2 0-3.5.5-4.5 1.5S22 9 22 11h6V22H15.4z" />
  </svg>
);

// Same two students as the Achievers section, shown here in their own
// words — real quotes, carried over from the academy's existing site.
const TESTIMONIALS = [
  {
    quote:
      "The structured revision cycles made formula mastery feel natural instead of rushed.",
    name: "Shri Hari Varsha S",
    detail: "GATE 2026, Civil Engineering",
  },
  {
    quote:
      "Every mock became a clear conversation with my preparation. I knew exactly what to fix next.",
    name: "Priya Darsini A",
    detail: "GATE 2026, Civil Engineering",
  },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;

  const go = (delta) => {
    setIndex((prev) => (prev + delta + total) % total);
  };

  const current = TESTIMONIALS[index];

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
              "{current.quote}"
            </p>
            <p className="text-sm font-semibold text-navy-dark mt-5 font-inter">
              {current.name}
            </p>
            <p className="text-xs text-slate mt-0.5 font-inter">
              {current.detail}
            </p>
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
                {TESTIMONIALS.map((t, i) => (
                  <button
                    key={t.name}
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

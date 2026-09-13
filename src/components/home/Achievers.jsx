import React from "react";

const QuoteMark = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="#C9971F">
    <path d="M0 22V13.2C0 8.8 1.2 5.4 3.6 3 6 .6 9 -0.4 12.6 0v5.4c-2 0-3.5.5-4.5 1.5S6.6 9 6.6 11h6V22H0zm15.4 0V13.2c0-4.4 1.2-7.8 3.6-10.2C21.4.6 24.4-.4 28 0v5.4c-2 0-3.5.5-4.5 1.5S22 9 22 11h6V22H15.4z" />
  </svg>
);

const TESTIMONIALS = [
  {
    quote:
      "The structured revision cycles made formula mastery feel natural instead of rushed.",
    name: "Shri Hari Varsha S",
    detail: "GATE 2026, Civil Engineering",
  },
  {
    quote: "Every mock became a clear conversation with my preparation.",
    name: "Priya Darsini A",
    detail: "GATE 2026, Civil Engineering",
  },
];

const Achievers = () => {
  return (
    <section id="achievers" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Achievers
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            From our students, in their own words.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 mt-12">
          {TESTIMONIALS.map(({ quote, name, detail }) => (
            <div
              key={name}
              className="bg-white rounded-xl border border-line p-7 shadow-sm"
            >
              <QuoteMark />
              <p className="text-[15px] text-ink leading-relaxed mt-4 italic font-inter">
                "{quote}"
              </p>
              <p className="text-sm font-semibold text-navy-dark mt-4 font-inter">
                {name}
              </p>
              <p className="text-xs text-slate mt-0.5 font-inter">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievers;

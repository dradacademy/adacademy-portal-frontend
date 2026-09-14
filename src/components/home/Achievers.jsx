import React from "react";

// Real achievers only — do not add placeholder/fabricated entries here.
// Update this list as the academy shares new results.
const ACHIEVERS = [
  {
    photo: "/achievers/priya-darsini-a.png",
    name: "Priya Darsini A",
    branch: "Civil Engineering",
    exam: "GATE 2026",
    year: "2026",
    achievement: "GATE Qualified",
    story:
      "Received an NIT offer in the first round of CCMT 2026 counselling.",
  },
  {
    photo: "/achievers/shri-hari-varsha-s.png",
    name: "Shri Hari Varsha S",
    branch: "Civil Engineering",
    exam: "GATE 2026",
    year: "2026",
    achievement: "GATE Qualified",
    story:
      "Received an NIT offer in the first round of CCMT 2026 counselling.",
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
            Real results from our GATE 2026 batch.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 mt-12 max-w-2xl">
          {ACHIEVERS.map(({ photo, name, branch, exam, achievement, story }) => (
            <div
              key={name}
              className="bg-white rounded-xl border border-line shadow-sm overflow-hidden"
            >
              <img
                src={photo}
                alt={name}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-5">
                <span className="inline-block text-[11px] font-semibold tracking-wide uppercase text-gold bg-gold/10 rounded-full px-2.5 py-1">
                  {achievement} · {exam}
                </span>
                <h3 className="text-base font-semibold text-navy-dark mt-3 font-inter">
                  {name}
                </h3>
                <p className="text-xs text-slate font-inter">{branch}</p>
                <p className="text-sm text-ink leading-relaxed mt-2.5 font-inter">
                  {story}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievers;

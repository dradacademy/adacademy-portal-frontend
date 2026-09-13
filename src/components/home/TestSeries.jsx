import React from "react";

const SERIES = [
  {
    number: "01",
    title: "Topic-wise Tests",
    description: "Build a strong foundation, one topic at a time.",
  },
  {
    number: "02",
    title: "Subject-wise Tests",
    description: "Check your grasp across an entire subject at once.",
  },
  {
    number: "03",
    title: "Mixed-Subject Tests",
    description:
      "Revise across subjects together, the way the real exam mixes them.",
  },
  {
    number: "04",
    title: "Full-Length Mocks",
    description:
      "Complete exam simulations under real timing and marking conditions.",
  },
];

const TestSeries = () => {
  return (
    <section id="test-series" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Online Test Series
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Four formats, one steady build toward exam day.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {SERIES.map(({ number, title, description }) => (
            <div
              key={number}
              className="bg-white rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="font-newsreader text-2xl font-semibold text-gold">
                {number}
              </div>
              <h3 className="text-base font-semibold text-navy-dark mt-3 font-inter">
                {title}
              </h3>
              <p className="text-sm text-slate leading-relaxed mt-2 font-inter">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestSeries;

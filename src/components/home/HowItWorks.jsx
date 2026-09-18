import React from "react";

const STEPS = [
  {
    number: "01",
    title: "Enroll with the Academy",
    description:
      "Your admin sets up your student account and gives you access to your subjects.",
  },
  {
    number: "02",
    title: "Practice Topic-wise Tests",
    description:
      "Work through structured, timed tests for each topic in your syllabus.",
  },
  {
    number: "03",
    title: "Track Your Performance",
    description:
      "See your marks, accuracy, and time spent the moment each test ends.",
  },
  {
    number: "04",
    title: "Attempt Every Set",
    description:
      "Every test set is available to attempt as soon as it's posted — up to 3 attempts each — so you can practice in whatever order suits you.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            How It Works
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            A clear path from enrollment to exam-ready.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {STEPS.map(({ number, title, description }) => (
            <div key={number}>
              <div className="font-newsreader text-3xl sm:text-4xl font-semibold text-gold">
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

export default HowItWorks;

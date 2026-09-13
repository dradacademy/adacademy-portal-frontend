import React from "react";
import { Layers, Settings2, Building2 } from "lucide-react";

const EXAMS = [
  {
    icon: Layers,
    title: "GATE Civil Engineering",
    description:
      "Complete topic-wise coverage of the GATE CE syllabus, from Fluid Mechanics to Structural Analysis, with previous-year-pattern practice sets.",
  },
  {
    icon: Settings2,
    title: "IES/ESE",
    description:
      "Structured prep for the Engineering Services Examination — objective and conventional-paper-style questions across core civil engineering subjects.",
  },
  {
    icon: Building2,
    title: "TNPSC AE, TNPSC JDO & SSC JE",
    description:
      "Practice sets aligned to TNPSC Assistant Engineer, TNPSC Junior Draughting Officer, SSC JE, and RRB JE recruitment exams for civil engineering roles.",
  },
];

const ExamsWeCover = () => {
  return (
    <section id="exams" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Exams We Cover
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Focused preparation for the exams that matter to civil engineers.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {EXAMS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-line p-7 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-lg bg-gold/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-navy-dark mt-5 font-inter">
                {title}
              </h3>
              <p className="text-sm text-slate leading-relaxed mt-2.5 font-inter">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamsWeCover;

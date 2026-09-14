import React from "react";
import { Link } from "react-router-dom";
import { Layers, Settings2, Building2, ArrowRight } from "lucide-react";

// Real, confirmed course list — exactly these six, in this order. Do not
// add or remove exams here without checking with the academy first: the
// student login/test-portal backend only recognizes 4 categories (gate,
// tnpsc-ae, tnpsc-jdo, and a combined ssc-rrb-je), so SSC JE and RRB JE
// intentionally share one portal, and ESE has no student portal yet.
const TIERS = [
  {
    tier: "National Elite Services",
    icon: Layers,
    blurb: "Comprehensive conceptual depth, MSQ & NAT mastery, PYQ analysis.",
    courses: [
      { name: "GATE Civil", slug: "gate" },
      { name: "IES/ESE Civil", slug: "ese" },
    ],
  },
  {
    tier: "State Engineering Services",
    icon: Settings2,
    blurb: "High-speed objective accuracy, IS Code provisions, state syllabus coverage.",
    courses: [
      { name: "TNPSC AE Civil", slug: "tnpsc-ae" },
      { name: "TNPSC JDO Civil", slug: "tnpsc-jdo" },
    ],
  },
  {
    tier: "Central Technical Services",
    icon: Building2,
    blurb: "CBT pattern drills, technical + general studies integration.",
    courses: [
      { name: "SSC JE Civil", slug: "ssc-je" },
      { name: "RRB JE Civil", slug: "rrb-je" },
    ],
  },
];

const Courses = () => {
  return (
    <section id="courses" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Courses We Handle
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Six exams, one focused Civil Engineering curriculum.
          </h2>
        </div>

        <div className="flex flex-col gap-10 mt-12">
          {TIERS.map(({ tier, icon: Icon, blurb, courses }) => (
            <div key={tier}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[18px] h-[18px] text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-dark font-inter">
                    {tier}
                  </h3>
                  <p className="text-xs text-slate font-inter">{blurb}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {courses.map(({ name, slug }) => (
                  <div
                    key={slug}
                    className="bg-white rounded-xl border border-line p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <h4 className="text-lg font-semibold text-navy-dark font-inter">
                      {name}
                    </h4>
                    <p className="text-sm text-slate leading-relaxed mt-2.5 font-inter flex-1">
                      {blurb}
                    </p>
                    <Link
                      to={`/exams/${slug}`}
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy mt-5 hover:text-gold transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;

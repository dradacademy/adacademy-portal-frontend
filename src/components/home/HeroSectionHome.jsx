import React from "react";
import { Anchor, Clock3, LineChart } from "lucide-react";

const HeroSectionHome = () => {
  return (
    <section className="relative overflow-hidden bg-navy-dark rounded-xl">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 82% -10%, rgba(201,151,31,0.16), transparent)",
        }}
      ></div>
      <div className="container mx-auto px-4 relative">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center py-16 lg:py-20">
          <div>
            <span className="inline-block text-gold-light text-xs sm:text-sm font-semibold tracking-wide uppercase font-inter">
              GATE Civil &nbsp;•&nbsp; IES/ESE &nbsp;•&nbsp; TNPSC AE &nbsp;•&nbsp; TNPSC JDO &nbsp;•&nbsp; SSC JE
            </span>
            <h1 className="text-white text-4xl sm:text-5xl font-newsreader font-semibold mt-5 leading-tight tracking-tight">
              Build Your Rank.
              <br />
              Engineer Your Future.
            </h1>
            <p className="text-[#C9D2DE] text-lg leading-relaxed max-w-lg mt-6 font-inter">
              Concept clarity for serious civil aspirants — topic-wise,
              subject-wise, mixed-subject, and full-length test series with
              real exam-pattern marking, from Dr. A. Dinesh, Ph.D.
            </p>
            <div className="flex flex-wrap gap-4 mt-9 font-inter">
              <a
                href="#cta"
                className="px-6 py-3 bg-gold text-navy-dark rounded-full font-semibold transition-colors hover:bg-gold-light"
              >
                Enroll Now
              </a>
              <a
                href="#test-series"
                className="px-6 py-3 border border-white/30 text-white rounded-full font-medium transition-colors hover:bg-white/10"
              >
                Explore Test Series
              </a>
            </div>
            <div className="flex flex-wrap gap-7 mt-11 pt-7 border-t border-white/15">
              <div className="flex items-center gap-2.5">
                <Anchor className="w-5 h-5 text-gold-light flex-shrink-0" />
                <span className="text-white text-sm font-medium">
                  Ph.D., Civil Engineering
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock3 className="w-5 h-5 text-gold-light flex-shrink-0" />
                <span className="text-white text-sm font-medium">
                  12+ Years Teaching
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <LineChart className="w-5 h-5 text-gold-light flex-shrink-0" />
                <span className="text-white text-sm font-medium">
                  Topic-wise Test Series
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="bg-navy px-5 py-4 flex items-center justify-between">
                <span className="text-white text-[13px] font-semibold">
                  Fluid Mechanics — Topic Test
                </span>
                <span className="text-gold-light text-xs font-semibold">
                  18:42
                </span>
              </div>
              <div className="p-6">
                <p className="text-[15px] font-medium text-ink leading-snug">
                  A pipe carries water at a discharge of 0.5 m³/s. What is the
                  value of <span className="italic">Q/A</span> when{" "}
                  <span className="italic">A</span> = 0.25 m²?
                </p>
                <div className="flex flex-col gap-2.5 mt-4">
                  <div className="flex items-center gap-2.5 py-2.5 px-3.5 border-[1.5px] border-gold bg-gold/10 rounded-md">
                    <div className="w-[18px] h-[18px] rounded-full bg-gold flex-shrink-0"></div>
                    <span className="text-sm">2 m/s</span>
                  </div>
                  <div className="flex items-center gap-2.5 py-2.5 px-3.5 border-[1.5px] border-line rounded-md">
                    <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-gray-300 flex-shrink-0"></div>
                    <span className="text-sm text-slate">0.5 m/s</span>
                  </div>
                  <div className="flex items-center gap-2.5 py-2.5 px-3.5 border-[1.5px] border-line rounded-md">
                    <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-gray-300 flex-shrink-0"></div>
                    <span className="text-sm text-slate">1.25 m/s</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-5 pt-4 border-t border-line">
                  <span className="text-xs text-slate">Question 4 of 10</span>
                  <div className="w-[120px] h-1.5 bg-line rounded-full overflow-hidden">
                    <div className="w-2/5 h-full bg-gold"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionHome;

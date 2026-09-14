import React from "react";
import founderPhoto from "../../assets/images/home/founder.jpg";

const CREDENTIALS = [
  {
    strong: "Ph.D., Civil Engineering",
    rest: " — Anna University, Outstanding Thesis Award",
  },
  {
    strong: "M.E., Structural Engineering",
    rest: " — Gold Medalist & Best Outgoing Student",
  },
  {
    strong: "B.E., Civil Engineering",
    rest: " — First Class",
  },
];

const DIFFERENTIATORS = [
  "100% core Civil Engineering focus — no multi-branch dilution",
  "Research-backed pedagogy from an active Ph.D. researcher",
  "Concept-based teaching with structured revision cycles",
  "Previous-year-question (PYQ) mastery, not generic question banks",
  "Result-oriented approach — every session builds toward exam day",
];

const AboutFounder = () => {
  return (
    <section id="about" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            About Our Academy
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Dr. A.D. Academy of Excellence
          </h2>
          <p className="text-[15.5px] text-slate leading-relaxed mt-5 font-inter">
            Founded in 2025 in Coimbatore, Dr. A.D. Academy of Excellence
            gives civil engineering aspirants the kind of structured,
            exam-pattern-accurate preparation that's usually reserved for the
            best coaching institutes — built directly by a Ph.D. faculty
            member with over 12 years of teaching and mentoring experience.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mt-12">
          <div className="bg-cream rounded-xl border border-line p-7">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gold font-inter mb-2.5">
              Our Mission
            </h3>
            <p className="text-[14.5px] text-ink leading-relaxed font-inter">
              To help civil engineering aspirants build genuine conceptual
              mastery — not just exam tricks — for GATE, ESE, and state and
              central technical recruitment exams, through concept-based,
              research-backed teaching.
            </p>
          </div>
          <div className="bg-cream rounded-xl border border-line p-7">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gold font-inter mb-2.5">
              Our Vision
            </h3>
            <p className="text-[14.5px] text-ink leading-relaxed font-inter">
              To enable every serious aspirant we teach to secure a seat at a
              top institute — an IIT or NIT — or a government engineering
              post, before or right after graduation.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-14 items-center mt-14">
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gold font-inter mb-4">
              What Makes Us Different
            </h3>
            <div className="flex flex-col gap-4">
              {DIFFERENTIATORS.map((item) => (
                <div key={item} className="flex items-start gap-3.5">
                  <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0"></div>
                  <span className="text-[14.5px] text-ink font-inter">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-navy-dark rounded-lg p-7 text-center w-full max-w-[360px]">
              <img
                src={founderPhoto}
                alt="Dr. A. Dinesh"
                className="w-full aspect-[4/5] object-cover rounded-md border-2 border-gold"
              />
              <h3 className="text-white text-xl mt-5 font-newsreader">
                Dr. A. Dinesh
              </h3>
              <p className="text-[#B9C2CF] text-[13.5px] mt-1.5 font-inter">
                Founder, Dr. A.D. Academy of Excellence
              </p>
              <div className="h-px bg-white/15 my-5"></div>
              <p className="text-gold-light text-3xl font-newsreader font-semibold">
                12+
              </p>
              <p className="text-[#C9D2DE] text-[13px] mt-0.5 font-inter">
                Years of Teaching &amp; Mentoring
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gold font-inter mb-4">
            Faculty Credentials
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {CREDENTIALS.map(({ strong, rest }) => (
              <div key={strong} className="flex items-start gap-3.5">
                <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0"></div>
                <span className="text-[14.5px] text-ink font-inter">
                  <strong className="font-semibold">{strong}</strong>
                  {rest}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 bg-navy-dark rounded-xl p-8">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gold-light font-inter mb-4">
            A Student-Focused Learning System
          </h3>
          <p className="text-[14.5px] text-[#C9D2DE] leading-relaxed font-inter">
            Topic-wise, subject-wise, mixed-subject, and full-length test
            series with real exam-pattern marking; personalized doubt-clearing
            support; and a live performance-tracking system so both students
            and the academy can see exactly what's improving and what needs
            more work — not just a final score.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder;

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
  {
    strong: "Former faculty",
    rest: ", Sri Ramakrishna Engineering College",
  },
];

const AboutFounder = () => {
  return (
    <section id="about" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
              About the Academy
            </span>
            <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
              Led by Dr. A. Dinesh, Ph.D.
            </h2>
            <p className="text-[15.5px] text-slate leading-relaxed mt-5 font-inter">
              Dr. A.D. Academy of Excellence was founded to give civil
              engineering students the kind of structured, exam-pattern-accurate
              preparation that's usually reserved for the best coaching
              institutes — built directly by a Ph.D. faculty member with over
              12 years of teaching and mentoring experience.
            </p>
            <div className="flex flex-col gap-4 mt-7">
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
      </div>
    </section>
  );
};

export default AboutFounder;

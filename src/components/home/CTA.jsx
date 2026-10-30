import React, { useState } from "react";
import EnrollNowPopup from "../common/popup/EnrollNowPopup";

const CTA = () => {
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  return (
    <section
      id="cta"
      className="py-16 sm:py-20 text-center rounded-3xl"
      style={{ background: "linear-gradient(120deg, #c9971f, #e8b94a)" }}
    >
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="font-newsreader font-semibold text-3xl sm:text-5xl text-navy-dark">
          Ready to start your preparation?
        </h2>
        <p className="text-[15.5px] text-navy-dark/80 mt-3.5 font-inter">
          Enroll with Dr. A.D. Academy of Excellence and start practicing
          across topic-wise, subject-wise, mixed-subject, and full-length
          tests today.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8 font-inter">
          <button
            type="button"
            onClick={() => setShowEnrollModal(true)}
            className="px-6 py-3 bg-navy-dark text-white rounded-full font-semibold hover:bg-navy transition-colors cursor-pointer"
          >
            Enroll Now
          </button>
          <a
            href="mailto:dradacademy@gmail.com"
            className="px-6 py-3 border-[1.5px] border-navy-dark text-navy-dark rounded-full font-semibold hover:bg-white/20 transition-colors"
          >
            Contact the Academy
          </a>
        </div>
      </div>
      <EnrollNowPopup
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
      />
    </section>
  );
};

export default CTA;

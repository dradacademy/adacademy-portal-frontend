import React from "react";

const CTA = () => {
  return (
    <section
      id="cta"
      className="py-16 sm:py-20 bg-navy-dark text-center rounded-xl"
    >
      <div className="container mx-auto px-4 max-w-xl">
        <h2 className="font-newsreader text-3xl sm:text-4xl text-white">
          Ready to start your preparation?
        </h2>
        <p className="text-[15.5px] text-[#C9D2DE] mt-3.5 font-inter">
          Enroll with Dr. A.D. Academy of Excellence and start practicing
          across topic-wise, subject-wise, mixed-subject, and full-length
          tests today.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8 font-inter">
          <a
            href="mailto:dradacademy@gmail.com?subject=Enrollment%20Enquiry"
            className="px-6 py-3 bg-gold text-navy-dark rounded-full font-semibold hover:bg-gold-light transition-colors"
          >
            Enroll Now
          </a>
          <a
            href="mailto:dradacademy@gmail.com"
            className="px-6 py-3 border border-white/30 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
          >
            Contact the Academy
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;

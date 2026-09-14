import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

const TermsAndConditions = () => {
  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-3xl mx-auto py-16">
        <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
          Legal
        </span>
        <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
          Terms and Conditions
        </h1>
        <p className="text-sm text-slate italic mt-4 font-inter">
          This is a plain-language summary of the terms of using our website
          and test portal. It has not been reviewed by a lawyer — if you have
          questions, please contact us directly.
        </p>

        <div className="flex flex-col gap-8 mt-8 text-[15px] text-ink leading-relaxed font-inter">
          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              About Dr. A.D. Academy of Excellence
            </h2>
            <p>
              This website is operated by Dr. A.D. Academy of Excellence,
              a civil engineering competitive exam coaching academy based in
              Coimbatore, Tamil Nadu. By using this website or our online
              test portal, you agree to these terms.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Using the test portal
            </h2>
            <p>
              Access to our online test portal is provided to enrolled
              students for the purpose of exam preparation. Your login
              credentials are personal to you and should not be shared.
              Test content, questions, and study materials are for your
              personal use and may not be copied or redistributed.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Enrollment and fees
            </h2>
            <p>
              Course fees and enrollment details are shared directly with
              you by our team over call or WhatsApp, and are not processed
              through this website. Please refer to what is communicated to
              you directly for the most accurate and current information.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Accuracy of information
            </h2>
            <p>
              We try to keep exam-related information on this site
              accurate and up to date, but official exam details (patterns,
              eligibility, dates) are ultimately governed by the respective
              exam-conducting bodies (GATE, UPSC, TNPSC, SSC, RRB). Please
              verify critical details against official notifications.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Careers applications
            </h2>
            <p>
              Information you submit through our Careers page is used only
              to evaluate your application and get in touch with you about
              opportunities at our academy.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Contact us
            </h2>
            <p>
              Questions about these terms? Call or WhatsApp us at{" "}
              <strong className="font-semibold">+91 95668 18665</strong> or
              email{" "}
              <a
                href="mailto:dradacademy@gmail.com"
                className="text-navy hover:text-gold underline"
              >
                dradacademy@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Footer />
      </div>
    </div>
  );
};

export default TermsAndConditions;

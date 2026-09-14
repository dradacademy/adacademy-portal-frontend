import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-3xl mx-auto py-16">
        <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
          Legal
        </span>
        <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate italic mt-4 font-inter">
          This is a plain-language summary of what we collect and why. It has
          not been reviewed by a lawyer — if you have questions, please
          contact us directly.
        </p>

        <div className="flex flex-col gap-8 mt-8 text-[15px] text-ink leading-relaxed font-inter">
          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              What we collect
            </h2>
            <p>
              When you fill out an enrollment or callback request form on
              this website, we collect the details you provide — your name,
              phone number, and the exam you're interested in — so we can
              get in touch with you about our courses. When you apply
              through our Careers page, we collect the application details
              you submit, including your resume/CV.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Student accounts and exam records
            </h2>
            <p>
              If you're enrolled as a student, we maintain a login account
              for you and keep records of the tests you attempt through our
              online test portal, including your answers and scores, so we
              can track your progress and share results with you.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Website analytics
            </h2>
            <p>
              We use Google Analytics (GA4) to understand how visitors use
              this website — which pages are viewed and how people found us.
              This data is aggregated and does not identify you personally.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Payments
            </h2>
            <p>
              We do not process or store any payment or card information
              through this website. Fee payments are handled directly and
              separately, outside of this site.
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Sharing your information
            </h2>
            <p>
              We do not sell your personal information. We do not share it
              with third parties except as needed to operate the website
              itself (such as our hosting and analytics providers).
            </p>
          </div>

          <div>
            <h2 className="font-newsreader text-xl text-navy-dark mb-2">
              Contact us
            </h2>
            <p>
              If you'd like to know what information we hold about you, or
              want it corrected or removed, call or WhatsApp us at{" "}
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

export default PrivacyPolicy;

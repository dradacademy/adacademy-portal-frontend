import React from "react";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "Which exams/courses do you cover?",
    answer:
      "GATE Civil, IES/ESE Civil, TNPSC AE Civil, TNPSC JDO Civil, SSC JE Civil, and RRB JE Civil.",
  },
  {
    question: "What are your fees?",
    answer:
      "Fees vary by course and batch. Call or WhatsApp us at +91 95668 18665 for current pricing.",
  },
  {
    question: "Are classes online or offline?",
    answer:
      "We run a hybrid model — both online and offline — so you can choose whichever works for you. Current batch timings are 6:00 PM – 8:30 PM.",
  },
  {
    question: "What kinds of tests are included?",
    answer:
      "Topic-wise, subject-wise, mixed-subject, and full-length mock tests, plus dedicated previous-year-question practice — all with real exam-pattern marking and live performance tracking.",
  },
  {
    question: "Do you provide study materials?",
    answer:
      "Study material PDFs, previous-year question papers, sample tests, and prep notes are being added to our Free Resources section — check back soon.",
  },
  {
    question: "How do I register or enroll?",
    answer:
      "There's no public self-signup — accounts are created by the academy after you enroll. Use the Enroll Now form on this site, or call/WhatsApp us directly, and we'll set up your account.",
  },
  {
    question: "How do I get access to the academy portal?",
    answer:
      "Once enrolled, you'll receive login details to access your subjects and start practicing.",
  },
  {
    question: "Is negative marking applied the same way as the real exam?",
    answer:
      "Yes — marks and negative marking follow the same pattern as GATE, IES/ESE, and PSC exams, so your practice scores are meaningful.",
  },
  {
    question: "Can I use the portal on my phone?",
    answer:
      "Yes — the platform works on any device with a browser, so you can practice from your phone, tablet, or computer.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Frequently Asked
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3">
            Common questions
          </h2>
        </div>
        <div className="flex flex-col gap-px bg-line mt-11 rounded-lg overflow-hidden">
          {FAQS.map(({ question, answer }) => (
            <div key={question} className="bg-white px-6 sm:px-7 py-6">
              <h3 className="text-[15.5px] font-semibold text-navy-dark font-inter">
                {question}
              </h3>
              <p className="text-sm text-slate leading-relaxed mt-2 font-inter">
                {answer}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-cream rounded-xl p-6 border border-line">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-4 rounded-xl">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-navy">
                <HelpCircle className="h-8 w-8" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2 text-navy-dark font-inter">
                Still have questions?
              </h3>
              <p className="text-slate mb-4 font-inter">
                Reach out to the academy directly and we'll help you get
                started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <a
                  href="mailto:dradacademy@gmail.com"
                  className="px-4 py-2 bg-navy text-white rounded-full text-sm font-medium hover:bg-navy-dark transition-colors"
                >
                  Email the Academy
                </a>
                <a
                  href="tel:+919566818665"
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Call +91 95668 18665
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;

import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

// Stub content only — full exam guides (eligibility, pattern, syllabus,
// marking scheme, selection process, important dates) are a separate,
// later phase that will research official sources properly. The GATE
// pattern figures below are the one already-confirmed real data point,
// everything else here is deliberately just a "details coming soon" page.
const EXAMS = {
  gate: {
    name: "GATE Civil",
    tier: "National Elite Services",
    description:
      "Comprehensive conceptual depth, MSQ & NAT mastery, PYQ analysis.",
    hasPortal: true,
    pattern: {
      questions: "65 questions",
      marks: "100 marks",
      duration: "3 hours",
      breakdown:
        "General Aptitude 15 marks, Engineering Mathematics 13 marks, Core Civil Engineering 72 marks",
      types: "MCQs, MSQs (Multiple Select), and NAT (Numerical Answer Type)",
    },
  },
  ese: {
    name: "IES/ESE Civil",
    tier: "National Elite Services",
    description:
      "Comprehensive conceptual depth, MSQ & NAT mastery, PYQ analysis.",
    hasPortal: false,
  },
  "tnpsc-ae": {
    name: "TNPSC AE Civil",
    tier: "State Engineering Services",
    description:
      "High-speed objective accuracy, IS Code provisions, state syllabus coverage.",
    hasPortal: true,
  },
  "tnpsc-jdo": {
    name: "TNPSC JDO Civil",
    tier: "State Engineering Services",
    description:
      "High-speed objective accuracy, IS Code provisions, state syllabus coverage.",
    hasPortal: true,
  },
  "ssc-je": {
    name: "SSC JE Civil",
    tier: "Central Technical Services",
    description:
      "CBT pattern drills, technical + general studies integration.",
    hasPortal: true,
  },
  "rrb-je": {
    name: "RRB JE Civil",
    tier: "Central Technical Services",
    description:
      "CBT pattern drills, technical + general studies integration.",
    hasPortal: true,
  },
};

const ExamDetailPage = () => {
  const { examSlug } = useParams();
  const exam = EXAMS[examSlug];

  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-3xl mx-auto py-16">
        {!exam ? (
          <div className="text-center">
            <h1 className="font-newsreader text-3xl text-navy-dark">
              Exam not found
            </h1>
            <Link
              to="/#courses"
              className="inline-flex items-center gap-1.5 text-navy mt-5 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
          </div>
        ) : (
          <div>
            <Link
              to="/#courses"
              className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-navy transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
            <span className="block text-gold text-xs font-semibold tracking-wide uppercase font-inter mt-6">
              {exam.tier}
            </span>
            <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-2">
              {exam.name}
            </h1>
            <p className="text-[15px] text-slate leading-relaxed mt-4 font-inter">
              {exam.description}
            </p>

            {exam.pattern && (
              <div className="bg-cream rounded-xl border border-line p-6 mt-8">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-gold font-inter mb-3">
                  Exam Pattern (confirmed)
                </h2>
                <div className="grid sm:grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="font-newsreader text-2xl font-semibold text-navy-dark">
                      {exam.pattern.questions}
                    </div>
                  </div>
                  <div>
                    <div className="font-newsreader text-2xl font-semibold text-navy-dark">
                      {exam.pattern.marks}
                    </div>
                  </div>
                  <div>
                    <div className="font-newsreader text-2xl font-semibold text-navy-dark">
                      {exam.pattern.duration}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-ink font-inter">
                  <strong className="font-semibold">Marks breakdown:</strong>{" "}
                  {exam.pattern.breakdown}
                </p>
                <p className="text-sm text-ink font-inter mt-1.5">
                  <strong className="font-semibold">Question types:</strong>{" "}
                  {exam.pattern.types}
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-line p-7 mt-8">
              <p className="text-[15px] text-ink leading-relaxed font-inter">
                Full exam guide — eligibility, complete pattern, syllabus,
                marking scheme, selection process, and important dates — is
                being finalized. Call or WhatsApp us at{" "}
                <strong className="font-semibold">+91 95668 18665</strong> for
                complete details.
              </p>
              {!exam.hasPortal && (
                <p className="text-sm text-slate mt-4 font-inter">
                  Online test portal coming soon for this exam — contact us
                  to enroll in the meantime.
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-6">
                <a
                  href="tel:+919566818665"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-navy text-white rounded-full text-sm font-medium hover:bg-navy-dark transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Us
                </a>
                <a
                  href="https://wa.me/919566818665"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-5">
        <Footer />
      </div>
    </div>
  );
};

export default ExamDetailPage;

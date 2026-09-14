import React, { useState } from "react";
import { CalendarClock, Phone, MessageCircle } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import PortalSelectorPopup from "../../components/common/popup/PortalSelectorPopup";

const FORMATS = [
  {
    number: "01",
    title: "Topic-wise Tests",
    description: "Build a strong foundation, one topic at a time.",
  },
  {
    number: "02",
    title: "Subject-wise Tests",
    description: "Check your grasp across an entire subject at once.",
  },
  {
    number: "03",
    title: "Mixed-Subject Tests",
    description:
      "Revise across subjects together, the way the real exam mixes them.",
  },
  {
    number: "04",
    title: "Full-Length Mocks",
    description:
      "Complete exam simulations under real timing and marking conditions.",
  },
];

const LAUNCHES = [
  {
    name: "GATE Online Test Series (OTS)",
    date: "Launching October 1, 2026",
  },
  {
    name: "TNPSC JDO Online Test Series (OTS)",
    date: "Launching October 1, 2026",
  },
];

const OnlineTestSeries = () => {
  const [showPortalSelector, setShowPortalSelector] = useState(false);

  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-4xl mx-auto py-16">
        <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
          Online Test Series
        </span>
        <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
          Four formats, one steady build toward exam day.
        </h1>
        <p className="text-[15px] text-slate leading-relaxed mt-4 font-inter max-w-2xl">
          Our online test series takes you from topic-level practice all the
          way to full-length, real-timing mock exams — so exam day feels like
          just another test.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {FORMATS.map(({ number, title, description }) => (
            <div
              key={number}
              className="bg-white rounded-xl border border-line p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="font-newsreader text-2xl font-semibold text-gold">
                {number}
              </div>
              <h3 className="text-base font-semibold text-navy-dark mt-3 font-inter">
                {title}
              </h3>
              <p className="text-sm text-slate leading-relaxed mt-2 font-inter">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-cream rounded-xl border border-line p-6 sm:p-7 mt-10">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gold font-inter mb-4">
            Upcoming Launches
          </h2>
          <div className="flex flex-col gap-3">
            {LAUNCHES.map(({ name, date }) => (
              <div key={name} className="flex items-center gap-3">
                <CalendarClock className="w-5 h-5 text-navy flex-shrink-0" />
                <span className="text-sm text-ink font-inter">
                  <strong className="font-semibold">{name}</strong> — {date}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-line p-7 mt-8">
          <p className="text-[15px] text-ink leading-relaxed font-inter">
            Already enrolled? Log in to your test portal below. New here?
            Call or WhatsApp us at{" "}
            <strong className="font-semibold">+91 95668 18665</strong> to get
            started.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowPortalSelector(true)}
              className="py-2.5 px-5 bg-gold text-navy-dark rounded-full text-sm font-semibold hover:bg-gold-light transition-colors cursor-pointer"
            >
              Log In to Test Portal
            </button>
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
      <div className="mt-5">
        <Footer />
      </div>
      <PortalSelectorPopup
        open={showPortalSelector}
        onClose={() => setShowPortalSelector(false)}
      />
    </div>
  );
};

export default OnlineTestSeries;

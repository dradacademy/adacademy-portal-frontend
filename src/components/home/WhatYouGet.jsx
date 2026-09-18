import React from "react";
import {
  ClipboardList,
  CheckSquare,
  BarChart3,
  Layers,
  Anchor,
  Smartphone,
  Repeat,
  MessageCircleQuestion,
  UserCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "PYQ-Aligned Question Bank",
    description:
      "Questions built around previous-year exam patterns, not generic question banks — so your practice reflects what's actually asked.",
  },
  {
    icon: CheckSquare,
    title: "Real Exam-Pattern Marking",
    description:
      "Negative marking and question weightage that mirror the actual exam, so your practice score means something.",
  },
  {
    icon: Repeat,
    title: "Topic-wise, Subject-wise & Mock Tests",
    description:
      "Topic-wise, subject-wise, mixed-subject, and full-length mock tests, plus dedicated previous-year-question practice.",
  },
  {
    icon: BarChart3,
    title: "Real Performance Tracking",
    description:
      "Every test result, completion time, and on-time/late status is tracked — for you and for the academy — not just a final score.",
  },
  {
    icon: Layers,
    title: "Structured Study Roadmap",
    description:
      "Every topic-wise set is available the moment it's posted, with up to 3 attempts each — so you can move through your syllabus at your own pace.",
  },
  {
    icon: Anchor,
    title: "Direct Mentorship",
    description:
      "Guidance from Dr. A. Dinesh, Ph.D. — not a generic question bank, but a curriculum built by someone who teaches this subject.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Doubt-Clearing Support",
    description:
      "Reach out directly whenever a concept doesn't click — you're never left guessing between tests.",
  },
  {
    icon: UserCheck,
    title: "Personalized Guidance",
    description:
      "Progress is monitored per student, so guidance is based on where you actually stand, not a one-size-fits-all pace.",
  },
  {
    icon: Smartphone,
    title: "Practice Anywhere",
    description:
      "A clean, mobile-friendly test experience — practice from your phone between classes or on your commute.",
  },
];

const WhatYouGet = () => {
  return (
    <section id="why-us" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Why Choose Our Academy
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            A test platform built the way real exams are structured.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mt-12">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="w-11 h-11 rounded-lg bg-navy/[0.08] flex items-center justify-center flex-shrink-0">
                <Icon className="w-[22px] h-[22px] text-navy" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-navy-dark font-inter">
                  {title}
                </h3>
                <p className="text-sm text-slate leading-relaxed mt-2 font-inter">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatYouGet;

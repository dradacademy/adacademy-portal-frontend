import React from "react";
import { CalendarClock, Megaphone } from "lucide-react";

// Real, current announcements. Update/remove the batch-specific one once
// its admission window has passed — this section is hard-coded for now
// (an admin-editable version is planned for a later phase).
const ANNOUNCEMENTS = [
  {
    date: "Admissions close Sept 15, 2026",
    title: "GATE 2027 (Civil Engineering) — Batch 2 Enrollment Open",
    description:
      "Hybrid mode (Online & Offline), 6:00 PM – 8:30 PM. Batch strength 60 — limited seats left. Special offer for 3rd-year Civil Engineering students to build their GATE foundation early. Batch commences September 16, 2026.",
    cta: { label: "Call / WhatsApp +91 95668 18665", href: "tel:+919566818665" },
  },
  {
    date: "Coming Soon",
    title: "TNPSC AE & TNPSC JDO Batches",
    description: "New batches for TNPSC AE and TNPSC JDO Civil starting soon.",
  },
  {
    date: "Launching October 1, 2026",
    title: "GATE & TNPSC JDO Online Test Series",
    description:
      "Our dedicated Online Test Series for GATE and TNPSC JDO Civil launches October 1, 2026.",
  },
];

const Announcements = () => {
  return (
    <section id="updates" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Latest Updates
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Batches, notifications, and announcements.
          </h2>
        </div>

        <div className="flex flex-col gap-5 mt-12 max-w-3xl">
          {ANNOUNCEMENTS.map(({ date, title, description, cta }) => (
            <div
              key={title}
              className="bg-cream rounded-xl border border-line p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wide font-inter">
                <CalendarClock className="w-3.5 h-3.5" />
                {date}
              </div>
              <h3 className="text-base font-semibold text-navy-dark mt-2.5 font-inter flex items-start gap-2">
                <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0 text-navy" />
                {title}
              </h3>
              <p className="text-sm text-slate leading-relaxed mt-2 font-inter">
                {description}
              </p>
              {cta && (
                <a
                  href={cta.href}
                  className="inline-block mt-4 text-sm font-medium text-navy hover:text-gold transition-colors"
                >
                  {cta.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Announcements;

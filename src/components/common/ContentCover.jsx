import React from "react";
import { FileText, Presentation, PlayCircle, Video, File } from "lucide-react";

// A neat, readable "cover" for cards that have no real thumbnail (recorded
// classes, study material). Instead of a blank box with a faint icon it
// shows the subject and topic name on a coloured background, with an icon
// for the kind of content. The colour comes from the subject name, so every
// class/material of the same subject gets the same colour — easy to scan.

// Deep, high-contrast gradients (white text stays readable on all of them).
const PALETTE = [
  ["#4f46e5", "#7c3aed"], // indigo → violet
  ["#0f766e", "#0891b2"], // teal → cyan
  ["#c2410c", "#e07b20"], // academy orange
  ["#be123c", "#e11d48"], // rose
  ["#1d4ed8", "#0284c7"], // blue → sky
  ["#15803d", "#0d9488"], // green → teal
  ["#7e22ce", "#c026d3"], // purple → fuchsia
  ["#334155", "#475569"], // slate
];

const hash = (text) => {
  let h = 0;
  for (const ch of String(text || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

// "Engineering Mathematics - Differential Equation" → eyebrow "Engineering
// Mathematics", main "Differential Equation". Used when the item has no
// subject/topic set, so even ungrouped items get a tidy two-line cover.
const splitTitle = (title) => {
  const parts = String(title || "").split(/\s+[-–—:|]\s+/);
  if (parts.length >= 2 && parts[0].length <= 40) {
    return { eyebrow: parts[0].trim(), main: parts.slice(1).join(" – ").trim() };
  }
  return { eyebrow: "", main: String(title || "").trim() };
};

const KINDS = {
  video: { icon: Video, label: "Class", pillIcon: PlayCircle },
  pdf: { icon: FileText, label: "PDF", pillIcon: FileText },
  slides: { icon: Presentation, label: "Slides", pillIcon: Presentation },
  doc: { icon: File, label: "Document", pillIcon: File },
};

const mainSize = (text) => {
  const n = text.length;
  if (n > 70) return "text-sm sm:text-base";
  if (n > 40) return "text-base sm:text-lg";
  return "text-lg sm:text-xl";
};

const ContentCover = ({ title, subject, topic, kind = "video", badge, className = "" }) => {
  // Big text = this item's own name. Small line above = where it belongs
  // (subject · subtopic), or the "Subject" part of a "Subject - Topic" title.
  const fromTitle = splitTitle(title);
  const sameAsSubject =
    subject && fromTitle.eyebrow && fromTitle.eyebrow.toLowerCase() === subject.toLowerCase();
  let main = subject && !sameAsSubject ? title : fromTitle.main;
  if (!main) main = title || "";
  const eyebrow = subject
    ? [subject, topic].filter(Boolean).join(" · ")
    : fromTitle.eyebrow;
  const showEyebrow = eyebrow && eyebrow.toLowerCase() !== main.toLowerCase();

  // Colour = subject (or the "Subject" part of the title). Items with
  // neither all share the academy's default indigo, so colour always
  // means "same subject" and never looks random.
  const colourKey = (subject || fromTitle.eyebrow || "").toLowerCase();
  const [from, to] = colourKey ? PALETTE[hash(colourKey) % PALETTE.length] : PALETTE[0];
  const k = KINDS[kind] || KINDS.doc;
  const Icon = k.icon;
  const PillIcon = k.pillIcon;

  return (
    <div
      className={`relative aspect-video overflow-hidden select-none ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      title={title}
    >
      {/* soft decorative shapes */}
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -left-8 -bottom-14 h-32 w-32 rounded-full bg-white/[0.07]" />
      <Icon className="absolute right-3 bottom-3 h-16 w-16 text-white/15" strokeWidth={1.5} />

      <div className="relative h-full flex flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">{badge}</div>
          <span className="shrink-0 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-white">
            <PillIcon className="h-3.5 w-3.5" />
            {k.label}
          </span>
        </div>

        <div className="mt-auto pr-14 min-w-0">
          {showEyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80 line-clamp-1">
              {eyebrow}
            </p>
          )}
          <p className={`font-bold text-white leading-snug line-clamp-4 ${mainSize(main)}`}>
            {main}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentCover;

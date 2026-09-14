import React, { useState } from "react";
import { ImageOff } from "lucide-react";

// Only "Facility" has real photos right now. The rest are shown as
// selectable categories so the gallery is ready to grow, but they honestly
// say "coming soon" rather than showing placeholder/fake images.
const CATEGORIES = [
  "All",
  "Facility",
  "Classroom Sessions",
  "Faculty",
  "Students",
  "Test Sessions",
  "Workshops",
  "Events",
  "Achievers",
];

const FACILITY_PHOTOS = [
  { src: "/gallery/reception-entrance.png", alt: "Reception / Entrance" },
  { src: "/gallery/classroom.png", alt: "Classroom" },
  { src: "/gallery/meeting-room.png", alt: "Meeting Room" },
  { src: "/gallery/faculty-room.png", alt: "Faculty Room" },
  { src: "/gallery/digital-classroom.png", alt: "Digital Classroom" },
];

const Gallery = () => {
  const [active, setActive] = useState("All");

  const showFacility = active === "All" || active === "Facility";

  return (
    <section id="gallery" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Academy Gallery
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            A look inside the academy.
          </h2>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium font-inter transition-colors cursor-pointer border ${
                active === cat
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-slate border-line hover:border-navy hover:text-navy"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {showFacility ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {FACILITY_PHOTOS.map(({ src, alt }) => (
              <div
                key={src}
                className="rounded-xl overflow-hidden border border-line shadow-sm bg-white"
              >
                <img
                  src={src}
                  alt={alt}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 bg-white rounded-xl border border-line border-dashed py-16 flex flex-col items-center justify-center text-center">
            <ImageOff className="w-8 h-8 text-slate" />
            <p className="text-sm text-slate mt-3 font-inter">
              Photos for "{active}" are coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
